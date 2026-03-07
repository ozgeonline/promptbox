import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { Prompt, Folder } from '@/types';
import { useAuthContext } from '@/context/AuthContext';


export const useAdminData = () => {
  const { session, isAdmin } = useAuthContext();
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    if (!isAdmin || !session) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all folders
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: false });

      if (foldersError) throw foldersError;
      setAllFolders(foldersData || []);

      // Fetch all prompts
      const { data: promptsData, error: promptsError } = await supabase
        .from('prompts')
        .select('*, folders(id, name)')
        .order('created_at', { ascending: false });

      if (promptsError) throw promptsError;

      const formattedPrompts: Prompt[] = (promptsData || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        folderId: p.folder_id,
        image: p.image,
        userId: p.user_id,
        userEmail: p.profiles?.email || 'Bilinmiyor',
        userName: p.profiles?.full_name || 'Bilinmiyor',
        isPublic: p.is_public,
        createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
        folders: p.folders
      }));

      setAllPrompts(formattedPrompts);

      // Group folders by name
      const rawFolders = foldersData || [];
      const groupedFoldersMap = new Map<string, any>();

      rawFolders.forEach((f: any) => {
        if (!groupedFoldersMap.has(f.name)) {
          groupedFoldersMap.set(f.name, {
            id: f.name, // Use name as UI ID since we're grouping by name
            name: f.name,
            originalIds: [f.id],
            promptCount: 0
          });
        } else {
          groupedFoldersMap.get(f.name).originalIds.push(f.id);
        }
      });

      // Calculate prompt counts per grouped folder
      formattedPrompts.forEach(p => {
        if (p.folders?.name && groupedFoldersMap.has(p.folders.name)) {
          groupedFoldersMap.get(p.folders.name).promptCount += 1;
        }
      });

      setAllFolders(Array.from(groupedFoldersMap.values()));

    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Admin Fetch Error:', err);
      }

      setError('Admin verileri yüklenirken bir hata oluştu...');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, session]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleAdminDeletePrompt = async (id: string) => {
    if (!isAdmin) return false;
    if (!window.confirm("Bu promptu silmek istediğinize emin misiniz? (Tüm kullanıcılardan silinecek)")) return false;

    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAllPrompts(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Prompt silinemedi:', err);
      }
      setError('Prompt silinemedi...');
      return false;
    }
  };

  const handleAdminDeleteFolder = async (folderName: string, originalIds: string[]) => {
    if (!isAdmin) return false;
    const hasPrompts = (allFolders.find(f => f.name === folderName) as any)?.promptCount > 0;
    const confirmMessage = hasPrompts
      ? `"${folderName}" isimli klasörü (ve tüm kullanıcılardaki kopyaları ile İÇİNDEKİ TÜM PROMPTLARI) silmek istediğinize emin misiniz?`
      : `"${folderName}" isimli klasörü silmek istediğinize emin misiniz?`;

    if (!window.confirm(confirmMessage)) return false;

    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .in('id', originalIds);

      if (error) throw error;

      // Update UI state
      setAllFolders(prev => prev.filter(f => f.name !== folderName));
      // Remove all prompts that belonged to this grouping
      setAllPrompts(prev => prev.filter(p => p.folders?.name !== folderName));

      return true;
    } catch (err: any) {
      alert(`Klasör silinemedi...`);
      if (process.env.NODE_ENV === 'development') {
        console.error('Klasör silinemedi:', err.message);
      }
      return false;
    }
  };

  return {
    allFolders,
    allPrompts,
    isLoading,
    error,
    refreshAdminData: fetchAdminData,
    handleAdminDeletePrompt,
    handleAdminDeleteFolder
  };
};
