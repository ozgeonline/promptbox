import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { Prompt } from '@/types';
import { useAuthContext } from '@/context/AuthContext';
import { useDataContext } from '@/context/DataContext';
import { usePromptFilter } from '@/hooks/usePromptFilter';

interface UIContextType {
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

  // Filtered Data
  filteredPrompts: Prompt[];

  // Modals
  isPromptModalOpen: boolean;
  setIsPromptModalOpen: (isOpen: boolean) => void;
  editingPrompt: Prompt | null;
  setEditingPrompt: (prompt: Prompt | null) => void;

  // Helper Actions (UI logic wrapping Data actions)
  openCreateModal: () => void;
  openEditModal: (prompt: Prompt) => void;
  savePromptAndNavigate: (promptData: any) => Promise<void>;
  deleteFolderAndNavigate: (id: string, e: React.MouseEvent) => Promise<void>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session, handleGoogleLogin } = useAuthContext();
  const {
    folders,
    communityFolders,
    prompts,
    handleSavePrompt,
    handleDeleteFolder
  } = useDataContext();

  // Low-level UI State
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [viewContext, setViewContext] = useState<'personal' | 'community'>('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal State
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

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

  // Filter Logic
  const filteredPrompts = usePromptFilter({
    prompts,
    activeFolderId,
    searchQuery,
    viewContext,
    session
  });

  // UI Helpers
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

  // Complex Actions handling UI Navigation + Data
  const savePromptAndNavigate = async (promptData: any) => {
    const result = await handleSavePrompt(promptData);
    if (result) {
      // Navigate based on result
      setActiveFolderId(result.folderId);
      setViewContext(result.isPublic ? 'community' : 'personal');
      if (result.isPublic && activeFolderId === 'public_community') {
        // ensure we stay on community if that's where we are
      } else if (!result.isPublic) {
        setViewContext('personal');
      }
    }
  };

  const deleteFolderAndNavigate = async (id: string, e: React.MouseEvent) => {
    const success = await handleDeleteFolder(id, e);
    if (success) {
      if (activeFolderId === id) setActiveFolderId('all');
    }
  }

  const value = useMemo(() => ({
    activeFolderId,
    setActiveFolderId,
    viewContext,
    setViewContext,
    searchQuery,
    setSearchQuery,
    isSidebarOpen,
    setIsSidebarOpen,
    activeFolderName,
    filteredPrompts,
    isPromptModalOpen,
    setIsPromptModalOpen,
    editingPrompt,
    setEditingPrompt,
    openCreateModal,
    openEditModal,
    savePromptAndNavigate,
    deleteFolderAndNavigate
  }), [
    activeFolderId,
    viewContext,
    searchQuery,
    isSidebarOpen,
    activeFolderName,
    filteredPrompts,
    isPromptModalOpen,
    editingPrompt
  ]);

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

export const useUIContext = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
};
