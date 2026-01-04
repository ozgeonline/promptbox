import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Supabase URL ve Key bulunamadı. Lütfen .env dosyasını veya Vercel ayarlarını kontrol edin.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
