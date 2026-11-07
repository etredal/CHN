import { playAudioClip } from './audioClip';
import type { AudioClip } from './audioClip';
import { speechService } from './speech';

/**
 * Say a word, preferring its clip from the story recording (natural voice,
 * works wherever the story audio works). Falls back to the browser's speech
 * synthesis, which needs a Chinese voice installed on the device.
 *
 * Resolves once the word has (roughly) finished.
 */
export async function pronounceWord(word: string, clip?: AudioClip, slow = false): Promise<void> {
  if (clip) {
    try {
      await playAudioClip(clip, slow ? 0.6 : 1);
      return;
    } catch (err) {
      console.warn('Word clip failed, falling back to speech synthesis', err);
    }
  }
  await new Promise<void>(resolve => {
    speechService.speak(word, { rate: slow ? 0.65 : 0.85, onEnd: resolve });
    // onEnd never fires if the device has no usable voice.
    setTimeout(resolve, 3000);
  });
}
