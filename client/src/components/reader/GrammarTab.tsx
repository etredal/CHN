import React from 'react';
import type { GrammarPoint } from '../../types';
import { BookOpen, Sparkles } from 'lucide-react';
import { ChineseText } from '../common/ChineseText';

interface GrammarTabProps {
  notes: GrammarPoint[];
}

export const GrammarTab: React.FC<GrammarTabProps> = ({ notes }) => {
  if (!notes || notes.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p>本课暂无语法笔记</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-4">
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <Sparkles className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans">
          <ChineseText pinyin={false} text="核心语法与句型精讲" en="Key grammar and sentence patterns" />
        </h3>
      </div>

      <div className="space-y-4">
        {notes.map((g, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
          >
            {/* Pattern Badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-lg text-sm font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                {/* The pattern reveals its (English) explanation. */}
                <ChineseText text={g.pattern} en={g.explanation} />
              </span>
            </div>

            {/* Example from story */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-l-4 border-amber-500 text-sm mb-3">
              <span className="text-xs font-semibold text-slate-400 block mb-1">课文原句：</span>
              <p className="text-slate-800 dark:text-slate-200 font-chinese-sans font-medium">
                <ChineseText text={g.exampleFromStory} en={g.exampleFromStoryEn} />
              </p>
            </div>

            {/* Additional examples */}
            {g.additionalExamples && g.additionalExamples.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <span className="text-xs font-semibold text-slate-400 block mb-1">扩展例句：</span>
                {g.additionalExamples.map((ex, exIdx) => (
                  <div key={exIdx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <ChineseText className="font-chinese-sans" text={ex} en={g.additionalExamplesEn?.[exIdx]} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
