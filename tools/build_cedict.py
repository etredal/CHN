"""Build the app's dictionary from CC-CEDICT.

Input: cedict.json from the `cedict-json` npm package (CC-CEDICT as a JSON
array of {traditional, simplified, pinyin, english}). Get it without running
any package code:

    npm pack cedict-json && tar xzf cedict-json-*.tgz
    python3 tools/build_cedict.py package/cedict.json

Output: client/public/dict/<version>/<n>.json (version from the package, so a
new dictionary gets new URLs and never hides behind an old cached copy), the dictionary split into shards by the
first character of each word (see shardOf in client/src/dictionary/cedict.ts),
so a lookup only downloads the shard it needs. Each shard maps a simplified
word to its readings: [[pinyin with tone marks, "def1/def2/..."], ...].

CC-CEDICT is licensed CC BY-SA 4.0; the LICENSE file is copied alongside.
"""

import json
import os
import re
import shutil
import sys

SHARDS = 64  # keep in sync with client/src/dictionary/cedict.ts
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'client', 'public', 'dict')

TONE_MARKS = {
    'a': 'āáǎà', 'e': 'ēéěè', 'i': 'īíǐì', 'o': 'ōóǒò', 'u': 'ūúǔù', 'ü': 'ǖǘǚǜ',
}


def mark_syllable(syl: str) -> str:
    """'xiang1' -> 'xiāng', 'lu:4' -> 'lǜ'. Leaves non-pinyin as is."""
    m = re.fullmatch(r'([A-Za-zü:]+)([1-5])', syl)
    if not m:
        return syl.replace('u:', 'ü').replace('U:', 'Ü')
    letters, tone = m.group(1).replace('u:', 'ü').replace('U:', 'Ü'), int(m.group(2))
    if tone == 5:
        return letters
    lower = letters.lower()
    # Standard placement: a or e takes the mark; in "ou" the o; otherwise
    # the last vowel.
    if 'a' in lower:
        i = lower.index('a')
    elif 'e' in lower:
        i = lower.index('e')
    elif 'ou' in lower:
        i = lower.index('o')
    else:
        i = max(lower.rfind(v) for v in 'iouü')
        if i < 0:
            return letters
    mark = TONE_MARKS[lower[i]][tone - 1]
    if letters[i].isupper():
        mark = mark.upper()
    return letters[:i] + mark + letters[i + 1:]


def shard_of(word: str) -> int:
    return ord(word[0]) % SHARDS


def main(src: str) -> None:
    with open(src, encoding='utf-8') as f:
        entries = json.load(f)

    words: dict[str, list[list[str]]] = {}
    for e in entries:
        word = e['simplified']
        pinyin = ' '.join(mark_syllable(s) for s in e['pinyin'].split())
        defs = '/'.join(d.strip() for d in e['english'] if d.strip())
        if not defs:
            continue
        readings = words.setdefault(word, [])
        same = next((r for r in readings if r[0] == pinyin), None)
        if same:
            same[1] += '/' + defs  # traditional variants of one simplified word
        else:
            readings.append([pinyin, defs])

    shards: list[dict] = [{} for _ in range(SHARDS)]
    for word, readings in words.items():
        shards[shard_of(word)][word] = readings

    pkg = os.path.join(os.path.dirname(src), 'package.json')
    with open(pkg, encoding='utf-8') as f:
        version = json.load(f)['version'].split('.')[-1]  # e.g. 20251213
    if os.path.isdir(OUT_DIR):
        shutil.rmtree(OUT_DIR)
    out = os.path.join(OUT_DIR, version)
    os.makedirs(out)
    total = 0
    for i, shard in enumerate(shards):
        data = json.dumps(shard, ensure_ascii=False, separators=(',', ':'), sort_keys=True)
        total += len(data.encode())
        with open(os.path.join(out, f'{i}.json'), 'w', encoding='utf-8') as f:
            f.write(data)
    licence = os.path.join(os.path.dirname(src), 'LICENSE')
    if os.path.exists(licence):
        shutil.copy(licence, os.path.join(out, 'LICENSE.txt'))
    print(f'{len(words)} words in {SHARDS} shards, {total / 1e6:.1f} MB -> dict/{version}/ (set DICT_VERSION in cedict.ts)')


if __name__ == '__main__':
    main(sys.argv[1])
