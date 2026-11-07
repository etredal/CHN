import React from 'react';
import type { WordToken as IWordToken } from '../../types';
import { useSettings, usePinyinVisible } from '../../context/SettingsContext';
import { getToneColorClass } from '../../utils/pinyin';

interface WordTokenProps {
  token: IWordToken;
  onClick: (token: IWordToken) => void;
  highlight?: boolean;
}

export const WordToken: React.FC<WordTokenProps> = ({ token, onClick, highlight }) => {
  const { settings } = useSettings();
  const showPinyin = usePinyinVisible();

  const isPunc = /^[，。！？；：“”‘’（）《》、—…\.,!?;:\'\"()\[\]]$/.test(token.text);

  if (isPunc) {
    return <span className="text-gray-400 dark:text-gray-500 select-none mx-0.5">{token.text}</span>;
  }

  const toneClass = settings.showToneColors ? getToneColorClass(token.tone) : '';
  const isTarget = token.isTargetWord;

  const renderContent = () => {
    if (showPinyin && token.pinyin && token.pinyin !== token.text) {
      // Pinyin is one syllable per character, space separated: annotate each
      // character so syllables sit over their own character.
      const chars = Array.from(token.text);
      const syllables = token.pinyin.split(' ');
      const pairs: [string, string][] = chars.length === syllables.length
        ? chars.map((c, i) => [c, syllables[i]])
        : [[token.text, token.pinyin]];
      return (
        <span className={`transition-colors ${toneClass}`}>
          {pairs.map(([text, py], i) => (
            py === text ? text : (
              <ruby key={i}>
                {text}
                <rt>{py}</rt>
              </ruby>
            )
          ))}
        </span>
      );
    }

    return <span className={`transition-colors ${toneClass}`}>{token.text}</span>;
  };

  return (
    <span
        onClick={(e) => {
          e.stopPropagation();
          onClick(token);
        }}
        className={`word-token inline-block cursor-pointer px-0.5 py-0.5 rounded transition-all select-text
          hover:bg-amber-100/70 dark:hover:bg-amber-900/40 active:scale-95
          ${isTarget ? 'border-b-2 border-amber-400 dark:border-amber-500/80 font-medium' : ''}
          ${highlight ? 'bg-amber-300/30' : ''}`}
        // The hover tooltip only reveals pinyin when pinyin is switched on.
        title={showPinyin && token.pinyin && token.pinyin !== token.text ? `${token.text} (${token.pinyin})` : token.text}
      >
      {renderContent()}
    </span>
  );
};
