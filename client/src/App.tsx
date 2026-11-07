import React, { useState } from 'react';
import { SettingsProvider } from './context/SettingsContext';
import { AudioPlayerProvider, useAudioPlayer } from './context/AudioPlayerContext';
import { Header } from './components/layout/Header';
import { BottomAudioBar } from './components/layout/BottomAudioBar';
import { LibraryView } from './components/library/LibraryView';
import { ReaderView } from './components/reader/ReaderView';
import { ImporterView } from './components/importer/ImporterView';
import { VocabListView } from './components/flashcards/VocabListView';
import { FlashcardDeck } from './components/flashcards/FlashcardDeck';
import type { LongStory, Flashcard } from './types';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'library' | 'vocab' | 'importer'>('library');
  const [selectedStory, setSelectedStory] = useState<LongStory | null>(null);
  const [reviewDeck, setReviewDeck] = useState<Flashcard[] | null>(null);

  const { activeSentenceId } = useAudioPlayer();

  const handleSelectStory = (story: LongStory) => {
    setSelectedStory(story);
  };

  const handleBackToLibrary = () => {
    setSelectedStory(null);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {selectedStory ? (
        <>
          <ReaderView
            story={selectedStory}
            onBack={handleBackToLibrary}
          />
          <BottomAudioBar />
        </>
      ) : reviewDeck ? (
        <FlashcardDeck
          cards={reviewDeck}
          onBack={() => setReviewDeck(null)}
          onFinishReview={() => setReviewDeck(null)}
        />
      ) : (
        <>
          <Header
            currentTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              setReviewDeck(null);
            }}
          />

          <main className={`flex-1 ${activeSentenceId ? 'pb-28' : ''}`}>
            {activeTab === 'library' && (
              <LibraryView onSelectStory={handleSelectStory} />
            )}

            {activeTab === 'vocab' && (
              <VocabListView
                onStartReview={(cards) => setReviewDeck(cards)}
              />
            )}

            {activeTab === 'importer' && (
              <ImporterView />
            )}
          </main>

          {/* Show audio bar if any audio was previously active */}
          {activeSentenceId && <BottomAudioBar />}
        </>
      )}
    </div>
  );
};

export default function App() {
  return (
    <SettingsProvider>
      <AudioPlayerProvider>
        <MainApp />
      </AudioPlayerProvider>
    </SettingsProvider>
  );
}
