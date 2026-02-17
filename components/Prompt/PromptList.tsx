import React from 'react';
import { Loader2, AlertCircle, Globe, LayoutGrid } from 'lucide-react';
import { useAuthContext, useDataContext, useUIContext } from '@/context';
import { PromptCard } from './PromptCard';

export const PromptList: React.FC = () => {
  const { session } = useAuthContext();

  const {
    isLoading,
    error,
    folders,
    handleDeletePrompt
  } = useDataContext();

  const {
    filteredPrompts,
    activeFolderId,
    searchQuery,
    openCreateModal,
    openEditModal
  } = useUIContext();

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <Loader2 size={48} className="animate-spin mb-4 text-indigo-500" />
        <p>Veriler yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-500">
        <AlertCircle size={48} className="mb-4" />
        <p className="text-center max-w-md">{error}</p>
      </div>
    );
  }

  if (filteredPrompts.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          {activeFolderId === 'public_community' ? (
            <Globe size={48} className="text-slate-300" />
          ) : (
            <LayoutGrid size={48} className="text-slate-300" />
          )}
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">
          {activeFolderId === 'public_community'
            ? 'Keşfedilecek Prompt Yok'
            : activeFolderId === 'my_prompts'
              ? 'Henüz hiç prompt oluşturmadınız'
              : 'Henüz prompt yok'}
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
            {folders.length === 0
              ? 'İlk Promptu Ekle (Klasör Otomatik Oluşur)'
              : 'Yeni Prompt Ekle'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredPrompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          folderName={
            prompt.folders?.name ||
            folders.find((f) => f.id === prompt.folderId)?.name ||
            'Genel'
          }
          currentUserId={session?.user.id}
          onEdit={openEditModal}
          onDelete={handleDeletePrompt}
        />
      ))}
    </div>
  );
};
