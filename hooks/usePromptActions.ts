import React from 'react';
import { supabase } from '@/supabaseClient';
import { Prompt, Folder } from '@/types';
import { Session } from '@supabase/supabase-js';

interface UsePromptActionsProps {
  session: Session | null;
  folders: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  prompts: Prompt[];
  setPrompts: React.Dispatch<React.SetStateAction<Prompt[]>>;
}

export const usePromptActions = ({
  session,
  folders,
  setFolders,
  prompts,
  setPrompts
}: UsePromptActionsProps) => {

  const handleCreateFolder =
    async (e: React.FormEvent, newFolderName: string, onSuccess: () => void) => {
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
        onSuccess();
      } catch (err: any) {
        alert(`Klasör oluşturulamadı: ${err.message}`);
      }
    };

  const handleDeleteFolder =
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!session) return false;

      if (!window.confirm('Bu klasörü ve içindeki tüm promptları silmek istediğinize emin misiniz?')) {
        return false;
      }

      try {
        const { error } = await supabase
          .from('folders')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setFolders(prev => prev.filter(f => f.id !== id));
        setPrompts(prev => prev.filter(p => p.folderId !== id));

        return true; // Indicate success
      } catch (err: any) {
        alert(`Silme işlemi başarısız: ${err.message}`);
        return false;
      }
    };

  const handleSavePrompt =
    async (promptData: Omit<Prompt, 'id' | 'createdAt' | 'userId'> & { id?: string }) => {
      if (!session) {
        alert("Prompt oluşturmak için giriş yapmalısınız.");
        return null;
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

        // Default image URL if none provided
        const DEFAULT_IMAGE_URL =
          'https://9gdj1dewg7.ufs.sh/f/MzCIEEnlPGFDqLuejTAO6xTMuqHPGhbIk5NKF8ARWaVQnU1J';

        const payload = {
          title: promptData.title,
          content: promptData.content,
          folder_id: targetFolderId,
          image: promptData.image || DEFAULT_IMAGE_URL,
          is_public: promptData.isPublic,
          user_id: session.user.id
        };

        if (promptData.id) {
          // Update
          const { data, error } = await supabase
            .from('prompts')
            .update(payload)
            .eq('id', promptData.id)
            .select('*, folders(id, name)') // Fetch joined data
            .single();

          if (error) throw error;

          setPrompts(prompts.map(p => p.id === promptData.id ? {
            ...p,
            title: data.title,
            content: data.content,
            folderId: data.folder_id,
            image: data.image,
            isPublic: data.is_public,
            folders: data.folders
          } : p));

          return {
            promptId: data.id,
            folderId: targetFolderId,
            isPublic: data.is_public
          };

        } else {
          // Create
          const { data, error } = await supabase
            .from('prompts')
            .insert([payload])
            .select('*, folders(id, name)')
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
            createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
            folders: data.folders
          };

          setPrompts([newPrompt, ...prompts]);

          return {
            promptId: data.id,
            folderId: targetFolderId,
            isPublic: data.is_public
          };
        }
      } catch (err: any) {
        alert(`Kayıt başarısız: ${err.message}`);
        throw err;
      }
    };

  const handleDeletePrompt =
    async (id: string) => {
      if (!window.confirm('Bu promptu silmek istediğinize emin misiniz?')) return false;

      try {
        const { error } = await supabase
          .from('prompts')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setPrompts(prompts.filter(p => p.id !== id));
        return true;
      } catch (err: any) {
        alert(`Silme başarısız: ${err.message}`);
        return false;
      }
    };

  return {
    handleCreateFolder,
    handleDeleteFolder,
    handleSavePrompt,
    handleDeletePrompt
  };
};
