import React from 'react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { useSettings } from '../../context/SettingsContext';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Gauge
} from 'lucide-react';
import { ChineseText } from '../common/ChineseText';

/** `aboveTabBar`: sit above the phone bottom tab bar instead of at the screen edge. */
export const BottomAudioBar: React.FC<{ aboveTabBar?: boolean }> = ({ aboveTabBar = false }) => {
  const {
    isPlaying,
    currentTime,
    duration,
    activeSentence,
    isLoopingSentence,
    togglePlay,
    seekTo,
    nextSentence,
    prevSentence,
    toggleLoopSentence,
  } = useAudioPlayer();

  const { settings, setPlaybackSpeed } = useSettings();

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const speeds = [0.75, 0.85, 1.0, 1.25];

  const cycleSpeed = () => {
    const currentIndex = speeds.indexOf(settings.playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  return (
    <div className={`fixed inset-x-0 z-40 ${aboveTabBar ? 'bottom-[calc(3.5rem+env(safe-area-inset-bottom))] sm:bottom-0' : 'bottom-0 pb-[env(safe-area-inset-bottom)]'} bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl transition-colors`}>
      {/* Progress Bar */}
      <div className="relative w-full h-1.5 bg-slate-100 dark:bg-slate-800 cursor-pointer group">
        <div
          className="absolute top-0 left-0 h-full bg-amber-500 rounded-r-full transition-all"
          style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
        />
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => seekTo(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Active sentence preview */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            {isLoopingSentence && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                单句循环
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate font-chinese-sans mt-0.5">
            {activeSentence ? <ChineseText text={activeSentence.cn} en={activeSentence.en} /> : '点击播放收听自然原声中文朗读'}
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Loop sentence toggle */}
          <button
            onClick={toggleLoopSentence}
            className={`p-2 rounded-xl transition-colors ${
              isLoopingSentence
                ? 'text-amber-600 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title="Loop Current Sentence"
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Previous sentence */}
          <button
            onClick={prevSentence}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Previous Sentence"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Main Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          {/* Next sentence */}
          <button
            onClick={nextSentence}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Next Sentence"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Speed Selector */}
          <button
            onClick={cycleSpeed}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors"
            title="Adjust Speed"
          >
            <Gauge className="w-3.5 h-3.5 text-amber-500" />
            <span>{settings.playbackSpeed}x</span>
          </button>
        </div>
      </div>
    </div>
  );
};
