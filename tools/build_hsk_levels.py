"""Build client/src/utils/hskLevels.json: the official HSK 2.0 word list (the
2012 revision, about 5,000 words in levels 1-6) as one space-separated string
of words per level.

Source: the official list published by Hanban (the HSK exam body), as packaged
in the `@leonsilicon/hsk2.0` npm package (HSK2.0_words_level1..6.json). Get it
without running any package code:

    npm pack @leonsilicon/hsk2.0 && tar xzf leonsilicon-hsk2.0-*.tgz
    python tools/build_hsk_levels.py package

A word listed at two levels keeps the lower one; patterns such as
因为……所以…… are skipped.
"""

import json
import os
import re
import sys

OUT = "client/src/utils/hskLevels.json"


def main(package_dir):
    levels = {}
    for level in range(1, 7):
        with open(os.path.join(package_dir, f"HSK2.0_words_level{level}.json"), encoding="utf-8") as f:
            for word in json.load(f):
                word = word.strip()
                if re.fullmatch(r"[一-鿿]+", word):
                    levels.setdefault(word, level)
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
