import { renderHook } from '@testing-library/react';
import { usePromptFilter } from '@/hooks/usePromptFilter';
import { Prompt } from '@/types';
import { expect, describe, it } from 'vitest';

const mockPrompts: Prompt[] = [
  {
    id: '1',
    title: 'React Introduction',
    content: 'Learn the basics of React components.',
    folderId: 'folder1',
    userId: 'user1',
    isPublic: true,
    createdAt: Date.now(),
    folders: { id: 'folder1', name: 'Frontend' }
  },
  {
    id: '2',
    title: 'Advanced TypeScript',
    content: 'Deep dive into TS generics and utility types.',
    folderId: 'folder2',
    userId: 'user1',
    isPublic: false,
    createdAt: Date.now(),
  },
  {
    id: '3',
    title: 'Python for Beginners',
    content: 'A simple script to say Hello World in Python.',
    folderId: 'folder3',
    userId: 'user2',
    isPublic: true,
    createdAt: Date.now(),
    folders: { id: 'folder3', name: 'Backend' }
  }
];

const mockSession: any = {
  user: {
    id: 'user1'
  }
};

describe('usePromptFilter Hook', () => {

  it('should return all personal prompts when activeFolderId is "all" and viewContext is "personal"', () => {
    const { result } = renderHook(() => usePromptFilter({
      prompts: mockPrompts,
      activeFolderId: 'all',
      searchQuery: '',
      viewContext: 'personal',
      session: mockSession
    }));

    // Expecting all 3 prompts to be returned since the filtering doesn't restrict by user for 'all' in 'personal' unless specifically coded to do so in the component, but the hook itself returns all in this path.
    // Wait, the hook says: if (activeFolderId === 'all') ... if (viewContext === 'community') { filtered = filtered.filter(...) }
    // So for 'personal' it returns all prompts passed to it.
    expect(result.current.length).toBe(3);
  });

  it('should return only public prompts when activeFolderId is "all" and viewContext is "community"', () => {
    const { result } = renderHook(() => usePromptFilter({
      prompts: mockPrompts,
      activeFolderId: 'all',
      searchQuery: '',
      viewContext: 'community',
      session: mockSession
    }));

    expect(result.current.length).toBe(2);
    expect(result.current.some(p => p.id === '2')).toBe(false); // ID 2 is not public
  });

  it('should filter by specific folderId in personal context', () => {
    const { result } = renderHook(() => usePromptFilter({
      prompts: mockPrompts,
      activeFolderId: 'folder2',
      searchQuery: '',
      viewContext: 'personal',
      session: mockSession
    }));

    expect(result.current.length).toBe(1);
    expect(result.current[0].title).toBe('Advanced TypeScript');
  });

  it('should filter items matching the search query ignoring case', () => {
    const { result } = renderHook(() => usePromptFilter({
      prompts: mockPrompts,
      activeFolderId: 'all',
      searchQuery: 'react',
      viewContext: 'personal',
      session: mockSession
    }));

    expect(result.current.length).toBe(1);
    expect(result.current[0].title).toBe('React Introduction');
  });

  it('should filter items by searching in the content', () => {
    const { result } = renderHook(() => usePromptFilter({
      prompts: mockPrompts,
      activeFolderId: 'all',
      searchQuery: 'generics',
      viewContext: 'personal',
      session: mockSession
    }));

    expect(result.current.length).toBe(1);
    expect(result.current[0].id).toBe('2');
  });

});
