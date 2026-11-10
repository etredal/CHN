import React from 'react';
import type { Sentence, TextBlock, WordToken as IWordToken } from '../../types';
import { WordToken } from './WordToken';
import { ChineseText } from '../common/ChineseText';

interface WordLineProps {
  block: TextBlock;
  /** Identifies the block as a word's context (e.g. "title", "part-2"). */
  id: string;
  onWordClick: (token: IWordToken, sentenceContext?: Sentence) => void;
}

/**
 * A title, summary or heading that behaves like the story text: each word
 * opens the word drawer, which shows this block (and its English) as context.
 */
export const WordLine: React.FC<WordLineProps> = ({ block, id, onWordClick }) => {
  if (!block.tokens?.length) return <ChineseText text={block.cn} en={block.en} />;

  const context: Sentence = {
    id,
    cn: block.cn,
    en: block.en,
    pinyin: '',
    startTime: 0,
    endTime: 0,
    tokens: block.tokens,
  };
  return (
    <>
      {block.tokens.map((token, idx) => (
        <WordToken key={idx} token={token} onClick={tok => onWordClick(tok, context)} />
      ))}
    </>
  );
};
