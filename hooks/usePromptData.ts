import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Prompt, Folder } from '@/types';

export const usePromptData = (session: Session | null, isAuthLoading = false) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  // undefined means no request has finished; null identifies the guest account.
  const [loadedUserId, setLoadedUserId] = useState<string | null | undefined>(undefined);
  const requestVersion = useRef(0);
  const userId = session?.user.id ?? null;
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (showLoading = true) => {
    if (isAuthLoading) return;
    const version = ++requestVersion.current;
    const isCurrentRequest = () => version === requestVersion.current;
    try {
      if (showLoading) setIsFetching(true);
      setError(null);

      // Fetch Folders (Only if logged in)
      let foldersData: any[] = [];
      if (userId) {
        const { data, error: foldersError } = await supabase
          .from('folders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (!isCurrentRequest()) return;
        if (foldersError) throw foldersError;
        foldersData = data || [];
      }

      // Fetch Prompts (My Prompts OR Public Prompts)
      let query = supabase
        .from('prompts')
        .select('*, folders(id, name), comments(count)')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.or(`user_id.eq.${userId},is_public.eq.true`);
      } else {
        query = query.eq('is_public', true);
      }

      const { data: promptsData, error: promptsError } = await query;
      if (!isCurrentRequest()) return;

      if (promptsError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Supabase Query Error:', promptsError?.message || 'Bilinmeyen hata');
        }

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
        commentCount: p.comments && Array.isArray(p.comments) ? p.comments[0]?.count || 0 : p.comments?.count || 0,
        createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
        folders: p.folders
      }));

      setFolders(foldersData);
      setPrompts(formattedPrompts);

    } catch (err: any) {
      if (!isCurrentRequest()) return;
      if (process.env.NODE_ENV === 'development') {
        console.error('Data fetch error:', err?.message || 'Bilinmeyen hata');
      }

      let userMessage = 'Veriler yüklenirken bir sorun oluştu.';
      if (err.message === 'Failed to fetch') {
        userMessage = 'İnternet bağlantınızı kontrol edin.';
      }

      if (err.code !== 'PGRST116') {
        setError(userMessage);
      }
      setFolders([]);
      setPrompts([]);
    } finally {
      if (isCurrentRequest()) {
        setLoadedUserId(userId);
        setIsFetching(false);
      }
    }
  }, [userId, isAuthLoading]);

  // Initial Fetch & Refetch on Session Change
  useEffect(() => {
    fetchData(true);
    // A previous account's response must not overwrite the current account or
    // end its loading indicator. Also ignore responses after unmounting.
    return () => { requestVersion.current++; };
  }, [fetchData]);

  const hasCurrentData = loadedUserId === userId;
  const currentFolders = useMemo(() => hasCurrentData ? folders : [], [hasCurrentData, folders]);
  const currentPrompts = useMemo(() => hasCurrentData ? prompts : [], [hasCurrentData, prompts]);
  const isLoading = isAuthLoading || isFetching || !hasCurrentData;

  const updateCommentCount = useCallback((promptId: string, countChange: number) => {
    setPrompts(prev => prev.map(p =>
      p.id === promptId
        ? { ...p, commentCount: Math.max(0, (p.commentCount || 0) + countChange) }
        : p
    ));
  }, []);

  // Derived Community Folders (Grouped by Name)
  const communityFolders = useMemo(() => {
    const publicPrompts = currentPrompts.filter(p => p.isPublic && p.folders);
    const uniqueFoldersMap = new Map();

    publicPrompts.forEach(p => {
      if (p.folders) {
        //*** Grouping by NAME instead of ID to prevent duplicate folders.
        if (!uniqueFoldersMap.has(p.folders.name)) {
          uniqueFoldersMap.set(p.folders.name, {
            id: p.folders.name,
            name: p.folders.name
          });
        }
      }
    });

    return Array.from(uniqueFoldersMap.values());
  }, [currentPrompts]);

  return {
    folders: currentFolders,
    setFolders,
    prompts: currentPrompts,
    setPrompts,
    communityFolders,
    isLoading,
    error: hasCurrentData ? error : null,
    refreshData: fetchData,
    updateCommentCount
  };
};
