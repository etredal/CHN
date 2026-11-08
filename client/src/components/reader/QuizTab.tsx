import React, { useState } from 'react';
import type { QuizQuestion } from '../../types';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, Award } from 'lucide-react';
import { ChineseText, EnglishLine } from '../common/ChineseText';

interface QuizTabProps {
  quiz: QuizQuestion[];
}

export const QuizTab: React.FC<QuizTabProps> = ({ quiz }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showEnglish, setShowEnglish] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!quiz || quiz.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p>本课暂无阅读理解测验</p>
      </div>
    );
  }

  const handleSelect = (questionId: string, optionIdx: number) => {
    if (submitted) return; // Prevent changing after submit
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const calculateScore = () => {
    let score = 0;
    quiz.forEach(q => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  const score = calculateScore();
  const allAnswered = quiz.every(q => selectedAnswers[q.id] !== undefined);

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans">
            <ChineseText pinyin={false} text="阅读理解随堂测验" en="Reading comprehension quiz" />
          </h3>
        </div>

        {submitted && (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
              <Award className="w-4 h-4" />
              得分: {score} / {quiz.length}
            </span>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-1 rounded-lg"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重测
            </button>
          </div>
        )}
      </div>

      {/* Questions list */}
      <div className="space-y-6">
        {quiz.map((q, qIdx) => {
          const selected = selectedAnswers[q.id];
          const isCorrect = selected === q.correctIndex;

          return (
            <div
              key={q.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
            >
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 font-chinese-sans mb-3 flex items-start gap-2">
                <span className="text-amber-500">{qIdx + 1}.</span>
                {/* Clicking the question reveals English for it and its options. */}
                <ChineseText
                  text={q.question}
                  en={q.questionEn}
                  showEn={!!showEnglish[q.id]}
                  onToggleEn={() => setShowEnglish(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                />
              </h4>

              {/* Options */}
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  let optStyle = 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60';

                  if (selected === optIdx) {
                    optStyle = 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-medium';
                  }

                  if (submitted) {
                    if (optIdx === q.correctIndex) {
                      optStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium';
                    } else if (selected === optIdx && !isCorrect) {
                      optStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                    }
                  }

                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelect(q.id, optIdx)}
                      className={`p-3 rounded-xl border text-sm font-chinese-sans cursor-pointer transition-all flex items-center justify-between ${optStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs shrink-0">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>
                          <ChineseText text={opt} />
                          {showEnglish[q.id] && q.optionsEn?.[optIdx] && <EnglishLine text={q.optionsEn[optIdx]} />}
                        </span>
                      </div>

                      {submitted && optIdx === q.correctIndex && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      )}
                      {submitted && selected === optIdx && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation upon submit */}
              {submitted && (
                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 font-sans border-l-4 border-amber-500">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">解析：</span>
                  <p className="font-chinese-sans text-sm"><ChineseText text={q.explanation} en={q.explanationEn} /></p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {!submitted && (
        <div className="pt-2 text-center">
          <button
            onClick={() => setSubmitted(true)}
            disabled={!allAnswered}
            className={`px-8 py-3 rounded-xl font-medium text-sm transition-all shadow-sm ${
              allAnswered
                ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer active:scale-95'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            {allAnswered ? '提交答案并查看解析' : `请完成所有题目 (${Object.keys(selectedAnswers).length}/${quiz.length})`}
          </button>
        </div>
      )}
    </div>
  );
};
