import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { Prompt, Folder } from '@/types';
import { useAuthContext } from './AuthContext';
import { usePromptData } from '@/hooks/usePromptData';
import { usePromptActions } from '@/hooks/usePromptActions';

interface DataContextType {
  folders: Folder[];
  communityFolders: Folder[];
  prompts: Prompt[];
  isLoading: boolean;
  error: string | null;

  // Actions
  handleCreateFolder: (e: React.FormEvent, name: string, onSuccess: () => void) => Promise<void>;
  handleDeleteFolder: (id: string, e: React.MouseEvent) => Promise<boolean>;
  handleSavePrompt: (promptData: any) => Promise<{
    promptId: string,
    folderId: string,
    isPublic: boolean
  } | null>;
  handleDeletePrompt: (id: string) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session } = useAuthContext();

  const {
    folders,
    setFolders,
    prompts,
    setPrompts,
    communityFolders,
    isLoading,
    error,
  } = usePromptData(session);

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
    setPrompts
  });

  const value = useMemo(() => ({
    folders,
    communityFolders,
    prompts,
    isLoading,
    error,
    handleCreateFolder,
    handleDeleteFolder,
    handleSavePrompt,
    handleDeletePrompt
  }), [
    folders,
    communityFolders,
    prompts,
    isLoading,
    error,
    handleCreateFolder,
    handleDeleteFolder,
    handleSavePrompt,
    handleDeletePrompt
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};
