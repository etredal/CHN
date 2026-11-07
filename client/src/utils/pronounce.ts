import { playAudioClip, preloadAudio } from './audioClip';
import type { AudioClip } from './audioClip';
import { speechService } from './speech';
import type { WordAudio } from '../types';

/** Ways a word can be pronounced, best first. */
export interface WordAudioSources {
  /** The word recorded on its own. */
  clip?: AudioClip;
  /** The word recorded on its own, slowly. */
  slowClip?: AudioClip;
}

/** Look a word up in a story's standalone word recordings. */
export function wordAudioSources(word: string, wordAudio?: WordAudio): WordAudioSources {
  const c = wordAudio?.clips[word];
  if (!wordAudio || !c) return {};
  return {
    clip: { url: wordAudio.url, start: c[0], end: c[1] },
    slowClip: { url: wordAudio.slowUrl, start: c[2], end: c[3] },
  };
}

/** Start fetching a story's word recordings so the first click plays at once. */
export function preloadWordAudio(wordAudio?: WordAudio): void {
  if (!wordAudio) return;
  preloadAudio(wordAudio.url);
  preloadAudio(wordAudio.slowUrl);
}

/**
 * Say a word, preferring its standalone recording. Without one, falls back
 * to the browser's speech synthesis, which needs a Chinese voice installed
 * on the device.
 *
 * Resolves once the word has (roughly) finished.
 */
export async function pronounceWord(word: string, sources: WordAudioSources = {}, slow = false): Promise<void> {
  const attempts: [AudioClip, number][] = [];
  if (slow && sources.slowClip) attempts.push([sources.slowClip, 1]);
  if (sources.clip) attempts.push([sources.clip, slow ? 0.6 : 1]);

  for (const [clip, rate] of attempts) {
    try {
      await playAudioClip(clip, rate);
      return;
    } catch (err) {
      console.warn('Word recording failed to play', err);
    }
  }
  await new Promise<void>(resolve => {
    speechService.speak(word, { rate: slow ? 0.65 : 0.85, onEnd: resolve });
    // onEnd never fires if the device has no usable voice.
    setTimeout(resolve, 3000);
  });
}
