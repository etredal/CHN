// Plays a short slice of a story's recorded audio, e.g. one word.
//
// Uses its own <audio> element, separate from the story player, so playing a
// word never moves the story's playback position or highlighting.

export interface AudioClip {
  url: string;
  start: number; // seconds
  end: number;   // seconds
}

let clipEl: HTMLAudioElement | null = null;
let watchFrame = 0;
let safetyTimer = 0;
let finishCurrent: (() => void) | null = null;

export function stopAudioClip(): void {
  cancelAnimationFrame(watchFrame);
  clearTimeout(safetyTimer);
  clipEl?.pause();
  const finish = finishCurrent;
  finishCurrent = null;
  finish?.();
}

/**
 * Play `clip` at `rate` (pitch preserved). Resolves when the clip has finished
 * or was stopped; rejects if the audio could not be played at all, so callers
 * can fall back to speech synthesis.
 */
export function playAudioClip({ url, start, end }: AudioClip, rate = 1): Promise<void> {
  stopAudioClip();

  if (!clipEl) {
    clipEl = new Audio();
    clipEl.preload = 'auto';
  }
  const el = clipEl;
  const src = new URL(url, document.baseURI).href;
  if (el.src !== src) el.src = src;

  return new Promise<void>((resolve, reject) => {
    finishCurrent = resolve;

    const begin = () => {
      el.defaultPlaybackRate = rate;
      el.playbackRate = rate;
      el.preservesPitch = true;
      el.currentTime = start;
      el.play().then(() => {
        // Stop at the end of the word. Checked every frame because the
        // media 'timeupdate' event is too coarse (~250ms) for single words.
        const watch = () => {
          if (el.paused || el.currentTime >= end) {
            stopAudioClip();
          } else {
            watchFrame = requestAnimationFrame(watch);
          }
        };
        watchFrame = requestAnimationFrame(watch);
        // Backstop in case animation frames are throttled (background tab).
        safetyTimer = window.setTimeout(stopAudioClip, ((end - start) / rate) * 1000 + 500);
      }, err => {
        finishCurrent = null;
        reject(err);
      });
    };

    if (el.readyState >= HTMLMediaElement.HAVE_METADATA) {
      begin();
    } else {
      const onError = () => {
        el.removeEventListener('loadedmetadata', onReady);
        finishCurrent = null;
        reject(new Error(`Could not load ${src}`));
      };
      const onReady = () => {
        el.removeEventListener('error', onError);
        begin();
      };
      el.addEventListener('loadedmetadata', onReady, { once: true });
      el.addEventListener('error', onError, { once: true });
      el.load();
    }
  });
}
