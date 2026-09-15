import React, { useState } from 'react';
import type { WordToken, Sentence } from '../../types';
import { speechService } from '../../utils/speech';
import { getToneBadgeClass } from '../../utils/pinyin';
import { isWordSaved, saveFlashcard, removeFlashcard } from '../../utils/srs';
import { Volume2, Bookmark, BookmarkCheck, X, Sparkles } from 'lucide-react';

interface WordDrawerProps {
  token: WordToken | null;
  sentenceContext?: Sentence | null;
  onClose: () => void;
}

export const WordDrawer: React.FC<WordDrawerProps> = ({ token, sentenceContext, onClose }) => {
  if (!token) return null;

  const [saved, setSaved] = useState(() => isWordSaved(token.text));
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleSpeak = (slow: boolean = false) => {
    setIsPlayingAudio(true);
    speechService.speakWord(token.text, slow);
    setTimeout(() => setIsPlayingAudio(false), 1200);
  };

  const handleToggleSave = () => {
    if (saved) {
      removeFlashcard(token.text);
      setSaved(false);
    } else {
      saveFlashcard({
        word: token.text,
        pinyin: token.pinyin,
        tone: token.tone,
        definitions: token.definitions.length > 0 ? token.definitions : ['definition not specified'],
        hskLevel: token.hskLevel,
        exampleSentence: sentenceContext ? { cn: sentenceContext.cn, en: sentenceContext.en } : undefined,
      });
      setSaved(true);
    }
  };

  const toneBadge = getToneBadgeClass(token.tone);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer content */}
      <div className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[85vh] flex flex-col">
        {/* Mobile handle */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1" />

        {/* Header bar */}
        <div className="px-6 pt-4 pb-3 flex items-start justify-between border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white font-chinese-sans">
                {token.text}
              </h2>
              {token.hskLevel && (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  {token.hskLevel}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 text-sm font-medium rounded-md border ${toneBadge}`}>
                {token.pinyin}
              </span>
              <span className="text-xs text-slate-400">第 {token.tone === 5 ? '轻' : token.tone} 声</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSave}
              className={`p-2 rounded-xl border transition-all ${
                saved
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:text-amber-500'
              }`}
              title={saved ? "Remove from Flashcards" : "Save to Flashcards"}
            >
              {saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="px-6 py-4 overflow-y-auto space-y-4">
          {/* Audio controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSpeak(false)}
              disabled={isPlayingAudio}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
            >
              <Volume2 className="w-4 h-4 text-amber-500" />
              <span>标准发音</span>
            </button>
            <button
              onClick={() => handleSpeak(true)}
              disabled={isPlayingAudio}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
            >
              <Volume2 className="w-4 h-4 text-blue-500" />
              <span>慢速 (0.6x)</span>
            </button>
          </div>

          {/* Definitions */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              英文释义 (Definitions)
            </h4>
            {token.definitions.length > 0 ? (
              <ul className="space-y-1.5">
                {token.definitions.map((def, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{def}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 italic">No direct dictionary entry found.</p>
            )}
          </div>

          {/* Character Breakdown (for multi-character words) */}
          {token.characters && token.characters.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                字义分解 (Character Breakdown)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {token.characters.map((ch, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline justify-between">
                      <span className="font-bold text-slate-900 dark:text-white font-chinese-sans">{ch.char}</span>
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{ch.pinyin}</span>
                    </div>
                    {ch.definition && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{ch.definition}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Context Sentence */}
          {sentenceContext && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>语境例句 (Context from Story)</span>
              </h4>
              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-slate-800/40 border border-amber-100 dark:border-slate-800 text-sm">
                <p className="text-slate-800 dark:text-slate-100 font-chinese-sans leading-relaxed">{sentenceContext.cn}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sentenceContext.en}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer save status */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>{saved ? '✓ 已保存至 SRS 复习卡片' : '点击右上角书签可加入复习库'}</span>
          <button
            onClick={handleToggleSave}
            className="font-medium text-amber-600 dark:text-amber-400 hover:underline"
          >
            {saved ? '取消收藏' : '收藏此词'}
          </button>
        </div>
      </div>
    </div>
  );
};
