import React from 'react';
import { Plus } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

interface SidebarFooterProps {
  isLoading: boolean;
  session: Session | null;
  openCreateModal: () => void;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  isLoading,
  session,
  openCreateModal
}) => {
  return (
    <div className="p-4 border-t border-slate-100">
      <button
        onClick={openCreateModal}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium shadow-sm shadow-indigo-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
        title={!session ? "Giriş yapmalısınız" : ""}
      >
        <Plus size={20} />
        <span>{session ? 'Yeni Prompt' : 'Oluşturmak için Giriş Yap'}</span>
      </button>
    </div>
  );
};
