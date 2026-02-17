import { useMemo } from 'react';
import { Prompt } from '@/types';
import { Session } from '@supabase/supabase-js';

interface UsePromptFilterProps {
  prompts: Prompt[];
  activeFolderId: string;
  searchQuery: string;
  viewContext: 'personal' | 'community';
  session: Session | null;
}

export const usePromptFilter = ({
  prompts,
  activeFolderId,
  searchQuery,
  viewContext,
  session
}: UsePromptFilterProps) => {
  const filteredPrompts = useMemo(() => {
    let filtered = prompts;

    // 1. Context Filtering (Public vs Private)
    if (viewContext === 'community') {
      filtered = filtered.filter(p => p.isPublic);
    }

    // 2. Folder Filtering
    if (activeFolderId !== 'all') {
      if (activeFolderId === 'public_community') {
        filtered = filtered.filter(p => p.isPublic);
      } else if (activeFolderId === 'my_prompts') {
        filtered = filtered.filter(p => p.userId === session?.user?.id);
      } else {
        const isCommunityView = viewContext === 'community';
        if (isCommunityView) {
          filtered = filtered.filter(p => p.folders?.name === activeFolderId);
        } else {
          filtered = filtered.filter(p => p.folderId === activeFolderId);
        }
      }
    }

    // 3. Search Filtering
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [prompts, activeFolderId, searchQuery, session, viewContext]);

  return filteredPrompts;
};
