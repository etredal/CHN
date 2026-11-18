// Fill out a story's 重点生词 (key vocabulary) list with more HSK 5 and HSK 6
// words from the story itself, used by compile_ts_stories.cjs.
//
// The hand-written words stay first. Added words are HSK 5/6 words of two or
// more characters that occur in the story, preferring frequent ones and HSK 6.
// Each gets its CC-CEDICT definitions (the reading that matches the story)
// and, as its example, the story sentence where it first appears, with that
// sentence's pinyin and English.
const fs = require('fs');
const path = require('path');

const TOTAL_WORDS = 25;
const MAX_DEFINITIONS = 3;

const ROOT = path.join(__dirname, '..');
const levels = require('../client/src/utils/hskLevels.json');
const levelOf = new Map();
for (const [level, words] of Object.entries(levels)) for (const w of words.split(' ')) levelOf.set(w, Number(level));

// The dictionary the app uses: client/public/dict/<version>/<shard>.json.
const DICT_SHARDS = 64; // keep in sync with client/src/dictionary/cedict.ts
const dictDir = (() => {
  const base = path.join(ROOT, 'client/public/dict');
  const versions = fs.readdirSync(base).filter(d => fs.statSync(path.join(base, d)).isDirectory()).sort();
  return path.join(base, versions[versions.length - 1]);
})();
const shards = new Map();
function readings(word) {
  const i = (word.codePointAt(0) ?? 0) % DICT_SHARDS;
  if (!shards.has(i)) shards.set(i, JSON.parse(fs.readFileSync(path.join(dictDir, `${i}.json`), 'utf8')));
  return shards.get(i)[word] ?? [];
}

// Same clean-up as client/src/dictionary/cedict.ts.
const normalize = py => py.toLowerCase().replace(/[\s'’·-]/g, '');
const isMinor = d => /^(old |archaic |erroneous )?variant of |^surname /i.test(d);
const isPronunciationNote = d => /^(also |Taiwan |old |colloquial )?pr\. /i.test(d);
const tidy = d => d
  .replace(/\bCL:/g, '量词: ')
  .replace(/\s*\((?:also |Taiwan )?pr\. \[[^\]]*\]\)/g, '')
  .replace(/[^\s|,;:()[\]]+\|([^\s|,;:()[\]]+)\[[^\]]*\]/g, '$1')
  .replace(/(\p{Script=Han}+)\[[^\]]*\]/gu, '$1')
  .replace(/,(?=\S)/g, ', ')
  .trim();

/** Definitions for the reading of `word` that matches `pinyin`, or null. */
function definitionsFor(word, pinyin) {
  const want = normalize(pinyin);
  const match = readings(word).find(([py]) => normalize(py) === want && py[0] === py[0].toLowerCase());
  if (!match) return null;
  const defs = match[1].split('/').filter(d => d && !isPronunciationNote(d) && !isMinor(d)).map(tidy).filter(Boolean);
  return defs.length ? defs.slice(0, MAX_DEFINITIONS) : null;
}

const TONES = { 'ā': 1, 'ē': 1, 'ī': 1, 'ō': 1, 'ū': 1, 'ǖ': 1, 'á': 2, 'é': 2, 'í': 2, 'ó': 2, 'ú': 2, 'ǘ': 2, 'ǎ': 3, 'ě': 3, 'ǐ': 3, 'ǒ': 3, 'ǔ': 3, 'ǚ': 3, 'à': 4, 'è': 4, 'ì': 4, 'ò': 4, 'ù': 4, 'ǜ': 4 };
const toneOf = py => { for (const c of py) if (TONES[c]) return TONES[c]; return 5; };

/**
 * The story's key words: `handWritten` plus added words, up to TOTAL_WORDS.
 * `sentences` are the story's sentences in order, each with cn/pinyin/en/tokens.
 */
function keyWords(handWritten, sentences) {
  const have = new Set(handWritten.map(v => v.word));
  const found = new Map(); // word -> { count, order, pinyin, sentence }
  let order = 0;
  for (const s of sentences) {
    for (const t of s.tokens) {
      const level = levelOf.get(t.text);
      if (level !== 5 && level !== 6) continue;
      if (Array.from(t.text).length < 2 || have.has(t.text)) continue;
      // Skip parts of a listed word (疲惫 when 疲惫不堪 is already there).
      if (handWritten.some(v => v.word.includes(t.text))) continue;
      const f = found.get(t.text);
      if (f) { f.count++; continue; }
      found.set(t.text, { word: t.text, level, count: 1, order: order++, pinyin: t.pinyin, sentence: s });
    }
  }
  const added = [...found.values()]
    .map(f => ({ ...f, definitions: definitionsFor(f.word, f.pinyin) }))
    .filter(f => f.definitions)
    .sort((a, b) => (b.count + (b.level === 6 ? 0.5 : 0)) - (a.count + (a.level === 6 ? 0.5 : 0)) || a.order - b.order)
    .slice(0, Math.max(0, TOTAL_WORDS - handWritten.length))
    .sort((a, b) => a.order - b.order)
    .map(f => ({
      word: f.word,
      pinyin: f.pinyin.split(' ').reduce((acc, syl, i) => acc + (i > 0 && /^[aeoāáǎàēéěèōóǒò]/.test(syl) ? "'" : '') + syl, ''),
      tone: toneOf(f.pinyin),
      hsk: `HSK ${f.level}`,
      definitions: f.definitions,
      exampleSentence: { cn: f.sentence.cn, pinyin: f.sentence.pinyin, en: f.sentence.en },
    }));
  return [...handWritten, ...added];
}

module.exports = { keyWords };
