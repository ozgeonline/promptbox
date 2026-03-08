import React from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Header } from './components/Layout/Header';
import { MobileOverlay } from './components/Layout/MobileOverlay';
import { PromptList, PromptForm } from './components/Prompt';
import { CommentsModal } from './components/Prompt/CommentsModal';
import { ProfileModal } from './components/Profile/ProfileModal';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { useAdminData } from './hooks/useAdminData';
import {
  AuthProvider,
  DataProvider,
  UIProvider,
  useUIContext,
  useDataContext,
  useAuthContext
} from '@/context';

const AppContent: React.FC = () => {

  const { session } = useAuthContext(); // Auth state
  const adminData = useAdminData(); // Hoisted here to cache state while logged in
  const { folders } = useDataContext(); // Needed for folders prop
  const {
    currentView,
    isPromptModalOpen,
    setIsPromptModalOpen,
    isProfileModalOpen,
    setIsProfileModalOpen,
    isCommentsModalOpen,
    setIsCommentsModalOpen,
    selectedPromptForComments,
    editingPrompt,
    savePromptAndNavigate // Logic wrapper
  } = useUIContext();

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <MobileOverlay />

      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header />

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {currentView === 'admin'
            ? <AdminDashboard adminData={adminData} />
            : <PromptList />
          }
        </div>
      </main>

      {session && (
        <>
          <PromptForm
            isOpen={isPromptModalOpen}
            onClose={() => setIsPromptModalOpen(false)}
            onSave={savePromptAndNavigate}
            folders={folders}
            initialData={editingPrompt}
          />
          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
          />
          <CommentsModal
            isOpen={isCommentsModalOpen}
            onClose={() => setIsCommentsModalOpen(false)}
            prompt={selectedPromptForComments}
          />
        </>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <UIProvider>
          <AppContent />
        </UIProvider>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
