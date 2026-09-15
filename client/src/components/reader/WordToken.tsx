import React from 'react';
import type { WordToken as IWordToken } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { getToneColorClass } from '../../utils/pinyin';

interface WordTokenProps {
  token: IWordToken;
  onClick: (token: IWordToken) => void;
  highlight?: boolean;
}

export const WordToken: React.FC<WordTokenProps> = ({ token, onClick, highlight }) => {
  const { settings } = useSettings();

  const isPunc = /^[，。！？；：“”‘’（）《》、—…\.,!?;:\'\"()\[\]]$/.test(token.text);

  if (isPunc) {
    return <span className="text-gray-400 dark:text-gray-500 select-none mx-0.5">{token.text}</span>;
  }

  const toneClass = settings.showToneColors ? getToneColorClass(token.tone) : '';
  const isTarget = token.isTargetWord;

  const renderContent = () => {
    if (settings.pinyinMode === 'above' && token.pinyin && token.pinyin !== token.text) {
      return (
        <ruby className="inline-flex flex-col items-center">
          <rt className="text-xs text-slate-400 dark:text-slate-500 font-normal pb-0.5 select-none">
            {token.pinyin}
          </rt>
          <span className={`transition-colors ${toneClass}`}>{token.text}</span>
        </ruby>
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
        title={token.pinyin ? `${token.text} (${token.pinyin})` : token.text}
      >
      {renderContent()}
    </span>
  );
};
