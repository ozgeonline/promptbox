import React from 'react';

interface NewFolderInputProps {
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  handleCreateFolder: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const NewFolderInput: React.FC<NewFolderInputProps> = ({
  newFolderName,
  setNewFolderName,
  handleCreateFolder,
  onCancel
}) => {
  return (
    <div className="mb-3 px-2 py-2 bg-slate-50/80 rounded-xl border border-indigo-100/50">
      <form onSubmit={handleCreateFolder}>
        <input
          autoFocus
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="Klasör adı..."
          className="w-full px-3 py-1.5 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white mb-2 placeholder:text-slate-400"
        />
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-md transition-colors"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={!newFolderName.trim()}
            className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-200"
          >
            Oluştur
          </button>
        </div>
      </form>
    </div>
  );
};
