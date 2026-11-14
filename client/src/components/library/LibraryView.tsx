import React, { useState } from 'react';
import type { LongStory } from '../../types';
import { ALL_STORIES } from '../../data';
import { Search, BookOpen, Clock, Headphones, Sparkles, Filter } from 'lucide-react';
import { ChineseText } from '../common/ChineseText';
import { categoryZh } from '../../utils/labels';
import { getSavedTime } from '../../utils/readingProgress';

interface LibraryViewProps {
  onSelectStory: (story: LongStory) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ onSelectStory }) => {
  const [selectedLevel, setSelectedLevel] = useState<'All' | 'HSK 5' | 'HSK 6'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Fiction', 'History', 'Society', 'Philosophy'];

  const query = searchQuery.trim().toLowerCase();
  const filteredStories = ALL_STORIES.filter(story => {
    const matchesLevel = selectedLevel === 'All' || story.level === selectedLevel;
    const matchesCategory = selectedCategory === 'All' || story.category === selectedCategory;
    // Pinyin is matched with and without tone marks and spaces, so
    // "guxiang" finds 故乡 (Gùxiāng).
    const plain = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f\s]/g, '').toLowerCase();
    const matchesSearch = !query ||
      story.title.cn.includes(query) ||
      story.title.pinyin.toLowerCase().includes(query) ||
      plain(story.title.pinyin).includes(plain(query)) ||
      story.title.en.toLowerCase().includes(query) ||
      story.summary.cn.includes(query) ||
      story.summary.en.toLowerCase().includes(query);

    return matchesLevel && matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <ChineseText pinyin={false} text="杜中文进阶阅读平台 • HSK 5 & 6 专区" en="Du Chinese advanced reading platform • HSK 5 & 6" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3 font-chinese-sans">
          <ChineseText pinyin={false} text="沉浸式中文精读文库" en="An immersive library for close reading in Chinese" />
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
          <ChineseText pinyin={false} text="精选长篇故事与思想深度解析，支持拼音标注、点击查看英文翻译、原生自然语音跟读同步与全功能词典速查。" en="Hand-picked long stories with in-depth analysis, with optional pinyin, English a click away, natural audio that follows along, and instant dictionary lookup." />
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
            {(['All', 'HSK 5', 'HSK 6'] as const).map(level => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedLevel === level
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {level === 'All' ? '全部等级' : level}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索故事、拼音或主题..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              title={cat === 'All' ? 'All topics' : cat}
              className={`px-3 py-1 rounded-lg transition-colors shrink-0 font-medium ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'All' ? '全部题材' : categoryZh(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredStories.map(story => {
          // How far into the recording the reader got, if they've started.
          const saved = getSavedTime(story.audioUrl);
          const progress = saved > 0 && story.stats.audioDurationSeconds > 0
            ? Math.min(1, saved / story.stats.audioDurationSeconds)
            : 0;
          return (
          <div
            key={story.id}
            onClick={() => onSelectStory(story)}
            className="group flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400/80 dark:hover:border-amber-500/80 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <div>
              {/* Header tags */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  story.level === 'HSK 6'
                    ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {story.level}
                </span>

                <span className="text-xs text-slate-400 font-medium" title={story.category}>
                  {categoryZh(story.category)}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-chinese-sans group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors mb-1">
                {/* The title opens the story like the rest of the card; its English
                    is a click away on the story page, and the summary reveals its own. */}
                <ChineseText text={story.title.cn} />
              </h2>

              {/* Summary */}
              <p className="text-sm text-slate-600 dark:text-slate-300 font-chinese-sans leading-relaxed mt-2 mb-4">
                <ChineseText text={story.summary.cn} en={story.summary.en} />
              </p>
            </div>

            {/* Footer Stats & Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                  {story.stats.characterCount} 字
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  约 {story.stats.estimatedReadingTimeMinutes} 分钟
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Headphones className="w-3.5 h-3.5" />
                  语音同步
                </span>
              </div>

              <span className="font-semibold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5 whitespace-nowrap">
                {progress > 0 ? '继续阅读 →' : '进入阅读 →'}
              </span>
            </div>
            {progress > 0 && (
              <div
                className="mt-3 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
                role="progressbar"
                aria-label="阅读进度"
                aria-valuenow={Math.round(progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                title={`已听 ${Math.round(progress * 100)}%`}
              >
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.max(2, progress * 100)}%` }} />
              </div>
            )}
          </div>
          );
        })}
      </div>

      {filteredStories.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>未找到符合条件的故事，请尝试更换筛选标签</p>
        </div>
      )}
    </div>
  );
};
