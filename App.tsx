import React, { useState, useMemo } from 'react';
import { PromptCard } from './components/PromptCard';
import { PromptForm } from './components/PromptForm';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Header } from './components/Layout/Header';
import { useAuth } from './hooks/useAuth';
import { usePromptData } from './hooks/usePromptData';
import { usePromptActions } from './hooks/usePromptActions';
import { Prompt } from './types';
import {
  Loader2,
  AlertCircle,
  Globe,
  LayoutGrid
} from 'lucide-react';

const App: React.FC = () => {
  // 1. Auth Hook
  const { session, handleGoogleLogin, handleLogout } = useAuth();

  // 2. Data Hook (Linked to Session)
  const {
    folders,
    setFolders,
    prompts,
    setPrompts,
    communityFolders,
    isLoading,
    error,
  } = usePromptData(session);

  // 3. UI State
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [viewContext, setViewContext] = useState<'personal' | 'community'>('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modal State
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isNewFolderMode, setIsNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // 4. Actions Hook
  const {
    handleCreateFolder,
    handleDeleteFolder,
    handleSavePrompt,
    handleDeletePrompt
  } = usePromptActions({
    session,
    folders,
    setFolders,
    prompts,
    setPrompts,
    activeFolderId,
    setActiveFolderId
  });

  // Derived UI computations
  const filteredPrompts = useMemo(() => {
    let filtered = prompts;

    if (viewContext === 'community') {
      filtered = filtered.filter(p => p.isPublic);
    }

    if (activeFolderId !== 'all') {
      if (activeFolderId === 'public_community') {
        filtered = filtered.filter(p => p.isPublic);
      } else if (activeFolderId === 'my_prompts') {
        filtered = filtered.filter(p => p.userId === session?.user.id);
      } else {
        filtered = filtered.filter(p => p.folderId === activeFolderId);
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [prompts, activeFolderId, searchQuery, session]);

  const activeFolderName = useMemo(() => {
    if (activeFolderId === 'all') return 'Tüm Promptlar';
    if (activeFolderId === 'public_community') return 'Keşfet (Topluluk)';
    if (activeFolderId === 'my_prompts') return 'Promptlarım';

    // Check user folders
    const userFolder = folders.find(f => f.id === activeFolderId);
    if (userFolder) return userFolder.name;

    // Check community folders
    const commFolder = communityFolders.find(f => f.id === activeFolderId);
    if (commFolder) return commFolder.name;

    return 'Genel';
  }, [activeFolderId, folders, communityFolders]);

  const openCreateModal = () => {
    if (!session) {
      handleGoogleLogin();
      return;
    }
    setEditingPrompt(null);
    setIsPromptModalOpen(true);
  };

  const openEditModal = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setIsPromptModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        session={session}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeFolderId={activeFolderId}
        setActiveFolderId={setActiveFolderId}
        folders={folders}
        communityFolders={communityFolders}
        prompts={prompts}
        handleLogout={handleLogout}
        handleGoogleLogin={handleGoogleLogin}
        handleDeleteFolder={handleDeleteFolder}
        isNewFolderMode={isNewFolderMode}
        setIsNewFolderMode={setIsNewFolderMode}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        handleCreateFolder={(e) => {
          handleCreateFolder(e, newFolderName, () => {
            setNewFolderName('');
            setIsNewFolderMode(false);
          });
        }}
        openCreateModal={openCreateModal}
        isLoading={isLoading}
        setViewContext={setViewContext}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          session={session}
          setIsSidebarOpen={setIsSidebarOpen}
          activeFolderName={activeFolderName}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleGoogleLogin={handleGoogleLogin}
        />

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Loader2 size={48} className="animate-spin mb-4 text-indigo-500" />
              <p>Veriler yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-red-500">
              <AlertCircle size={48} className="mb-4" />
              <p className="text-center max-w-md">{error}</p>
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                {activeFolderId === 'public_community' ? (
                  <Globe size={48} className="text-slate-300" />
                ) : (
                  <LayoutGrid size={48} className="text-slate-300" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {activeFolderId === 'public_community' ? 'Keşfedilecek Prompt Yok' : activeFolderId === 'my_prompts' ? 'Henüz hiç prompt oluşturmadınız' : 'Henüz prompt yok'}
              </h3>
              <p className="text-slate-500 max-w-sm mb-8">
                {searchQuery
                  ? 'Aradığınız kriterlere uygun sonuç bulunamadı.'
                  : session
                    ? 'Yeni bir prompt ekleyerek başlayın veya topluluk promptlarına göz atın.'
                    : 'Prompt oluşturmak için giriş yapın veya topluluk promptlarını inceleyin.'}
              </p>
              {session && !searchQuery && activeFolderId !== 'public_community' && (
                <button
                  onClick={openCreateModal}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
                  disabled={folders.length === 0}
                >
                  {folders.length === 0 ? 'İlk Promptu Ekle (Klasör Otomatik Oluşur)' : 'Yeni Prompt Ekle'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPrompts.map(prompt => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  folderName={prompt.folders?.name || folders.find(f => f.id === prompt.folderId)?.name || 'Genel'}
                  currentUserId={session?.user.id}
                  onEdit={openEditModal}
                  onDelete={handleDeletePrompt}
                />
              ))}
            </div>
          )}
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

export default App;
