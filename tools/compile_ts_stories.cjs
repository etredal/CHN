const fs = require('fs');
const { keyWords } = require('./key_words.cjs');
const { pinyin, customPinyin } = require('../client/node_modules/pinyin-pro');
// Words pinyin-pro gets wrong; shared with the app (ChineseText).
customPinyin(require('../client/src/utils/pinyinOverrides.json'));

const TONE_MARKS = {
  'ā': 1, 'ē': 1, 'ī': 1, 'ō': 1, 'ū': 1, 'ǖ': 1,
  'á': 2, 'é': 2, 'í': 2, 'ó': 2, 'ú': 2, 'ǘ': 2,
  'ǎ': 3, 'ě': 3, 'ǐ': 3, 'ǒ': 3, 'ǔ': 3, 'ǚ': 3,
  'à': 4, 'è': 4, 'ì': 4, 'ò': 4, 'ù': 4, 'ǜ': 4,
};
function getTone(py) {
  for (const c of py) {
    if (TONE_MARKS[c]) return TONE_MARKS[c];
  }
  return 5;
}

const PUNC = /^[，。！？；：“”‘’（）《》、—…\.,!?;:\'\"()\[\]]$/;
const PRONOUNS = new Set(['我', '你', '他', '她', '它', '我们', '你们', '他们', '她们', '咱们', '谁']);

// Pinyin for each character, worked out from the whole sentence so that
// polyphonic characters get their in-context reading (了 le, 长者 zhǎng...).
function sentencePinyin(text) {
  return pinyin(text, { type: 'all', toneType: 'symbol' }).map(c => (c.isZh ? c.pinyin : c.origin));
}

// Structural particles that pinyin-pro misreads even in context, when they
// stand alone as a word: adverbial 地 (慢慢地走) and complement 得 (长得高).
function fixParticle(tok, prev) {
  if (tok.text === '地' && prev && !PUNC.test(prev.text) && (prev.text.length >= 2 || /[般样]$/.test(prev.text))) return 'de';
  if (tok.text === '得' && prev && !PUNC.test(prev.text)) return PRONOUNS.has(prev.text) ? 'děi' : 'de';
  return null;
}

function tokenize(text) {
  const seg = new Intl.Segmenter('zh-Hans', { granularity: 'word' });
  const charPinyin = sentencePinyin(text);
  const tokens = [];

  for (const item of seg.segment(text)) {
    const raw = item.segment;
    if (!raw.trim()) continue;

    if (PUNC.test(raw)) {
      tokens.push({ text: raw, pinyin: raw, tone: 5, definitions: [] });
      continue;
    }

    const prev = tokens[tokens.length - 1];
    // Tokens without any Chinese (Z282, 207) keep their text as "pinyin".
    const py = !/\p{Script=Han}/u.test(raw)
      ? raw
      : fixParticle({ text: raw }, prev) ?? charPinyin.slice(item.index, item.index + raw.length).join(' ');
    tokens.push({
      text: raw,
      pinyin: py,
      tone: getTone(py),
      definitions: [],
    });
  }
  return tokens;
}

// Give each spoken token the onset of its first character, using the
// per-character times written by tools/align_word_timings.py. A token ends
// where the next spoken token starts (or at the end of the sentence).
// Punctuation tokens get no times, so they are never highlighted.
function addTokenTimes(sent, tokens) {
  const charTimes = sent.charTimes;
  if (!charTimes) return tokens;
  let cursor = 0;
  const timed = tokens.map(tok => {
    const at = sent.cn.indexOf(tok.text, cursor);
    if (at < 0) throw new Error(`Token "${tok.text}" not found in sentence ${sent.id}`);
    cursor = at + tok.text.length;
    const onsets = charTimes.slice(at, cursor).filter(t => t !== null && t !== undefined);
    const { startTime, endTime, ...rest } = tok;
    return onsets.length ? { ...rest, startTime: onsets[0] } : rest;
  });
  const spoken = timed.filter(t => t.startTime !== undefined);
  spoken.forEach((tok, i) => {
    tok.endTime = i + 1 < spoken.length ? spoken[i + 1].startTime : sent.endTime;
  });
  return timed;
}

const stories = [
  { jsonFile: 'tools/hsk5_night_train.json', tsFile: 'client/src/data/hsk5_night_train.ts', varName: 'hsk5NightTrain' },
  { jsonFile: 'tools/hsk6_battle_of_julu.json', tsFile: 'client/src/data/hsk6_battle_of_julu.ts', varName: 'hsk6BattleOfJulu' },
  { jsonFile: 'tools/hsk5_digital_nomads.json', tsFile: 'client/src/data/hsk5_digital_nomads.ts', varName: 'hsk5DigitalNomads' },
  { jsonFile: 'tools/hsk6_zhuangzi_oak.json', tsFile: 'client/src/data/hsk6_zhuangzi_oak.ts', varName: 'hsk6ZhuangziOak' },
  { jsonFile: 'tools/hsk5_hometown.json', tsFile: 'client/src/data/hsk5_hometown.ts', varName: 'hsk5Hometown' },
  { jsonFile: 'tools/hsk6_school_611.json', tsFile: 'client/src/data/hsk6_school_611.ts', varName: 'hsk6School611' },
];

function groupParagraphs(sentences) {
  const groups = [];
  let current = null;
  for (const s of sentences) {
    if (!groups.length || (s.paragraph ?? 1) !== current) {
      groups.push([]);
      current = s.paragraph ?? 1;
    }
    groups[groups.length - 1].push(s);
  }
  return groups;
}

// Tokens written by a story's generator (tools/generate_story5.cjs) win over
// the automatic word split.
const tokensOf = block => (block.tokens && block.tokens.length > 0 ? block.tokens : tokenize(block.cn));

const catalog = [];
for (const s of stories) {
  const rawData = JSON.parse(fs.readFileSync(s.jsonFile, 'utf8'));
  s.id = rawData.id;
  catalog.push({
    id: rawData.id,
    title: { cn: rawData.title.cn, pinyin: rawData.title.pinyin, en: rawData.title.en },
    level: rawData.level,
    category: rawData.category,
    stats: rawData.stats,
    ...(rawData.audioUrl ? { audioUrl: rawData.audioUrl } : {}),
    summary: { cn: rawData.summary.cn, en: rawData.summary.en },
  });

  const formattedSections = rawData.sections.map(sec => ({
    partNumber: sec.partNumber,
    // Headings are split into words too, so they read like the story text.
    partTitle: { ...sec.partTitle, tokens: tokensOf(sec.partTitle) },
    // Sentences may carry a paragraph number; without one, the whole
    // section is a single paragraph.
    paragraphs: groupParagraphs(sec.sentences).map((sentences, i) => ({
      id: `p_${sec.partNumber}_${i + 1}`,
      sentences: sentences.map(({ charTimes, paragraph, ...sent }) => ({
        ...sent,
        tokens: addTokenTimes(
          { ...sent, charTimes },
          sent.tokens && sent.tokens.length > 0 ? sent.tokens : tokenize(sent.cn)
        )
      }))
    }))
  }));

  const storyObj = {
    ...rawData,
    title: { ...rawData.title, tokens: tokensOf(rawData.title) },
    summary: { ...rawData.summary, tokens: tokensOf(rawData.summary) },
    sections: formattedSections,
    // The hand-written key words, then more HSK 5/6 words from the story.
    targetVocabulary: keyWords(
      rawData.targetVocabulary,
      formattedSections.flatMap(sec => sec.paragraphs.flatMap(p => p.sentences)),
    ),
  };

  const tsContent = `import type { LongStory } from '../types';\n\nexport const ${s.varName}: LongStory = ${JSON.stringify(storyObj, null, 2)};\n`;
  fs.writeFileSync(s.tsFile, tsContent, 'utf8');
  console.log(`Wrote ${s.tsFile}`);
}

// The library only needs each story's card details; the full story (text,
// tokens, timings) is a separate chunk loaded when the story is opened.
const indexContent = `import type { LongStory, StorySummary } from '../types';

// Generated by tools/compile_ts_stories.cjs.
export const STORY_CATALOG: StorySummary[] = ${JSON.stringify(catalog, null, 2)};

const LOADERS: Record<string, () => Promise<LongStory>> = {
${stories.map(s => `  ${JSON.stringify(s.id)}: () => import('./${s.tsFile.split('/').pop().replace(/\.ts$/, '')}').then(m => m.${s.varName}),`).join('\n')}
};

export function loadStory(id: string): Promise<LongStory> {
  const load = LOADERS[id];
  return load ? load() : Promise.reject(new Error(\`Unknown story: \${id}\`));
}
`;
fs.writeFileSync('client/src/data/index.ts', indexContent, 'utf8');
console.log('Wrote client/src/data/index.ts');
