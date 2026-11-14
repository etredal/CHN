import React from 'react';
import type { Sentence, WordToken as IWordToken } from '../../types';
import { WordToken } from './WordToken';
import { useAudioPlayer } from '../../context/AudioPlayerContext';

interface SentenceProps {
  sentence: Sentence;
  onWordClick: (token: IWordToken, sentenceContext?: Sentence) => void;
}

/**
 * One sentence, rendered inline so a paragraph reads as continuous text.
 * While the audio plays it gets a soft highlight, and the word being spoken
 * a stronger one.
 */
export const SentenceBlock: React.FC<SentenceProps> = ({ sentence, onWordClick }) => {
  const { activeSentenceId, activeWord, isPlaying, currentTime, playFrom } = useAudioPlayer();
  // Highlight only once listening has started, not on a fresh story.
  const isActive = activeSentenceId === sentence.id && (isPlaying || currentTime > 0);
  // Timing lives in the audio player (see utils/wordTimeline.ts).
  const activeWordIndex = activeWord?.sentenceId === sentence.id ? activeWord.tokenIndex : -1;

  return (
    <span id={`sentence-${sentence.id}`} className={`story-sentence${isActive ? ' is-active' : ''}`}>
      {sentence.tokens.map((token, idx) => (
        <WordToken
          key={`${sentence.id}-tok-${idx}`}
          token={token}
          onClick={(tok) => onWordClick(tok, sentence)}
          // Press and hold a word to play the story from there.
          onLongPress={() => playFrom(sentence, idx)}
          highlight={isActive && idx === activeWordIndex}
        />
      ))}
    </span>
  );
};
