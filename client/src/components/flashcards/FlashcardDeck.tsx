import React, { useState } from 'react';
import type { Flashcard } from '../../types';
import { updateCardSrs } from '../../utils/srs';
import { pronounceWord } from '../../utils/pronounce';
import { Volume2, ArrowLeft, Sparkles } from 'lucide-react';
import { ChineseText } from '../common/ChineseText';

interface FlashcardDeckProps {
  cards: Flashcard[];
  onBack: () => void;
  onFinishReview: () => void;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards, onBack, onFinishReview }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!cards || cards.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center text-slate-400">
        <Sparkles className="w-12 h-12 mx-auto mb-3 text-amber-500 opacity-60" />
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">暂无待复习的生词</h3>
        <p className="text-xs text-slate-500 mt-1">在精读文章时点击任意汉字并点击书签即可加入复习库。</p>
        <button
          onClick={onBack}
          className="mt-6 px-6 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold"
        >
          返回生词列表
        </button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleGrade = (rating: number) => {
    updateCardSrs(currentCard.id, rating);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      onFinishReview();
    }
  };

  const playWordAudio = () => {
    pronounceWord(currentCard.word, { clip: currentCard.audioClip });
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>退出复习</span>
        </button>

        <span className="text-xs font-bold text-slate-400">
          进度: {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* Flashcard Canvas */}
      <div
        onClick={() => !isFlipped && setIsFlipped(true)}
        className="relative min-h-[380px] p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between cursor-pointer transition-all duration-300 select-none"
      >
        {/* Card Top */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
            {currentCard.hskLevel || 'Vocabulary'}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              playWordAudio();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Pronounce Word"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Card Center: Large Hanzi */}
        <div className="text-center my-auto py-6">
          <h2 className="text-6xl font-extrabold text-slate-900 dark:text-white font-chinese-sans tracking-wide">
            {currentCard.word}
          </h2>

          {isFlipped && (
            <div className="mt-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <span className="text-xl font-semibold text-amber-600 dark:text-amber-400 font-sans block">
                {currentCard.pinyin}
              </span>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1 font-sans">
                  {currentCard.definitions.map((def, idx) => (
                    <li key={idx}>• {def}</li>
                  ))}
                </ul>
              </div>

              {currentCard.exampleSentence && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-left">
                  <p className="font-chinese-sans text-slate-800 dark:text-slate-200 font-medium">
                    <ChineseText text={currentCard.exampleSentence.cn} en={currentCard.exampleSentence.en} />
                  </p>
                </div>
              )}
            </div>
          )}

          {!isFlipped && (
            <p className="text-xs text-slate-400 mt-8 font-sans">点击卡片任意位置翻转查看释义</p>
          )}
        </div>

        {/* Card Bottom / Grading Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          {!isFlipped ? (
            <button
              onClick={() => setIsFlipped(true)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-98"
            >
              翻转卡片
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleGrade(0);
                }}
                className="py-2.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold text-xs flex flex-col items-center gap-1 border border-rose-200 dark:border-rose-900 transition-colors"
              >
                <span>重来</span>
                <span className="text-[10px] font-normal opacity-70">1天</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleGrade(1);
                }}
                className="py-2.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-bold text-xs flex flex-col items-center gap-1 border border-amber-200 dark:border-amber-900 transition-colors"
              >
                <span>较难</span>
                <span className="text-[10px] font-normal opacity-70">2天</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleGrade(2);
                }}
                className="py-2.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold text-xs flex flex-col items-center gap-1 border border-emerald-200 dark:border-emerald-900 transition-colors"
              >
                <span>良好</span>
                <span className="text-[10px] font-normal opacity-70">4天</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleGrade(3);
                }}
                className="py-2.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-bold text-xs flex flex-col items-center gap-1 border border-blue-200 dark:border-blue-900 transition-colors"
              >
                <span>容易</span>
                <span className="text-[10px] font-normal opacity-70">7天</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
