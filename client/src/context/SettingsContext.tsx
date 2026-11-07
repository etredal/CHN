import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReaderSettings, PinyinMode, FontSize, FontFamily, AppTheme } from '../types';

interface SettingsContextType {
  settings: ReaderSettings;
  setPinyinMode: (mode: PinyinMode) => void;
  toggleShowEnglish: () => void;
  setShowEnglish: (val: boolean) => void;
  toggleToneColors: () => void;
  setFontSize: (size: FontSize) => void;
  setFontFamily: (font: FontFamily) => void;
  setTheme: (theme: AppTheme) => void;
  setAutoScroll: (auto: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  pinyinMode: 'off',
  showEnglish: false,
  showToneColors: true,
  fontSize: 'lg',
  fontFamily: 'sans',
  theme: 'light',
  autoScroll: true,
  playbackSpeed: 1.0,
};

const STORAGE_KEY = 'duchinese_reader_settings';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return DEFAULT_SETTINGS;
      const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      // Pinyin used to be shown above the characters; it now goes below.
      if (parsed.pinyinMode === 'above') parsed.pinyinMode = 'below';
      return parsed;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }

    // Apply theme classes to root HTML element
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-sepia', 'theme-light', 'dark');
    if (settings.theme === 'dark') {
      root.classList.add('dark', 'theme-dark');
    } else if (settings.theme === 'sepia') {
      root.classList.add('theme-sepia');
    } else {
      root.classList.add('theme-light');
    }
  }, [settings]);

  const setPinyinMode = (pinyinMode: PinyinMode) => setSettings(s => ({ ...s, pinyinMode }));
  const toggleShowEnglish = () => setSettings(s => ({ ...s, showEnglish: !s.showEnglish }));
  const setShowEnglish = (showEnglish: boolean) => setSettings(s => ({ ...s, showEnglish }));
  const toggleToneColors = () => setSettings(s => ({ ...s, showToneColors: !s.showToneColors }));
  const setFontSize = (fontSize: FontSize) => setSettings(s => ({ ...s, fontSize }));
  const setFontFamily = (fontFamily: FontFamily) => setSettings(s => ({ ...s, fontFamily }));
  const setTheme = (theme: AppTheme) => setSettings(s => ({ ...s, theme }));
  const setAutoScroll = (autoScroll: boolean) => setSettings(s => ({ ...s, autoScroll }));
  const setPlaybackSpeed = (playbackSpeed: number) => setSettings(s => ({ ...s, playbackSpeed }));

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setPinyinMode,
        toggleShowEnglish,
        setShowEnglish,
        toggleToneColors,
        setFontSize,
        setFontFamily,
        setTheme,
        setAutoScroll,
        setPlaybackSpeed,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};