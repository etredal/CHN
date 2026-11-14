import type { Flashcard } from '../types';

const STORAGE_KEY = 'duchinese_flashcards_v1';

/**
  * Calculate next SRS state based on SM-2 algorithm
  * rating: 0 = Again, 1 = Hard, 2 = Good, 3 = Easy
  */
export function calculateNextReview(
  currentSrs: Flashcard['srs'],
  rating: number // 0, 1, 2, 3
): Flashcard['srs'] {
  let { repetition, interval, easeFactor } = currentSrs;

  // Map 0-3 rating to SM-2 quality (0: Again -> 1, 1: Hard -> 3, 2: Good -> 4, 3: Easy -> 5)
  const q = rating === 0 ? 1 : rating === 1 ? 3 : rating === 2 ? 4 : 5;

  if (q < 3) {
    // Failed recall
    repetition = 0;
    interval = 1;
  } else {
    // Successful recall
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = rating === 3 ? 4 : 2;
    } else {
      const modifier = rating === 1 ? 1.1 : rating === 3 ? 1.3 : 1.0;
      interval = Math.round(interval * easeFactor * modifier);
    }
    repetition += 1;
  }

  // Update Ease Factor (EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;

  return {
    repetition,
    interval,
    easeFactor: Math.round(easeFactor * 100) / 100,
    nextReviewDate,
  };
}

export function getSavedFlashcards(): Flashcard[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to load flashcards:', err);
    return [];
  }
}

export function saveFlashcard(
  cardData: Omit<Flashcard, 'id' | 'savedAt' | 'srs'>
): Flashcard {
  const cards = getSavedFlashcards();
  const existing = cards.find(c => c.word === cardData.word);
  if (existing) return existing;

  const newCard: Flashcard = {
    ...cardData,
    id: 'card_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    savedAt: Date.now(),
    srs: {
      interval: 1,
      repetition: 0,
      easeFactor: 2.5,
      nextReviewDate: Date.now(), // Due immediately
    },
  };

  cards.push(newCard);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  return newCard;
}

export function removeFlashcard(word: string): void {
  const cards = getSavedFlashcards().filter(c => c.word !== word);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

/** Cards whose next review is due now, most overdue first. */
export function getDueFlashcards(cards: Flashcard[] = getSavedFlashcards(), now = Date.now()): Flashcard[] {
  return cards
    .filter(c => c.srs.nextReviewDate <= now)
    .sort((a, b) => a.srs.nextReviewDate - b.srs.nextReviewDate);
}

/** Short label for how long until the next review, e.g. "1天", "3周", "2月". */
export function formatInterval(days: number): string {
  if (days < 14) return `${days}天`;
  if (days < 60) return `${Math.round(days / 7)}周`;
  if (days < 365) return `${Math.round(days / 30)}月`;
  return `${Math.round((days / 365) * 10) / 10}年`;
}

export function isWordSaved(word: string): boolean {
  return getSavedFlashcards().some(c => c.word === word);
}

export function updateCardSrs(cardId: string, rating: number): Flashcard | null {
  const cards = getSavedFlashcards();
  const index = cards.findIndex(c => c.id === cardId);
  if (index === -1) return null;

  const card = cards[index];
  card.srs = calculateNextReview(card.srs, rating);
  cards[index] = card;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  return card;
}

/**
  * Generates an Anki-compatible tab-separated values (TSV) string
  */
export function exportToAnkiTsv(cards: Flashcard[]): string {
  const header = '# Hanzi\tPinyin\tDefinitions\tHSK\tContext Sentence\n';
  // Tabs or line breaks inside a field would split it into extra columns/rows.
  const clean = (field: string) => field.replace(/[\t\r\n]+/g, ' ');
  const rows = cards.map(c => {
    const defs = c.definitions.join('; ');
    const context = c.exampleSentence ? `${c.exampleSentence.cn} (${c.exampleSentence.en})` : '';
    return [c.word, c.pinyin, defs, c.hskLevel || '', context].map(clean).join('\t');
  });
  return header + rows.join('\n');
}