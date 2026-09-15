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
  * Returns the CSS class for a given tone (1-5)
  */
export function getToneColorClass(tone: number): string {
  switch (tone) {
    case 1: return 'text-red-500';
    case 2: return 'text-amber-500';
    case 3: return 'text-emerald-500';
    case 4: return 'text-blue-500';
    case 5:
    default: return 'text-slate-400';
  }
}

/**
  * Returns the background badge class for tone
  */
export function getToneBadgeClass(tone: number): string {
  switch (tone) {
    case 1: return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800';
    case 2: return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    case 3: return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    case 4: return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
    case 5:
    default: return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }
}

/**
  * Generate pinyin for Chinese text using pinyin-pro
  */
export function generatePinyin(text: string): string {
  return pinyin(text, { toneType: 'symbol' });
}