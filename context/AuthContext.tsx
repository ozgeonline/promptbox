import React, { createContext, useContext, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';

interface AuthContextType {
  session: Session | null;
  handleLogout: () => void;
  handleGoogleLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session, handleGoogleLogin, handleLogout } = useAuth();

  const value = {
    session,
    handleLogout,
    handleGoogleLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
