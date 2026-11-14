// Where the reader got to in each story's recording, so reopening a story
// resumes there. Keyed by the recording's URL. Browser storage can be
// unavailable (private mode), in which case nothing is remembered.

const STORAGE_KEY = 'chn_reading_progress_v1';

type Progress = Record<string, { time: number; duration?: number; updatedAt: number }>;

function readAll(): Progress {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Progress;
  } catch {
    return {};
  }
}

function writeAll(progress: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage full or blocked: progress just isn't kept.
  }
}

/** Seconds into the recording where the reader left off (0 if none). */
export function getSavedTime(audioUrl?: string): number {
  if (!audioUrl) return 0;
  return readAll()[audioUrl]?.time ?? 0;
}

/** Fraction of the recording heard (0 if not started), from the measured length when known. */
export function getProgress(audioUrl: string | undefined, fallbackDuration: number): number {
  if (!audioUrl) return 0;
  const saved = readAll()[audioUrl];
  const duration = saved?.duration || fallbackDuration;
  if (!saved || !(duration > 0)) return 0;
  return Math.min(1, saved.time / duration);
}

export function saveTime(audioUrl: string, time: number, duration?: number): void {
  const all = readAll();
  if (time < 1) delete all[audioUrl];
  else all[audioUrl] = {
    time: Math.round(time * 10) / 10,
    ...(duration && Number.isFinite(duration) ? { duration: Math.round(duration) } : {}),
    updatedAt: Date.now(),
  };
  writeAll(all);
}

/** Forget the position, e.g. once the story has been listened to the end. */
export function clearTime(audioUrl: string): void {
  saveTime(audioUrl, 0);
}
