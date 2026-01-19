import React from 'react';
import { LayoutGrid, Menu } from 'lucide-react';

interface SidebarHeaderProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ setIsSidebarOpen }) => {
  return (
    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-2 text-indigo-600">
        <LayoutGrid className="w-8 h-8" />
        <h1 className="text-xl font-bold tracking-tight text-slate-800">PromptBox</h1>
      </div>
      <button
        onClick={() => setIsSidebarOpen(false)}
        className="md:hidden text-slate-400"
      >
        <Menu size={20} />
      </button>
    </div>
  );
};
