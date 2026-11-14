import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { BookOpen, Bookmark, FileText, Moon, Sun, Coffee } from 'lucide-react';
import { PinyinToggle } from '../common/PinyinToggle';

interface HeaderProps {
  currentTab: 'library' | 'vocab' | 'importer';
  onSelectTab: (tab: 'library' | 'vocab' | 'importer') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab }) => {
  const { settings, setTheme } = useSettings();

  const cycleTheme = () => {
    if (settings.theme === 'light') setTheme('sepia');
    else if (settings.theme === 'sepia') setTheme('dark');
    else setTheme('light');
  };

  const renderThemeIcon = () => {
    if (settings.theme === 'dark') return <Moon className="w-4 h-4 text-amber-400" />;
    if (settings.theme === 'sepia') return <Coffee className="w-4 h-4 text-amber-700" />;
    return <Sun className="w-4 h-4 text-amber-500" />;
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Brand */}
        <div
          onClick={() => onSelectTab('library')}
          className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0 max-[359px]:hidden"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-amber-500/30 group-hover:scale-105 transition-transform">
            杜
          </div>
          <div className="hidden md:block whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base text-slate-900 dark:text-white font-chinese-sans tracking-tight">
                杜中文
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                HSK 5/6
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-chinese-sans -mt-0.5">进阶中文分级阅读</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-2xl min-w-0 overflow-x-auto">
          <button
            onClick={() => onSelectTab('library')}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              currentTab === 'library'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 hidden sm:block" />
            <span>精选文库</span>
          </button>

          <button
            onClick={() => onSelectTab('vocab')}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              currentTab === 'vocab'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 hidden sm:block" />
            <span>生词本</span>
          </button>

          <button
            onClick={() => onSelectTab('importer')}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              currentTab === 'importer'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 hidden sm:block" />
            <span>文章导入</span>
          </button>
        </nav>

        {/* Quick Theme Switcher */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <PinyinToggle />
          <button
            onClick={cycleTheme}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Current Theme: ${settings.theme} (click to cycle)`}
          >
            {renderThemeIcon()}
          </button>
        </div>
      </div>
    </header>
  );
};
