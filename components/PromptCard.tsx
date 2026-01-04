import React from 'react';
import { Prompt } from '../types';
import { Copy, Edit2, Trash2, Image as ImageIcon, Globe, Lock } from 'lucide-react';

interface PromptCardProps {
  prompt: Prompt;
  folderName: string;
  currentUserId?: string;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({ 
  prompt, 
  folderName, 
  currentUserId,
  onEdit, 
  onDelete 
}) => {
  const [copied, setCopied] = React.useState(false);
  
  // Check if the current user owns this prompt
  const isOwner = currentUserId && prompt.userId === currentUserId;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full ${!isOwner ? 'border-indigo-100' : 'border-slate-200'}`}>
      {/* Image Section */}
      <div className="h-40 w-full bg-slate-100 relative overflow-hidden">
        {prompt.image ? (
          <img 
            src={prompt.image} 
            alt={prompt.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <ImageIcon size={48} opacity={0.2} />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 right-2 flex gap-2">
           {prompt.isPublic && (
            <div className="bg-emerald-500/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-white shadow-sm flex items-center gap-1">
              <Globe size={10} /> Public
            </div>
           )}
           <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-slate-600 shadow-sm">
             {folderName}
           </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-semibold text-slate-800 line-clamp-1" title={prompt.title}>
            {prompt.title}
          </h3>
          {!isOwner && (
            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 whitespace-nowrap">
              Community
            </span>
          )}
        </div>
        
        <div className="relative bg-slate-50 rounded-lg p-3 mb-4 flex-1 border border-slate-100 group-hover:border-slate-200 transition-colors">
          <p className="text-sm text-slate-600 font-mono line-clamp-4 leading-relaxed">
            {prompt.content}
          </p>
          <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-50 to-transparent" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
          <button 
            onClick={handleCopy}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
              copied 
                ? 'bg-green-100 text-green-700' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Copy size={14} />
            {copied ? 'Kopyalandı' : 'Kopyala'}
          </button>

          {/* Only show Edit/Delete for Owner */}
          {isOwner && (
            <div className="flex gap-2">
              <button 
                onClick={() => onEdit(prompt)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                title="Düzenle"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => onDelete(prompt.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Sil"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
