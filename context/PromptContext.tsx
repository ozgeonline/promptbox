import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { useAuth } from '../hooks/useAuth';
import { usePromptData } from '../hooks/usePromptData';
import { usePromptActions } from '../hooks/usePromptActions';
import { Prompt, Folder } from '../types';

interface PromptContextType {
  // Auth
  session: Session | null;

  // Data
  folders: Folder[];
  communityFolders: Folder[];
  prompts: Prompt[];
  filteredPrompts: Prompt[];
  isLoading: boolean;
  error: string | null;

  // Global UI State
  activeFolderId: string;
  setActiveFolderId: (id: string) => void;
  viewContext: 'personal' | 'community';
  setViewContext: (ctx: 'personal' | 'community') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  activeFolderName: string;

  // Modals
  isPromptModalOpen: boolean;
  setIsPromptModalOpen: (isOpen: boolean) => void;
  editingPrompt: Prompt | null;
  setEditingPrompt: (prompt: Prompt | null) => void;
  openCreateModal: () => void;
  openEditModal: (prompt: Prompt) => void;

  // Actions
  handleCreateFolder: (e: React.FormEvent, name: string, onSuccess: () => void) => void;
  handleDeleteFolder: (id: string, e: React.MouseEvent) => void;
  handleSavePrompt: (promptData: any) => Promise<void>;
  handleDeletePrompt: (id: string) => Promise<void>;
  handleLogout: () => void;
  handleGoogleLogin: () => void;
}

const PromptContext = createContext<PromptContextType | undefined>(undefined);

export const PromptProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Auth
  const { session, handleGoogleLogin, handleLogout } = useAuth();

  // Data
  const {
    folders,
    setFolders,
    prompts,
    setPrompts,
    communityFolders,
    isLoading,
    error,
  } = usePromptData(session);

  // UI State
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [viewContext, setViewContext] = useState<'personal' | 'community'>('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Derived UI State
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

  // Modal State
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // Actions
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
    setActiveFolderId,
    setViewContext
  });

  // Helpers
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

  // Filter Logic (Moved from App.tsx)
  const filteredPrompts = useMemo(() => {
    let filtered = prompts;

    if (viewContext === 'community') {
      filtered = filtered.filter(p => p.isPublic);
    }

    if (activeFolderId !== 'all') {
      if (activeFolderId === 'public_community') {
        filtered = filtered.filter(p => p.isPublic);
      } else if (activeFolderId === 'my_prompts') {
        filtered = filtered.filter(p => p.userId === session?.user?.id);
      } else {
        const isCommunityView = viewContext === 'community';
        if (isCommunityView) {
          filtered = filtered.filter(p => p.folders?.name === activeFolderId);
        } else {
          filtered = filtered.filter(p => p.folderId === activeFolderId);
        }
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
  }, [prompts, activeFolderId, searchQuery, session, viewContext]);

  const value = {
    session,
    folders,
    communityFolders,
    prompts,
    filteredPrompts,
    isLoading,
    error,
    activeFolderId,
    setActiveFolderId,
    activeFolderName,
    viewContext,
    setViewContext,
    searchQuery,
    setSearchQuery,
    isSidebarOpen,
    setIsSidebarOpen,
    isPromptModalOpen,
    setIsPromptModalOpen,
    editingPrompt,
    setEditingPrompt,
    openCreateModal,
    openEditModal,
    handleCreateFolder,
    handleDeleteFolder,
    handleSavePrompt,
    handleDeletePrompt,
    handleLogout,
    handleGoogleLogin
  };

  return (
    <PromptContext.Provider value={value}>
      {children}
    </PromptContext.Provider>
  );
};

export const usePromptContext = () => {
  const context = useContext(PromptContext);
  if (context === undefined) {
    throw new Error('usePromptContext must be used within a PromptProvider');
  }
  return context;
};
