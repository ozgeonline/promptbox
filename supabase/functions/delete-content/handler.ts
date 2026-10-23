import type { SupabaseClient } from '@supabase/supabase-js';
import { getImageReference, sameImage } from '../_shared/imageReferences.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Dependencies {
  db: SupabaseClient;
  projectUrl: string;
  adminEmails: string[];
  deleteUploadthingFiles: (key: string) => Promise<void>;
}

interface CleanupRow {
  id: string;
  image_url: string;
  owner_id: string | null;
  attempts: number;
}

class RequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function createHandler({ db, projectUrl, adminEmails, deleteUploadthingFiles }: Dependencies) {
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });

  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return json({ error: 'Yalnızca POST destekleniyor.' }, 405);

    try {
      const token = req.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
      if (!token) throw new RequestError(401, 'Giriş yapmanız gerekiyor.');
      const { data: auth, error: authError } = await db.auth.getUser(token);
      if (authError || !auth.user) throw new RequestError(401, 'Oturum doğrulanamadı.');
      const user = auth.user;
      const isAdmin = Boolean(user.email_confirmed_at && user.email
        && adminEmails.includes(user.email.toLowerCase()));

      let body: { target?: string; ids?: unknown };
      try { body = await req.json(); } catch { throw new RequestError(400, 'Geçersiz istek.'); }
      if (!['prompt', 'folder', 'cleanup'].includes(body.target || '')) {
        throw new RequestError(400, 'Geçersiz silme hedefi.');
      }
      let ids: string[] = [];
      if (body.target !== 'cleanup') {
        if (!Array.isArray(body.ids) || body.ids.length === 0 || body.ids.length > 100
          || !body.ids.every(id => typeof id === 'string' && uuid.test(id))) {
          throw new RequestError(400, 'Geçerli kayıt kimlikleri gerekiyor (en fazla 100).');
        }
        ids = [...new Set(body.ids as string[])];
      }

      // Fail before deleting anything if the required queue migration is missing.
      const { error: setupError } = await db.from('prompt_image_cleanup').select('id').limit(0);
      if (setupError) throw new RequestError(503, 'Görsel temizleme kurulumu tamamlanmamış. Hiçbir kayıt silinmedi.');

      let deletedIds: string[] = [];
      if (body.target !== 'cleanup') {
        const table = body.target === 'prompt' ? 'prompts' : 'folders';
        const { data: records, error: recordsError } = await db.from(table).select('id, user_id').in('id', ids);
        if (recordsError) throw new RequestError(500, 'Silinecek kayıtlar okunamadı.');
        if (!records || records.length !== ids.length) throw new RequestError(404, 'Silinecek kayıtlardan biri bulunamadı.');
        if (!isAdmin && records.some(row => row.user_id !== user.id)) {
          throw new RequestError(403, 'Bu kayıtları silme yetkiniz yok.');
        }
        let query = db.from(table).delete().in('id', ids);
        // Owner checks are enforced on the mutation, not on client-provided URLs.
        if (!isAdmin) query = query.eq('user_id', user.id);
        const { data, error } = await query.select('id');
        if (error) throw new RequestError(500, 'Kayıt silinemedi. Lütfen tekrar deneyin.');
        deletedIds = (data || []).map(row => row.id);
        if (deletedIds.length === 0) throw new RequestError(404, 'Kayıt bulunamadı veya silme yetkiniz yok.');
      }

      // The database deletion has committed. From here on, errors must be reported
      // as pending cleanup, never as a failed deletion or an invitation to delete again.
      let pendingCleanup: number | null = null;
      const warnings: string[] = [];
      try {
        let queueQuery = db.from('prompt_image_cleanup').select('id, image_url, owner_id, attempts')
          .order('attempts', { ascending: true }).order('created_at', { ascending: true }).limit(10);
        if (!isAdmin) queueQuery = queueQuery.eq('owner_id', user.id);
        const { data: queue, error: queueError } = await queueQuery;
        if (queueError) throw queueError;

        for (const entry of (queue || []) as CleanupRow[]) {
          try {
            const ref = getImageReference(entry.image_url, projectUrl);
            if (ref) {
              // Legacy UploadThing URLs do not prove who uploaded a file.
              // Only a server-verified administrator may delete those files.
              if (ref.provider === 'uploadthing' && !isAdmin) {
                throw new Error('UploadThing görseli yönetici tarafından temizlenmeli.');
              }
              if (ref.provider === 'supabase' && ref.key.split('/')[0] !== entry.owner_id) {
                throw new Error('Görselin dosya sahibi doğrulanamadı.');
              }

              // Check every matching reference, including private prompts and URL
              // aliases/query strings. Never trust the browser's visible prompt list.
              // Storage paths may be URL-encoded differently. Scan supported
              // storage URLs instead of matching the decoded object key in SQL.
              const fragment = ref.provider === 'uploadthing' ? `/f/${ref.key}` : '/storage/v1/object/public/prompt-images/';
              const pattern = fragment.replace(/[\\%_]/g, char => `\\${char}`);
              let shared = false;
              for (let offset = 0; ; offset += 100) {
                const { data: references, error: referencesError } = await db.from('prompts')
                  .select('image').like('image', `%${pattern}%`).order('id').range(offset, offset + 99);
                if (referencesError) throw referencesError;
                if ((references || []).some(row => sameImage(ref, getImageReference(row.image, projectUrl)))) {
                  shared = true;
                  break;
                }
                if (!references || references.length < 100) break;
              }
              if (!shared) {
                if (ref.provider === 'uploadthing') {
                  await deleteUploadthingFiles(ref.key);
                } else {
                  const { error } = await db.storage.from('prompt-images').remove([ref.key]);
                  if (error) throw error;
                }
              }
            }
            // Protected defaults, Base64, external images and shared files are kept.
            const { error } = await db.from('prompt_image_cleanup').delete().eq('id', entry.id);
            if (error) throw error;
          } catch {
            const { error } = await db.from('prompt_image_cleanup').update({
              attempts: entry.attempts + 1,
              last_error: 'Dosya temizlenemedi; yönetim panelinden tekrar denenebilir.',
            }).eq('id', entry.id);
            if (error) warnings.push('Temizlik durumu güncellenemedi.');
          }
        }

        let countQuery = db.from('prompt_image_cleanup').select('id', { count: 'exact', head: true });
        if (!isAdmin) countQuery = countQuery.eq('owner_id', user.id);
        const { count, error: countError } = await countQuery;
        if (countError) throw countError;
        pendingCleanup = count ?? 0;
        if (pendingCleanup > 0) warnings.push(`${pendingCleanup} görselin temizliği bekliyor. Yönetim panelinden tekrar deneyebilirsiniz.`);
      } catch {
        warnings.push('Kayıt silindi; görsel temizliği tamamlanamadı. Temizlik kuyruğu korundu.');
      }
      return json({ deletedIds, pendingCleanup, warnings });
    } catch (error) {
      if (error instanceof RequestError) return json({ error: error.message }, error.status);
      return json({ error: 'İşlem tamamlanamadı. Lütfen tekrar deneyin.' }, 500);
    }
  };
}
