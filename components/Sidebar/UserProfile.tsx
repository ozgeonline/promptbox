import React from 'react';
import { Session } from '@supabase/supabase-js';
import { User, LogOut, LogIn } from 'lucide-react';

interface UserProfileProps {
  session: Session | null;
  handleLogout: () => void;
  handleGoogleLogin: () => void;
}


export const UserProfile: React.FC<UserProfileProps> = ({
  session,
  handleLogout,
  handleGoogleLogin
}) => {
  if (session) {
    return (
      <div className="mb-6 px-3 py-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
          <User size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">
            {session.user?.user_metadata?.full_name || session.user?.email}
          </p>
          <button
            onClick={handleLogout}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mt-0.5"
          >
            <LogOut size={10} /> Çıkış Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 px-2">
      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl font-medium transition-all text-sm shadow-sm"
      >
        <LogIn size={16} />
        <span>Google ile Giriş</span>
      </button>
    </div>
  );
};
