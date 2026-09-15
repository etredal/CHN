import type { WordToken, HskLevel, WordCharacter } from '../types';
import { pinyin } from 'pinyin-pro';
import { getToneFromPinyin } from '../utils/pinyin';

export interface DictEntry {
  pinyin: string;
  definitions: string[];
  hsk?: HskLevel;
  traditional?: string;
}

export const BUILTIN_DICT: Record<string, DictEntry> = {
  // Story 1: Night Train (HSK 5)
  '雨水': { pinyin: 'yǔshuǐ', definitions: ['rainwater', 'rainfall'], hsk: 'HSK 3' },
  '敲打': { pinyin: 'qiāodǎ', definitions: ['to beat', 'to knock', 'to tap rhythmically'], hsk: 'HSK 5' },
  '顶棚': { pinyin: 'dǐngpéng', definitions: ['ceiling', 'roof awning', 'canopy'], hsk: 'HSK 5' },
  '沉闷': { pinyin: 'chénmèn', definitions: ['oppressive (atmosphere)', 'dull', 'depressed'], hsk: 'HSK 5' },
  '连绵': { pinyin: 'liánmián', definitions: ['continuous', 'unbroken', 'stretching without interruption'], hsk: 'HSK 5' },
  '声响': { pinyin: 'shēngxiǎng', definitions: ['sound', 'noise', 'clamor'], hsk: 'HSK 5' },
  '建筑师': { pinyin: 'jiànzhùshī', definitions: ['architect'], hsk: 'HSK 5' },
  '公文包': { pinyin: 'gōngwénbāo', definitions: ['briefcase'], hsk: 'HSK 5' },
  '步履匆匆': { pinyin: 'bùlǚ cōngcōng', definitions: ['hurried steps', 'walking in great haste'], hsk: 'HSK 5' },
  '商贸': { pinyin: 'shāngmào', definitions: ['commerce and trade'], hsk: 'HSK 5' },
  '综合体': { pinyin: 'zōnghétǐ', definitions: ['complex', 'integrated structural complex'], hsk: 'HSK 6' },
  '竞标': { pinyin: 'jìngbiāo', definitions: ['to bid competitively', 'enter a competitive tender'], hsk: 'HSK 6' },
  '通宵': { pinyin: 'tōngxiāo', definitions: ['all night', 'through the night', 'overnight'], hsk: 'HSK 5' },
  '疲惫不堪': { pinyin: 'píbèi bùkān', definitions: ['utterly exhausted', 'worn out to the bone'], hsk: 'HSK 5' },
  '铁轨': { pinyin: 'tiěguǐ', definitions: ['railroad track', 'iron rail'], hsk: 'HSK 5' },
  '颠簸': { pinyin: 'diānbǒ', definitions: ['to bump', 'to jolt', 'to toss along roughly'], hsk: 'HSK 5' },
  '毫无': { pinyin: 'háowú', definitions: ['not in the least', 'completely devoid of'], hsk: 'HSK 5' },
  '睡意': { pinyin: 'shuìyì', definitions: ['sleepiness', 'drowsiness'], hsk: 'HSK 5' },
  '无边无际': { pinyin: 'wúbiān-wújì', definitions: ['boundless', 'limitless', 'vast without borders'], hsk: 'HSK 5' },
  '思绪': { pinyin: 'sīxù', definitions: ['train of thought', 'emotional reflection'], hsk: 'HSK 5' },
  '远大前程': { pinyin: 'yuǎndà qiánchéng', definitions: ['bright prospects', 'great and promising future'], hsk: 'HSK 5' },
  '日夜兼程': { pinyin: 'rìyè-jiānchéng', definitions: ['travel day and night at double speed'], hsk: 'HSK 6' },
  '奔波': { pinyin: 'bēnbō', definitions: ['rush about', 'busy and bustling'], hsk: 'HSK 5' },
  '如期而至': { pinyin: 'rúqī’érzhì', definitions: ['arrive as scheduled', 'arrive on time'], hsk: 'HSK 5' },
  '岁月': { pinyin: 'suìyuè', definitions: ['years', 'passage of time'], hsk: 'HSK 5' },
  '不知不觉': { pinyin: 'bùzhī-bùjué', definitions: ['unconsciously', 'without realizing it'], hsk: 'HSK 5' },
  '功名利禄': { pinyin: 'gōngmíng-lìlù', definitions: ['fame, rank, and riches', 'worldly success'], hsk: 'HSK 6' },
  '涟漪': { pinyin: 'liányī', definitions: ['ripples in water', 'subtle emotional waves'], hsk: 'HSK 6' },
  '纠缠已久': { pinyin: 'jiūchán yǐjiǔ', definitions: ['entangled for a long time'], hsk: 'HSK 6' },
  '焦虑': { pinyin: 'jiāolǜ', definitions: ['anxious', 'apprehensive', 'anxiety'], hsk: 'HSK 5' },
  '释怀': { pinyin: 'shìhuái', definitions: ['to dispel worry', 'release an emotional burden'], hsk: 'HSK 5' },

  // Story 2: Battle of Julu (HSK 6)
  '破釜沉舟': { pinyin: 'pòfǔ-chénzhōu', definitions: ['break the cauldrons and sink the boats', 'cut off all retreat', 'commit irrevocably'], hsk: 'HSK 6' },
  '巨鹿': { pinyin: 'Jùlù', definitions: ['Julu (ancient city in Hebei)'] },
  '抉择': { pinyin: 'juézé', definitions: ['critical choice', 'solemn decision'], hsk: 'HSK 5' },
  '危局': { pinyin: 'wēijú', definitions: ['precarious crisis', 'dangerous predicament'], hsk: 'HSK 6' },
  '强渡': { pinyin: 'qiángdù', definitions: ['force a river crossing under fire'], hsk: 'HSK 6' },
  '漳水': { pinyin: 'Zhāng Shuǐ', definitions: ['Zhang River'] },
  '诸侯': { pinyin: 'zhūhóu', definitions: ['feudal lords', 'vassal rulers'], hsk: 'HSK 6' },
  '逡巡': { pinyin: 'qūnxún', definitions: ['hesitate', 'hang back in fear', 'waver'], hsk: 'HSK 6' },
  '势单力薄': { pinyin: 'shìdān-lìbó', definitions: ['isolated and weak', 'lacking external support'], hsk: 'HSK 6' },
  '悬殊': { pinyin: 'xuánshū', definitions: ['disparity', 'great difference in power or number'], hsk: 'HSK 6' },
  '决一死战': { pinyin: 'juéyì sǐzhàn', definitions: ['fight to the death', 'final decisive combat'], hsk: 'HSK 6' },
  '军心涣散': { pinyin: 'jūnxīn huànsàn', definitions: ['troops morale is shattered'], hsk: 'HSK 6' },
  '气壮山河': { pinyin: 'qìzhuàng-shānhé', definitions: ['magnificent heroism shaking mountains and rivers'], hsk: 'HSK 6' },
  '绝处逢生': { pinyin: 'juéchù-féngshēng', definitions: ['find a way out from a desperate impasse'], hsk: 'HSK 6' },
  '功亏一篑': { pinyin: 'gōngkuī-yíkuì', definitions: ['fall short of final success at the last step'], hsk: 'HSK 6' },
  '毋庸置疑': { pinyin: 'wúyōng-zhìyí', definitions: ['beyond all doubt', 'indubitable'], hsk: 'HSK 6' },
  '项羽': { pinyin: 'Xiàng Yǔ', definitions: ['Xiang Yu (232–202 BC), Hegemon-King of Western Chu'] },
  '宿命': { pinyin: 'sùmìng', definitions: ['predestined fate', 'destiny'], hsk: 'HSK 6' },
  '叹喟': { pinyin: 'tànkuì', definitions: ['to sigh deeply in lamentation'], hsk: 'HSK 6' },
  '精锐': { pinyin: 'jīngruì', definitions: ['elite forces', 'crack troops'], hsk: 'HSK 6' },
  '合围': { pinyin: 'héwéi', definitions: ['surround', 'encircle completely'], hsk: 'HSK 6' },
  '粮饷': { pinyin: 'liángxiǎng', definitions: ['provisions and pay for soldiers'], hsk: 'HSK 6' },
  '生路': { pinyin: 'shēnglù', definitions: ['way to survive', 'escape route'], hsk: 'HSK 5' },
  '同仇敌忾': { pinyin: 'tóngchóu-díkài', definitions: ['shared hatred against the common enemy'], hsk: 'HSK 6' },
  '溃败': { pinyin: 'kuìbài', definitions: ['be utterly routed', 'collapse in defeat'], hsk: 'HSK 6' },

  // Story 3: Digital Nomads (HSK 5)
  '内卷': { pinyin: 'nèijuǎn', definitions: ['involution', 'hyper-competitive rat race with diminishing returns'], hsk: 'HSK 5' },
  '数字游民': { pinyin: 'shùzì yóumín', definitions: ['digital nomads'], hsk: 'HSK 5' },
  '大理': { pinyin: 'Dàlǐ', definitions: ['Dali (city in Yunnan province)'] },
  '苍山': { pinyin: 'Cāngshān', definitions: ['Mount Cangshan'] },
  '洱海': { pinyin: 'Ěrhǎi', definitions: ['Erhai Lake'] },
  '告别': { pinyin: 'gàobié', definitions: ['to bid farewell to'], hsk: 'HSK 4' },
  '归属感': { pinyin: 'guīshǔgǎn', definitions: ['sense of belonging'], hsk: 'HSK 5' },
  '权衡': { pinyin: 'quánhéng', definitions: ['to weigh and balance', 'trade-off'], hsk: 'HSK 5' },
  '潜移默化': { pinyin: 'qiányí-mòhuà', definitions: ['subtle influence over time', 'imperceptible transformation'], hsk: 'HSK 6' },
  '自律': { pinyin: 'zìlǜ', definitions: ['self-discipline', 'autonomy'], hsk: 'HSK 5' },
  '隔阂': { pinyin: 'géhé', definitions: ['estrangement', 'barrier of misunderstanding'], hsk: 'HSK 5' },
  '乌托邦': { pinyin: 'wūtuōbāng', definitions: ['Utopia'], hsk: 'HSK 6' },
  '双刃剑': { pinyin: 'shuāngrènjiàn', definitions: ['double-edged sword'], hsk: 'HSK 5' },
  '虚无感': { pinyin: 'xūwúgǎn', definitions: ['sense of nihilism/emptiness'], hsk: 'HSK 6' },
  '节奏': { pinyin: 'jiézòu', definitions: ['rhythm', 'tempo of life'], hsk: 'HSK 4' },
  '打卡': { pinyin: 'dǎkǎ', definitions: ['clock in/out at work', 'check in at scenic spot'], hsk: 'HSK 4' },
  '支配': { pinyin: 'zhīpèi', definitions: ['to control', 'to dominate', 'to govern'], hsk: 'HSK 5' },
  '社保': { pinyin: 'shèbǎo', definitions: ['social security', 'medical insurance'], hsk: 'HSK 5' },
  '安顿': { pinyin: 'āndùn', definitions: ['settle down', 'find a peaceful place'], hsk: 'HSK 5' },

  // Story 4: Zhuangzi Oak (HSK 6)
  '庄子': { pinyin: 'Zhuāngzǐ', definitions: ['Zhuangzi (c. 369–286 BC), major Daoist philosopher'] },
  '无用之用': { pinyin: 'wúyòng zhī yòng', definitions: ['the usefulness of the useless', 'Daoist paradox on intrinsic preservation'], hsk: 'HSK 6' },
  '从容': { pinyin: 'cóngróng', definitions: ['calm and unhurried', 'poised'], hsk: 'HSK 5' },
  '功利主义': { pinyin: 'gōnglì zhǔyì', definitions: ['utilitarianism'], hsk: 'HSK 6' },
  '逍遥': { pinyin: 'xiāoyáo', definitions: ['free and unconstrained', 'carefree wandering'], hsk: 'HSK 6' },
  '参天大树': { pinyin: 'cāntiān dàshù', definitions: ['towering ancient tree reaching the sky'], hsk: 'HSK 5' },
  '栋梁之材': { pinyin: 'dòngliáng zhī cái', definitions: ['pillar timber', 'person of great talent capable of heavy responsibility'], hsk: 'HSK 6' },
  '见微知著': { pinyin: 'jiànwēi-zhīzhù', definitions: ['perceive the whole from the smallest sign'], hsk: 'HSK 6' },
  '豁达': { pinyin: 'huòdá', definitions: ['magnanimous', 'open-minded and generous'], hsk: 'HSK 6' },
  '大相径庭': { pinyin: 'dàxiāng-jìngtíng', definitions: ['poles apart', 'entirely different'], hsk: 'HSK 6' },
  '急功近利': { pinyin: 'jígōng-jìnlì', definitions: ['eager for quick success and instant gain'], hsk: 'HSK 6' },
  '审视': { pinyin: 'shěnshì', definitions: ['examine closely', 'scrutinize'], hsk: 'HSK 5' },
  '寓言': { pinyin: 'yùyán', definitions: ['parable', 'fable', 'allegory'], hsk: 'HSK 5' },
  '辩驳': { pinyin: 'biànbó', definitions: ['refute', 'argue against'], hsk: 'HSK 6' },
  '斧斤': { pinyin: 'fǔjīn', definitions: ['axes and hatchets'], hsk: 'HSK 6' },
  '夭折': { pinyin: 'yāozhé', definitions: ['die prematurely', 'cut down in one’s youth'], hsk: 'HSK 6' },
  '遮蔽': { pinyin: 'zhēbì', definitions: ['shade', 'shelter from the sun'], hsk: 'HSK 5' },
  '天年': { pinyin: 'tiānnián', definitions: ['natural span of life'], hsk: 'HSK 6' }
};

export function lookupWord(word: string): DictEntry | null {
  return BUILTIN_DICT[word] || null;
}

export function tokenizeChinese(text: string): WordToken[] {
  const segmenter = new Intl.Segmenter('zh-Hans', { granularity: 'word' });
  const segments = Array.from(segmenter.segment(text));
  const tokens: WordToken[] = [];

  for (const seg of segments) {
    const raw = seg.segment;
    if (!raw.trim()) continue;

    const isPunctuation = /^[，。！？；：“”‘’（）《》、—…\.,!?;:\'\"()\[\]]$/.test(raw);
    if (isPunctuation) {
      tokens.push({
        text: raw,
        pinyin: raw,
        tone: 5,
        definitions: [],
      });
      continue;
    }

    const dict = lookupWord(raw);
    const py = dict ? dict.pinyin : pinyin(raw, { toneType: 'symbol' });
    const tone = getToneFromPinyin(py);
    const defs = dict ? dict.definitions : [];
    const hsk = dict?.hsk;

    const chars: WordCharacter[] = [];
    if (raw.length > 1) {
      for (const ch of raw) {
        const chDict = lookupWord(ch);
        chars.push({
          char: ch,
          pinyin: chDict ? chDict.pinyin : pinyin(ch, { toneType: 'symbol' }),
          definition: chDict ? chDict.definitions[0] : '',
        });
      }
    }

    tokens.push({
      text: raw,
      pinyin: py,
      tone,
      definitions: defs,
      hskLevel: hsk,
      isTargetWord: Boolean(dict?.hsk === 'HSK 5' || dict?.hsk === 'HSK 6'),
      characters: chars.length > 0 ? chars : undefined,
    });
  }

  return tokens;
}
