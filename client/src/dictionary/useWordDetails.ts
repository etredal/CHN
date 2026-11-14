import { useEffect, useState } from 'react';
import type { WordCharacter, WordToken } from '../types';
import { lookupWord } from './dictService';
import { lookupCedict } from './cedict';

export interface WordDetails {
  definitions: string[];
  /** Per-character pinyin and meaning, for words of two or more characters. */
  characters: WordCharacter[];
  /** Still fetching from the dictionary. */
  loading: boolean;
  /** Definitions came from CC-CEDICT (shown with attribution). */
  fromCedict: boolean;
  /** The word isn't in the dictionary as a whole, so `definitions` explain its parts. */
  fromParts: boolean;
}

/**
 * For a combination the dictionary doesn't list (不知道, 一件, 豆腐店), the
 * first way to split it into two listed words, e.g. "不 bù: not; no".
 */
async function definePartsOf(chars: string[], syllables: string[]): Promise<string[]> {
  for (let k = 1; k < chars.length; k++) {
    const left = chars.slice(0, k).join('');
    const right = chars.slice(k).join('');
    const lpy = syllables.slice(0, k).join(' ') || undefined;
    const rpy = syllables.slice(k).join(' ') || undefined;
    const [l, r] = await Promise.all([lookupCedict(left, lpy), lookupCedict(right, rpy)]);
    if (l.length && r.length) {
      const line = (w: string, x: { pinyin: string; definitions: string[] }) =>
        `${w} ${x.pinyin}: ${x.definitions.slice(0, 3).join('; ')}`;
      return [line(left, l[0]), line(right, r[0])];
    }
  }
  return [];
}

/**
 * Definitions and a character breakdown for `token`. Story words carry no
 * definitions of their own, so they come from (in order) the token itself,
 * the hand-written entries in dictService, then CC-CEDICT, choosing the
 * reading that matches the token's pinyin.
 */
export function useWordDetails(token: WordToken): WordDetails {
  const own = token.definitions.length
    ? token.definitions
    : lookupWord(token.text)?.definitions ?? [];
  const chars = Array.from(token.text);
  const needsDefs = own.length === 0;
  const needsChars = !token.characters?.length && chars.length > 1;

  const [fetched, setFetched] = useState<{ key: string; definitions: string[]; characters: WordCharacter[]; fromParts: boolean } | null>(null);
  const key = `${token.text}|${token.pinyin}`;

  useEffect(() => {
    if (!needsDefs && !needsChars) return;
    let cancelled = false;
    // One syllable per character, when the pinyin lines up.
    const syllables = token.pinyin.split(/\s+/);
    const perChar = syllables.length === chars.length ? syllables : [];

    const wholeOrParts = async () => {
      const readings = await lookupCedict(token.text, token.pinyin);
      if (readings.length || chars.length < 2) return { definitions: readings[0]?.definitions ?? [], fromParts: false };
      return { definitions: await definePartsOf(chars, perChar), fromParts: true };
    };

    Promise.all([
      needsDefs ? wholeOrParts() : Promise.resolve({ definitions: [], fromParts: false }),
      needsChars
        ? Promise.all(chars.map((ch, i) => lookupCedict(ch, perChar[i]).catch(() => [])))
        : Promise.resolve([]),
    ])
      .then(([found, charReadings]) => {
        if (cancelled) return;
        setFetched({
          key,
          definitions: found.definitions,
          fromParts: found.fromParts && found.definitions.length > 0,
          characters: charReadings.map((r, i) => ({
            char: chars[i],
            pinyin: perChar[i] ?? r[0]?.pinyin ?? '',
            definition: r[0]?.definitions.slice(0, 2).join('; ') ?? '',
          })),
        });
      })
      .catch(err => {
        console.warn('Dictionary lookup failed', err);
        if (!cancelled) setFetched({ key, definitions: [], characters: [], fromParts: false });
      });
    return () => {
      cancelled = true;
    };
    // `key` covers the token's text and pinyin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, needsDefs, needsChars]);

  const done = fetched?.key === key;
  return {
    definitions: needsDefs ? (done ? fetched.definitions : []) : own,
    characters: needsChars ? (done ? fetched.characters : []) : token.characters ?? [],
    loading: (needsDefs || needsChars) && !done,
    fromCedict: needsDefs && done && fetched.definitions.length > 0,
    fromParts: needsDefs && done && fetched.fromParts,
  };
}
