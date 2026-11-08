import React, { useMemo, useState } from 'react';
import { pinyin, customPinyin } from 'pinyin-pro';
import overrides from '../../utils/pinyinOverrides.json';
import { usePinyinVisible } from '../../context/SettingsContext';

interface ChineseTextProps {
  text: string;
  className?: string;
  /** English for this text: clicking the text reveals it underneath. */
  en?: string;
  /** Control the English from outside (e.g. a quiz question reveals its options too). */
  showEn?: boolean;
  onToggleEn?: () => void;
  /** Interface labels skip pinyin; reading content gets it. */
  pinyin?: boolean;
}

// Words pinyin-pro gets wrong; shared with tools/compile_ts_stories.cjs.
customPinyin(overrides);

type Segment = { zh: true; char: string; pinyin: string } | { zh: false; text: string };

function segment(text: string): Segment[] {
  // Pinyin for the whole string at once, so readings come from context
  // (e.g. 长大 -> zhǎng, 银行 -> háng).
  const out: Segment[] = [];
  for (const item of pinyin(text, { type: 'all', toneType: 'symbol' })) {
    if (item.isZh && item.pinyin) {
      out.push({ zh: true, char: item.origin, pinyin: item.pinyin });
    } else {
      const last = out[out.length - 1];
      if (last && !last.zh) last.text += item.origin;
      else out.push({ zh: false, text: item.origin });
    }
  }
  return out;
}

/**
 * Renders Chinese text, with pinyin below each character when the reader's
 * global pinyin setting is on. Punctuation, Latin text and digits are left as is.
 *
 * Given `en`, the text is clickable and toggles its English translation
 * underneath. Clicks don't reach the parent (e.g. a card that opens a story).
 */
export const ChineseText: React.FC<ChineseTextProps> = ({ text, className, en, showEn, onToggleEn, pinyin: annotate = true }) => {
  const showPinyin = usePinyinVisible() && annotate;
  const segments = useMemo(() => (showPinyin ? segment(text) : null), [text, showPinyin]);
  const [ownShowEn, setOwnShowEn] = useState(false);
  const enVisible = showEn ?? ownShowEn;

  const body = !segments ? text : segments.map((s, i) =>
    s.zh ? (
      <ruby key={i}>
        {s.char}
        <rt>{s.pinyin}</rt>
      </ruby>
    ) : (
      <React.Fragment key={i}>{s.text}</React.Fragment>
    )
  );
  const cls = `${segments ? 'chinese-with-pinyin' : ''} ${className ?? ''}`.trim() || undefined;

  if (!en) return <span className={cls}>{body}</span>;

  const toggle = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (onToggleEn) onToggleEn();
    else setOwnShowEn(v => !v);
  };
  return (
    <span
      className={`translatable ${cls ?? ''}`}
      role="button"
      tabIndex={0}
      aria-expanded={enVisible}
      title={enVisible ? undefined : 'Click for English'}
      onClick={toggle}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle(e);
        }
      }}
    >
      {body}
      {enVisible && <EnglishLine text={en} />}
    </span>
  );
};

/** An English translation revealed under Chinese text. */
export const EnglishLine: React.FC<{ text: string }> = ({ text }) => (
  <span lang="en" className="english-line block mt-1 text-[0.8em] leading-snug font-sans font-normal not-italic text-slate-500 dark:text-slate-400">
    {text}
  </span>
);
