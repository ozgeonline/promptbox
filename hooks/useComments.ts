import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Comment } from '@/types';
import { useAuthContext } from '@/context';

export const useComments = (promptId: string | null) => {
  const { session } = useAuthContext();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!promptId) {
      setComments([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          prompt_id,
          user_id,
          content,
          created_at,
          profiles:user_id (id, username, birthdate)
        `)
        .eq('prompt_id', promptId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Post-process to ensure profiles is correctly mapped (Supabase typing quirk)
      const formattedData = (data as any[]).map(item => ({
        ...item,
        profiles: item.profiles
          ? (Array.isArray(item.profiles)
            ? item.profiles[0]
            : item.profiles)
          : null
      })) as Comment[];

      setComments(formattedData);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching comments:', err);
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [promptId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (content: string) => {
    if (!session?.user?.id || !promptId) return { success: false, error: 'User not logged in or prompt missing' };

    setLoading(true);
    setError(null);
    try {
      const { data: insertedData, error: insertError } = await supabase
        .from('comments')
        .insert([{
          prompt_id: promptId,
          user_id: session.user.id,
          content: content.trim()
        }])
        .select(`
          id,
          prompt_id,
          user_id,
          content,
          created_at,
          profiles:user_id (id, username, birthdate)
        `)
        .single();

      if (insertError) throw insertError;

      const newComment = {
        ...insertedData,
        profiles: insertedData.profiles
          ? (Array.isArray(insertedData.profiles)
            ? insertedData.profiles[0]
            : insertedData.profiles)
          : null
      } as unknown as Comment;

      setComments(prev => [newComment, ...prev]);
      return { success: true, data: newComment };
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error adding comment:', err);
      }
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!session?.user?.id) return { success: false, error: 'User not logged in' };

    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', session.user.id);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
      return { success: true };
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting comment:', err);
      }
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    comments,
    loading,
    error,
    addComment,
    deleteComment,
    refreshComments: fetchComments
  };
};
