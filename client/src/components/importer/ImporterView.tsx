import React, { useState } from 'react';
import { tokenizeChinese } from '../../dictionary/dictService';
import type { WordToken } from '../../types';
import { WordDrawer } from '../reader/WordDrawer';
import { WordToken as WordTokenComp } from '../reader/WordToken';
import { speechService } from '../../utils/speech';
import { useSettings } from '../../context/SettingsContext';
import { Sparkles, FileText, Volume2, RotateCcw } from 'lucide-react';

export const ImporterView: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [sentences, setSentences] = useState<Array<{ text: string; tokens: WordToken[] }>>([]);
  const [selectedWord, setSelectedWord] = useState<WordToken | null>(null);
  const [isProcessed, setIsProcessed] = useState(false);
  const [speakingSentenceIdx, setSpeakingSentenceIdx] = useState<number | null>(null);

  const { settings } = useSettings();

  const handleProcess = () => {
    if (!inputText.trim()) return;

    // Split text into sentences by Chinese/English punctuation
    const rawSentences = inputText
      .split(/(?<=[。！？\n\r!?])/)
      .map(s => s.trim())
      .filter(Boolean);

    const processed = rawSentences.map(sent => ({
      text: sent,
      tokens: tokenizeChinese(sent),
    }));

    setSentences(processed);
    setIsProcessed(true);
  };

  const handlePlaySentence = (idx: number, text: string) => {
    setSpeakingSentenceIdx(idx);
    speechService.speak(text, {
      rate: settings.playbackSpeed,
      onEnd: () => setSpeakingSentenceIdx(null),
    });
  };

  const sampleTexts = [
    '中国古典文学作品往往蕴含着深邃的人生哲理，不仅陶冶情操，更能启迪当下的青年人寻找内心的从容。',
    '随着人工智能与机器人技术的突飞猛进，未来的工作模式与劳动价值正经历着前所未有的深刻重塑。'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-300 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>自由阅读器 • 导入任意中文文章</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-chinese-sans">
          导入中文文章进行精读
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          粘贴任何新闻、考试阅读理解或随笔，系统将自动进行分词、注音与词典匹配，并支持纯本地语音跟读。
        </p>
      </div>

      {!isProcessed ? (
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <textarea
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="在此处粘贴或输入中文段落（例如：HSK 5/6 模拟考题、知乎深度文章、人民网报道等）..."
              className="w-full text-base font-chinese-sans p-3 bg-transparent border-none text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-y"
            />

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="text-xs text-slate-400">已输入 {inputText.length} 字</span>
              <button
                onClick={handleProcess}
                disabled={!inputText.trim()}
                className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  inputText.trim()
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 cursor-pointer active:scale-95'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                立即解析并开始精读
              </button>
            </div>
          </div>

          {/* Quick sample buttons */}
          <div className="text-xs text-slate-400 space-y-1">
            <span>快速填充范例：</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {sampleTexts.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(sample)}
                  className="text-left p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-chinese-sans line-clamp-1 max-w-md transition-colors"
                >
                  范例 {idx + 1}: {sample}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Parsed Interactive Reader Canvas */
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              已解析 {sentences.length} 个句子（点击文字可查询释义与发音）
            </span>

            <button
              onClick={() => {
                setIsProcessed(false);
                speechService.stop();
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 p-1.5 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重新输入</span>
            </button>
          </div>

          {/* Render parsed sentences */}
          <div className="space-y-3 text-xl leading-loose font-chinese-sans">
            {sentences.map((sent, sIdx) => {
              const isSpeaking = speakingSentenceIdx === sIdx;
              return (
                <div
                  key={sIdx}
                  className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                    isSpeaking
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <button
                    onClick={() => handlePlaySentence(sIdx, sent.text)}
                    className={`p-1.5 rounded-xl shrink-0 transition-colors mt-1 ${
                      isSpeaking
                        ? 'bg-amber-500 text-white'
                        : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title="朗读该句"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <div className="flex-1 flex flex-wrap items-baseline gap-y-1">
                    {sent.tokens.map((token, tIdx) => (
                      <WordTokenComp
                        key={tIdx}
                        token={token}
                        onClick={(tok) => setSelectedWord(tok)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Word Drawer */}
      <WordDrawer
        token={selectedWord}
        onClose={() => setSelectedWord(null)}
      />
    </div>
  );
};
