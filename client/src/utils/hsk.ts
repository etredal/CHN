import type { HskLevel } from '../types';
// The official HSK 2.0 word list (tools/build_hsk_levels.py).
import levels from './hskLevels.json';

let byWord: Map<string, HskLevel> | null = null;

/** The word's level in the HSK 2.0 list (HSK 1–6), if it is on the list. */
export function hskLevelOf(word: string): HskLevel | undefined {
  if (!byWord) {
    byWord = new Map();
    for (const [level, words] of Object.entries(levels as Record<string, string>)) {
      for (const w of words.split(' ')) byWord.set(w, `HSK ${level}` as HskLevel);
    }
  }
  return byWord.get(word);
}
