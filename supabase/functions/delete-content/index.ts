import { createClient } from '@supabase/supabase-js';
import { UTApi } from 'uploadthing/server';
import { createHandler } from './handler.ts';

const projectUrl = Deno.env.get('SUPABASE_URL')!;
const db = createClient(projectUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve(createHandler({
  db,
  projectUrl,
  adminEmails: (Deno.env.get('ADMIN_EMAILS') || '').split(',').map(email => email.trim().toLowerCase()).filter(Boolean),
  deleteUploadthingFiles: async key => {
    const token = Deno.env.get('UPLOADTHING_TOKEN');
    if (!token) throw new Error('UPLOADTHING_TOKEN tanımlı değil.');
    const result = await new UTApi({
      token,
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5000) }),
    }).deleteFiles(key);
    if (!result.success) throw new Error('UploadThing dosyayı silemedi.');
  },
}));
