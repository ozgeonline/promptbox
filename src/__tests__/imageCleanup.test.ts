import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createHandler } from '../../supabase/functions/delete-content/handler';
import { DEFAULT_IMAGE_URL, getImageReference } from '../../supabase/functions/_shared/imageReferences';

const projectUrl = 'https://project.supabase.co';
const owner = '11111111-1111-1111-1111-111111111111';
const promptId = '22222222-2222-2222-2222-222222222222';
const folderId = '33333333-3333-3333-3333-333333333333';
const otherId = '44444444-4444-4444-4444-444444444444';
const uploadthingImage = 'https://app.ufs.sh/f/example_image.png';

interface Row { id: string; user_id?: string; folder_id?: string; image?: string; image_url?: string; owner_id?: string; attempts?: number }

function setup(image = uploadthingImage, admin = true) {
  const state: Record<string, Row[]> = {
    prompts: [{ id: promptId, user_id: owner, folder_id: folderId, image }],
    folders: [{ id: folderId, user_id: owner }],
    prompt_image_cleanup: [],
  };
  const events: string[] = [];
  let queueAvailable = true;
  const removeStorage = vi.fn(async () => { events.push('storage'); return { error: null }; });
  const deleteUploadthingFiles = vi.fn(async () => { events.push('uploadthing'); });
  const getUser = vi.fn(async () => ({
    data: { user: { id: owner, email: 'admin@example.com', email_confirmed_at: '2026-01-01' } }, error: null,
  }));

  function enqueue(rows: Row[]) {
    for (const row of rows) if (row.image?.startsWith('https://')) {
      state.prompt_image_cleanup.push({
        id: `queue-${state.prompt_image_cleanup.length}`, image_url: row.image, owner_id: row.user_id, attempts: 0,
      });
    }
  }

  const from = (table: string) => {
    let operation = 'read';
    let patch: object = {};
    let cap = Infinity;
    let start = 0;
    let countOnly = false;
    const filters: ((row: Row) => boolean)[] = [];
    const query = {
      select(_columns?: string, options?: { head?: boolean }) { countOnly = options?.head || false; return query; },
      delete() { operation = 'delete'; return query; },
      update(value: object) { operation = 'update'; patch = value; return query; },
      in(key: string, values: string[]) { filters.push(row => values.includes((row as unknown as Record<string, string>)[key])); return query; },
      eq(key: string, value: string) { filters.push(row => (row as unknown as Record<string, string>)[key] === value); return query; },
      like(key: string, pattern: string) {
        const fragment = pattern.slice(1, -1).replace(/\\([\\%_])/g, '$1');
        filters.push(row => String((row as unknown as Record<string, string>)[key] || '').includes(fragment));
        return query;
      },
      order() { return query; },
      limit(value: number) { cap = value; return query; },
      range(first: number, last: number) { start = first; cap = last - first + 1; return query; },
      then(resolve: (result: unknown) => unknown) {
        if (table === 'prompt_image_cleanup' && !queueAvailable) {
          return Promise.resolve({ data: null, error: { message: 'missing table' } }).then(resolve);
        }
        const matches = state[table].filter(row => filters.every(filter => filter(row)));
        const rows = matches.slice(start, start + cap);
        if (operation === 'delete') {
          events.push(`delete:${table}`);
          if (table === 'prompts') enqueue(rows);
          if (table === 'folders') {
            const prompts = state.prompts.filter(row => rows.some(folder => folder.id === row.folder_id));
            enqueue(prompts);
            state.prompts = state.prompts.filter(row => !prompts.includes(row));
          }
          state[table] = state[table].filter(row => !rows.includes(row));
        } else if (operation === 'update') rows.forEach(row => Object.assign(row, patch));
        return Promise.resolve({ data: countOnly ? null : rows, count: matches.length, error: null }).then(resolve);
      },
    };
    return query;
  };

  const handler = createHandler({
    db: { from, auth: { getUser }, storage: { from: () => ({ remove: removeStorage }) } } as unknown as SupabaseClient,
    projectUrl,
    adminEmails: admin ? ['admin@example.com'] : [],
    deleteUploadthingFiles,
  });
  const request = (target = 'prompt', ids = [promptId], authenticated = true) => handler(new Request('https://function.test', {
    method: 'POST',
    headers: authenticated ? { Authorization: 'Bearer valid-user-token', 'Content-Type': 'application/json' } : {},
    body: JSON.stringify({ target, ids }),
  }));
  return { state, events, removeStorage, deleteUploadthingFiles, request, getUser, disableQueue: () => { queueAvailable = false; } };
}

describe('image reference safety', () => {
  it('protects the default file across provider aliases and query strings', () => {
    expect(getImageReference(DEFAULT_IMAGE_URL, projectUrl)).toBeNull();
    expect(getImageReference(DEFAULT_IMAGE_URL.replace('9gdj1dewg7.ufs.sh', 'utfs.io') + '?download=1', projectUrl)).toBeNull();
  });

  it.each([
    'data:image/png;base64,example',
    'https://app.ufs.sh.evil.test/f/example.png',
    'https://evil.test/storage/v1/object/public/prompt-images/user/image.png',
    'https://project.supabase.co/storage/v1/object/public/prompt-images/user/%2e%2e%2fimage.png',
    'https://app.ufs.sh/f/key/extra',
  ])('does not attempt to delete unsupported or unsafe images: %s', image => {
    expect(getImageReference(image, projectUrl)).toBeNull();
  });
});

describe('server-side deletion and file cleanup', () => {
  it('rejects unauthenticated requests without touching any records or files', async () => {
    const test = setup();
    expect((await test.request('prompt', [promptId], false)).status).toBe(401);
    expect(test.events).toEqual([]);
  });

  it('does not grant admin access based on a client claim or an unconfirmed email', async () => {
    const test = setup();
    test.getUser.mockResolvedValueOnce({ data: { user: { id: otherId, email: 'admin@example.com', email_confirmed_at: '' } }, error: null });
    expect((await test.request()).status).toBe(403);
    expect(test.state.prompts).toHaveLength(1);
    expect(test.deleteUploadthingFiles).not.toHaveBeenCalled();
  });

  it('fails closed when the cleanup migration is missing', async () => {
    const test = setup();
    test.disableQueue();
    expect((await test.request()).status).toBe(503);
    expect(test.events).toEqual([]);
  });

  it('rejects a mixed batch containing someone else’s record before deleting any rows', async () => {
    const test = setup(uploadthingImage, false);
    test.state.prompts.push({ id: otherId, user_id: otherId, image: uploadthingImage });
    expect((await test.request('prompt', [promptId, otherId])).status).toBe(403);
    expect(test.events).toEqual([]);
    expect(test.state.prompts).toHaveLength(2);
  });

  it('deletes the prompt before deleting its UploadThing file', async () => {
    const test = setup();
    const response = await test.request();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ deletedIds: [promptId], pendingCleanup: 0, warnings: [] });
    expect(test.deleteUploadthingFiles).toHaveBeenCalledWith('example_image.png');
    expect(test.events.indexOf('delete:prompts')).toBeLessThan(test.events.indexOf('uploadthing'));
  });

  it('keeps a failed file cleanup queued and retries without re-deleting the prompt', async () => {
    const test = setup();
    test.deleteUploadthingFiles.mockRejectedValueOnce(new Error('service unavailable'));
    expect(await (await test.request()).json()).toMatchObject({ deletedIds: [promptId], pendingCleanup: 1 });
    expect(test.state.prompt_image_cleanup).toHaveLength(1);
    expect(test.state.prompt_image_cleanup[0].attempts).toBe(1);
    expect(await (await test.request('cleanup', [])).json()).toMatchObject({ pendingCleanup: 0 });
    expect(test.deleteUploadthingFiles).toHaveBeenCalledTimes(2);
  });

  it('preserves a shared UploadThing file referenced through a different hostname', async () => {
    const test = setup();
    test.state.prompts.push({ id: otherId, user_id: otherId, image: 'https://utfs.io/f/example_image.png?download=1' });
    await test.request();
    expect(test.deleteUploadthingFiles).not.toHaveBeenCalled();
    expect(test.state.prompt_image_cleanup).toHaveLength(0);
  });

  it.each([DEFAULT_IMAGE_URL, 'data:image/png;base64,example'])('preserves protected images: %s', async image => {
    const test = setup(image);
    await test.request();
    expect(test.deleteUploadthingFiles).not.toHaveBeenCalled();
    expect(test.removeStorage).not.toHaveBeenCalled();
  });

  it('cleans the owning user’s Supabase file after deleting a folder', async () => {
    const test = setup(`${projectUrl}/storage/v1/object/public/prompt-images/${owner}/image.png`, false);
    const response = await test.request('folder', [folderId]);
    expect(response.status).toBe(200);
    expect(test.state.prompts).toHaveLength(0);
    expect(test.removeStorage).toHaveBeenCalledWith([`${owner}/image.png`]);
  });

  it('preserves shared Supabase files even when the stored URLs encode a filename differently', async () => {
    const image = `${projectUrl}/storage/v1/object/public/prompt-images/${owner}/my%20image.png`;
    const test = setup(image);
    test.state.prompts.push({ id: otherId, user_id: owner, image: image.replace('%20', ' ') });
    await test.request();
    expect(test.removeStorage).not.toHaveBeenCalled();
    expect(test.state.prompt_image_cleanup).toHaveLength(0);
  });

  it('keeps legacy UploadThing cleanup for an administrator when an ordinary user deletes a prompt', async () => {
    const test = setup(uploadthingImage, false);
    const response = await test.request();
    expect(await response.json()).toMatchObject({ deletedIds: [promptId], pendingCleanup: 1 });
    expect(test.deleteUploadthingFiles).not.toHaveBeenCalled();
  });

  it('never deletes a Supabase object belonging to another user even for an administrator', async () => {
    const test = setup(`${projectUrl}/storage/v1/object/public/prompt-images/${otherId}/image.png`);
    await test.request();
    expect(test.removeStorage).not.toHaveBeenCalled();
    expect(test.state.prompt_image_cleanup).toHaveLength(1);
  });
});
