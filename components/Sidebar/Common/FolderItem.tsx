import React from 'react';
import { Trash2, Folder as FolderIcon } from 'lucide-react';

interface FolderItemProps {
  id: string;
  name: string;
  isActive: boolean;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  isCommunity?: boolean;
}

export const FolderItem: React.FC<FolderItemProps> = ({
  name,
  isActive,
  onClick,
  onDelete,
  isCommunity = false
}) => {
  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all 
        ${isActive
          ? isCommunity
            ? 'bg-emerald-50 text-emerald-700 font-medium border-emerald-500' // Active Community Style
            : 'bg-indigo-50 text-indigo-700 font-medium' // Active User Style
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent hover:border-slate-200'
        } ${isCommunity ? 'ml-4 border-l-2 py-2 text-sm' : ''}`}
      onClick={onClick}
    >
      <FolderIcon
        size={isCommunity ? 16 : 18}
        className={isActive
          ? (isCommunity
            ? 'fill-emerald-200 text-emerald-600'
            : 'fill-indigo-200 text-indigo-600')
          : ''
        }
      />
      <span className="flex-1 text-left truncate">{name}</span>

      {onDelete && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-600 rounded-md transition-all z-10"
          title="Klasörü Sil"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};
