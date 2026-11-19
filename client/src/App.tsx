import React, { useRef, useState } from 'react';
import { SettingsProvider } from './context/SettingsContext';
import { AudioPlayerProvider, useAudioPlayer } from './context/AudioPlayerContext';
import { Header } from './components/layout/Header';
import { BottomAudioBar } from './components/layout/BottomAudioBar';
import { LibraryView } from './components/library/LibraryView';
import { ReaderView } from './components/reader/ReaderView';
import { ImporterView } from './components/importer/ImporterView';
import { VocabListView } from './components/flashcards/VocabListView';
import { FlashcardDeck } from './components/flashcards/FlashcardDeck';
import { UpdateToast } from './components/common/UpdateToast';
import type { LongStory, Flashcard, StorySummary } from './types';
import { loadStory } from './data';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'library' | 'vocab' | 'importer'>('library');
  const [selectedStory, setSelectedStory] = useState<LongStory | null>(null);
  const [reviewDeck, setReviewDeck] = useState<Flashcard[] | null>(null);

  const { activeSentenceId } = useAudioPlayer();

  // Each story's full text is its own chunk, fetched when it is opened
  // (and cached by the service worker for offline use).
  const [openingId, setOpeningId] = useState<string | null>(null);
  const latestRequest = useRef<string | null>(null);

  const handleSelectStory = (summary: StorySummary) => {
    latestRequest.current = summary.id;
    setOpeningId(summary.id);
    loadStory(summary.id)
      .then(story => {
        if (latestRequest.current === summary.id) setSelectedStory(story);
      })
      .catch(err => {
        console.error(err);
        if (latestRequest.current === summary.id) {
          window.alert('故事加载失败，请检查网络后重试。\nThe story could not be loaded. Check your connection and try again.');
        }
      })
      .finally(() => {
        if (latestRequest.current === summary.id) {
          latestRequest.current = null;
          setOpeningId(null);
        }
      });
  };

  const handleBackToLibrary = () => {
    setSelectedStory(null);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
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

          <main className={`flex-1 ${activeSentenceId ? 'pb-[calc(10.5rem+env(safe-area-inset-bottom))] sm:pb-28' : 'pb-[calc(3.5rem+env(safe-area-inset-bottom))] sm:pb-0'}`}>
            {activeTab === 'library' && (
              <LibraryView onSelectStory={handleSelectStory} openingId={openingId} />
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
          {activeSentenceId && <BottomAudioBar aboveTabBar />}
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
        <UpdateToast />
      </AudioPlayerProvider>
    </SettingsProvider>
  );
}
