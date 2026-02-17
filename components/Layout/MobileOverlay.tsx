import React from 'react';
import { useUIContext } from '@/context/UIContext';

export const MobileOverlay: React.FC = () => {
  const { isSidebarOpen, setIsSidebarOpen } = useUIContext();

  if (!isSidebarOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm"
      onClick={() => setIsSidebarOpen(false)}
    />
  );
};
