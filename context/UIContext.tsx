import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode
} from 'react';
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
    handleDeleteFolder,
    isLoading
  } = useDataContext();

  // Helper to slugify folder names
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  // Helper to find folder ID by slug
  const findFolderIdBySlug =
    (slug: string, source: 'personal' | 'community') => {
      if (source === 'personal') {
        const folder = folders.find(f => slugify(f.name) === slug);
        return folder ? folder.id : 'all';
      } else {
        const folder = communityFolders.find(f => {
          const match = slugify(f.name) === slug;
          return match;
        });
        if (!folder && communityFolders.length > 0) {
          console.warn(`
            [UIContext] Community folder NOT found for slug: "${slug}".
             Available folders:`, communityFolders.map(f => `${f.name} -> ${slugify(f.name)}
          `));
        }
        return folder ? folder.id : 'public_community';
      }
    };

  // Helper to get path for current state
  const getPathForState = (folderId: string, context: 'personal' | 'community') => {
    if (folderId === 'all') return '/';
    if (folderId === 'public_community') return '/community';
    if (folderId === 'my_prompts') return '/my-prompts';

    if (context === 'personal') {
      const folder = folders.find(f => f.id === folderId);
      if (folder) return `/my-prompts/${slugify(folder.name)}`;
    } else {
      const folder = communityFolders.find(f => f.id === folderId);
      if (folder) return `/community/${slugify(folder.name)}`;
    }
    return '/';
  };

  // --- State Initialization ---
  // Initial active folder ID
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [viewContext, setViewContext] = useState<'personal' | 'community'>('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- SYNC URL -> STATE (On Load & PopState) ---
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname;

      // 1. Static Routes
      if (path === '/' || path === '') {
        setActiveFolderId('all');
        setViewContext('personal');
        return;
      }
      if (path === '/community') {
        setActiveFolderId('public_community');
        setViewContext('community');
        return;
      }
      if (path === '/my-prompts') {
        setActiveFolderId('my_prompts');
        setViewContext('personal');
        return;
      }

      // 2. Dynamic Routes: /my-prompts/:slug or /community/:slug
      const personalMatch = path.match(/^\/my-prompts\/([^/]+)$/);
      const communityMatch = path.match(/^\/community\/([^/]+)$/);
      const legacyFolderMatch = path.match(/^\/folder\/([^/]+)$/);

      if (personalMatch) {
        const slug = personalMatch[1];
        if (folders.length > 0) {
          const id = findFolderIdBySlug(slug, 'personal');
          if (id !== 'all') {
            setActiveFolderId(id);
            setViewContext('personal');
          }
        }
      } else if (legacyFolderMatch) {
        // Backward compatibility for /folder/
        const slug = legacyFolderMatch[1];
        if (folders.length > 0) {
          const id = findFolderIdBySlug(slug, 'personal');
          if (id !== 'all') {
            setActiveFolderId(id);
            setViewContext('personal');
          }
        }
      } else if (communityMatch) {
        const slug = communityMatch[1];
        if (communityFolders.length > 0) {
          const id = findFolderIdBySlug(slug, 'community');
          if (id !== 'public_community') {
            setActiveFolderId(id);
            setViewContext('community');
          }
        }
      }
    };

    // When the file is linked and the data changes
    handleUrlChange();

    // Listen for back/forward
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [folders, communityFolders, isLoading]);


  // --- SYNC STATE -> URL ---
  useEffect(() => {
    // CRITICAL: Do not overwrite URL if data is still loading
    // This prevents redirecting to '/' on reload because activeFolderId defaults to 'all'
    if (isLoading) return;

    const currentPath = window.location.pathname;
    const newPath = getPathForState(activeFolderId, viewContext);

    if (currentPath !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  }, [activeFolderId, viewContext, folders, communityFolders, isLoading]);

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

  const deleteFolderAndNavigate =
    async (id: string, e: React.MouseEvent) => {
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
