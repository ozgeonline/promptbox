import React from 'react';

import { useAuthContext } from '@/context/AuthContext';
import { Trash2, Folder as FolderIcon, FileText, Lock } from 'lucide-react';

export const AdminDashboard: React.FC<any> = ({ adminData }) => {
  const { isAdmin } = useAuthContext();
  const {
    allPrompts,
    allFolders,
    isLoading,
    handleAdminDeletePrompt,
    handleAdminDeleteFolder
  } = adminData;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-6 animate-in fade-in duration-300">
        <div className="bg-purple-50 p-6 rounded-full mb-6 relative shadow-inner">
          <div className="absolute inset-0 bg-purple-100 rounded-full animate-ping opacity-20"></div>
          <Lock size={48} className="text-purple-600" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3 tracking-tight">
          Yetkili Erişimi Gerekli
        </h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
          Bu alan sistem genelindeki tüm verileri düzenlemek için ayrılmıştır. Yönetici komutlarına erişmek için lütfen yetkili hesaba geçiş yapın.
        </p>
        <button
          onClick={() => window.location.href = 'mailto:nisroc.414@hotmail.com'}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium shadow-sm hover:shadow-md hover:bg-slate-800 transition-all active:scale-95"
        >
          Topluluğa Katılın veya İletişime Geçin
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 flex justify-center py-20 animate-pulse">Yönetim verileri yükleniyor...</div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Yönetim Paneli</h1>
        <p className="text-slate-500">Tüm sistemdeki promptları ve klasörleri yönetin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Prompts Section */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[800px]">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
              <FileText size={20} className="text-indigo-500" />
              Tüm Promptlar
            </h2>
            <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
              {allPrompts.length} Adet
            </span>
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto flex-1 p-2">
            {allPrompts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">Hiç prompt bulunmuyor</div>
            ) : (
              allPrompts.map((prompt: any) => (
                <div key={prompt.id} className="p-4 hover:bg-slate-50 rounded-lg flex items-center justify-between group transition-colors">
                  <div className="flex items-center gap-4 min-w-0 pr-4 flex-1">
                    {/* Prompt Image */}
                    <div className="shrink-0 h-16 w-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      <img
                        src={prompt.image || 'https://9gdj1dewg7.ufs.sh/f/MzCIEEnlPGFDqLuejTAO6xTMuqHPGhbIk5NKF8ARWaVQnU1J'}
                        alt={prompt.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {/* Prompt Info */}
                    <div className="min-w-0">
                      <h3 className="font-medium text-slate-900 truncate">{prompt.title}</h3>
                      <p className="text-xs text-slate-500 truncate mt-1">
                        Klasör: {prompt.folders?.name || 'Genel'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 space-x-2">
                        <span className="uppercase">ID: {prompt.id}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAdminDeletePrompt(prompt.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                    title="Sil"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Folders Section */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[800px]">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
              <FolderIcon size={20} className="text-sky-500" />
              Tüm Klasörler
            </h2>
            <span className="text-xs font-medium bg-sky-100 text-sky-700 px-2 py-1 rounded-full">
              {allFolders.length} Adet
            </span>
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto flex-1 p-2">
            {allFolders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">Hiç klasör bulunmuyor</div>
            ) : (
              allFolders.map((folder: any) => (
                <div key={folder.id} className="p-4 hover:bg-slate-50 rounded-lg flex items-center justify-between group transition-colors">
                  <div className="min-w-0 pr-4 flex-1">
                    <h3 className="font-medium text-slate-900 truncate">{folder.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-1 space-x-2">
                      <span>{folder.promptCount || 0} Prompt</span>
                      <span className="text-slate-300">•</span>
                      <span>{folder.originalIds?.length || 1} Farklı Kullanıcıda</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleAdminDeleteFolder(folder.name, folder.originalIds)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                    title="Sil"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
