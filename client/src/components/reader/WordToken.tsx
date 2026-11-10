import React from 'react';
import type { WordToken as IWordToken } from '../../types';
import { usePinyinVisible } from '../../context/SettingsContext';

interface WordTokenProps {
  token: IWordToken;
  onClick: (token: IWordToken) => void;
  highlight?: boolean;
}

export const WordToken: React.FC<WordTokenProps> = ({ token, onClick, highlight }) => {
  const showPinyin = usePinyinVisible();

  const isPunc = /^[，。！？；：“”‘’（）《》、—…\.,!?;:\'\"()\[\]]$/.test(token.text);

  if (isPunc) {
    return <span className="select-none">{token.text}</span>;
  }

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
        <>
          {pairs.map(([text, py], i) => (
            py === text ? text : (
              <ruby key={i}>
                {text}
                <rt>{py}</rt>
              </ruby>
            )
          ))}
        </>
      );
    }

    return token.text;
  };

  return (
    <span
        onClick={(e) => {
          e.stopPropagation();
          onClick(token);
        }}
        className={`word-token${isTarget ? ' is-target' : ''}${highlight ? ' is-spoken' : ''}`}
        // The hover tooltip only reveals pinyin when pinyin is switched on.
        title={showPinyin && token.pinyin && token.pinyin !== token.text ? `${token.text} (${token.pinyin})` : token.text}
      >
      {renderContent()}
    </span>
  );
};
