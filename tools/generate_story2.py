import os
import json
from synthesizer import synthesize_audio

story2 = {
    "id": "hsk6_battle_of_julu",
    "title": {
        "cn": "破釜沉舟：巨鹿之战的生死抉择",
        "pinyin": "Pòfǔ-chénzhōu: Jùlù zhī Zhàn de Shēngsǐ Juézé",
        "en": "Breaking the Cauldrons: Battle of Julu"
    },
    "level": "HSK 6",
    "category": "History",
    "stats": {
        "characterCount": 1150,
        "audioDurationSeconds": 155,
        "estimatedReadingTimeMinutes": 7
    },
    "audioUrl": "/audio/hsk6_battle_of_julu.mp3",
    "summary": {
        "cn": "公元前207年，项羽率楚军渡过漳水救援巨鹿，命令全军凿沉船只、砸碎铁锅，置之死地而后生，展现了中国历史上最为震撼的军事魄力。",
        "en": "In 207 BC, Xiang Yu led the Chu army across the Zhang River to relieve Julu. He ordered all boats sunk and cauldrons smashed, cutting off all retreat to fight to victory."
    },
    "sections": [
        {
            "partNumber": 1,
            "partTitle": { "cn": "第一幕：巨鹿危局与诸侯逡巡", "en": "Act I: The Crisis of Julu & Hesitant Lords" },
            "sentences": [
                {
                    "id": "s2_1",
                    "cn": "公元前207年冬，秦国名将章邯与王离率领数十万虎狼之师，将赵国重镇巨鹿层层合围，城中粮饷告罄，形势岌岌可危。",
                    "pinyin": "Gōngyuán qián 207 nián dōng, Qínguó míngjiàng Zhāng Hán yǔ Wáng Lí shuàilǐng shùshí wàn hǔláng zhī shī, jiāng Zhàoguó zhòngzhèn Jùlù céngcéng héwéi, chéng zhōng liángxiǎng gàoqìng, xíngshì jíjíkěwēi.",
                    "en": "In the winter of 207 BC, Qin generals Zhang Han and Wang Li surrounded the strategic city of Julu with hundreds of thousands of crack troops; provisions were depleted, and the city hung by a thread."
                },
                {
                    "id": "s2_2",
                    "cn": "齐、燕等各路诸侯的大军虽已赶至外围，却震慑于秦军的威势，人人逡巡不前，作壁上观，没有一支军队敢于主动破敌。",
                    "pinyin": "Qí, Yàn děng gèlù zhūhóu de dàjūn suī yǐ gǎnzhì wàiwéi, què zhènshè yú Qínjūn de wēishì, rénrén qūnxún bù qián, zuòbìshàngguān, méiyǒu yì zhī jūnduì gǎnyú zhǔdòng pòdí.",
                    "en": "Although the armies of allied lords from Qi and Yan had arrived at the perimeter, they were intimidated by the Qin army's ferocity; all hung back in fear, merely spectating from afar."
                }
            ]
        },
        {
            "partNumber": 2,
            "partTitle": { "cn": "第二幕：强渡漳水与破釜沉舟", "en": "Act II: Crossing the Zhang River & Sinking the Boats" },
            "sentences": [
                {
                    "id": "s2_3",
                    "cn": "唯有二十五岁的楚军统帅项羽，毅然率领五万精锐横渡滔滔漳水。",
                    "pinyin": "Wéiyǒu èrshíwǔ suì de Chǔjūn tǒngshuài Xiàng Yǔ, yìrán shuàilǐng wǔ wàn jīngruì héngdù tāotāo Zhāng Shuǐ.",
                    "en": "Only twenty-five-year-old Chu commander Xiang Yu resolutely led his fifty thousand elite troops across the roaring Zhang River."
                },
                {
                    "id": "s2_4",
                    "cn": "全军渡河之后，项羽当即拔剑下令：凿沉所有渡船，砸碎所有做饭的铁锅，烧毁营垒，每人仅带三日干粮！",
                    "pinyin": "Quánjūn dùhé zhīhòu, Xiàng Yǔ dāngjí bájiàn xiàlìng: záochén suǒyǒu dùchuán, zásuì suǒyǒu zuòfàn de tiěguō, shāohuǐ yínglěi, měi rén jǐn dài sān rì gānliáng!",
                    "en": "Once across, Xiang Yu drew his sword and commanded: sink all boats, smash all cooking cauldrons, burn the barracks, and carry only three days of dry rations!"
                },
                {
                    "id": "s2_5",
                    "cn": "“此战要么击溃秦军，要么葬身沙场，绝不留任何苟活的退路！”他的呼喊气壮山河，深深震撼了每一位将士。",
                    "pinyin": "“Cǐ zhàn yàome jīkuì Qínjūn, yàome zàngshēn shāchǎng, jué bù liú rènhé gǒuhuó de tuìlù!” Tā de hūhǎn qìzhuàng-shānhé, shēnshēn zhènshè le měi yí wèi jiàngshì.",
                    "en": "“In this battle we either crush the Qin army or die on the field; there is no retreat to scrape by!” His cry shook the mountains and rivers, electrifying every soldier."
                }
            ]
        },
        {
            "partNumber": 3,
            "partTitle": { "cn": "第三幕：九战九捷与以一当十", "en": "Act III: Nine Triumphs & Fighting Like Tigers" },
            "sentences": [
                {
                    "id": "s2_6",
                    "cn": "断绝了退路的楚军自知无处可逃，人人同仇敌忾，杀入敌阵时以一当十，喊杀之声令群山颤动。",
                    "pinyin": "Duànjué le tuìlù de Chǔjūn zìzhī wúchù kětáo, rénrén tóngchóu-díkài, shārù dízhèn shí yǐyīdāngshí, hǎnshā zhī shēng lìng qúnshān chàndòng.",
                    "en": "Cut off from retreat, the Chu soldiers knew they had nowhere to flee; united in desperate fury, each fought like ten men, their battle cries shaking the mountains."
                },
                {
                    "id": "s2_7",
                    "cn": "项羽身先士卒，九战九捷，不仅彻底粉碎了秦军精锐，生擒王离，更逼得一代名将章邯最终俯首受降。",
                    "pinyin": "Xiàng Yǔ xiānxiān-shìzú, jiǔ zhàn jiǔ jié, bùjǐn chèdǐ fěnsuì le Qínjūn jīngruì, shēngqín Wáng Lí, gèng bī de yí dài míngjiàng Zhāng Hán zuìzhōng fǔshǒu shòuxiáng.",
                    "en": "Xiang Yu led from the front, winning nine victories in nine clashes, completely smashing the Qin elite, capturing Wang Li alive, and compelling the great general Zhang Han to surrender."
                }
            ]
        },
        {
            "partNumber": 4,
            "partTitle": { "cn": "第四幕：历史的启示与宿命叹喟", "en": "Act IV: Historical Lessons & Reflections" },
            "sentences": [
                {
                    "id": "s2_8",
                    "cn": "巨鹿之战不仅彻底扭转了秦末抗暴的天下大势，更将“破釜沉舟”这一成语化作了中华文化中置之死地而后生的精神象征。",
                    "pinyin": "Jùlù zhī Zhàn bùjǐn chèdǐ niǔzhuǎn le Qínmò kàngbào de tiānxià dàshì, gèng jiāng “pòfǔ-chénzhōu” zhè yì chéngyǔ huàzuò le Zhōnghuá wénhuà zhōng zhìzhī-sǐdì ér hòushēng de jīngshén xiàngzhēng.",
                    "en": "The Battle of Julu not only turned the tides against the Qin empire, but immortalized 'breaking cauldrons and sinking boats' as the ultimate Chinese symbol of triumph through resolute desperation."
                },
                {
                    "id": "s2_9",
                    "cn": "历史毋庸置疑地证明：很多时候，让人脱颖而出的往往不是顺境中的从容，而是身处绝境时不留退路的惊人决绝。",
                    "pinyin": "Lìshǐ wúyōng-zhìyí de zhèngmíng: hěn duō shíhou, ràng rén tuōyǐng’érchū de wǎngwǎng bú shì shùnjìng zhōng de cóngróng, ér shì shēnchǔ juéjìng shí bù liú tuìlù de jīngrén juéjué.",
                    "en": "History proves beyond doubt: what elevates exceptional souls is rarely unhurried ease in calm times, but the astonishing resolve to burn one's boats when facing an impossible impasse."
                }
            ]
        }
    ],
    "targetVocabulary": [
        {
            "word": "破釜沉舟",
            "pinyin": "pòfǔ-chénzhōu",
            "tone": 4,
            "hsk": "HSK 6",
            "definitions": ["break cauldrons and sink boats", "cut off all retreat", "commit irrevocably to victory"],
            "exampleSentence": {
                "cn": "全军渡河之后，项羽下令破釜沉舟，誓死决战。",
                "pinyin": "Quánjūn dùhé zhīhòu, Xiàng Yǔ xiàlìng pòfǔ-chénzhōu, shìsǐ juézhàn.",
                "en": "After crossing the river, Xiang Yu ordered the troops to break their pots and sink their boats to fight to the death."
            }
        },
        {
            "word": "势单力薄",
            "pinyin": "shìdān-lìbó",
            "tone": 4,
            "hsk": "HSK 6",
            "definitions": ["isolated and weak", "lacking external resources and numbers"],
            "exampleSentence": {
                "cn": "尽管楚军看似势单力薄，却爆发出了无坚不摧的斗志。",
                "pinyin": "Jǐnguǎn Chǔjūn kànsì shìdān-lìbó, què bàofā chū le wújiān-bùcuī de dòuzhì.",
                "en": "Although the Chu army seemed outnumbered and isolated, they unleashed an invincible fighting spirit."
            }
        },
        {
            "word": "毋庸置疑",
            "pinyin": "wúyōng-zhìyí",
            "tone": 2,
            "hsk": "HSK 6",
            "definitions": ["beyond all doubt", "indubitable", "needless to say"],
            "exampleSentence": {
                "cn": "这项决策对于战局的扭转起到了毋庸置疑的关键作用。",
                "pinyin": "Zhè xiàng juécè duìyú zhànjú de niǔzhuǎn qǐdào le wúyōng-zhìyí de guānjiàn zuòyòng.",
                "en": "This decision played an indubitably decisive role in reversing the course of the battle."
            }
        },
        {
            "word": "军心涣散",
            "pinyin": "jūnxīn huànsàn",
            "tone": 1,
            "hsk": "HSK 6",
            "definitions": ["troops morale is shattered", "disheartened soldiers"],
            "exampleSentence": {
                "cn": "面对强敌，诸侯大军军心涣散，作壁上观。",
                "pinyin": "Miànduì qiángdí, zhūhóu dàjūn jūnxīn huànsàn, zuòbìshàngguān.",
                "en": "Confronted by the formidable enemy, the allied armies lost morale and merely stood by spectating."
            }
        }
    ],
    "grammarNotes": [
        {
            "pattern": "唯有...方能...",
            "explanation": "Expresses an exclusive necessary condition (Only by doing X can one achieve Y).",
            "exampleFromStory": "唯有置之死地，方能绝处逢生。",
            "additionalExamples": [
                "唯有经历风雨的洗礼，方能铸就坚毅的品格。",
                "唯有勇于直面内心的恐惧，方能迎来真正的自由。"
            ]
        },
        {
            "pattern": "不仅...更...",
            "explanation": "Progressive connector showing a higher or deeper impact (Not only X, but furthermore Y).",
            "exampleFromStory": "不仅彻底粉碎了秦军精锐，更逼得名将章邯俯首受降。",
            "additionalExamples": [
                "阅读不仅能拓展知识面，更能陶冶人的情操。",
                "这项突破不仅降低了生产成本，更引领了整个行业的新变革。"
            ]
        }
    ],
    "quiz": [
        {
            "id": "q1",
            "question": "在巨鹿之战中，项羽为什么要下令“破釜沉舟”？",
            "options": [
                "船只损坏严重无法继续使用",
                "军中粮饷被敌军焚毁殆尽",
                "断绝将士们一切退路与侥幸心理，激发拼死一战的必胜信念",
                "给赵国守将传递投降的信号"
            ],
            "correctIndex": 2,
            "explanation": "项羽通过破釜沉舟切断所有退路，使全军置之死地而后生，爆发出以一当十的顽强战斗力。"
        },
        {
            "id": "q2",
            "question": "文中描述其他诸侯军队在秦军围城时的表现是：",
            "options": [
                "身先士卒，奋力冲杀",
                "逡巡不前，作壁上观",
                "暗中与秦军议和投降",
                "日夜兼程运输军粮"
            ],
            "correctIndex": 1,
            "explanation": "第二句明确指出：各路诸侯震慑于秦军声势，“人人逡巡不前，作壁上观”。"
        },
        {
            "id": "q3",
            "question": "成语“毋庸置疑”在句中的主要语法作用是：",
            "options": [
                "作状语，表示情况极其确凿、不容怀疑",
                "作谓语，表示提出反驳",
                "作定语，修饰敌人军队",
                "作补语，表示程度不够"
            ],
            "correctIndex": 0,
            "explanation": "“毋庸置疑”常作状语修饰动词（如证明、说明），强调事实确凿毫无疑虑。"
        }
    ]
}

s2_text = " ".join([s["cn"] for sec in story2["sections"] for s in sec["sentences"]])
s2_mp3 = "client/public/audio/hsk6_battle_of_julu.mp3"
s2_vtt = "client/public/audio/hsk6_battle_of_julu.vtt"
s2_cues = synthesize_audio(s2_text, "zh-CN-YunjianNeural", s2_mp3, s2_vtt)

s2_sentences = [s for sec in story2["sections"] for s in sec["sentences"]]
for i, s in enumerate(s2_sentences):
    if i < len(s2_cues):
        s["startTime"] = round(s2_cues[i]["start"], 2)
        s["endTime"] = round(s2_cues[i]["end"], 2)
    else:
        s["startTime"] = round(i * 10.0, 2)
        s["endTime"] = round((i + 1) * 10.0, 2)

with open("tools/hsk6_battle_of_julu.json", "w", encoding="utf-8") as f:
    json.dump(story2, f, ensure_ascii=False, indent=2)

print("Story 2 generated successfully!")
