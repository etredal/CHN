export type HskLevel = 'HSK 1' | 'HSK 2' | 'HSK 3' | 'HSK 4' | 'HSK 5' | 'HSK 6' | 'Beyond';

export interface WordCharacter {
  char: string;
  pinyin: string;
  definition: string;
}

export interface WordToken {
  text: string;
  pinyin: string;
  tone: number; // 1 to 5
  startTime?: number; // seconds from start of story audio
  endTime?: number;   // optional end time for the word
  definitions: string[];
  hskLevel?: HskLevel;
  characters?: WordCharacter[];
  isTargetWord?: boolean;
}

export interface Sentence {
  id: string;
  cn: string;
  pinyin: string;
  en: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  tokens: WordToken[];
}

export interface Paragraph {
  id: string;
  sentences: Sentence[];
}

export interface Section {
  partNumber: number;
  partTitle: {
    cn: string;
    en: string;
  };
  paragraphs: Paragraph[];
}

export interface TargetWord {
  word: string;
  pinyin: string;
  tone: number;
  hsk: 'HSK 5' | 'HSK 6';
  definitions: string[];
  exampleSentence: {
    cn: string;
    pinyin: string;
    en: string;
  };
}

export interface GrammarPoint {
  pattern: string;
  explanation: string;
  exampleFromStory: string;
  additionalExamples: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LongStory {
  id: string;
  title: {
    cn: string;
    pinyin: string;
    en: string;
  };
  level: 'HSK 5' | 'HSK 6';
  category: 'Fiction' | 'History' | 'Society' | 'Philosophy';
  stats: {
    characterCount: number;
    audioDurationSeconds: number;
    estimatedReadingTimeMinutes: number;
  };
  audioUrl?: string;
  summary: {
    cn: string;
    en: string;
  };
  sections: Section[];
  targetVocabulary: TargetWord[];
  grammarNotes: GrammarPoint[];
  quiz: QuizQuestion[];
}

export type PinyinMode = 'off' | 'above' | 'on-demand';
export type FontSize = 'sm' | 'base' | 'lg' | 'xl';
export type FontFamily = 'sans' | 'serif' | 'kaiti';
export type AppTheme = 'light' | 'sepia' | 'dark';

export interface ReaderSettings {
  pinyinMode: PinyinMode;
  showEnglish: boolean;
  showToneColors: boolean;
  fontSize: FontSize;
  fontFamily: FontFamily;
  theme: AppTheme;
  autoScroll: boolean;
  playbackSpeed: number;
}

export interface Flashcard {
  id: string;
  word: string;
  pinyin: string;
  tone: number;
  definitions: string[];
  hskLevel?: HskLevel;
  exampleSentence?: {
    cn: string;
    en: string;
  };
  storyTitle?: string;
  savedAt: number;
  srs: {
    interval: number; // days
    repetition: number;
    easeFactor: number;
    nextReviewDate: number; // timestamp ms
  };
}