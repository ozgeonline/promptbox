import React, { useState, useEffect, useRef } from 'react';
import { Plus, User } from 'lucide-react';
import { usePromptContext } from '@/context/PromptContext';
import { FolderItem } from '../Common/FolderItem';
import { NewFolderInput } from '../Common/NewFolderInput';

export const SidebarPersonalSection: React.FC = () => {
  const {
    session,
    folders,
    activeFolderId,
    setActiveFolderId,
    setViewContext,
    setIsSidebarOpen,
    handleCreateFolder: onCreateFolder,
    handleDeleteFolder
  } = usePromptContext();

  const [isMyPromptsExpanded, setIsMyPromptsExpanded] = useState(false);
  const [isNewFolderMode, setIsNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const prevActiveFolderIdRef = useRef(activeFolderId);

  // Auto-expand if active folder is within this section
  useEffect(() => {
    if (prevActiveFolderIdRef.current !== activeFolderId) {
      if (activeFolderId === 'my_prompts' || folders.some(f => f.id === activeFolderId)) {
        setIsMyPromptsExpanded(true);
      } else {
        setIsMyPromptsExpanded(false);
      }
      prevActiveFolderIdRef.current = activeFolderId;
    }
  }, [activeFolderId, folders]);

  // Handlers
  const handleMyPromptsClick = () => {
    if (activeFolderId === 'my_prompts') {
      setIsMyPromptsExpanded(!isMyPromptsExpanded);
    } else {
      setActiveFolderId('my_prompts');
      setViewContext('personal');
      setIsMyPromptsExpanded(true);
    }
  };

  const handlePersonalFolderSelect = (folderId: string) => {
    setActiveFolderId(folderId);
    setViewContext('personal');
    setIsSidebarOpen(false);
  };

  // It creates a new folder and, if successful, clears and closes the form.
  const handleCreateFolder = (e: React.FormEvent) => {
    onCreateFolder(e, newFolderName, () => {
      setNewFolderName('');
      setIsNewFolderMode(false);
    });
  };

  const handleToggleNewFolderMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsNewFolderMode(!isNewFolderMode);
  };

  const handleCancelCreateFolder = () => {
    setIsNewFolderMode(false);
    setNewFolderName('');
  };

  if (!session) return null;

  return (
    <>
      <button
        onClick={handleMyPromptsClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all 
          ${activeFolderId === 'my_prompts'
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
              onClick={handleToggleNewFolderMode}
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
              onCancel={handleCancelCreateFolder}
            />
          )}

          <div className="space-y-0.5">
            {folders.map(folder => (
              <FolderItem
                key={folder.id}
                id={folder.id}
                name={folder.name}
                isActive={activeFolderId === folder.id}
                onClick={() => handlePersonalFolderSelect(folder.id)}
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
  );
};
