import { useSyncExternalStore } from 'react';
import { VOCAB_CHANGED_EVENT, VOCAB_STORAGE_KEY, getSavedFlashcards } from './srs';

// The words in the vocabulary list, shared by every word on screen. The set is
// rebuilt only when the stored list changes, so each word's lookup is cheap.
let cachedRaw: string | null | undefined;
let cachedWords: Set<string> = new Set();

function snapshot(): Set<string> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(VOCAB_STORAGE_KEY);
  } catch {
    return cachedWords;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedWords = new Set(getSavedFlashcards().map(c => c.word));
  }
  return cachedWords;
}

function subscribe(onChange: () => void): () => void {
  // Saves in this tab, and in other tabs of the app.
  const onStorage = (e: StorageEvent) => { if (e.key === VOCAB_STORAGE_KEY) onChange(); };
  window.addEventListener(VOCAB_CHANGED_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(VOCAB_CHANGED_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

/** The set of words saved to the vocabulary list (生词本), kept up to date. */
export function useSavedWords(): Set<string> {
  return useSyncExternalStore(subscribe, snapshot, () => cachedWords);
}
