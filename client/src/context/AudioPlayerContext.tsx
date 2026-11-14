import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import type { Sentence } from '../types';
import { useSettings } from './SettingsContext';
import { speechService } from '../utils/speech';
import { stopAudioClip } from '../utils/audioClip';
import { buildWordTimeline, sentenceIndexAt, wordAt } from '../utils/wordTimeline';
import type { ActiveWord, WordTimeline } from '../utils/wordTimeline';

interface AudioPlayerContextType {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  activeSentenceId: string | null;
  activeSentence: Sentence | null;
  /** The word currently being spoken, for karaoke-style highlighting. */
  activeWord: ActiveWord | null;
  isLoopingSentence: boolean;
  hasAudioSource: boolean;
  /** URL of the loaded story's recording, if it has one. */
  audioUrl: string | null;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seekTo: (timeSeconds: number) => void;
  seekToSentence: (sentence: Sentence) => void;
  nextSentence: () => void;
  prevSentence: () => void;
  toggleLoopSentence: () => void;
  loadStoryAudio: (audioUrl?: string, storySentences?: Sentence[]) => void;
  playSentenceSpeech: (sentence: Sentence) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSentenceId, setActiveSentenceId] = useState<string | null>(null);
  const [isLoopingSentence, setIsLoopingSentence] = useState(false);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [hasAudioSource, setHasAudioSource] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [activeWord, setActiveWord] = useState<ActiveWord | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSentenceRef = useRef<Sentence | null>(null);
  const timelineRef = useRef<WordTimeline>({ words: [], sentenceStarts: [] });
  const activeWordRef = useRef<ActiveWord | null>(null);

  // Update playback speed whenever settings change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = settings.playbackSpeed;
    }
  }, [settings.playbackSpeed]);

  const loadStoryAudio = useCallback((audioUrl?: string, storySentences: Sentence[] = []) => {
    setSentences(storySentences);
    timelineRef.current = buildWordTimeline(storySentences);
    activeWordRef.current = null;
    setActiveWord(null);
    setActiveSentenceId(storySentences.length > 0 ? storySentences[0].id : null);
    currentSentenceRef.current = storySentences.length > 0 ? storySentences[0] : null;

    setHasAudioSource(!!audioUrl);
    setAudioUrl(audioUrl || null);

    speechService.stop();
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioUrl) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
      } else {
        audioRef.current.removeAttribute('src');
      }
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, []);

  // Work out which sentence and word are being spoken at `time`, and only
  // touch React state when either actually changes.
  const syncToTime = useCallback((time: number) => {
    const timeline = timelineRef.current;
    const sIdx = sentenceIndexAt(timeline, time);
    const sentence = sIdx >= 0 ? sentences[sIdx] : null;
    if (sentence && sentence.id !== currentSentenceRef.current?.id) {
      currentSentenceRef.current = sentence;
      setActiveSentenceId(sentence.id);
      if (settings.autoScroll) {
        document.getElementById(`sentence-${sentence.id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    const word = wordAt(timeline, sentences, time);
    const prev = activeWordRef.current;
    if (word?.sentenceId !== prev?.sentenceId || word?.tokenIndex !== prev?.tokenIndex) {
      activeWordRef.current = word;
      setActiveWord(word);
    }
  }, [sentences, settings.autoScroll]);

  // While playing, follow the audio every animation frame. The media
  // 'timeupdate' event only fires ~4 times a second, which makes word
  // highlighting visibly lag and stutter.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;
    let frame = 0;
    const tick = () => {
      const cur = currentSentenceRef.current;
      if (isLoopingSentence && cur && audio.currentTime >= cur.endTime) {
        audio.currentTime = cur.startTime;
      }
      syncToTime(audio.currentTime);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, isLoopingSentence, syncToTime]);

  // Attach audio event listeners when the <audio> element is ready
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Drives the progress bar; word/sentence tracking runs per frame above.
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    // Keep highlighting right after a seek while paused.
    const onSeeked = () => syncToTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setActiveSentenceId(null);
      currentSentenceRef.current = null;
      activeWordRef.current = null;
      setActiveWord(null);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('seeked', onSeeked);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('seeked', onSeeked);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [syncToTime]);

  const pause = useCallback(() => {
    speechService.stop();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    speechService.stop();
    setIsPlaying(false);
  }, []);

  // Seek once the audio can play. Only the latest request is kept, so
  // clicking around before the file has loaded doesn't stack up seeks.
  const pendingSeekRef = useRef<(() => void) | null>(null);
  const whenReady = useCallback((action: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (pendingSeekRef.current) {
      audio.removeEventListener('canplay', pendingSeekRef.current);
      pendingSeekRef.current = null;
    }
    if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      action();
      return;
    }
    const onCanPlay = () => {
      pendingSeekRef.current = null;
      action();
    };
    pendingSeekRef.current = onCanPlay;
    audio.addEventListener('canplay', onCanPlay, { once: true });
  }, []);

  // Point the looped/active sentence at whatever is playing at `time`, so a
  // manual seek isn't immediately undone by the sentence loop.
  const followSentenceAt = useCallback((time: number) => {
    const sIdx = sentenceIndexAt(timelineRef.current, time);
    const sentence = sIdx >= 0 ? sentences[sIdx] : null;
    if (sentence && sentence.id !== currentSentenceRef.current?.id) {
      currentSentenceRef.current = sentence;
      setActiveSentenceId(sentence.id);
    }
  }, [sentences]);

  const seekTo = useCallback((timeSeconds: number) => {
    if (!audioRef.current || !hasAudioSource) return;
    followSentenceAt(timeSeconds);
    setCurrentTime(timeSeconds);
    whenReady(() => {
      audioRef.current!.currentTime = timeSeconds;
    });
  }, [hasAudioSource, followSentenceAt, whenReady]);

  const playSentenceSpeech = useCallback((sentence: Sentence) => {
    setActiveSentenceId(sentence.id);
    currentSentenceRef.current = sentence;
    setIsPlaying(true);
    speechService.speak(sentence.cn, {
      rate: settings.playbackSpeed,
      onEnd: () => {
        setIsPlaying(false);
      },
    });
  }, [settings.playbackSpeed]);

  const play = useCallback(() => {
    if (audioRef.current && hasAudioSource) {
      stopAudioClip();
      audioRef.current.play().catch(e => console.warn('Audio play prevented', e));
    } else if (currentSentenceRef.current) {
      // No recording: read the current sentence with the device's voice.
      playSentenceSpeech(currentSentenceRef.current);
    }
  }, [hasAudioSource, playSentenceSpeech]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seekToSentence = useCallback((sentence: Sentence) => {
    setActiveSentenceId(sentence.id);
    currentSentenceRef.current = sentence;
    if (audioRef.current && hasAudioSource) {
      stopAudioClip();
      setCurrentTime(sentence.startTime);
      whenReady(() => {
        audioRef.current!.currentTime = sentence.startTime;
        audioRef.current!.play().catch(console.warn);
      });
    } else {
      // Fallback to on-device Web Speech API for this sentence
      playSentenceSpeech(sentence);
    }
  }, [hasAudioSource, whenReady, playSentenceSpeech]);

  const nextSentence = useCallback(() => {
    if (!sentences.length) return;
    const currentIndex = sentences.findIndex(s => s.id === activeSentenceId);
    if (currentIndex >= 0 && currentIndex < sentences.length - 1) {
      seekToSentence(sentences[currentIndex + 1]);
    }
  }, [sentences, activeSentenceId, seekToSentence]);

  const prevSentence = useCallback(() => {
    if (!sentences.length) return;
    const currentIndex = sentences.findIndex(s => s.id === activeSentenceId);
    if (currentIndex > 0) {
      seekToSentence(sentences[currentIndex - 1]);
    }
  }, [sentences, activeSentenceId, seekToSentence]);

  const toggleLoopSentence = useCallback(() => {
    setIsLoopingSentence(prev => !prev);
  }, []);

  const activeSentence = sentences.find(s => s.id === activeSentenceId) || null;

  return (
    <AudioPlayerContext.Provider
      value={{
        isPlaying,
        currentTime,
        duration,
        activeSentenceId,
        activeSentence,
        activeWord,
        isLoopingSentence,
        hasAudioSource,
        audioUrl,
        play,
        pause,
        togglePlay,
        seekTo,
        seekToSentence,
        nextSentence,
        prevSentence,
        toggleLoopSentence,
        loadStoryAudio,
        playSentenceSpeech,
      }}
    >
      {/* Hidden audio element used by the player */}
      <audio ref={audioRef} style={{ display: 'none' }} data-testid="audio-player" />
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = (): AudioPlayerContextType => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};