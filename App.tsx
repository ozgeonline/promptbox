import React, { useState, useEffect, useMemo } from 'react';
import { Folder, Prompt } from './types';
import { PromptCard } from './components/PromptCard';
import { PromptForm } from './components/PromptForm';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import {
  Plus,
  Search,
  LayoutGrid,
  Menu,
  Trash2,
  Folder as FolderIcon,
  FolderOpen,
  Loader2,
  AlertCircle,
  LogIn,
  LogOut,
  Globe,
  User
} from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [session, setSession] = useState<Session | null>(null);

  // Data State
  const [folders, setFolders] = useState<Folder[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isNewFolderMode, setIsNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Handle Auth & Initial Load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchData(session, true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Re-fetch data when auth state changes - false means no loading spinner
      fetchData(session, false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setFolders([]);
    // After logout, only fetch public prompts will be handled by onAuthStateChange triggering fetchData(null)
  };

  const fetchData = async (currentSession: Session | null, showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);

      // 1. Fetch Folders (Only if logged in)
      let foldersData: any[] = [];
      if (currentSession) {
        const { data, error: foldersError } = await supabase
          .from('folders')
          .select('*')
          .order('created_at', { ascending: true });

        if (foldersError) throw foldersError;
        foldersData = data || [];
      }

      setFolders(foldersData);

      // 2. Fetch Prompts (Logic: My Prompts OR Public Prompts)
      // Supabase JS .or() syntax allows checking multiple conditions
      let query = supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (currentSession) {
        // If logged in: fetch (my prompts) OR (public prompts)
        // Note: RLS policies usually handle "my prompts", but to get public ones too
        // we explicitly ask for them. The RLS we set up allows reading public OR owned.
        // So a simple select('*') works if RLS is correct.
        // However, to be explicit for the UI filtering:
        query = query.or(`user_id.eq.${currentSession.user.id},is_public.eq.true`);
      } else {
        // If guest: only public
        query = query.eq('is_public', true);
      }

      const { data: promptsData, error: promptsError } = await query;

      if (promptsError) throw promptsError;

      // Normalize data
      const formattedPrompts: Prompt[] = (promptsData || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        folderId: p.folder_id,
        image: p.image,
        userId: p.user_id,
        isPublic: p.is_public,
        createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now()
      }));

      setPrompts(formattedPrompts);

    } catch (err: any) {
      console.error('Data fetch error:', err);
      // Don't show error for empty RLS results, just log it
      if (err.code !== 'PGRST116') {
        setError('Veriler yüklenirken bir hata oluştu.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Derived State
  const filteredPrompts = useMemo(() => {
    let filtered = prompts;

    if (activeFolderId !== 'all') {
      if (activeFolderId === 'public_community') {
        // Special virtual folder for public prompts from others
        filtered = filtered.filter(p => p.isPublic && p.userId !== session?.user.id);
      } else if (activeFolderId === 'my_prompts') {
        // Show only my prompts (regardless of folder)
        filtered = filtered.filter(p => p.userId === session?.user.id);
      } else {
        filtered = filtered.filter(p => p.folderId === activeFolderId);
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [prompts, activeFolderId, searchQuery, session]);

  const activeFolderName = useMemo(() => {
    if (activeFolderId === 'all') return 'Tüm Promptlar';
    if (activeFolderId === 'public_community') return 'Keşfet (Topluluk)';
    if (activeFolderId === 'my_prompts') return 'Promptlarım';
    return folders.find(f => f.id === activeFolderId)?.name || 'Genel';
  }, [activeFolderId, folders]);

  // Handlers
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !session) return;

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert([{
          name: newFolderName.trim(),
          user_id: session.user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setFolders([...folders, data]);
      setNewFolderName('');
      setIsNewFolderMode(false);
    } catch (err: any) {
      alert(`Klasör oluşturulamadı: ${err.message}`);
    }
  };

  const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!session) return;

    if (!window.confirm('Bu klasörü ve içindeki tüm promptları silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFolders(prev => prev.filter(f => f.id !== id));
      setPrompts(prev => prev.filter(p => p.folderId !== id));

      if (activeFolderId === id) setActiveFolderId('all');
    } catch (err: any) {
      alert(`Silme işlemi başarısız: ${err.message}`);
    }
  };

  const handleSavePrompt = async (promptData: Omit<Prompt, 'id' | 'createdAt' | 'userId'> & { id?: string }) => {
    if (!session) {
      alert("Prompt oluşturmak için giriş yapmalısınız.");
      return;
    }

    try {
      let targetFolderId = promptData.folderId;

      // Auto-create "Genel" folder if no folders exist
      if (!targetFolderId && folders.length === 0) {
        const { data: newFolder, error: folderError } = await supabase
          .from('folders')
          .insert([{
            name: 'Genel',
            user_id: session.user.id
          }])
          .select()
          .single();

        if (folderError) throw folderError;

        setFolders([newFolder]);
        targetFolderId = newFolder.id;
      }

      const payload = {
        title: promptData.title,
        content: promptData.content,
        folder_id: targetFolderId,
        image: promptData.image,
        is_public: promptData.isPublic,
        user_id: session.user.id
      };

      if (promptData.id) {
        // Update
        const { data, error } = await supabase
          .from('prompts')
          .update(payload)
          .eq('id', promptData.id)
          .select()
          .single();

        if (error) throw error;

        setPrompts(prompts.map(p => p.id === promptData.id ? {
          ...p,
          title: data.title,
          content: data.content,
          folderId: data.folder_id,
          image: data.image,
          isPublic: data.is_public
        } : p));
      } else {
        // Create
        const { data, error } = await supabase
          .from('prompts')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;

        const newPrompt: Prompt = {
          id: data.id,
          title: data.title,
          content: data.content,
          folderId: data.folder_id,
          image: data.image,
          userId: data.user_id,
          isPublic: data.is_public,
          createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now()
        };

        setPrompts([newPrompt, ...prompts]);
      }

      // If user saved a private prompt, go to that folder. If public, stay or go to all.
      setActiveFolderId(promptData.folderId);
    } catch (err: any) {
      alert(`Kayıt başarısız: ${err.message}`);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (!window.confirm('Bu promptu silmek istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPrompts(prompts.filter(p => p.id !== id));
    } catch (err: any) {
      alert(`Silme başarısız: ${err.message}`);
    }
  };

  const openCreateModal = () => {
    if (!session) {
      handleGoogleLogin();
      return;
    }
    setEditingPrompt(null);
    setIsPromptModalOpen(true);
  };

  const openEditModal = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setIsPromptModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-30 flex flex-col w-72 h-full bg-white border-r border-slate-200 
          transform transition-transform duration-300 ease-in-out shadow-lg md:shadow-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-64 lg:w-72'}
        `}
      >
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

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {/* User Profile Section (Sidebar Top) */}
          {session ? (
            <div className="mb-6 px-3 py-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
              {session.user.user_metadata.avatar_url ? (
                <img src={session.user.user_metadata.avatar_url} alt="User" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                  <User size={16} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{session.user.user_metadata.full_name || session.user.email}</p>
                <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mt-0.5">
                  <LogOut size={10} /> Çıkış Yap
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 px-2">
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl font-medium transition-all text-sm shadow-sm"
              >
                <LogIn size={16} />
                <span>Google ile Giriş</span>
              </button>
            </div>
          )}

          <div className="px-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Kütüphane
          </div>

          <button
            onClick={() => setActiveFolderId('all')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeFolderId === 'all'
              ? 'bg-indigo-50 text-indigo-700 font-medium'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
          >
            <FolderOpen size={18} />
            <span className="flex-1 text-left">Tüm Promptlar</span>
            <span className="text-xs bg-slate-200/50 px-2 py-0.5 rounded-full text-slate-500">
              {prompts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFolderId('public_community')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeFolderId === 'public_community'
              ? 'bg-emerald-50 text-emerald-700 font-medium'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
          >
            <Globe size={18} />
            <span className="flex-1 text-left">Keşfet (Topluluk)</span>
          </button>

          <button
            onClick={() => setActiveFolderId('my_prompts')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeFolderId === 'my_prompts'
              ? 'bg-indigo-50 text-indigo-700 font-medium'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
          >
            <User size={18} />
            <span className="flex-1 text-left">Promptlarım</span>
          </button>

          {session && (
            <>
              <div className="mt-8 px-2 mb-2 flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <span>Klasörlerim</span>
                <button
                  onClick={() => setIsNewFolderMode(!isNewFolderMode)}
                  className="hover:text-indigo-600 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              {isNewFolderMode && (
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
                        onClick={() => {
                          setIsNewFolderMode(false);
                          setNewFolderName('');
                        }}
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
              )}

              <div className="space-y-0.5">
                {folders.map(folder => (
                  <div
                    key={folder.id}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${activeFolderId === folder.id
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    onClick={() => setActiveFolderId(folder.id)}
                  >
                    <FolderIcon size={18} className={activeFolderId === folder.id ? 'fill-indigo-200 text-indigo-600' : ''} />
                    <span className="flex-1 text-left truncate">{folder.name}</span>
                    <button
                      onClick={(e) => handleDeleteFolder(folder.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-600 rounded-md transition-all z-10"
                      title="Klasörü Sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {folders.length === 0 && (
                  <div className="px-3 py-2 text-sm text-slate-400 italic">Klasör yok</div>
                )}
              </div>
            </>
          )}
        </div>

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
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Navigation */}
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
                placeholder="Başlık veya içerik ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
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

        {/* Loading / Error / Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Loader2 size={48} className="animate-spin mb-4 text-indigo-500" />
              <p>Veriler yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-red-500">
              <AlertCircle size={48} className="mb-4" />
              <p className="text-center max-w-md">{error}</p>
              <p className="text-sm mt-2 text-slate-500">Lütfen veritabanı kurulumunu tamamladığınızdan emin olun.</p>
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                {activeFolderId === 'public_community' ? (
                  <Globe size={48} className="text-slate-300" />
                ) : (
                  <LayoutGrid size={48} className="text-slate-300" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {activeFolderId === 'public_community' ? 'Keşfedilecek Prompt Yok' : activeFolderId === 'my_prompts' ? 'Henüz hiç prompt oluşturmadınız' : 'Henüz prompt yok'}
              </h3>
              <p className="text-slate-500 max-w-sm mb-8">
                {searchQuery
                  ? 'Aradığınız kriterlere uygun sonuç bulunamadı.'
                  : session
                    ? 'Yeni bir prompt ekleyerek başlayın veya topluluk promptlarına göz atın.'
                    : 'Prompt oluşturmak için giriş yapın veya topluluk promptlarını inceleyin.'}
              </p>
              {session && !searchQuery && activeFolderId !== 'public_community' && (
                <button
                  onClick={openCreateModal}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
                  disabled={folders.length === 0}
                >
                  {folders.length === 0 ? 'İlk Promptu Ekle (Klasör Otomatik Oluşur)' : 'Yeni Prompt Ekle'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPrompts.map(prompt => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  folderName={folders.find(f => f.id === prompt.folderId)?.name || 'Genel'}
                  currentUserId={session?.user.id}
                  onEdit={openEditModal}
                  onDelete={handleDeletePrompt}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {session && (
        <PromptForm
          isOpen={isPromptModalOpen}
          onClose={() => setIsPromptModalOpen(false)}
          onSave={handleSavePrompt}
          folders={folders}
          initialData={editingPrompt}
        />
      )}
    </div>
  );
};

export default App;
