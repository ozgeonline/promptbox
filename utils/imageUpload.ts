import { supabase } from '@/supabaseClient';

const BUCKET_NAME = 'prompt-images';

/**
 * Supabase Storage'a görsel yükler ve public URL döndürür.
 */
export const uploadPromptImage = async (
  file: File,
  userId: string
): Promise<string> => {
  // Unique dosya adı: userId/timestamp_random.ext
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Görsel yüklenemedi: ${error.message}`);
  }

  // Public URL al
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return data.publicUrl;
};
