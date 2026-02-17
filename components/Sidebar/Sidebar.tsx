import React from 'react';
import { FolderOpen } from 'lucide-react';

import { SidebarHeader } from './Common/SidebarHeader';
import { UserProfile } from './Common/UserProfile';
import { SidebarFooter } from './Common/SidebarFooter';
import { SidebarCommunitySection } from './Sections/SidebarCommunitySection';
import { SidebarPersonalSection } from './Sections/SidebarPersonalSection';

import { useAuthContext, useDataContext, useUIContext } from '@/context';

export const Sidebar: React.FC = () => {
  const {
    session,
    handleLogout,
    handleGoogleLogin,
  } = useAuthContext();

  const {
    prompts,
    isLoading
  } = useDataContext();

  const {
    activeFolderId,
    setActiveFolderId,
    setViewContext,
    openCreateModal,
    isSidebarOpen,
    setIsSidebarOpen,
  } = useUIContext();

  const handleAllPromptsClick = () => {
    setActiveFolderId('all');
    setViewContext('personal');
    setIsSidebarOpen(false);
  };

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

        {/* 'Tüm Promptlar' button for logged-in users. */}
        {session && (
          <button
            onClick={handleAllPromptsClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all 
              ${activeFolderId === 'all'
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <FolderOpen size={18} />
            <span className="flex-1 text-left">Tüm Promptlar</span>
            <span className="text-xs bg-slate-200/50 px-2 py-0.5 rounded-full text-slate-500">
              {prompts.length}
            </span>
          </button>
        )}

        {/* Community Section */}
        <SidebarCommunitySection />

        {/* Personal Section (contains My Prompts) */}
        <SidebarPersonalSection />
      </div>

      {/* Sidebar Footer + New Prompt Button */}
      <SidebarFooter
        isLoading={isLoading}
        session={session}
        openCreateModal={openCreateModal}
      />
    </aside>
  );
};
