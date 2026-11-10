// Pinyin and Tone Color Utilities
import { pinyin } from 'pinyin-pro';

const TONE_MARKS: Record<string, number> = {
  // Tone 1
  'ā': 1, 'ē': 1, 'ī': 1, 'ō': 1, 'ū': 1, 'ǖ': 1,
  'Ā': 1, 'Ē': 1, 'Ī': 1, 'Ō': 1, 'Ū': 1, 'Ǖ': 1,
  // Tone 2
  'á': 2, 'é': 2, 'í': 2, 'ó': 2, 'ú': 2, 'ǘ': 2,
  'Á': 2, 'É': 2, 'Í': 2, 'Ó': 2, 'Ú': 2, 'Ǘ': 2,
  // Tone 3
  'ǎ': 3, 'ě': 3, 'ǐ': 3, 'ǒ': 3, 'ǔ': 3, 'ǚ': 3,
  'Ǎ': 3, 'Ě': 3, 'Ǐ': 3, 'Ǒ': 3, 'Ǔ': 3, 'Ǚ': 3,
  // Tone 4
  'à': 4, 'è': 4, 'ì': 4, 'ò': 4, 'ù': 4, 'ǜ': 4,
  'À': 4, 'È': 4, 'Ì': 4, 'Ò': 4, 'Ù': 4, 'Ǜ': 4,
};

/**
  * Extracts the primary tone number (1-5) from a pinyin string with marks.
  */
export function getToneFromPinyin(pinyinStr: string): number {
  for (const char of pinyinStr) {
    if (TONE_MARKS[char]) {
      return TONE_MARKS[char];
    }
  }
  return 5; // Neutral tone if no mark found
}

/**
  * Generate pinyin for Chinese text using pinyin-pro
  */
export function generatePinyin(text: string): string {
  return pinyin(text, { toneType: 'symbol' });
}