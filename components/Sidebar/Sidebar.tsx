import React from 'react';
import { Plus, FolderOpen, Globe, User } from 'lucide-react';

import { SidebarHeader } from './SidebarHeader';
import { UserProfile } from './UserProfile';
import { FolderItem } from './FolderItem';
import { NewFolderInput } from './NewFolderInput';
import { SidebarFooter } from './SidebarFooter';

import { usePromptContext } from '../../context/PromptContext';

export const Sidebar: React.FC = () => {
  const {
    session,
    folders,
    communityFolders,
    prompts,
    activeFolderId,
    setActiveFolderId,
    setViewContext,
    handleCreateFolder: onCreateFolder,
    handleDeleteFolder,
    openCreateModal,
    handleLogout,
    handleGoogleLogin,
    isSidebarOpen,
    setIsSidebarOpen,
    isLoading
  } = usePromptContext();

  const [isCommunityExpanded, setIsCommunityExpanded] = React.useState(false);
  const [isMyPromptsExpanded, setIsMyPromptsExpanded] = React.useState(false);

  // Local state for new folder creation
  const [isNewFolderMode, setIsNewFolderMode] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState('');

  const prevActiveFolderIdRef = React.useRef(activeFolderId);

  const handleCreateFolder = (e: React.FormEvent) => {
    onCreateFolder(e, newFolderName, () => {
      setNewFolderName('');
      setIsNewFolderMode(false);
    });
  };

  React.useEffect(() => {
    if (prevActiveFolderIdRef.current !== activeFolderId) {
      if (activeFolderId === 'public_community' || communityFolders.some(f => f.id === activeFolderId)) {
        setIsCommunityExpanded(true);
      } else {
        setIsCommunityExpanded(false);
      }

      if (activeFolderId === 'my_prompts' || folders.some(f => f.id === activeFolderId)) {
        setIsMyPromptsExpanded(true);
      } else {
        setIsMyPromptsExpanded(false);
      }

      prevActiveFolderIdRef.current = activeFolderId;
    }
  }, [activeFolderId, communityFolders, folders]);

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
                // If it's already active, just toggle. If not, activate AND expand.
                if (activeFolderId === 'my_prompts') {
                  setIsMyPromptsExpanded(!isMyPromptsExpanded);
                } else {
                  setActiveFolderId('my_prompts');
                  setViewContext('personal');
                  setIsMyPromptsExpanded(true);
                  // setIsSidebarOpen(false); // Mobile: Don't close sidebar immediately so user can see folders
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeFolderId === 'my_prompts'
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <User size={18} />
              <span className="flex-1 text-left">Promptlarım</span>
            </button>

            {/* Collapsible Area */}
            {isMyPromptsExpanded && (
              <div className="ml-4 border-l border-slate-100 pl-2 mt-1 space-y-1">
                <div className="px-2 py-1 flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Klasörlerim</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsNewFolderMode(!isNewFolderMode);
                    }}
                    className="hover:text-indigo-600 transition-colors p-1"
                    title="Yeni Klasör"
                  >
                    <Plus size={14} />
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
              </div>
            )}
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
