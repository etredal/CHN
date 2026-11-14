import React, { useState } from 'react';
import type { Flashcard } from '../../types';
import { getSavedFlashcards, getDueFlashcards, removeFlashcard, exportToAnkiTsv } from '../../utils/srs';
import { pronounceWord } from '../../utils/pronounce';
import { Bookmark, Volume2, Trash2, Download, Play, Search, Sparkles } from 'lucide-react';
import { ChineseText } from '../common/ChineseText';
import { usePinyinVisible } from '../../context/SettingsContext';

interface VocabListViewProps {
  onStartReview: (cards: Flashcard[]) => void;
}

export const VocabListView: React.FC<VocabListViewProps> = ({ onStartReview }) => {
  const showPinyin = usePinyinVisible();
  // Read saved words up front so the first render isn't an empty list.
  const [cards, setCards] = useState<Flashcard[]>(getSavedFlashcards);
  const [search, setSearch] = useState('');

  const dueCards = getDueFlashcards(cards);

  const loadCards = () => {
    setCards(getSavedFlashcards());
  };

  const handleDelete = (word: string) => {
    removeFlashcard(word);
    loadCards();
  };

  const handleExportAnki = () => {
    const tsv = exportToAnkiTsv(cards);
    const blob = new Blob([tsv], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duchinese_vocab_${new Date().toISOString().slice(0,10)}.tsv`;
    a.click();
    // Revoking straight away can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const filteredCards = cards.filter(c =>
    c.word.includes(search) ||
    c.pinyin.toLowerCase().includes(search.toLowerCase()) ||
    c.definitions.some(d => d.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-chinese-sans flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-amber-500 fill-current" />
            <span>我的生词本</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">共收藏 {cards.length} 个单词 • 今日待复习 {dueCards.length} 个 • 支持基于 SM-2 算法的间隔复习</p>
        </div>

        <div className="flex items-center gap-2">
          {cards.length > 0 && (
            <>
              <button
                onClick={handleExportAnki}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Export as Anki TSV"
              >
                <Download className="w-4 h-4" />
                <span>导出 Anki</span>
              </button>

              {dueCards.length > 0 ? (
                <button
                  onClick={() => onStartReview(dueCards)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                  title="Review the words that are due"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>开始复习 ({dueCards.length})</span>
                </button>
              ) : (
                // Nothing due: still allow an extra pass over everything.
                <button
                  onClick={() => onStartReview(cards)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl border border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold active:scale-95 transition-all"
                  title="Nothing is due; review all words anyway"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>今日已完成 · 全部复习 ({cards.length})</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Search Filter */}
      {cards.length > 0 && (
        <div className="relative mb-6">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索生词、拼音或释义..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      )}

      {/* Cards List */}
      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredCards.map(c => (
            <div
              key={c.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-bold text-slate-900 dark:text-white font-chinese-sans">
                    {/* Click the word for its English meaning. */}
                    <ChineseText pinyin={false} text={c.word} en={c.definitions.join(', ')} />
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                    {c.hskLevel || 'HSK'}
                  </span>
                </div>

                {showPinyin && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium font-sans block mb-1">
                    {c.pinyin}
                  </span>
                )}

                {c.exampleSentence && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    <ChineseText text={`"${c.exampleSentence.cn}"`} en={c.exampleSentence.en} />
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <button
                  onClick={() => pronounceWord(c.word, { clip: c.audioClip })}
                  className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Speak Word"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(c.word)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-30 text-amber-500" />
          <p className="text-sm font-medium">暂无生词</p>
          <p className="text-xs mt-1">在阅读课文时，点击任何单词即可收藏进生词本！</p>
        </div>
      )}
    </div>
  );
};
