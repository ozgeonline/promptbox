import React from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Header } from './components/Layout/Header';
import { MobileOverlay } from './components/Layout/MobileOverlay';
import { PromptList, PromptForm } from './components/Prompt';
import { PromptProvider, usePromptContext } from './context/PromptContext';

const AppContent: React.FC = () => {
  const {
    session,
    folders,
    isPromptModalOpen,
    setIsPromptModalOpen,
    handleSavePrompt,
    editingPrompt,
  } = usePromptContext();

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <MobileOverlay />

      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header />

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <PromptList />
        </div>
      </main>

      {session && (
        <PromptForm
          isOpen={isPromptModalOpen}
          onClose={() => setIsPromptModalOpen(false)}
          onSave={handleSavePrompt}
          folders={folders}
          initialData={editingPrompt}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <PromptProvider>
      <AppContent />
    </PromptProvider>
  );
};

export default App;
