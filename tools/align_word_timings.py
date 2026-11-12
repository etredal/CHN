"""Measure when each character of each story sentence is actually spoken.

The story audio is synthesised from the sentence text, and edge-tts only gives
us sentence-level cue times. To highlight words in sync with the voice we need
per-character onsets, so we run an offline Chinese speech recogniser with
timestamps (sherpa-onnx Paraformer) over the story audio and align the
recognised characters back onto the known story text.

For every sentence this writes ``charTimes``: a list with one entry per
character of ``cn``, holding the onset in seconds (absolute, from the start of
the story audio), or ``None`` for punctuation and whitespace.
It also rewrites each sentence's ``startTime``/``endTime`` from those onsets.
``compile_ts_stories.cjs`` turns ``charTimes`` into per-token
``startTime``/``endTime``.

Usage (from the repo root):

    pip install sherpa-onnx numpy
    # ffmpeg must be on PATH
    curl -LO https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-paraformer-zh-2023-09-14.tar.bz2
    tar xjf sherpa-onnx-paraformer-zh-2023-09-14.tar.bz2
    python tools/align_word_timings.py --model sherpa-onnx-paraformer-zh-2023-09-14
    node tools/compile_ts_stories.cjs
"""

import argparse
import difflib
import json
import os
import subprocess
import sys

import numpy as np

SAMPLE_RATE = 16000

STORY_JSONS = [
    "tools/hsk5_night_train.json",
    "tools/hsk6_battle_of_julu.json",
    "tools/hsk5_digital_nomads.json",
    "tools/hsk6_zhuangzi_oak.json",
    "tools/hsk5_hometown.json",
]

PUNCT = set("，。！？；：“”‘’（）《》、—…,.!?;:'\"()[] \t\n")


def is_spoken(ch):
    return ch not in PUNCT


def load_audio(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "quiet", "-i", path, "-ac", "1", "-ar", str(SAMPLE_RATE), "-f", "s16le", "-"],
        capture_output=True,
        check=True,
    ).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0


def make_recognizer(model_dir):
    import sherpa_onnx

    return sherpa_onnx.OfflineRecognizer.from_paraformer(
        paraformer=os.path.join(model_dir, "model.int8.onnx"),
        tokens=os.path.join(model_dir, "tokens.txt"),
        num_threads=os.cpu_count() or 2,
    )


def split_at_pauses(audio, max_chunk_s=15.0, min_pause_s=0.18):
    """Cut the audio into chunks of at most ``max_chunk_s``, only at pauses.

    The audio is clean TTS, so a simple energy threshold finds pauses reliably.
    """
    hop = SAMPLE_RATE // 100  # 10 ms frames
    frames = len(audio) // hop
    rms = np.sqrt(np.mean(audio[: frames * hop].reshape(frames, hop) ** 2, axis=1))
    db = 20 * np.log10(rms + 1e-6)
    silent = db < db.max() - 40

    # Midpoints of pauses long enough to cut at, in seconds.
    cut_points = []
    run_start = None
    for i, s in enumerate(silent):
        if s and run_start is None:
            run_start = i
        elif not s and run_start is not None:
            if (i - run_start) * 0.01 >= min_pause_s:
                cut_points.append((run_start + i) / 2 * 0.01)
            run_start = None

    total = len(audio) / SAMPLE_RATE
    chunks = []
    start = 0.0
    while total - start > max_chunk_s:
        candidates = [c for c in cut_points if start + 1.0 < c <= start + max_chunk_s]
        cut = candidates[-1] if candidates else start + max_chunk_s
        chunks.append((start, cut))
        start = cut
    chunks.append((start, total))
    return chunks


def recognise(recognizer, audio, start_s, end_s):
    """Return [(char, absolute_onset_s)] recognised in audio[start_s:end_s]."""
    a = audio[int(start_s * SAMPLE_RATE): int(end_s * SAMPLE_RATE)]
    stream = recognizer.create_stream()
    stream.accept_waveform(SAMPLE_RATE, a)
    recognizer.decode_stream(stream)
    out = []
    for tok, t in zip(stream.result.tokens, stream.result.timestamps):
        # Paraformer emits one Chinese character per token, but Latin letters
        # may come as multi-letter pieces (e.g. "ok@@"). Give each letter the
        # piece's onset.
        for ch in tok.replace("@@", "").strip():
            out.append((ch.lower(), start_s + t))
    return out


def align(target, recognised, start_s, end_s):
    """Give every char in ``target`` an onset time taken from ``recognised``.

    Returns (times, directly_matched_count).
    """
    hyp = [c for c, _ in recognised]
    hyp_t = [t for _, t in recognised]
    n = len(target)
    times = [None] * n
    matched = 0
    sm = difflib.SequenceMatcher(a=target, b=hyp, autojunk=False)
    for op, a0, a1, b0, b1 in sm.get_opcodes():
        if op == "equal" or (op == "replace" and (a1 - a0) == (b1 - b0)):
            # A same-length substitution is almost always a homophone the
            # recogniser spelled differently (e.g. 舟 -> 周): position holds.
            for k in range(a1 - a0):
                times[a0 + k] = hyp_t[b0 + k]
            matched += a1 - a0

    # Anything left (digits read out as words, dropped chars...) is spread
    # evenly between the nearest known neighbours.
    i = 0
    while i < n:
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < n and times[j] is None:
            j += 1
        left = times[i - 1] if i > 0 else start_s
        right = times[j] if j < n else end_s
        right = max(right, left)
        for k in range(j - i):
            times[i + k] = left + (right - left) * (k + 1) / (j - i + 1)
        i = j

    for k in range(1, n):  # onsets never go backwards
        times[k] = max(times[k], times[k - 1])
    return times, matched


def process_story(json_path, recognizer):
    with open(json_path, encoding="utf-8") as f:
        story = json.load(f)

    audio_path = os.path.join("client/public", story["audioUrl"].lstrip("/"))
    audio = load_audio(audio_path)
    duration = len(audio) / SAMPLE_RATE

    recognised = []
    for lo, hi in split_at_pauses(audio):
        recognised.extend(recognise(recognizer, audio, lo, hi))

    # Align the whole story at once. edge-tts's subtitle cues do not map 1:1
    # onto our sentences (it sometimes splits a sentence at a closing quote),
    # so sentence times are derived from the aligned characters as well.
    sentences = [s for sec in story["sections"] for s in sec["sentences"]]
    target, owner = [], []  # owner[k] = (sentence index, char index in cn)
    for si, s in enumerate(sentences):
        for ci, ch in enumerate(s["cn"]):
            if is_spoken(ch):
                target.append(ch.lower())
                owner.append((si, ci))
    times, matched = align(target, recognised, 0.0, duration)

    for s in sentences:
        s["charTimes"] = [None] * len(s["cn"])
    for (si, ci), t in zip(owner, times):
        sentences[si]["charTimes"][ci] = round(t, 3)

    # Sentence spans: start a touch before the first spoken char; end where
    # the next sentence starts, so there are no gaps between sentences.
    lead = 0.1
    firsts = [next(t for t in s["charTimes"] if t is not None) for s in sentences]
    for si, s in enumerate(sentences):
        prev_first = firsts[si - 1] if si > 0 else 0.0
        s["startTime"] = round(max(prev_first, firsts[si] - lead, 0.0), 3)
    for si, s in enumerate(sentences):
        s["endTime"] = sentences[si + 1]["startTime"] if si + 1 < len(sentences) else round(duration, 3)

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(story, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"{json_path}: {matched}/{len(target)} chars matched "
          f"({100 * matched / max(len(target), 1):.1f}%), rest interpolated; "
          f"{len(recognised)} chars heard in {duration:.1f}s of audio")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--model", required=True, help="Path to the extracted sherpa-onnx Paraformer zh model directory")
    ap.add_argument("stories", nargs="*", default=STORY_JSONS, help="Story JSON files (default: all)")
    args = ap.parse_args()

    if not os.path.exists("client/public"):
        sys.exit("Run this from the repository root.")
    recognizer = make_recognizer(args.model)
    for path in args.stories:
        process_story(path, recognizer)


if __name__ == "__main__":
    main()
