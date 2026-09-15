const fs = require('fs');
const { pinyin } = require('../client/node_modules/pinyin-pro');

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

function tokenize(text) {
  const seg = new Intl.Segmenter('zh-Hans', { granularity: 'word' });
  const items = Array.from(seg.segment(text));
  const tokens = [];

  for (const item of items) {
    const raw = item.segment;
    if (!raw.trim()) continue;

    const isPunc = /^[，。！？；：“”‘’（）《》、—…\.,!?;:\'\"()\[\]]$/.test(raw);
    if (isPunc) {
      tokens.push({ text: raw, pinyin: raw, tone: 5, definitions: [] });
      continue;
    }

    const py = pinyin(raw, { toneType: 'symbol' });
    const tone = getTone(py);
    tokens.push({
      text: raw,
      pinyin: py,
      tone,
      definitions: [],
    });
  }
  return tokens;
}

const stories = [
  { jsonFile: 'tools/hsk5_night_train.json', tsFile: 'client/src/data/hsk5_night_train.ts', varName: 'hsk5NightTrain' },
  { jsonFile: 'tools/hsk6_battle_of_julu.json', tsFile: 'client/src/data/hsk6_battle_of_julu.ts', varName: 'hsk6BattleOfJulu' },
  { jsonFile: 'tools/hsk5_digital_nomads.json', tsFile: 'client/src/data/hsk5_digital_nomads.ts', varName: 'hsk5DigitalNomads' },
  { jsonFile: 'tools/hsk6_zhuangzi_oak.json', tsFile: 'client/src/data/hsk6_zhuangzi_oak.ts', varName: 'hsk6ZhuangziOak' },
];

for (const s of stories) {
  const rawData = JSON.parse(fs.readFileSync(s.jsonFile, 'utf8'));

  const formattedSections = rawData.sections.map(sec => ({
    partNumber: sec.partNumber,
    partTitle: sec.partTitle,
    paragraphs: [
      {
        id: `p_${sec.partNumber}_1`,
        sentences: sec.sentences.map(sent => ({
          ...sent,
          tokens: sent.tokens && sent.tokens.length > 0 ? sent.tokens : tokenize(sent.cn)
        }))
      }
    ]
  }));

  const storyObj = {
    ...rawData,
    sections: formattedSections
  };

  const tsContent = `import type { LongStory } from '../types';\n\nexport const ${s.varName}: LongStory = ${JSON.stringify(storyObj, null, 2)};\n`;
  fs.writeFileSync(s.tsFile, tsContent, 'utf8');
  console.log(`Wrote ${s.tsFile}`);
}

const indexContent = `import type { LongStory } from '../types';
import { hsk5NightTrain } from './hsk5_night_train';
import { hsk6BattleOfJulu } from './hsk6_battle_of_julu';
import { hsk5DigitalNomads } from './hsk5_digital_nomads';
import { hsk6ZhuangziOak } from './hsk6_zhuangzi_oak';

export { hsk5NightTrain, hsk6BattleOfJulu, hsk5DigitalNomads, hsk6ZhuangziOak };

export const ALL_STORIES: LongStory[] = [
  hsk5NightTrain,
  hsk6BattleOfJulu,
  hsk5DigitalNomads,
  hsk6ZhuangziOak,
];

export function getStoryById(id: string): LongStory | undefined {
  return ALL_STORIES.find(s => s.id === id);
}
`;
fs.writeFileSync('client/src/data/index.ts', indexContent, 'utf8');
console.log('Wrote client/src/data/index.ts');
