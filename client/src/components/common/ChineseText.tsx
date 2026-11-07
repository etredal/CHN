import React, { useMemo } from 'react';
import { pinyin, customPinyin } from 'pinyin-pro';
import overrides from '../../utils/pinyinOverrides.json';
import { usePinyinVisible } from '../../context/SettingsContext';

interface ChineseTextProps {
  text: string;
  className?: string;
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
 */
export const ChineseText: React.FC<ChineseTextProps> = ({ text, className }) => {
  const showPinyin = usePinyinVisible();
  const segments = useMemo(() => (showPinyin ? segment(text) : null), [text, showPinyin]);

  if (!segments) return <span className={className}>{text}</span>;

  return (
    <span className={`chinese-with-pinyin ${className ?? ''}`}>
      {segments.map((s, i) =>
        s.zh ? (
          <ruby key={i}>
            {s.char}
            <rt>{s.pinyin}</rt>
          </ruby>
        ) : (
          <React.Fragment key={i}>{s.text}</React.Fragment>
        )
      )}
    </span>
  );
};
