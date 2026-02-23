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

    // 1.Folder Filtering
    if (activeFolderId === 'all') {
      // Show all for personal, or public for community
      if (viewContext === 'community') {
        filtered = filtered.filter(p => p.isPublic);
      }
    } else {
      if (activeFolderId === 'public_community') {
        filtered = filtered.filter(p => p.isPublic);
      } else if (activeFolderId === 'my_prompts') {
        filtered = filtered.filter(p => p.userId === session?.user?.id);
      } else {
        // Specific Folder
        filtered = filtered.filter(p => {
          let match = false;

          if (viewContext === 'community') {
            // Community folders use Name as their identifier. 
            // The folderId is also checked in case of future architectural changes.
            match = (p.folders?.name === activeFolderId) || (p.folderId === activeFolderId);
          } else {
            // Personal folders always use UUID
            match = p.folderId === activeFolderId;
          }

          return match;
        });
      }
    }

    // 2.Search Filtering
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query)
      );
    }

    // console.log('Filtered Count:', filtered.length);
    return filtered;
  }, [prompts, activeFolderId, searchQuery, session, viewContext]);

  return filteredPrompts;
};
