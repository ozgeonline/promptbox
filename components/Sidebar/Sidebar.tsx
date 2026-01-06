import React from 'react';
import { Session } from '@supabase/supabase-js';
import { Folder as FolderType, Prompt } from '../../types';
import { Plus, FolderOpen, Globe, User } from 'lucide-react';

import { SidebarHeader } from './SidebarHeader';
import { UserProfile } from './UserProfile';
import { FolderItem } from './FolderItem';
import { NewFolderInput } from './NewFolderInput';
import { SidebarFooter } from './SidebarFooter';

interface SidebarProps {
  session: Session | null;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  activeFolderId: string;
  setActiveFolderId: (id: string) => void;
  folders: FolderType[];
  communityFolders: FolderType[];
  prompts: Prompt[];
  handleLogout: () => void;
  handleGoogleLogin: () => void;
  handleDeleteFolder: (id: string, e: React.MouseEvent) => void;
  isNewFolderMode: boolean;
  setIsNewFolderMode: (isMode: boolean) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  handleCreateFolder: (e: React.FormEvent) => void;
  openCreateModal: () => void;
  isLoading: boolean;
  setViewContext: (context: 'personal' | 'community') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  session,
  isSidebarOpen,
  setIsSidebarOpen,
  activeFolderId,
  setActiveFolderId,
  folders,
  communityFolders,
  prompts,
  handleLogout,
  handleGoogleLogin,
  handleDeleteFolder,
  isNewFolderMode,
  setIsNewFolderMode,
  newFolderName,
  setNewFolderName,
  handleCreateFolder,
  openCreateModal,
  isLoading,
  setViewContext
}) => {
  const [isCommunityExpanded, setIsCommunityExpanded] = React.useState(false);
  const prevActiveFolderIdRef = React.useRef(activeFolderId);

  React.useEffect(() => {
    if (prevActiveFolderIdRef.current !== activeFolderId) {
      if (activeFolderId === 'public_community' || communityFolders.some(f => f.id === activeFolderId)) {
        setIsCommunityExpanded(true);
      } else {
        setIsCommunityExpanded(false);
      }
      prevActiveFolderIdRef.current = activeFolderId;
    }
  }, [activeFolderId, communityFolders]);

  return (
    <aside
      className={`
        fixed md:relative z-30 flex flex-col w-72 h-full bg-white border-r border-slate-200 
        transform transition-transform duration-300 ease-in-out shadow-lg md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-64 lg:w-72'}
      `}
    >
      <SidebarHeader setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <UserProfile
          session={session}
          handleLogout={handleLogout}
          handleGoogleLogin={handleGoogleLogin}
        />

        <div className="px-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Kütüphane
        </div>

        {session && (
          <button
            onClick={() => {
              setActiveFolderId('all');
              setViewContext('personal');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeFolderId === 'all'
              ? 'bg-indigo-50 text-indigo-700 font-medium'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
          >
            <FolderOpen size={18} />
            <span className="flex-1 text-left">Tüm Promptlar</span>
            <span className="text-xs bg-slate-200/50 px-2 py-0.5 rounded-full text-slate-500">
              {prompts.length}
            </span>
          </button>
        )}

        <button
          onClick={() => {
            if (activeFolderId === 'public_community') {
              setIsCommunityExpanded(!isCommunityExpanded);
            } else {
              setActiveFolderId('public_community');
              setViewContext('community');
              setIsSidebarOpen(false);
            }
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeFolderId === 'public_community'
            ? 'bg-emerald-50 text-emerald-700 font-medium'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
        >
          <Globe size={18} />
          <span className="flex-1 text-left">Keşfet (Topluluk)</span>
        </button>

        {(isCommunityExpanded) && (
          <div className="space-y-0.5 mb-2">
            {communityFolders.map(folder => (
              <FolderItem
                key={`community-${folder.id}`}
                id={folder.id}
                name={folder.name}
                isActive={activeFolderId === folder.id}
                onClick={() => {
                  setActiveFolderId(folder.id);
                  setViewContext('community');
                  setIsSidebarOpen(false);
                }}
                isCommunity={true}
              />
            ))}
          </div>
        )}

        {session && (
          <>
            <button
              onClick={() => {
                setActiveFolderId('my_prompts');
                setViewContext('personal');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeFolderId === 'my_prompts'
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <User size={18} />
              <span className="flex-1 text-left">Promptlarım</span>
            </button>

            <div className="mt-8 px-2 mb-2 flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Klasörlerim</span>
              <button
                onClick={() => setIsNewFolderMode(!isNewFolderMode)}
                className="hover:text-indigo-600 transition-colors"
                title="Yeni Klasör"
              >
                <Plus size={16} />
              </button>
            </div>

            {isNewFolderMode && (
              <NewFolderInput
                newFolderName={newFolderName}
                setNewFolderName={setNewFolderName}
                handleCreateFolder={handleCreateFolder}
                onCancel={() => {
                  setIsNewFolderMode(false);
                  setNewFolderName('');
                }}
              />
            )}

            <div className="space-y-0.5">
              {folders.map(folder => (
                <FolderItem
                  key={folder.id}
                  id={folder.id}
                  name={folder.name}
                  isActive={activeFolderId === folder.id}
                  onClick={() => {
                    setActiveFolderId(folder.id);
                    setViewContext('personal');
                    setIsSidebarOpen(false);
                  }}
                  onDelete={(e) => handleDeleteFolder(folder.id, e)}
                  isCommunity={false}
                />
              ))}
              {folders.length === 0 && (
                <div className="px-3 py-2 text-sm text-slate-400 italic">Klasör yok</div>
              )}
            </div>
          </>
        )}
      </div>

      <SidebarFooter
        isLoading={isLoading}
        session={session}
        openCreateModal={openCreateModal}
      />
    </aside>
  );
};
