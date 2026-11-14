import React, { useRef } from 'react';
import type { WordToken as IWordToken } from '../../types';
import { usePinyinVisible } from '../../context/SettingsContext';
import { isPunctuation } from '../../utils/punctuation';

interface WordTokenProps {
  token: IWordToken;
  onClick: (token: IWordToken) => void;
  /** Press and hold (mouse or touch). Holding doesn't also count as a click. */
  onLongPress?: (token: IWordToken) => void;
  highlight?: boolean;
}

const LONG_PRESS_MS = 450;
/** A finger that moves this far is scrolling, not holding. */
const MOVE_TOLERANCE_PX = 10;

export const WordToken: React.FC<WordTokenProps> = ({ token, onClick, onLongPress, highlight }) => {
  const showPinyin = usePinyinVisible();
  const pressTimer = useRef(0);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const longPressed = useRef(false);

  if (isPunctuation(token.text)) {
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

  const cancelPress = () => {
    clearTimeout(pressTimer.current);
    pressStart.current = null;
  };

  const pressHandlers = onLongPress ? {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      longPressed.current = false;
      pressStart.current = { x: e.clientX, y: e.clientY };
      clearTimeout(pressTimer.current);
      pressTimer.current = window.setTimeout(() => {
        pressStart.current = null;
        longPressed.current = true;
        navigator.vibrate?.(15);
        onLongPress(token);
      }, LONG_PRESS_MS);
    },
    onPointerMove: (e: React.PointerEvent) => {
      const start = pressStart.current;
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > MOVE_TOLERANCE_PX) cancelPress();
    },
    onPointerUp: cancelPress,
    onPointerLeave: cancelPress,
    onPointerCancel: cancelPress,
    // Stop the phone's long-press menu from opening over the text.
    onContextMenu: (e: React.MouseEvent) => {
      if (longPressed.current || pressStart.current) e.preventDefault();
    },
  } : {};

  return (
    <span
        {...pressHandlers}
        onClick={(e) => {
          e.stopPropagation();
          if (longPressed.current) {
            longPressed.current = false;
            return;
          }
          onClick(token);
        }}
        className={`word-token${isTarget ? ' is-target' : ''}${highlight ? ' is-spoken' : ''}${onLongPress ? ' can-hold' : ''}`}
        // The hover tooltip only reveals pinyin when pinyin is switched on.
        title={showPinyin && token.pinyin && token.pinyin !== token.text ? `${token.text} (${token.pinyin})` : token.text}
      >
      {renderContent()}
    </span>
  );
};
