import React, { useState, useEffect, useRef, useMemo, useSyncExternalStore } from 'react';
import type { LongStory, WordToken, Sentence } from '../../types';
import { SentenceBlock } from './SentenceBlock';
import { WordLine } from './WordLine';
import { WordDrawer } from './WordDrawer';
import { GrammarTab } from './GrammarTab';
import { QuizTab } from './QuizTab';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { useSettings, usePinyinVisible } from '../../context/SettingsContext';
import {
  ArrowLeft,
  HelpCircle,
  FileText,
  Sparkles,
  Settings2,
  Bookmark,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ChineseText } from '../common/ChineseText';
import { PinyinToggle } from '../common/PinyinToggle';
import { categoryZh } from '../../utils/labels';
import { paginate } from '../../utils/paginate';

// Characters per page: a screen or so on a desktop; phones get long pages so
// reading is still mostly scrolling.
const PAGE_CHARS_WIDE = 900;
const PAGE_CHARS_NARROW = 3000;

const WIDE_QUERY = '(min-width: 640px)';
function useIsWide(): boolean {
  return useSyncExternalStore(
    onChange => {
      const mq = window.matchMedia(WIDE_QUERY);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(WIDE_QUERY).matches,
  );
}

interface ReaderViewProps {
  story: LongStory;
  onBack: () => void;
}

const FONT_SIZE_LABELS = { sm: '小', base: '中', lg: '大', xl: '特大' } as const;

export const ReaderView: React.FC<ReaderViewProps> = ({ story, onBack }) => {
  const { loadStoryAudio, pause, togglePlay, playFrom, isStorySentence, activeSentenceId, isPlaying, seekTo, hasAudioSource } = useAudioPlayer();
  const showPinyin = usePinyinVisible();
  const { settings, setPinyinMode, toggleShowEnglish, setFontSize, setTheme } = useSettings();

  const [activeTab, setActiveTabState] = useState<'text' | 'grammar' | 'quiz' | 'vocab'>('text');
  // Each tab keeps its own scroll position, so going to the quiz and back
  // returns to the same place in the text.
  const tabScroll = useRef<Record<string, number>>({});
  const setActiveTab = (tab: typeof activeTab) => {
    if (tab === activeTab) return;
    tabScroll.current[activeTab] = window.scrollY;
    setActiveTabState(tab);
    requestAnimationFrame(() => window.scrollTo({ top: tabScroll.current[tab] ?? 0, behavior: 'auto' }));
  };
  const [selectedWord, setSelectedWord] = useState<WordToken | null>(null);
  const [selectedSentence, setSelectedSentence] = useState<Sentence | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  // ---- Pages ----
  const isWide = useIsWide();
  const { pages, pageOfSentence } = useMemo(
    () => paginate(story.sections, isWide ? PAGE_CHARS_WIDE : PAGE_CHARS_NARROW),
    [story, isWide],
  );
  const [pageIndex, setPageIndex] = useState(0);
  const page = Math.min(pageIndex, pages.length - 1);
  /** Sentence to bring into view once its page has rendered. */
  const scrollToSentenceRef = useRef<string | null>(null);

  // Keep the reader on the same text when the page size changes (e.g. the
  // window is resized or a phone is rotated).
  const firstSentenceOnPage = useRef<string | null>(null);
  useEffect(() => {
    const id = firstSentenceOnPage.current;
    if (id && pageOfSentence.has(id)) setPageIndex(pageOfSentence.get(id)!);
  }, [pageOfSentence]);
  useEffect(() => {
    firstSentenceOnPage.current = pages[page]?.[0]?.paragraphs[0]?.sentences[0]?.id ?? null;
  }, [pages, page]);

  // Only page 1 has the title above the text, so the top of the window is
  // the top of the page, page counter included.
  const scrollToArticleTop = () => window.scrollTo({ top: 0, behavior: 'auto' });

  const goToPage = (next: number) => {
    if (next < 0 || next >= pages.length || next === page) return;
    setPageIndex(next);
    // While paused, turning the page moves the start point with it, so play
    // reads the page in front of you. While playing, the audio carries on.
    const first = pages[next][0]?.paragraphs[0]?.sentences[0];
    if (!isPlaying && hasAudioSource && first) seekTo(first.startTime);
    // The new page starts at the top, like turning a page.
    requestAnimationFrame(scrollToArticleTop);
  };

  // Follow the audio onto another page: when it moves to a sentence there
  // (playing on, seeking, skipping) or when playback starts with the current
  // sentence on a page other than the one shown.
  useEffect(() => {
    if (!settings.autoScroll || !activeSentenceId) return;
    const target = pageOfSentence.get(activeSentenceId);
    if (target === undefined || target === page) return;
    scrollToSentenceRef.current = activeSentenceId;
    setPageIndex(target);
    // Only react to the audio, not to the reader turning pages themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSentenceId, isPlaying, pageOfSentence, settings.autoScroll]);

  // After a page turned to follow the audio, show the sentence being read.
  useEffect(() => {
    const id = scrollToSentenceRef.current;
    if (!id) return;
    scrollToSentenceRef.current = null;
    document.getElementById(`sentence-${id}`)?.scrollIntoView({ behavior: 'auto', block: 'center' });
  }, [page]);

  // Close the settings popover on a click outside it or Escape.
  useEffect(() => {
    if (!showSettingsMenu) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!settingsMenuRef.current?.contains(e.target as Node)) setShowSettingsMenu(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSettingsMenu(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showSettingsMenu]);

  // Space plays/pauses the story, unless focus is on something that uses it.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || selectedWord) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest('input, textarea, select, [contenteditable="true"]')) return;
      // ← / → turn pages.
      if (activeTab === 'text' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        goToPage(page + (e.key === 'ArrowRight' ? 1 : -1));
        return;
      }
      if (e.code !== 'Space' || e.repeat) return;
      if (el?.closest('button, [role="button"]')) return;
      e.preventDefault();
      togglePlay();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [togglePlay, selectedWord, activeTab, page, pages, isPlaying, hasAudioSource]);

  // Collect all sentences from all sections for audio player
  useEffect(() => {
    const allSentences = story.sections.flatMap(sec =>
      sec.paragraphs.flatMap(p => p.sentences)
    );
    loadStoryAudio(story.audioUrl, allSentences);
  }, [story, loadStoryAudio]);

  const handleWordClick = (token: WordToken, sentenceContext?: Sentence) => {
    // Looking a word up shouldn't talk over it: pause the story and leave the
    // playback position where it is.
    pause();
    setSelectedWord(token);
    setSelectedSentence(sentenceContext || null);
  };

  // The tapped word's place in the story, if it is in the story text (not a
  // title, heading or the vocabulary list).
  const tokenIndex = selectedWord && selectedSentence ? selectedSentence.tokens.indexOf(selectedWord) : -1;
  const playFromHere = selectedSentence && tokenIndex >= 0 && isStorySentence(selectedSentence.id)
    ? () => playFrom(selectedSentence, tokenIndex)
    : undefined;

  const getFontSizeClass = () => {
    // Pinyin under the characters needs taller lines.
    const leading = settings.pinyinMode === 'below' ? 'leading-[2.6]' : 'leading-loose';
    switch (settings.fontSize) {
      case 'sm': return `text-base ${leading}`;
      case 'base': return `text-lg ${leading}`;
      case 'lg': return `text-xl ${leading}`;
      case 'xl': return `text-2xl ${leading}`;
      default: return `text-xl ${leading}`;
    }
  };

  const getFontFamilyClass = () => {
    switch (settings.fontFamily) {
      case 'serif': return 'font-chinese-serif';
      case 'kaiti': return 'font-chinese-kaiti';
      default: return 'font-chinese-sans';
    }
  };

  return (
    <div className="min-h-screen pb-32 transition-colors duration-200">
      {/* Top sticky navigation */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            aria-label="返回文库"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回文库</span>
          </button>

          {/* Center Title */}
          <div className="text-center truncate px-4">
            <h1 className="text-base font-bold text-slate-900 dark:text-white truncate font-chinese-sans">
              {story.title.cn}
            </h1>
            <span className="text-xs text-slate-400 font-sans">{story.level}</span>
          </div>

          {/* Quick Reader Settings Trigger */}
          <div ref={settingsMenuRef} className="relative flex items-center gap-1">
            <PinyinToggle />
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              aria-expanded={showSettingsMenu}
              aria-label="阅读设置"
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Reading Settings"
            >
              <Settings2 className="w-5 h-5" />
            </button>

            {/* Settings Popover Dropdown */}
            {showSettingsMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 text-sm space-y-4 animate-in fade-in zoom-in-95 duration-150">
                {/* Pinyin Mode */}
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">拼音显示</span>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() => setPinyinMode('off')}
                      className={`py-1 text-xs rounded-lg font-medium transition-all ${
                        settings.pinyinMode === 'off' ? 'bg-white dark:bg-slate-700 shadow-xs text-amber-600 dark:text-amber-400' : 'text-slate-500'
                      }`}
                    >
                      隐藏
                    </button>
                    <button
                      onClick={() => setPinyinMode('below')}
                      className={`py-1 text-xs rounded-lg font-medium transition-all ${
                        settings.pinyinMode === 'below' ? 'bg-white dark:bg-slate-700 shadow-xs text-amber-600 dark:text-amber-400' : 'text-slate-500'
                      }`}
                    >
                      显示
                    </button>
                  </div>
                </div>

                {/* English Global Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">全部英文翻译</span>
                  <button
                    onClick={toggleShowEnglish}
                    className={`p-1.5 rounded-lg border flex items-center gap-1 text-xs font-medium ${
                      settings.showEnglish
                        ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {settings.showEnglish ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{settings.showEnglish ? '显示中' : '已隐藏'}</span>
                  </button>
                </div>

                {/* Font Size */}
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">字号大小</span>
                  <div className="flex items-center justify-between gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {(['sm', 'base', 'lg', 'xl'] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => setFontSize(size)}
                        title={size}
                        className={`flex-1 py-1 text-xs rounded-lg font-medium ${
                          settings.fontSize === size ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        {FONT_SIZE_LABELS[size]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Selector */}
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">背景主题</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => setTheme('light')}
                      className={`py-1.5 rounded-xl text-xs font-medium border ${
                        settings.theme === 'light' ? 'border-amber-500 bg-slate-100 font-bold' : 'border-slate-200'
                      }`}
                    >
                      浅色
                    </button>
                    <button
                      onClick={() => setTheme('sepia')}
                      className={`py-1.5 rounded-xl text-xs font-medium border bg-[#fbf0d9] text-[#5f4b32] ${
                        settings.theme === 'sepia' ? 'border-amber-600 font-bold' : 'border-[#eed9b3]'
                      }`}
                    >
                      羊皮纸
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`py-1.5 rounded-xl text-xs font-medium border bg-slate-800 text-slate-100 ${
                        settings.theme === 'dark' ? 'border-amber-400 font-bold' : 'border-slate-700'
                      }`}
                    >
                      夜间
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab switch bar */}
        <div className="max-w-4xl mx-auto px-2 sm:px-4 flex items-center justify-start sm:justify-center gap-1 sm:gap-2 overflow-x-auto border-t border-slate-100 dark:border-slate-800 py-1.5">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
              activeTab === 'text'
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 hidden sm:block" />
            <span>正文</span>
          </button>

          <button
            onClick={() => setActiveTab('grammar')}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
              activeTab === 'grammar'
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 hidden sm:block" />
            <span>语法点 ({story.grammarNotes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
              activeTab === 'quiz'
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 hidden sm:block" />
            <span>随堂测验 ({story.quiz.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('vocab')}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
              activeTab === 'vocab'
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 hidden sm:block" />
            <span>重点生词 ({story.targetVocabulary.length})</span>
          </button>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Every tab stays mounted (hidden when not shown), so quiz answers and
            the place in the text survive a look at another tab. */}
        <div hidden={activeTab !== 'text'}>
        {/* Story header: title, one quiet line of details, summary (first page only) */}
        {page === 0 && (
          <header className="text-center mt-4 mb-12">
            <h1 className={`text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white font-chinese-sans tracking-tight ${showPinyin ? 'leading-[2.2]' : ''}`}>
              <WordLine block={story.title} id="title" onWordClick={handleWordClick} />
            </h1>
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
              <span>{story.level}</span>
              <span aria-hidden>·</span>
              <span title={story.category}>{categoryZh(story.category)}</span>
              <span aria-hidden>·</span>
              <span>{story.stats.characterCount} 字</span>
              <span aria-hidden>·</span>
              <span>约 {story.stats.estimatedReadingTimeMinutes} 分钟</span>
            </p>
            <p className={`mt-6 text-base text-slate-500 dark:text-slate-400 font-chinese-sans max-w-xl mx-auto ${showPinyin ? 'leading-[2.4]' : 'leading-relaxed'}`}>
              <WordLine block={story.summary} id="summary" onWordClick={handleWordClick} />
            </p>
          </header>
        )}

        {/* Tab 1: Story Text View: continuous paragraphs, like a page */}
        <>
          {pages.length > 1 && (
            <Pager page={page} count={pages.length} onGo={goToPage} compact />
          )}
          <article className={`story-text ${getFontSizeClass()} ${getFontFamilyClass()}`}>
            {pages[page].map(({ section, paragraphs, startsSection }) => (
              <section key={section.partNumber} className="mb-12">
                {startsSection ? (
                  <h2 className={`mb-5 text-base font-semibold text-slate-400 dark:text-slate-500 font-chinese-sans ${showPinyin ? 'leading-[2.4]' : ''}`}>
                    <WordLine block={section.partTitle} id={`part-${section.partNumber}`} onWordClick={handleWordClick} />
                  </h2>
                ) : (
                  // A section carried over from the previous page: a quiet reminder of where we are.
                  <p className="mb-5 text-xs text-slate-400 dark:text-slate-500 font-chinese-sans">
                    {section.partTitle.cn}（续）
                  </p>
                )}
                {paragraphs.map(paragraph => (
                  <div key={paragraph.id} className="mb-6">
                    <p className="text-slate-800 dark:text-slate-100">
                      {paragraph.sentences.map(sentence => (
                        <SentenceBlock
                          key={sentence.id}
                          sentence={sentence}
                          onWordClick={handleWordClick}
                        />
                      ))}
                    </p>
                    {/* 全部英文翻译: the paragraph's English underneath */}
                    {settings.showEnglish && (
                      <p lang="en" className="mt-2 text-base leading-relaxed text-slate-500 dark:text-slate-400 font-sans">
                        {paragraph.sentences.map(s => s.en).join(' ')}
                      </p>
                    )}
                  </div>
                ))}
              </section>
            ))}
          </article>
          {pages.length > 1 && (
            <Pager page={page} count={pages.length} onGo={goToPage} />
          )}
        </>
        </div>

        {/* Tab 2: Grammar Notes */}
        <div hidden={activeTab !== 'grammar'}>
          <GrammarTab notes={story.grammarNotes} />
        </div>

        {/* Tab 3: Comprehension Quiz */}
        <div hidden={activeTab !== 'quiz'}>
          <QuizTab quiz={story.quiz} />
        </div>

        {/* Tab 4: Target Vocabulary List */}
        <div hidden={activeTab !== 'vocab'}>
          <div className="space-y-4 max-w-3xl mx-auto py-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans border-b border-slate-200 dark:border-slate-800 pb-3">
              <ChineseText pinyin={false} text={`本课重点考纲词汇 (${story.targetVocabulary.length} 词)`} en={`Key exam vocabulary in this lesson (${story.targetVocabulary.length} words)`} />
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {story.targetVocabulary.map((v, idx) => (
                <div
                  key={idx}
                  onClick={() => handleWordClick({
                    text: v.word,
                    pinyin: v.pinyin,
                    tone: v.tone,
                    definitions: v.definitions,
                    hskLevel: v.hsk,
                  })}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 cursor-pointer transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl font-bold text-slate-900 dark:text-white font-chinese-sans">
                      {v.word}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                      {v.hsk}
                    </span>
                  </div>
                  {showPinyin && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium block mb-2 font-sans">
                      {v.pinyin}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Word Inspector Drawer */}
      <WordDrawer
        token={selectedWord}
        sentenceContext={selectedSentence}
        wordAudio={story.wordAudio}
        onPlayFromHere={playFromHere}
        onClose={() => {
          setSelectedWord(null);
          setSelectedSentence(null);
        }}
      />
    </div>
  );
};

interface PagerProps {
  page: number;
  count: number;
  onGo: (page: number) => void;
  /** A small page count with arrows, for above the text. */
  compact?: boolean;
}

const Pager: React.FC<PagerProps> = ({ page, count, onGo, compact }) => {
  const isFirst = page === 0;
  const isLast = page === count - 1;

  if (compact) {
    return (
      <nav aria-label="分页" className="flex items-center justify-end gap-1 mb-4 text-xs text-slate-400 font-chinese-sans">
        <button onClick={() => onGo(page - 1)} disabled={isFirst} aria-label="上一页" className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span>第 {page + 1} / {count} 页</span>
        <button onClick={() => onGo(page + 1)} disabled={isLast} aria-label="下一页" className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent">
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    );
  }

  const btn = 'flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium border transition-colors disabled:opacity-0 disabled:pointer-events-none';
  return (
    <nav aria-label="分页" className="mt-4 pt-6 border-t border-slate-200 dark:border-slate-800 font-chinese-sans">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => onGo(page - 1)} disabled={isFirst} className={`${btn} border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800`}>
          <ChevronLeft className="w-4 h-4" />
          上一页
        </button>
        <span className="text-xs text-slate-400">第 {page + 1} / {count} 页</span>
        <button onClick={() => onGo(page + 1)} disabled={isLast} className={`${btn} border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40`}>
          下一页
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      {/* Jump straight to a page */}
      {count > 2 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              onClick={() => onGo(i)}
              aria-label={`第 ${i + 1} 页`}
              aria-current={i === page ? 'page' : undefined}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                i === page
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};
