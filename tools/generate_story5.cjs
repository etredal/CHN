// Build tools/hsk5_hometown.json from tools/hsk5_hometown.txt (Lu Xun's 《故乡》).
//
// The story is much longer than the others, and its 1921 vernacular trips up
// both the word segmenter and pinyin-pro, so this script writes the tokens
// itself (compile_ts_stories.cjs keeps tokens it is given), applying the
// segmentation and reading fixes listed below.
//
// Usage (from the repo root):
//   node tools/generate_story5.cjs            # write the JSON (keeps timings already in it)
//   python -m edge_tts --voice zh-CN-YunxiNeural --file tools/.hometown_audio.txt \
//     --write-media client/public/audio/hsk5_hometown.mp3 \
//     --write-subtitles client/public/audio/hsk5_hometown.vtt
//   python tools/align_word_timings.py --model <paraformer dir> tools/hsk5_hometown.json
//   node tools/generate_story5.cjs            # picks up the audio length
//   node tools/compile_ts_stories.cjs
//   python tools/generate_word_audio.py && node tools/compile_ts_stories.cjs
// (Behind the session proxy, edge-tts needs SSL_CERT_FILE and --proxy "$HTTPS_PROXY".)
const { buildStory } = require('./story_builder.cjs');

// ---------------------------------------------------------------------------
// Word segmentation fixes. Each entry fixes the word boundaries inside every
// place the text (without slashes) occurs: a slash is a boundary, and there
// are no other boundaries inside. Plain words just keep the word whole.
const SEGMENT = [
  '闰土', '宏儿', '水生', '杨二嫂', '迅/哥儿', '豆腐/西施', '和/宏儿', '闰土/哥',
  '人/口渴', '这/儿时', '无端/的', '展转/而', '好/心绪', '他/不/咬人', '那/一/年',
  '三十/多/年', '近处/的', '过/了/三/四/天', '很/好看', '发见/了', '大/竹匾', '竹匾',
  '秕谷', '鸟雀', '稻鸡', '角鸡', '鹁鸪', '蓝背', '獾猪', '胡叉', '毡帽', '银项圈',
  '项圈', '跳鱼儿', '潮汛', '苏生', '出惊', '瑟索', '开裂', '作声', '黄瘦', '片时',
  '苛税', '木偶', '拣择', '烛台', '抬秤', '草灰', '闲天', '送行', '一扫而空', '深黛',
  '后梢', '狗气杀', '气闷', '忙月', '值年', '少爷', '家景', '佳处', '悲凉', '阴晦',
  '船舱', '蓬隙', '活气', '聚族而居', '老屋', '公同', '谋食', '异地', '瓦楞', '断茎',
  '寓所', '租定', '齐集', '神异', '圆月', '五行', '祖像', '长工', '许下', '愿心',
  '上城', '一拉', '日里', '鬼见怕', '观音手', '无穷无尽', '四角', '水果店', '豆腐店',
  '应声', '景况', '模样', '叫/起来', '凸/颧骨', '画图', '细脚伶仃', '髀间', '系/裙',
  '对门', '确乎', '圆规', '不平', '贵人', '眼高', '那/有', '小户', '用得着', '阿呀呀',
  '阿呀', '道台', '八抬', '大轿', '一毫', '愤愤', '回转', '裤腰', '偷空',
  '红活圆实', '烟管', '连珠', '回旋', '口/外', '厚/障壁', '回过头', '躲躲闪闪',
  '下楼', '不得了', '哥弟', '照旧', '打拱', '生人', '怕生', '松松爽爽',
  '就/了/坐', '青豆', '摇头', '折/了/本', '形容/不出', '厨下', '多子', '尽/可以',
  '长桌', '载/去', '无关紧要', '的/话', '管/船只', '黑/眼睛', '高低', '小脚',
  '灰堆', '一齐', '以为/功', '内/盛/食料', '飞也似的', '四面', '隔成', '孤身',
  '忽地', '船底', '一气', '后辈', '隔膜', '恣睢', '未经', '生活/过/的', '暗地里',
  '手制', '切近', '茫远', '无所谓', '正/如', '走/的/人', '第二日', '清早晨',
  '海边', '沙地', '西瓜', '的/是', '是/的', '都/有', '也/有', '他/是', '我/在',
  '我/想', '我/只', '我/看', '我/知道', '我/到', '他/在', '他/用', '只/带', '还/说',
  '又/有', '又/要', '便/要', '便/有', '只/记得', '只/在', '向/外', '向外/走',
  '向前/走', '听/得', '急/得', '苦/得', '跑/得',
  '好/得', '肿/得', '用/得着', '有如', '如许', '一望无际', '喜欢/的/不得了',
  '什么/东西', '什么/时候', '我/还', '我/也', '我/又', '他/的', '我/的', '你/来',
  '他/家', '我/家', '自/家', '和/他', '只/一/拉', '却/没有', '却/不能', '也/不是',
  '也/没有', '都/不', '竟/与', '既然/是', '天/底下', '先/坐船', '好容易', '鸟毛', '侄儿', '不过', '搬动', '中年', '睡着/了',
];

// Readings pinyin-pro gets wrong here (one syllable per character).
const READINGS = {
  '模样': 'mú yàng', '少爷': 'shào ye', '五行': 'wǔ xíng', '种着': 'zhòng zhe',
  '种出': 'zhòng chū', '公同': 'gōng tóng', '熟识': 'shú shi', '家景': 'jiā jǐng',
  '值年': 'zhí nián', '忙月': 'máng yuè', '许下': 'xǔ xià', '愿心': 'yuàn xīn',
  '竹匾': 'zhú biǎn', '秕谷': 'bǐ gǔ', '鹁鸪': 'bó gū', '日里': 'rì lǐ',
  '观音': 'guān yīn', '獾猪': 'huān zhū', '啦啦': 'lā lā', '胡叉': 'hú chā',
  '无端': 'wú duān', '倒向': 'dào xiàng', '如许': 'rú xǔ', '潮汛': 'cháo xùn',
  '跳鱼儿': 'tiào yú r', '儿时': 'ér shí', '忽而': 'hū ér', '苏生': 'sū shēng',
  '应声': 'yìng shēng', '系裙': 'jì qún', '确乎': 'què hū', '一毫': 'yì háo',
  '那有': 'nǎ yǒu', '哥儿': 'gē r', '用得着': 'yòng de zháo', '阿呀呀': 'ā yā yā',
  '阿呀': 'ā yā', '道台': 'dào tái', '八抬': 'bā tái', '大轿': 'dà jiào',
  '愤愤': 'fèn fèn', '回转': 'huí zhuǎn', '絮絮': 'xù xù', '裤腰': 'kù yāo',
  '近处': 'jìn chù', '应酬': 'yìng chou', '出惊': 'chū jīng', '瑟索': 'sè suǒ',
  '开裂': 'kāi liè', '作声': 'zuò shēng', '寒噤': 'hán jìn', '颈子': 'jǐng zi',
  '黄瘦': 'huáng shòu', '不得了': 'bù dé liǎo', '怎的': 'zěn de', '称呼': 'chēng hu',
  '打拱': 'dǎ gǒng', '生人': 'shēng rén', '怕生': 'pà shēng', '听得': 'tīng de',
  '松松爽爽': 'sōng sōng shuǎng shuǎng', '就了坐': 'jiù le zuò', '递过': 'dì guò',
  '倒是': 'dào shì', '问问': 'wèn wen', '吃不够': 'chī bu gòu', '折了本': 'shé le běn',
  '片时': 'piàn shí', '便得回去': 'biàn děi huí qù', '厨下': 'chú xià', '苛税': 'kē shuì',
  '木偶': 'mù ǒu', '尽可以': 'jǐn kě yǐ', '拣择': 'jiǎn zé', '烛台': 'zhú tái',
  '一杆': 'yì gǎn', '抬秤': 'tái chèng', '载去': 'zài qù', '闲天': 'xián tiān',
  '送行': 'sòng xíng', '船只': 'chuán zhī', '一扫而空': 'yì sǎo ér kōng',
  '深黛': 'shēn dài', '后梢': 'hòu shāo', '大伯': 'dà bó', '痴痴': 'chī chī',
  '发见': 'fā xiàn', '以为功': 'yǐ wéi gōng', '狗气杀': 'gǒu qì shā', '盛食料': 'chéng shí liào',
  '飞也似的': 'fēi yě shì de', '气闷': 'qì mèn', '睡着': 'shuì zháo', '潺潺': 'chán chán',
  '一气': 'yí qì', '展转': 'zhǎn zhuǎn', '恣睢': 'zì suī', '未经': 'wèi jīng',
  '切近': 'qiè jìn', '茫远': 'máng yuǎn', '好容易': 'hǎo róng yì', '心绪': 'xīn xù',
  '悲凉': 'bēi liáng', '阴晦': 'yīn huì', '蓬隙': 'péng xì', '活气': 'huó qì',
  '佳处': 'jiā chù', '聚族而居': 'jù zú ér jū', '谋食': 'móu shí', '瓦楞': 'wǎ léng',
  '易主': 'yì zhǔ', '歇息': 'xiē xi', '齐集': 'qí jí', '收不起': 'shōu bu qǐ',
  '还在世': 'hái zài shì', '祖像': 'zǔ xiàng', '项带': 'xiàng dài', '钢叉': 'gāng chā',
  '一柄': 'yì bǐng', '一匹': 'yì pǐ', '一扭': 'yì niǔ', '一拉': 'yì lā', '一望': 'yí wàng',
  '一见': 'yí jiàn', '一吓': 'yí xià', '咧': 'lie', '哩': 'li', '吓，什么': 'hè shén me',
  '记得罢': 'jì de ba', '拿去罢': 'ná qù ba', '红活圆实': 'hóng huó yuán shí',
  '细脚伶仃': 'xì jiǎo líng dīng', '髀间': 'bì jiān', '画图': 'huà tú', '鬼见怕': 'guǐ jiàn pà',
  '好得多': 'hǎo de duō', '急得': 'jí de', '肿得': 'zhǒng de', '苦得': 'kǔ de',
  '跑得': 'pǎo de', '我得去': 'wǒ děi qù', '回过头': 'huí guò tóu', '弶': 'jiàng',
  '猹': 'chá', '廿': 'niàn', '不平': 'bù píng', '眼高': 'yǎn gāo', '小户': 'xiǎo hù',
  '凸颧骨': 'tū quán gǔ', '迟疑了一回': 'chí yí le yì huí', '一回': 'yì huí',
  '远远地': 'yuǎn yuǎn de', '轻轻地': 'qīng qīng de', '只一拉': 'zhǐ yì lā',
  '只带着': 'zhǐ dài zhe', '只看见': 'zhǐ kàn jiàn', '只贴': 'zhǐ tiē', '只记得': 'zhǐ jì de',
  '只是': 'zhǐ shì', '只在': 'zhǐ zài', '只一件': 'zhǐ yí jiàn', '只觉得': 'zhǐ jué de',
  '几支': 'jǐ zhī', '一支': 'yì zhī', '鸟毛': 'niǎo máo', '定说': 'dìng shuō',
  '亏伊': 'kuī yī', '装着': 'zhuāng zhe', '了，': 'le，', '了。': 'le。', '了；': 'le；',
  '成了路': 'chéng le lù', '放了道台': 'fàng le dào tái', '闰土': 'rùn tǔ', '宏儿': 'hóng ér',
  '水生': 'shuǐ shēng', '二嫂': 'èr sǎo', '神异': 'shén yì', '圆月': 'yuán yuè',
  '一轮': 'yì lún', '一幅': 'yì fú', '还有': 'hái yǒu', '还说': 'hái shuō',
  '还要': 'hái yào', '还是': 'hái shì', '还没有': 'hái méi yǒu', '我还': 'wǒ hái',
  '他后来还': 'tā hòu lái hái', '的佳处': 'de jiā chù', '尽力的': 'jìn lì de',
  '飞跑的': 'fēi pǎo de', '远远的': 'yuǎn yuǎn de', '默默的': 'mò mò de',
  '分明的': 'fēn míng de', '紧紧的': 'jǐn jǐn de', '高兴的说': 'gāo xìng de shuō',
  '不由的': 'bù yóu de', '絮絮的': 'xù xù de', '愤愤的': 'fèn fèn de', '痴痴的': 'chī chī de',
  '呜呜的': 'wū wū de', '无端的': 'wú duān de', '喜欢的': 'xǐ huan de', '非常的悲哀': 'fēi cháng de bēi āi',
  '中年': 'zhōng nián', '仿佛': 'fǎng fú', '侄儿': 'zhí ér', '收拾': 'shōu shi',
  '东西': 'dōng xi', '时候': 'shí hou', '告诉': 'gào su', '规矩': 'guī ju', '客气': 'kè qi',
  '朋友': 'péng you', '眼睛': 'yǎn jing', '清楚': 'qīng chu', '名字': 'míng zi', '老爷': 'lǎo ye',
  '工夫': 'gōng fu', '什么东西': 'shén me dōng xi', '少年': 'shào nián', '豆腐': 'dòu fu', '西施': 'xī shī',
};

// Words written with a capital letter in the sentence pinyin.
const PROPER = new Set(['闰土', '宏儿', '水生', '杨二嫂', '迅', '西施', '拿破仑', '华盛顿', '法国', '美国', '观音手', '闰土哥', '杨']);

buildStory({
  id: 'hsk5_hometown',
  src: 'tools/hsk5_hometown.txt',
  out: 'tools/hsk5_hometown.json',
  audioText: 'tools/.hometown_audio.txt',
  mp3: 'client/public/audio/hsk5_hometown.mp3',
  meta: require('./hsk5_hometown_meta.json'),
  level: 'HSK 5',
  category: 'Fiction',
  idPrefix: 's5',
  readingMinutes: 25,
  segmentFixes: SEGMENT,
  readings: READINGS,
  proper: PROPER,
});
