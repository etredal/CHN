// Shared code for the long-story generators (generate_story5.cjs, generate_story6.cjs).
//
// A story is written as a text file: "## <Chinese> || <English>" starts a
// section, every other non-comment line is "<Chinese sentence> || <English>",
// and a blank line starts a new paragraph. Each generator supplies its own
// word-split and reading fixes; this module splits the text into tokens with
// pinyin and writes the story JSON (compile_ts_stories.cjs keeps tokens it is
// given) plus a plain-text file for the narration.
const fs = require('fs');
const { execFileSync } = require('child_process');
const { pinyin, customPinyin } = require('../client/node_modules/pinyin-pro');
customPinyin(require('../client/src/utils/pinyinOverrides.json'));

const PUNC_RE = /^[，。！？；：“”‘’（）《》、—…\.,!?;:'"()\[\]\s]+$/;
const TONES = { 'ā': 1, 'ē': 1, 'ī': 1, 'ō': 1, 'ū': 1, 'ǖ': 1, 'á': 2, 'é': 2, 'í': 2, 'ó': 2, 'ú': 2, 'ǘ': 2, 'ǎ': 3, 'ě': 3, 'ǐ': 3, 'ǒ': 3, 'ǔ': 3, 'ǚ': 3, 'à': 4, 'è': 4, 'ì': 4, 'ò': 4, 'ù': 4, 'ǜ': 4 };
const tone = py => { for (const c of py) if (TONES[c]) return TONES[c]; return 5; };

function allIndexes(text, sub) {
  const out = [];
  for (let i = text.indexOf(sub); i >= 0; i = text.indexOf(sub, i + 1)) out.push(i);
  return out;
}

// segmentFixes: each entry fixes the word boundaries inside every place the
// text (without slashes) occurs: a slash is a boundary, and there are no
// other boundaries inside. Plain words just keep the word whole.
// readings: words whose pinyin pinyin-pro gets wrong (one syllable per character).
// proper: words written with a capital letter in the sentence pinyin.
function makeTokenizer({ segmentFixes, readings, proper }) {
  function segment(text) {
    const seg = new Intl.Segmenter('zh-Hans', { granularity: 'word' });
    // cuts[i] = true when a word boundary falls before text[i].
    const cuts = new Array(text.length + 1).fill(false);
    for (const s of seg.segment(text)) { cuts[s.index] = true; cuts[s.index + s.segment.length] = true; }
    // 了 after a verb is its own word (隔了 -> 隔 / 了), except in these words.
    const KEEP_LE = new Set(['为了', '罢了', '不得了', '除了', '算了']);
    for (const s of seg.segment(text)) {
      const w = s.segment;
      if (w.length >= 2 && w.endsWith('了') && !KEEP_LE.has(w)) cuts[s.index + w.length - 1] = true;
      if (w.length >= 2 && w.startsWith('了')) cuts[s.index + 1] = true;
    }
    // Punctuation is always its own token, one mark at a time.
    for (let i = 0; i < text.length; i++) if (PUNC_RE.test(text[i])) { cuts[i] = true; cuts[i + 1] = true; }
    // Longer patterns last, so they have the final say.
    const patterns = [...segmentFixes].sort((a, b) => a.replace(/\//g, '').length - b.replace(/\//g, '').length);
    for (const pat of patterns) {
      const plain = pat.replace(/\//g, '');
      const inner = [];
      let k = 0;
      for (const ch of pat) { if (ch === '/') inner.push(k); else k++; }
      for (const at of allIndexes(text, plain)) {
        cuts[at] = true; cuts[at + plain.length] = true;
        for (let j = 1; j < plain.length; j++) cuts[at + j] = inner.includes(j);
      }
    }
    const words = [];
    let start = 0;
    for (let i = 1; i <= text.length; i++) {
      if (cuts[i] || i === text.length) { if (text.slice(start, i).trim()) words.push({ text: text.slice(start, i), index: start }); start = i; }
    }
    return words;
  }

  function charReadings(text) {
    const py = pinyin(text, { type: 'all', toneType: 'symbol' }).map(c => (c.isZh ? c.pinyin : c.origin));
    // Shorter keys first, so longer (more specific) ones win.
    const keys = Object.keys(readings).sort((a, b) => a.length - b.length);
    for (const key of keys) {
      const sylls = readings[key].split(' ');
      for (const at of allIndexes(text, key)) {
        let s = 0;
        for (let j = 0; j < key.length; j++) {
          if (/\p{Script=Han}/u.test(key[j])) py[at + j] = sylls[s++].replace(/[，。；]/g, '');
        }
      }
    }
    return py;
  }

  function tokenize(text) {
    const py = charReadings(text);
    return segment(text).map(w => {
      if (PUNC_RE.test(w.text)) return { text: w.text, pinyin: w.text, tone: 5, definitions: [] };
      const p = /\p{Script=Han}/u.test(w.text) ? py.slice(w.index, w.index + w.text.length).join(' ') : w.text;
      return { text: w.text, pinyin: p, tone: tone(p), definitions: [] };
    });
  }

  const ASCII_PUNC = { '，': ',', '。': '.', '！': '!', '？': '?', '；': ';', '：': ':', '、': ',', '（': '(', '）': ')' };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  // Sentence pinyin for display: syllables joined within words, capitalised
  // at sentence starts and on names.
  function sentencePinyin(tokens) {
    let out = '';
    let capNext = true;
    for (const t of tokens) {
      if (PUNC_RE.test(t.text)) {
        const p = ASCII_PUNC[t.text] ?? t.text;
        if (t.text === '“' || t.text === '（') out += (out && !out.endsWith(' ') ? ' ' : '') + p;
        else if (t.text === '—') out += p === '—' ? '—' : p;
        else out += p + (t.text === '”' || t.text === '）' || t.text === '…' ? '' : ' ');
        if ('。！？'.includes(t.text)) capNext = true;
        continue;
      }
      // Apostrophe before a syllable starting with a vowel inside a word (Hóng'ér).
      let w = t.pinyin.split(' ').reduce((acc, s, i) => acc + (i > 0 && /^[aeoāáǎàēéěèōóǒò]/.test(s) ? "'" : '') + s, '');
      if (proper.has(t.text) || capNext) w = cap(w);
      capNext = false;
      if (out && !/[\s“(—]$/.test(out)) out += ' ';
      out += w;
    }
    return out.replace(/\s+/g, ' ').replace(/ ([,.!?;:)”])/g, '$1').trim();
  }

  return { tokenize, sentencePinyin };
}

// Build the story JSON. config: { id, src, out, audioText, mp3, meta, level,
// category, idPrefix, readingMinutes } plus the tokenizer fixes above.
function buildStory(config) {
  const { tokenize, sentencePinyin } = makeTokenizer(config);
  const lines = fs.readFileSync(config.src, 'utf8').split('\n').filter(l => !l.startsWith('# ') && l !== '#');
  const sections = [];
  let paragraph = 1;
  let blank = false;
  for (const line of lines) {
    if (!line.trim()) { blank = true; continue; }
    const [cn, en] = line.replace(/^## /, '').split(' || ').map(s => s.trim());
    if (line.startsWith('## ')) {
      sections.push({ partNumber: sections.length + 1, partTitle: { cn, en, tokens: tokenize(cn) }, sentences: [] });
      paragraph = 1;
    } else {
      const sec = sections[sections.length - 1];
      if (blank && sec.sentences.length) paragraph++;
      const tokens = tokenize(cn);
      sec.sentences.push({ id: `${config.idPrefix}_${sec.partNumber}_${sec.sentences.length + 1}`, paragraph, cn, pinyin: sentencePinyin(tokens), en, tokens });
    }
    blank = false;
  }

  // Keep timings measured earlier (align_word_timings.py) if the text is unchanged.
  const previous = {};
  const oldStory = fs.existsSync(config.out) ? JSON.parse(fs.readFileSync(config.out, 'utf8')) : {};
  for (const sec of oldStory.sections ?? []) for (const s of sec.sentences) previous[s.id] = s;
  for (const sec of sections) for (const s of sec.sentences) {
    const old = previous[s.id];
    if (old && old.cn === s.cn) Object.assign(s, { startTime: old.startTime, endTime: old.endTime, charTimes: old.charTimes });
    else Object.assign(s, { startTime: 0, endTime: 0 });
  }

  const meta = config.meta;
  let audioSeconds = 0;
  try {
    audioSeconds = Math.round(Number(execFileSync('ffprobe', ['-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', config.mp3]).toString()));
  } catch { /* no audio yet */ }
  const allText = sections.flatMap(sec => sec.sentences.map(s => s.cn)).join('');
  const story = {
    id: config.id,
    title: { ...meta.title, tokens: tokenize(meta.title.cn) },
    level: config.level,
    category: config.category,
    stats: {
      characterCount: (allText.match(/\p{Script=Han}/gu) || []).length,
      audioDurationSeconds: audioSeconds || oldStory.stats?.audioDurationSeconds || 0,
      estimatedReadingTimeMinutes: config.readingMinutes,
    },
    audioUrl: config.mp3.replace(/^client\/public\//, ''),
    summary: { ...meta.summary, tokens: tokenize(meta.summary.cn) },
    sections,
    targetVocabulary: meta.targetVocabulary,
    grammarNotes: meta.grammarNotes,
    quiz: meta.quiz,
    ...(oldStory.wordAudio ? { wordAudio: oldStory.wordAudio } : {}),
  };
  fs.writeFileSync(config.out, JSON.stringify(story, null, 2) + '\n', 'utf8');

  // Text for the narration: one sentence per line, sections separated by a blank line.
  fs.writeFileSync(config.audioText, sections.map(sec => sec.sentences.map(s => s.cn).join('\n')).join('\n\n') + '\n', 'utf8');
  console.log(`Wrote ${config.out}: ${sections.length} sections, ${sections.reduce((n, s) => n + s.sentences.length, 0)} sentences, ${story.stats.characterCount} characters`);
  return story;
}

module.exports = { makeTokenizer, buildStory };
