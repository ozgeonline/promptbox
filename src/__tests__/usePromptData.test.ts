import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { usePromptData } from '@/hooks/usePromptData';

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/supabaseClient', () => ({ supabase: { from: mocks.from } }));

interface QueryResult { data: Record<string, unknown>[] | null; error: { message: string } | null }
interface PendingQuery { table: string; resolve: (value: QueryResult) => void }
let pending: PendingQuery[];

const sessionFor = (id: string) => ({ user: { id } }) as Session;
const prompt = (id: string, userId: string) => ({
  id, title: id, content: 'Prompt content', user_id: userId,
  folder_id: 'folder', is_public: false, created_at: '2026-01-01',
});
const complete = async (query: PendingQuery, data: Record<string, unknown>[]) => {
  await act(async () => { query.resolve({ data, error: null }); });
};

beforeEach(() => {
  pending = [];
  mocks.from.mockReset();
  mocks.from.mockImplementation((table: string) => {
    let resolve!: PendingQuery['resolve'];
    const promise = new Promise<QueryResult>(done => { resolve = done; });
    pending.push({ table, resolve });
    const builder = {
      select: () => builder,
      eq: () => builder,
      or: () => builder,
      order: () => builder,
      then: promise.then.bind(promise),
    };
    return builder;
  });
});

describe('prompt loading across authentication changes', () => {
  it('waits for authentication and keeps loading until both folders and prompts are ready', async () => {
    const { result, rerender } = renderHook(
      ({ session, authLoading }) => usePromptData(session, authLoading),
      { initialProps: { session: null as Session | null, authLoading: true } },
    );
    expect(result.current.isLoading).toBe(true);
    expect(mocks.from).not.toHaveBeenCalled();

    rerender({ session: sessionFor('user-a'), authLoading: false });
    expect(pending[0].table).toBe('folders');
    await complete(pending[0], [{ id: 'folder', name: 'My folder' }]);
    expect(pending[1].table).toBe('prompts');
    expect(result.current.isLoading).toBe(true);

    await complete(pending[1], [prompt('My prompt', 'user-a')]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.prompts[0].title).toBe('My prompt');
    expect(result.current.folders[0].name).toBe('My folder');
  });

  it('does not let a guest request stop the logged-in user’s loading indicator', async () => {
    const { result, rerender } = renderHook(({ session }) => usePromptData(session), {
      initialProps: { session: null as Session | null },
    });
    const guestRequest = pending[0];
    rerender({ session: sessionFor('user-a') });

    await complete(guestRequest, [prompt('Guest result', 'someone-else')]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.prompts).toEqual([]);

    await complete(pending[1], []);
    await complete(pending[2], [prompt('My prompt', 'user-a')]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.prompts.map(item => item.title)).toEqual(['My prompt']);
  });

  it('ignores another account’s late response after the current account has finished loading', async () => {
    const { result, rerender } = renderHook(({ session }) => usePromptData(session), {
      initialProps: { session: sessionFor('user-a') },
    });
    await complete(pending[0], []);
    const oldUserRequest = pending[1];
    rerender({ session: sessionFor('user-b') });
    await complete(pending[2], []);
    await complete(pending[3], [prompt('User B prompt', 'user-b')]);
    await complete(oldUserRequest, [prompt('User A prompt', 'user-a')]);

    expect(result.current.isLoading).toBe(false);
    expect(result.current.prompts.map(item => item.title)).toEqual(['User B prompt']);
  });

  it('hides previous private data as soon as the user signs out', async () => {
    const { result, rerender } = renderHook(({ session }) => usePromptData(session), {
      initialProps: { session: sessionFor('user-a') as Session | null },
    });
    await complete(pending[0], [{ id: 'folder', name: 'Private folder' }]);
    await complete(pending[1], [prompt('Private prompt', 'user-a')]);
    rerender({ session: null });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.prompts).toEqual([]);
    expect(result.current.folders).toEqual([]);
    await complete(pending[2], []);
    expect(result.current.isLoading).toBe(false);
  });

  it('stops loading and exposes a fetch error instead of leaving the spinner running', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { result } = renderHook(() => usePromptData(sessionFor('user-a')));
      await act(async () => { pending[0].resolve({ data: null, error: { message: 'Failed to fetch' } }); });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('İnternet bağlantınızı kontrol edin.');
      expect(result.current.prompts).toEqual([]);
    } finally {
      consoleError.mockRestore();
    }
  });
});
