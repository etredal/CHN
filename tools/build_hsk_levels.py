"""Build client/src/utils/hskLevels.json: the official HSK 2.0 word list (5,000
words, levels 1-6) as one space-separated string of words per level.

Source: the `hsk-words` npm package by John Heroy (MIT licence), which ships
the list in db/hsk-words.sqlite:

    npm pack hsk-words && tar xzf hsk-words-*.tgz
    python tools/build_hsk_levels.py package/db/hsk-words.sqlite

A word listed at two levels (长, 得, 还...) keeps the lower one; patterns such
as …分之… are skipped.
"""

import json
import re
import sqlite3
import sys

OUT = "client/src/utils/hskLevels.json"


def main(db_path):
    levels = {}
    with sqlite3.connect(db_path) as db:
        for level, word in db.execute("SELECT level, simplified FROM Words"):
            word = word.strip()
            if not re.fullmatch(r"[一-鿿]+", word):
                continue
            levels[word] = min(level, levels.get(word, level))
    by_level = {str(n): " ".join(sorted(w for w, l in levels.items() if l == n)) for n in range(1, 7)}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(by_level, f, ensure_ascii=False, indent=0)
        f.write("\n")
    counts = {n: len(s.split()) for n, s in by_level.items()}
    print(f"Wrote {OUT}: {sum(counts.values())} words {counts}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
