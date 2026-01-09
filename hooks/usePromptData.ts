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

      // Fetch Folders (Only if logged in)
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

      // Fetch Prompts (Logic: My Prompts OR Public Prompts)
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
        setError('An error occurred while uploading the data.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Initial Fetch & Refetch on Session Change
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Derived Community Folders (Grouped by Name)
  const communityFolders = useMemo(() => {
    const publicPrompts = prompts.filter(p => p.isPublic && p.folders);
    const uniqueFoldersMap = new Map();

    publicPrompts.forEach(p => {
      if (p.folders) {
        // Group by NAME instead of ID to avoid duplicate "Genel" folders
        // We use the name as the key, but we need an ID for the UI key.
        // We can use the name as the ID for these "virtual" folders or just pick the first ID found.
        if (!uniqueFoldersMap.has(p.folders.name)) {
          uniqueFoldersMap.set(p.folders.name, {
            id: p.folders.name, // Use NAME as ID for grouping in UI
            name: p.folders.name
          });
        }
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
