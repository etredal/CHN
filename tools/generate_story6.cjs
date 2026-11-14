// Build tools/hsk6_school_611.json from tools/hsk6_school_611.txt: VOA Chinese's
// 2025 report on the "611" school schedule (public domain; see the text file).
//
// Usage (from the repo root):
//   node tools/generate_story6.cjs            # write the JSON (keeps timings already in it)
//   python -m edge_tts --voice zh-CN-YunxiNeural --file tools/.school_611_audio.txt \
//     --write-media client/public/audio/hsk6_school_611.mp3 \
//     --write-subtitles client/public/audio/hsk6_school_611.vtt
//   python tools/align_word_timings.py --model <paraformer dir> tools/hsk6_school_611.json
//   node tools/generate_story6.cjs            # picks up the audio length
//   node tools/compile_ts_stories.cjs
//   python tools/generate_word_audio.py tools/hsk6_school_611.json && node tools/compile_ts_stories.cjs
// (Behind the session proxy, edge-tts needs SSL_CERT_FILE and --proxy "$HTTPS_PROXY".)
const { buildStory } = require('./story_builder.cjs');

// Word-split fixes (see story_builder.cjs): a slash is a boundary, a plain
// entry keeps the word whole.
const SEGMENT = [
  // Names, places and organisations.
  '美国之音', '蒋不', '程华宇', '朱永泉', '李金池', '杨二发', '斯坦哈特', '戴维斯', '衡水',
  '赤壁市', '湖北省', '宝鸡', '孝感',
  // Words the segmenter splits wrongly.
  '大V', '超时', '多元', '什么样', '毕业生', '该校', '重点班', '普班', '考练', '举报',
  '狼狈为奸', '寄宿制', '干啥', '无望', '晚自习', '自习', '难熬', '大多数', '孩子们', '学生们',
  '投稿人', '幼儿园', '高发', '厌学', '补习班', '连轴转', '望洋兴叹', '更为', '往死里',
  '反人类', '摄像头', '流毒', '贻害无穷', '发起人', '问卷', '声量', '影响力', '行动力',
  '网名', '严重性', '学弟', '学妹', '表单', '后续', '应试', '题海', '加工厂', '创造力',
  '升学率', '清北率', '效仿', '自觉性', '七点半', '培优班', '培优', '补差', '磨叽',
  '理所应当', '推文', '谋利', '题型', '初中部', '跳楼', '高额', '捞钱', '不一而论', '公办',
  '深层', '有史以来', '失业率', '考上', '年轻人', '鄙视链', '攀比', '学时', '递减', '学习者',
  '时长', '至关重要', '共度', '茁壮', '反思', '螺丝钉', '泯灭', '浑浑噩噩', '视为', '额外',
  '交费', '作业', 'Hua-Yu Sebastian Cherng', 'Kevin Gee', '611 ICU', '6:50', '10：30', '40.6', '80％', '小初高中', '耻辱名单', '后台',
  // Boundaries the segmenter misplaces.
  '衡水/流毒', '衡水/中学/校长', '额外/交费', '写/作业', '初中/学生', '7/天/后', '90/多/个',
  '6/点/到', '但/从', '点/到', '据/了解', '另/一/位', '另/一/名', '能/有', '人/的', '会/对',
  '他/在', '我/的', '我/也', '我/想', '我/不', '也/有', '也/在', '也/向', '也/不', '也/要',
  '也/是', '也/能', '也/没有', '是/有', '是/好', '大多/是', '更/能', '更/深层', '很/有',
  '做/的', '好/的', '最好/的', '所谓/的', '中/的', '的/是', '还/说', '又/要', '又/是', '都/要',
  '就/要', '就/像', '想/进', '会/说', '曾/在', '活/在', '此/前', '更/多元', '只/会', '太/过分',
  '近/几年', '本质/上', '取决/于', '学弟/学妹/们', '每个人', '不敢', '正是', '有道理', '高一/起', '目的/是', '了解',
];

// Readings pinyin-pro gets wrong here (one syllable per character).
const READINGS = {
  '成为': 'chéng wéi', '认为': 'rèn wéi', '视为': 'shì wéi', '任命为': 'rèn mìng wéi',
  '为寄宿': 'wéi jì sù', '放假': 'fàng jià', '重点': 'zhòng diǎn', '干啥': 'gàn shá',
  '家长': 'jiā zhǎng', '院长': 'yuàn zhǎng', '校长': 'xiào zhǎng', '还有': 'hái yǒu',
  '更是': 'gèng shì', '只会': 'zhǐ huì', '本质上将': 'běn zhì shàng jiāng', '变得': 'biàn de',
  '花得起': 'huā de qǐ', '强调': 'qiáng diào', '声量': 'shēng liàng', '项目的': 'xiàng mù de',
  '一觉': 'yí jiào', '一次': 'yí cì', '一周': 'yì zhōu', '很卷': 'hěn juǎn', '蒋不': 'jiǎng bù',
  '告诉': 'gào su', '清楚': 'qīng chu', '路子': 'lù zi', '补差': 'bǔ chà', '谁': 'shéi',
  '做的更绝': 'zuò de gèng jué', '不一而论': 'bù yī ér lùn', '大V': 'dà V', '了解': 'liǎo jiě',
  '理所应当': 'lǐ suǒ yīng dāng', '磨叽': 'mó ji', '时长': 'shí cháng', '学时': 'xué shí',
  '过长': 'guò cháng', '长期': 'cháng qī', '另一位': 'lìng yí wèi', '另一名': 'lìng yì míng',
  '不在少数': 'bú zài shǎo shù',
};

// Words written with a capital letter in the sentence pinyin.
const PROPER = new Set([
  '中国', '美国', '美国之音', '中国人', '李', '蒋不', '程华宇', '朱永泉', '李金池', '杨二发',
  '陕西', '宝鸡', '山西', '厦门', '福建', '湖北', '湖北省', '赤壁', '赤壁市', '孝感', '辽宁',
  '衡水', '河北', '山东', '江西', '广东', '中山', '纽约', '加州', '戴维斯', '斯坦哈特', '春节',
]);

buildStory({
  id: 'hsk6_school_611',
  src: 'tools/hsk6_school_611.txt',
  out: 'tools/hsk6_school_611.json',
  audioText: 'tools/.school_611_audio.txt',
  mp3: 'client/public/audio/hsk6_school_611.mp3',
  meta: require('./hsk6_school_611_meta.json'),
  level: 'HSK 6',
  category: 'Society',
  idPrefix: 's6',
  readingMinutes: 25,
  segmentFixes: SEGMENT,
  readings: READINGS,
  proper: PROPER,
});
