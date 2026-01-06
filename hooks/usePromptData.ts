import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Prompt, Folder } from '../types';

export const usePromptData = (session: Session | null) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);

      // 1. Fetch Folders (Only if logged in)
      let foldersData: any[] = [];
      if (session) {
        const { data, error: foldersError } = await supabase
          .from('folders')
          .select('*')
          .order('created_at', { ascending: true });

        if (foldersError) throw foldersError;
        foldersData = data || [];
      }

      setFolders(foldersData);

      // 2. Fetch Prompts (Logic: My Prompts OR Public Prompts)
      // Including joined folders data
      let query = supabase
        .from('prompts')
        .select('*, folders(id, name)')
        .order('created_at', { ascending: false });

      if (session) {
        query = query.or(`user_id.eq.${session.user.id},is_public.eq.true`);
      } else {
        query = query.eq('is_public', true);
      }

      const { data: promptsData, error: promptsError } = await query;

      if (promptsError) {
        console.error('Supabase Query Error:', promptsError);
        throw promptsError;
      }

      // Normalize data
      const formattedPrompts: Prompt[] = (promptsData || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        folderId: p.folder_id,
        image: p.image,
        userId: p.user_id,
        isPublic: p.is_public,
        createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
        folders: p.folders
      }));

      setPrompts(formattedPrompts);

    } catch (err: any) {
      console.error('Data fetch error:', err);
      if (err.code !== 'PGRST116') {
        setError('Veriler yüklenirken bir hata oluştu.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Initial Fetch & Refetch on Session Change
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Derived Community Folders
  const communityFolders = useMemo(() => {
    const publicPrompts = prompts.filter(p => p.isPublic && p.folders);
    const uniqueFoldersMap = new Map();

    publicPrompts.forEach(p => {
      if (p.folders) {
        uniqueFoldersMap.set(p.folders.id, {
          id: p.folders.id,
          name: p.folders.name
        });
      }
    });

    return Array.from(uniqueFoldersMap.values());
  }, [prompts]);

  return {
    folders,
    setFolders,
    prompts,
    setPrompts,
    communityFolders,
    isLoading,
    error,
    refreshData: fetchData
  };
};
