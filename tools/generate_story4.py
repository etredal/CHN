import os
import json
from synthesizer import synthesize_audio

story4 = {
    "id": "hsk6_zhuangzi_oak",
    "title": {
        "cn": "庄子的“无用之用”：在焦虑时代寻找内心的从容",
        "pinyin": "Zhuāngzǐ de “Wúyòng zhī Yòng”: Zài Jiāolǜ Shídài Xúnzhǎo Nèixīn de Cóngróng",
        "en": "Zhuangzi's \"Usefulness of the Useless\": Serenity in an Anxious Age"
    },
    "level": "HSK 6",
    "category": "Philosophy",
    "stats": {
        "characterCount": 1050,
        "audioDurationSeconds": 107,
        "estimatedReadingTimeMinutes": 7
    },
    "audioUrl": "/audio/hsk6_zhuangzi_oak.mp3",
    "summary": {
        "cn": "借助庄子寓言中未被匠人砍伐的高大栎树，探讨现代社会被极端功利主义裹挟下的心理困境，揭示‘无用之大用’如何解救精神内耗。",
        "en": "Through Zhuangzi's parable of the giant oak tree dismissed by carpenters as useless timber, this piece explores escaping modern utilitarian burnout."
    },
    "sections": [
        {
            "partNumber": 1,
            "partTitle": { "cn": "第一幕：栎社神树的寓言与木匠的讥讽", "en": "Act I: Parable of the Sacred Oak" },
            "sentences": [
                {
                    "id": "s4_1",
                    "cn": "两千多年前，一位名叫石的木匠前往齐国，途中在一处土地庙前见到了一棵遮天蔽日的参天大树。",
                    "pinyin": "Liǎng qiān duō nián qián, yí wèi míng jiào Shí de mùjiang qiánwǎng Qíguó, túzhōng zài yí chù tǔdìmio qián jiàndào le yì kē zhētiān-bìrì de cāntiān dàshù.",
                    "en": "Over two thousand years ago, a master carpenter named Shi traveled to Qi, encountering a colossal sacred oak outside a village shrine that blotted out the sky."
                },
                {
                    "id": "s4_2",
                    "cn": "那棵大树树冠之大可庇护数千头耕牛，树干需百人合抱，引得路人纷纷驻足惊叹，唯独老木匠看都不看一眼，径直扬长而去。",
                    "pinyin": "Nà kē dàshù shùguān zhī dà kě bìhù shù qiān tóu gēngniú, shùgàn xū bǎi rén hébào, yǐnde lùrén fēnfēn zhùzú jīngtàn, wéidú lǎo mùjiang kàn dōu bú kàn yì yǎn, jìngzhí yángcháng’érqù.",
                    "en": "The canopy could shelter thousands of cattle, its trunk required a hundred men to encircle; passersby paused in awe, yet the carpenter passed without a glance."
                },
                {
                    "id": "s4_3",
                    "cn": "徒弟追上前去不解地询问，木匠不屑地冷笑道：“那不过是一棵毫无价值的‘散木’！做船便沉，做器皿便裂，做门窗便渗出黏液，毫无用处，才能长到如此巨大！”",
                    "pinyin": "Túdì zhuī shàngqián qù bùjiě de xúnwèn, mùjiang búxiè de lěngxiào dào: “Nà búguò shì yì kē háowú jiàzhí de ‘sǎnmù’! Zuò chuán biàn chén, zuò qìmǐn biàn liè, zuò ménchuāng biàn shènchū niányè, háowú yòngchù, cái néng zhǎng dào rúcǐ jùdà!”",
                    "en": "His apprentice caught up in bewilderment; the carpenter sneered: 'That is merely worthless scrub! Boats made of it sink, vessels split, doors warp—it grew so gigantic only because it is utterly useless!'"
                }
            ]
        },
        {
            "partNumber": 2,
            "partTitle": { "cn": "第二幕：庄子的顿悟：不材之木保全天年", "en": "Act II: Zhuangzi's Revelation: Preserving Natural Life" },
            "sentences": [
                {
                    "id": "s4_4",
                    "cn": "哲学家庄子得知此事后，却发出了截然相反的慨叹：“世人皆知有用之用，却往往不知‘无用之用’才是保全生命的无上智慧。”",
                    "pinyin": "Zhéxuéjiā Zhuāngzǐ dézhī cǐ shì hòu, què fāchū le jiérán-xiāngfǎn de kǎitàn: “Shìrén jiē zhī yǒuyòng zhī yòng, què wǎngwǎng bùzhī ‘wúyòng zhī yòng’ cái shì bǎoquán shēngmìng de wúshàng zhìhuì.”",
                    "en": "Hearing of this, philosopher Zhuangzi offered a radically contrary insight: 'All men know the utility of the useful, yet none know that the usefulness of the useless is the supreme wisdom of preservation.'"
                },
                {
                    "id": "s4_5",
                    "cn": "那些笔直挺拔的桂树被砍来做栋梁，香气馥郁的漆树被割破皮肉流出漆汁，正是因为它们对人类‘有用’，才难逃中途夭折的惨痛命运。",
                    "pinyin": "Nàxiē bǐzhí tǐngbá de guìshù bèi kǎn lái zuò dòngliáng, xiāngqì fùyù de qīshù bèi gēpò píròu liúchū qīzhī, zhèng shì yīnwèi tāmen duì rénlèi ‘yǒuyòng’, cái nán táo zhōngtú yāozhé de cǎntòng mìngyùn.",
                    "en": "Straight cinnamon trees are felled for pillars, fragrant lacquer trees slashed for resin—precisely because they are 'useful' to humans, they cannot escape premature death."
                },
                {
                    "id": "s4_6",
                    "cn": "唯独这棵所谓的‘散木’，因不符合任何世俗的功利标准，才避开了斧斤之灾，得以在天地之间傲然屹立数百年，享尽天年。",
                    "pinyin": "Wéidú zhè kē suǒwèi de ‘sǎnmù’, yīn bù fúhé rènhé shìsú de gōnglì biāozhǔn, cái bìkāi le fǔjīn zhī zāi, déyǐ zài tiāndì zhījiān àorán yìlì shù bǎi nián, xiǎng jìn tiānnián.",
                    "en": "Only this 'worthless timber', fitting no utilitarian purpose, avoided the woodsman's axe, standing majestically between heaven and earth for centuries to fulfill its natural lifespan."
                }
            ]
        },
        {
            "partNumber": 3,
            "partTitle": { "cn": "第三幕：现代社会的功利枷锁与心灵解脱", "en": "Act III: Escaping Utilitarian Burnout" },
            "sentences": [
                {
                    "id": "s4_7",
                    "cn": "反观当下，现代文明往往将‘变现’与‘效率’作为衡量个体价值的唯一标尺，人们无时无刻不在急功近利地将自己塑造成符合社会期待的‘栋梁之材’。",
                    "pinyin": "Fǎnguān dāngxià, xiàndài wénmíng wǎngwǎng jiāng ‘biànxiàn’ yǔ ‘xiàolǜ’ zuòwéi héngliáng gètǐ jiàzhí de wéiyī biāochǐ, rénmen wúshí-wúkè bú zài jígōng-jìnlì de jiāng zìjǐ sùzào chéng fúhé shèhuì qīdài de ‘dòngliáng zhī cái’.",
                    "en": "Looking at contemporary times, modern civilization often enshrines monetization and efficiency as the sole yardsticks, constantly urging people to mold themselves into utilitarian pillars."
                },
                {
                    "id": "s4_8",
                    "cn": "然而，当我们为了迎合外界标准而过度耗损精神、透支健康时，内心深处那片原本可以逍遥自得的净土，也随之荒芜殆尽。",
                    "pinyin": "Rán’ér, dāng wǒmen wèile yínghé wàijiè biāozhǔn ér guòdù hàosǔn jīngshén, tòuzhī jiànkāng shí, nèixīn shēnchù nà piàn yuánběn kěyǐ xiāoyáo-zìdé de jìngtǔ, yě suízhī huāngwú dàijìn.",
                    "en": "Yet when we exhaust our spirit and overdraft health to satisfy external benchmarks, the tranquil sanctuary within us that could have wandered carefree becomes desolate."
                },
                {
                    "id": "s4_9",
                    "cn": "学会停下来，去读一本‘无用’的书，去发一会儿‘无用’的呆，给生命留出一片不被考核的空白，何尝不是抵抗时代焦虑最深刻的豁达与自救？",
                    "pinyin": "Xuéhuì tíng xiàlai, qù dú yì běn ‘wúyòng’ de shū, qù fā yíhuìr ‘wúyòng’ de dāi, gěi shēngmìng liúchū yí piàn bú bèi kǎohé de kòngbái, hécháng bú shì dǐkàng shídài jiāolǜ zuì shēnkè de huòdá yǔ zìjiù?",
                    "en": "Learning to pause—to read a 'useless' book, to gaze into space without purpose, carving out a space exempt from evaluation—is this not the profoundest wisdom to resist modern anxiety?"
                }
            ]
        }
    ],
    "targetVocabulary": [
        {
            "word": "无用之用",
            "pinyin": "wúyòng zhī yòng",
            "tone": 2,
            "hsk": "HSK 6",
            "definitions": ["the usefulness of the useless", "the profound Taoist paradox that non-utility preserves essence"],
            "exampleSentence": {
                "cn": "庄子提出了‘无用之用’的思想，启发人们从功利主义中解脱出来。",
                "pinyin": "Zhuāngzǐ tíchū le ‘wúyòng zhī yòng’ de sīxiǎng, qǐfā rénmen cóng gōnglì zhǔyì zhōng jiětuō chūlai.",
                "en": "Zhuangzi proposed the concept of 'the usefulness of the useless,' inspiring people to liberate themselves from utilitarianism."
            }
        },
        {
            "word": "急功近利",
            "pinyin": "jígōng-jìnlì",
            "tone": 2,
            "hsk": "HSK 6",
            "definitions": ["eager for quick success and instant gain", "short-sighted opportunism"],
            "exampleSentence": {
                "cn": "做学问最忌讳急功近利，必须耐得住寂寞才能有所建树。",
                "pinyin": "Zuò xuéwèn zuì jìhuì jígōng-jìnlì, bìxū nàidezhù jìmò cái néng yǒusuǒ jiànshù.",
                "en": "In scholarship, nothing is more detrimental than craving quick success; one must endure solitude to achieve greatness."
            }
        },
        {
            "word": "栋梁之材",
            "pinyin": "dòngliáng zhī cái",
            "tone": 4,
            "hsk": "HSK 6",
            "definitions": ["pillar timber", "a pillar of society", "a person of paramount ability"],
            "exampleSentence": {
                "cn": "学校致力于将学生培养成为未来社会的栋梁之材。",
                "pinyin": "Xuéxiào zhìlì yú jiāng xuésheng péiyǎng chéngwéi wèilái shèhuì de dòngliáng zhī cái.",
                "en": "The university is dedicated to nurturing students into pillars of tomorrow's society."
            }
        },
        {
            "word": "豁达",
            "pinyin": "huòdá",
            "tone": 4,
            "hsk": "HSK 6",
            "definitions": ["magnanimous", "open-minded", "philosophically detached and serene"],
            "exampleSentence": {
                "cn": "他为人豁达大度，从不为了微不足道的小事斤斤计较。",
                "pinyin": "Tā wéirén huòdá-dàdù, cóng bù wèile wēibùzúdào de xiǎoshì jīnjīn-jìjiào.",
                "en": "He is open-minded and generous, never quibbling over trivialities."
            }
        }
    ],
    "grammarNotes": [
        {
            "pattern": "世人皆知...却往往不知...",
            "explanation": "Rhetorical contrast highlighting a widespread common misconception against an overlooked profound truth (Everyone knows X, but rarely realizes Y).",
            "exampleFromStory": "世人皆知有用之用，却往往不知‘无用之用’才是保全生命的无上智慧。",
            "additionalExamples": [
                "世人皆知财富的光鲜，却往往不知守护财富背后所承受的沉重代价。",
                "世人皆知言语的犀利，却往往不知沉默中所蕴含的巨大力量。"
            ]
        },
        {
            "pattern": "何尝不是一种...",
            "explanation": "Double negative rhetorical question affirming that X is indeed a legitimate form of Y (Is this not indeed a kind of...?).",
            "exampleFromStory": "给生命留出一片空白，何尝不是抵抗时代焦虑最深刻的自救？",
            "additionalExamples": [
                "在喧闹中选择独处，何尝不是一种成熟的心灵修行？",
                "失败后坦然认输，何尝不是一种需要极大勇气的豁达？"
            ]
        }
    ],
    "quiz": [
        {
            "id": "q1",
            "question": "根据庄子的阐述，那棵巨大的栎树之所以能够享有天年、屹立数百年，根本原因在于：",
            "options": [
                "土地庙的祭祀保护了它免遭风雨摧残",
                "因为在世俗眼光中‘一无所用’，才彻底避开了工匠斧斤的砍伐",
                "木质坚硬如铁，工匠的刀斧无法砍断",
                "树叶带有剧毒，无人敢于接近"
            ],
            "correctIndex": 1,
            "explanation": "第二幕阐明：因其不符合世俗功利标准，避开了被砍做栋梁或割漆的厄运，因而‘无用之用’成了保全生命的大智慧。"
        },
        {
            "id": "q2",
            "question": "文章借庄子的寓言批判了现代社会的哪种不良心态？",
            "options": [
                "过分追求艺术而忽略了科学技术",
                "急功近利、将变现与工具价值作为衡量人生一切标尺的极端功利主义",
                "逃避一切工作责任、主张无政府主义",
                "盲目崇拜古代典籍而否定现代医学"
            ],
            "correctIndex": 1,
            "explanation": "第三幕深入剖析了现代人急功近利、过度自我工具化和内耗的精神枷锁。"
        },
        {
            "id": "q3",
            "question": "成语“见微知著”在此类哲学论述中的深层寓意是：",
            "options": [
                "只看表面微小的事情，不求甚解",
                "能从微小隐蔽的征兆中洞察出事物发展的大趋势与深层本质",
                "细心地观察微观世界的显微镜图像",
                "在显微镜下研究植物细胞的构造"
            ],
            "correctIndex": 1,
            "explanation": "“见微知著”出自古代典籍，指看见微小的苗头就能预知其重大的发展或本质。"
        }
    ]
}

s4_text = " ".join([s["cn"] for sec in story4["sections"] for s in sec["sentences"]])
s4_mp3 = "client/public/audio/hsk6_zhuangzi_oak.mp3"
s4_vtt = "client/public/audio/hsk6_zhuangzi_oak.vtt"
s4_cues = synthesize_audio(s4_text, "zh-CN-XiaoxiaoNeural", s4_mp3, s4_vtt)

s4_sentences = [s for sec in story4["sections"] for s in sec["sentences"]]
for i, s in enumerate(s4_sentences):
    if i < len(s4_cues):
        s["startTime"] = round(s4_cues[i]["start"], 2)
        s["endTime"] = round(s4_cues[i]["end"], 2)
    else:
        s["startTime"] = round(i * 10.0, 2)
        s["endTime"] = round((i + 1) * 10.0, 2)

with open("tools/hsk6_zhuangzi_oak.json", "w", encoding="utf-8") as f:
    json.dump(story4, f, ensure_ascii=False, indent=2)

print("Story 4 generated successfully!")
