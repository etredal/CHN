import React from 'react';
import { useSettings } from '../../context/SettingsContext';

/** One-tap switch for pinyin over all Chinese text in the app. */
export const PinyinToggle: React.FC = () => {
  const { settings, setPinyinMode } = useSettings();
  const on = settings.pinyinMode === 'above';
  return (
    <button
      onClick={() => setPinyinMode(on ? 'off' : 'above')}
      aria-pressed={on}
      title={on ? 'Hide pinyin' : 'Show pinyin'}
      className={`h-9 min-w-9 px-2 rounded-xl text-xs font-bold font-chinese-sans border transition-colors flex items-center justify-center gap-1 ${
        on
          ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700'
          : 'text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <span className="text-sm leading-none">拼</span>
      <span className="hidden sm:inline text-[10px] font-medium leading-none">pīn</span>
    </button>
  );
};
