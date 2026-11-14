import type { Sentence } from '../types';
import { isPunctuation } from './punctuation';

/** One spoken word in the story audio, in playback order. */
export interface TimelineWord {
  start: number;
  sentenceIndex: number;
  tokenIndex: number;
}

export interface WordTimeline {
  /** Sorted by `start`. */
  words: TimelineWord[];
  /** Sentence start times, parallel to the sentences array. */
  sentenceStarts: number[];
}

export interface ActiveWord {
  sentenceId: string;
  tokenIndex: number;
}

/**
 * Build a flat, time-sorted list of every spoken word in the story.
 *
 * Tokens carry measured onsets (see tools/align_word_timings.py). A sentence
 * without them falls back to spreading its words across the sentence span in
 * proportion to their length in characters, skipping punctuation.
 */
export function buildWordTimeline(sentences: Sentence[]): WordTimeline {
  const words: TimelineWord[] = [];

  sentences.forEach((sentence, sentenceIndex) => {
    const timed = sentence.tokens.some(t => t.startTime !== undefined);
    if (timed) {
      sentence.tokens.forEach((token, tokenIndex) => {
        if (token.startTime !== undefined) {
          words.push({ start: token.startTime, sentenceIndex, tokenIndex });
        }
      });
      return;
    }

    const spoken = sentence.tokens
      .map((token, tokenIndex) => ({ token, tokenIndex }))
      .filter(({ token }) => !isPunctuation(token.text));
    const totalChars = spoken.reduce((n, { token }) => n + token.text.length, 0);
    const span = sentence.endTime - sentence.startTime;
    if (!totalChars || span <= 0) return;
    let charsBefore = 0;
    for (const { token, tokenIndex } of spoken) {
      words.push({
        start: sentence.startTime + (span * charsBefore) / totalChars,
        sentenceIndex,
        tokenIndex,
      });
      charsBefore += token.text.length;
    }
  });

  words.sort((a, b) => a.start - b.start);
  return { words, sentenceStarts: sentences.map(s => s.startTime) };
}

/** Index of the last entry in sorted `starts` that is <= time, or -1. */
function lastAtOrBefore<T>(items: T[], time: number, startOf: (item: T) => number): number {
  let lo = 0;
  let hi = items.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (startOf(items[mid]) <= time) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

/** The sentence being spoken at `time`, or -1 before the first one. */
export function sentenceIndexAt(timeline: WordTimeline, time: number): number {
  return lastAtOrBefore(timeline.sentenceStarts, time, s => s);
}

/**
 * The word being spoken at `time`. During a pause the previous word stays
 * highlighted, but never across into a different sentence.
 */
export function wordAt(timeline: WordTimeline, sentences: Sentence[], time: number): ActiveWord | null {
  const i = lastAtOrBefore(timeline.words, time, w => w.start);
  if (i < 0) return null;
  const word = timeline.words[i];
  const sentenceIndex = sentenceIndexAt(timeline, time);
  if (word.sentenceIndex !== sentenceIndex) return null;
  return { sentenceId: sentences[word.sentenceIndex].id, tokenIndex: word.tokenIndex };
}
