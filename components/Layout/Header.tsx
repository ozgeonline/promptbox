import React from 'react';
import { Search, Menu, LogIn } from 'lucide-react';

import { useAuthContext, useUIContext } from '@/context';

export const Header: React.FC = () => {
  const {
    session,
    handleGoogleLogin
  } = useAuthContext();

  const {
    setIsSidebarOpen,
    activeFolderName,
    searchQuery,
    setSearchQuery,
  } = useUIContext();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden text-slate-500 hover:text-indigo-600"
        >
          <Menu size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-800 hidden sm:block">
          {activeFolderName}
        </h2>
      </div>

      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="İlgili Klasörde Başlık veya içerik ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 outline-none transition-all"
          />
        </div>
      </div>

      {!session && (
        <button
          onClick={handleGoogleLogin}
          className="hidden sm:flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
        >
          <LogIn size={16} /> Giriş Yap
        </button>
      )}
    </header>
  );
};
