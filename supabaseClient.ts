import { createClient } from '@supabase/supabase-js';

// Vercel'de Environment Variables (Çevre Değişkenleri) kullanacağız.
// Kodun içine API key gömmek güvenlik açığı oluşturabilir.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase URL ve Key bulunamadı. Lütfen .env dosyasını veya Vercel ayarlarını kontrol edin.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
