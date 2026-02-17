import React, { useState, useEffect, useRef } from 'react';
import { Globe } from 'lucide-react';
import { useDataContext, useUIContext } from '@/context';
import { FolderItem } from '@/components/Sidebar/Common/FolderItem';

export const SidebarCommunitySection: React.FC = () => {
  const {
    communityFolders,
  } = useDataContext();

  const {
    activeFolderId,
    setActiveFolderId,
    setViewContext,
    setIsSidebarOpen
  } = useUIContext();

  const [isCommunityExpanded, setIsCommunityExpanded] = useState(false);
  const prevActiveFolderIdRef = useRef(activeFolderId);

  // Auto-expand if active folder is within this section
  useEffect(() => {
    if (prevActiveFolderIdRef.current !== activeFolderId) {
      if (activeFolderId === 'public_community' || communityFolders.some(f => f.id === activeFolderId)) {
        setIsCommunityExpanded(true);
      } else {
        setIsCommunityExpanded(false);
      }
      prevActiveFolderIdRef.current = activeFolderId;
    }
  }, [activeFolderId, communityFolders]);

  const handleCommunityClick = () => {
    if (activeFolderId === 'public_community') {
      setIsCommunityExpanded(!isCommunityExpanded);
    } else {
      setActiveFolderId('public_community');
      setViewContext('community');
      setIsSidebarOpen(false);
    }
  };

  const handleCommunityFolderSelect = (folderId: string) => {
    setActiveFolderId(folderId);
    setViewContext('community');
    setIsSidebarOpen(false);
  };

  return (
    <>
      <button
        onClick={handleCommunityClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all 
          ${activeFolderId === 'public_community'
            ? 'bg-emerald-50 text-emerald-700 font-medium'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`
        }
      >
        <Globe size={18} />
        <span className="flex-1 text-left">Keşfet (Topluluk)</span>
      </button>

      {isCommunityExpanded && (
        <div className="space-y-0.5 mb-2">
          {communityFolders.map(folder => (
            <FolderItem
              key={`community-${folder.id}`}
              id={folder.id}
              name={folder.name}
              isActive={activeFolderId === folder.id}
              onClick={() => handleCommunityFolderSelect(folder.id)}
              isCommunity={true}
            />
          ))}
        </div>
      )}
    </>
  );
};
