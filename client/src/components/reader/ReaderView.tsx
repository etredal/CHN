import React, { useState, useEffect } from 'react';
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
  EyeOff
} from 'lucide-react';
import { ChineseText } from '../common/ChineseText';
import { PinyinToggle } from '../common/PinyinToggle';
import { categoryZh } from '../../utils/labels';

interface ReaderViewProps {
  story: LongStory;
  onBack: () => void;
}

const FONT_SIZE_LABELS = { sm: '小', base: '中', lg: '大', xl: '特大' } as const;

export const ReaderView: React.FC<ReaderViewProps> = ({ story, onBack }) => {
  const { loadStoryAudio, pause } = useAudioPlayer();
  const showPinyin = usePinyinVisible();
  const { settings, setPinyinMode, toggleShowEnglish, setFontSize, setTheme } = useSettings();

  const [activeTab, setActiveTab] = useState<'text' | 'grammar' | 'quiz' | 'vocab'>('text');
  const [selectedWord, setSelectedWord] = useState<WordToken | null>(null);
  const [selectedSentence, setSelectedSentence] = useState<Sentence | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

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
          <div className="relative flex items-center gap-1">
            <PinyinToggle />
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
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
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-2 border-t border-slate-100 dark:border-slate-800 py-1.5">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'text'
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>正文</span>
          </button>

          <button
            onClick={() => setActiveTab('grammar')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'grammar'
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>语法点 ({story.grammarNotes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'quiz'
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>随堂测验 ({story.quiz.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('vocab')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'vocab'
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>重点生词 ({story.targetVocabulary.length})</span>
          </button>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Story header: title, one quiet line of details, summary */}
        {activeTab === 'text' && (
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
        {activeTab === 'text' && (
          <article className={`story-text ${getFontSizeClass()} ${getFontFamilyClass()}`}>
            {story.sections.map(section => (
              <section key={section.partNumber} className="mb-12">
                <h2 className={`mb-5 text-base font-semibold text-slate-400 dark:text-slate-500 font-chinese-sans ${showPinyin ? 'leading-[2.4]' : ''}`}>
                  <WordLine block={section.partTitle} id={`part-${section.partNumber}`} onWordClick={handleWordClick} />
                </h2>
                {section.paragraphs.map(paragraph => (
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
        )}

        {/* Tab 2: Grammar Notes */}
        {activeTab === 'grammar' && (
          <GrammarTab notes={story.grammarNotes} />
        )}

        {/* Tab 3: Comprehension Quiz */}
        {activeTab === 'quiz' && (
          <QuizTab quiz={story.quiz} />
        )}

        {/* Tab 4: Target Vocabulary List */}
        {activeTab === 'vocab' && (
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
        )}
      </main>

      {/* Word Inspector Drawer */}
      <WordDrawer
        token={selectedWord}
        sentenceContext={selectedSentence}
        wordAudio={story.wordAudio}
        onClose={() => {
          setSelectedWord(null);
          setSelectedSentence(null);
        }}
      />
    </div>
  );
};
