import React, { useState } from 'react';
import type { Sentence, WordToken as IWordToken } from '../../types';
import { WordToken } from './WordToken';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { useSettings } from '../../context/SettingsContext';
import { Play, Eye, EyeOff } from 'lucide-react';

interface SentenceBlockProps {
  sentence: Sentence;
  onWordClick: (token: IWordToken, sentenceContext?: Sentence) => void;
}

export const SentenceBlock: React.FC<SentenceBlockProps> = ({ sentence, onWordClick }) => {
  const { activeSentenceId, seekToSentence, currentTime } = useAudioPlayer();
  const { settings } = useSettings();
  const [localShowEnglish, setLocalShowEnglish] = useState(false);
  const isEnglishVisible = settings.showEnglish || localShowEnglish;
  const isActive = activeSentenceId === sentence.id;
  // Calculate which word should be highlighted when sentence is active
  const activeWordIndex = (() => {
    if (!isActive) return -1;
    // If any token has a startTime, use timestamp based lookup
    const hasTimestamps = sentence.tokens.some(t => t.startTime !== undefined);
    if (hasTimestamps) {
      // Find the last token whose startTime is <= currentTime
      for (let i = sentence.tokens.length - 1; i >= 0; i--) {
        const t = sentence.tokens[i];
        if (t.startTime !== undefined && t.startTime <= currentTime) {
          return i;
        }
      }
      return -1;
    }
    // Fallback to proportional calculation (previous logic)
    const duration = sentence.endTime - sentence.startTime;
    if (duration <= 0) return -1;
    const elapsed = currentTime - sentence.startTime;
    if (elapsed >= duration) return -1;
    const progress = Math.max(0, Math.min(1, elapsed / duration));
    const idx = Math.floor(progress * sentence.tokens.length);
    return idx >= sentence.tokens.length ? sentence.tokens.length - 1 : idx;
  })();

  return (
    <div
      id={`sentence-${sentence.id}`}
      className={`group relative my-2 px-3 py-2 rounded-xl transition-all duration-200
        ${isActive
          ? 'bg-amber-50/90 dark:bg-amber-950/30 border-l-4 border-amber-500 shadow-sm'
          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-l-4 border-transparent'
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Chinese text block */}
        <div className="flex-1 leading-relaxed text-slate-800 dark:text-slate-100 flex flex-wrap items-baseline gap-y-2">
          {sentence.tokens.map((token, idx) => (
            <WordToken
              key={`${sentence.id}-tok-${idx}`}
              token={token}
              onClick={(tok) => onWordClick(tok, sentence)}
              highlight={isActive && idx === activeWordIndex}
            />
          ))}
        </div>

        {/* Action Controls (Play sentence & Toggle English) */}
        <div className="opacity-0 group-hover:opacity-100 sm:flex items-center gap-1 shrink-0 text-slate-400 dark:text-slate-500 transition-opacity">
          <button
            onClick={() => seekToSentence(sentence)}
            className="p-1 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Play from this sentence"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>
          <button
            onClick={() => setLocalShowEnglish(!localShowEnglish)}
            className="p-1 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title={isEnglishVisible ? "Hide English" : "Show English"}
          >
            {isEnglishVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* English translation */}
      {isEnglishVisible && (
        <div className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-sans border-t border-slate-100 dark:border-slate-800/80 pt-1.5 transition-all">
          {sentence.en}
        </div>
      )}
    </div>
  );
};
