// Where the reader got to in each story's recording, so reopening a story
// resumes there. Keyed by the recording's URL. Browser storage can be
// unavailable (private mode), in which case nothing is remembered.

const STORAGE_KEY = 'chn_reading_progress_v1';

type Progress = Record<string, { time: number; updatedAt: number }>;

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

export function saveTime(audioUrl: string, time: number): void {
  const all = readAll();
  if (time < 1) delete all[audioUrl];
  else all[audioUrl] = { time: Math.round(time * 10) / 10, updatedAt: Date.now() };
  writeAll(all);
}

/** Forget the position, e.g. once the story has been listened to the end. */
export function clearTime(audioUrl: string): void {
  saveTime(audioUrl, 0);
}
