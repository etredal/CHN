"""Generate a clean, standalone pronunciation for every word in each story.

Cutting words out of the story narration sounds bad for short words: they are
spoken in ~0.1s with reduced tones and run into their neighbours. Instead,
each unique word is synthesised on its own with the same voice as the story
(normal speed and a genuinely slow take), trimmed, and packed into one audio
file per story and speed ("audio sprite"):

    client/public/audio/words/<story id>.mp3
    client/public/audio/words/<story id>_slow.mp3

The word -> position map is stored in the story JSON as ``wordAudio`` and
passed through to the app by compile_ts_stories.cjs.

Usage (from the repo root; needs ffmpeg and network access to the edge-tts
service at speech.platform.bing.com):

    pip install edge-tts numpy
    node tools/compile_ts_stories.cjs        # so the word list is current
    python tools/generate_word_audio.py
    node tools/compile_ts_stories.cjs        # picks up wordAudio

Synthesised words are cached in tools/.word_audio_cache/ (git-ignored), so
re-runs only fetch new words.
"""

import argparse
import asyncio
import hashlib
import json
import os
import re
import subprocess
import sys

import numpy as np

VOICE = "zh-CN-YunxiNeural"
SPEEDS = {"normal": "+0%", "slow": "-40%"}
SAMPLE_RATE = 24000
GAP_S = 0.35        # silence between words in the sprite
EDGE_PAD_S = 0.04   # silence kept before/after each word when trimming
CLIP_PAD_S = 0.06   # extra slack in the map so MP3 encoder offsets can't clip a word
CACHE_DIR = "tools/.word_audio_cache"
OUT_DIR = "client/public/audio/words"

STORIES = [
    ("tools/hsk5_night_train.json", "client/src/data/hsk5_night_train.ts"),
    ("tools/hsk6_battle_of_julu.json", "client/src/data/hsk6_battle_of_julu.ts"),
    ("tools/hsk5_digital_nomads.json", "client/src/data/hsk5_digital_nomads.ts"),
    ("tools/hsk6_zhuangzi_oak.json", "client/src/data/hsk6_zhuangzi_oak.ts"),
    ("tools/hsk5_hometown.json", "client/src/data/hsk5_hometown.ts"),
]

PUNCT = re.compile(r"^[，。！？；：“”‘’（）《》、—…\.,!?;:'\"()\[\]\s]+$")


def story_words(ts_path):
    """Unique words of a compiled story (title, summary, headings, text), in order."""
    src = open(ts_path, encoding="utf-8").read()
    story = json.loads(src[src.index("= {") + 2:].rstrip().rstrip(";"))
    words = []
    for heading in [story["title"], story["summary"]] + [sec["partTitle"] for sec in story["sections"]]:
        words += [t["text"] for t in heading.get("tokens", []) if not PUNCT.match(t["text"])]
    for sec in story["sections"]:
        for para in sec["paragraphs"]:
            for sent in para["sentences"]:
                words += [t["text"] for t in sent["tokens"] if not PUNCT.match(t["text"])]
    words += [v["word"] for v in story.get("targetVocabulary", [])]
    return list(dict.fromkeys(words))


def cache_path(word, rate):
    key = hashlib.sha1(f"{VOICE}|{rate}|{word}".encode()).hexdigest()[:16]
    return os.path.join(CACHE_DIR, f"{key}.mp3")


async def synthesise_missing(jobs, concurrency):
    import edge_tts

    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    sem = asyncio.Semaphore(concurrency)
    done = 0

    async def one(word, rate, path):
        nonlocal done
        async with sem:
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(word, VOICE, rate=rate, proxy=proxy).save(path + ".tmp")
                    os.replace(path + ".tmp", path)
                    break
                except Exception as e:  # network hiccups: back off and retry
                    if attempt == 3:
                        raise RuntimeError(f"edge-tts failed for {word!r} at {rate}") from e
                    await asyncio.sleep(2 ** attempt)
            done += 1
            if done % 100 == 0:
                print(f"  synthesised {done}/{len(jobs)}")

    await asyncio.gather(*(one(*j) for j in jobs))


def decode(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "quiet", "-i", path, "-ac", "1", "-ar", str(SAMPLE_RATE), "-f", "s16le", "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0


def trim(audio):
    """Cut leading/trailing silence, keep a short pad, fade the edges."""
    hop = SAMPLE_RATE // 200  # 5 ms
    frames = len(audio) // hop
    rms = np.sqrt(np.mean(audio[: frames * hop].reshape(frames, hop) ** 2, axis=1))
    loud = np.where(20 * np.log10(rms + 1e-7) > 20 * np.log10(rms.max() + 1e-7) - 45)[0]
    if not len(loud):
        return audio
    pad = int(EDGE_PAD_S * SAMPLE_RATE)
    a = audio[max(0, loud[0] * hop - pad): min(len(audio), (loud[-1] + 1) * hop + pad)].copy()
    fade = min(len(a) // 4, int(0.005 * SAMPLE_RATE))
    if fade:
        a[:fade] *= np.linspace(0, 1, fade)
        a[-fade:] *= np.linspace(1, 0, fade)
    return a


def build_sprite(words, rate, out_path):
    """Concatenate trimmed words into one MP3; return {word: [start, end]}."""
    gap = np.zeros(int(GAP_S * SAMPLE_RATE), np.float32)
    parts, positions, t = [gap], {}, GAP_S
    for w in words:
        a = trim(decode(cache_path(w, rate)))
        dur = len(a) / SAMPLE_RATE
        positions[w] = [round(max(0.0, t - CLIP_PAD_S), 3), round(t + dur + CLIP_PAD_S, 3)]
        parts += [a, gap]
        t += dur + GAP_S
    pcm = (np.clip(np.concatenate(parts), -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run(
        ["ffmpeg", "-v", "quiet", "-y", "-f", "s16le", "-ar", str(SAMPLE_RATE), "-ac", "1", "-i", "-",
         "-codec:a", "libmp3lame", "-b:a", "48k", out_path],
        input=pcm, check=True,
    )
    return positions


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--concurrency", type=int, default=6)
    ap.add_argument("stories", nargs="*", help="Story JSON files to (re)build (default: all)")
    args = ap.parse_args()
    if not os.path.exists("client/public"):
        sys.exit("Run this from the repository root.")
    os.makedirs(CACHE_DIR, exist_ok=True)
    os.makedirs(OUT_DIR, exist_ok=True)

    selected = [(j, t) for j, t in STORIES if not args.stories or j in args.stories]
    per_story = [(j, t, story_words(t)) for j, t in selected]
    jobs = {(w, r, cache_path(w, r)) for _, _, ws in per_story for w in ws for r in SPEEDS.values()}
    missing = [j for j in sorted(jobs) if not os.path.exists(j[2])]
    print(f"{len(jobs)} word takes needed, {len(missing)} not cached yet")
    if missing:
        asyncio.run(synthesise_missing(missing, args.concurrency))

    for json_path, _, words in per_story:
        story = json.load(open(json_path, encoding="utf-8"))
        sid = story["id"]
        normal = build_sprite(words, SPEEDS["normal"], f"{OUT_DIR}/{sid}.mp3")
        slow = build_sprite(words, SPEEDS["slow"], f"{OUT_DIR}/{sid}_slow.mp3")
        story["wordAudio"] = {
            "url": f"audio/words/{sid}.mp3",
            "slowUrl": f"audio/words/{sid}_slow.mp3",
            # word -> [start, end, slowStart, slowEnd] in seconds
            "clips": {w: normal[w] + slow[w] for w in words},
        }
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(story, f, ensure_ascii=False, indent=2)
            f.write("\n")
        sizes = [os.path.getsize(f"{OUT_DIR}/{sid}{s}.mp3") // 1024 for s in ("", "_slow")]
        print(f"{sid}: {len(words)} words, sprites {sizes[0]} KB / {sizes[1]} KB")


if __name__ == "__main__":
    main()
