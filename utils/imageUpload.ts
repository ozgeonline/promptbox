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

/**
 * Supabase Storage'dan görseli siler.
 * URL'den dosya yolunu çıkarır.
 */
export const deletePromptImage = async (imageUrl: string): Promise<void> => {
  // Base64 veya harici URL ise silme işlemi yapma
  if (!imageUrl || imageUrl.startsWith('data:') || !imageUrl.includes(BUCKET_NAME)) {
    return;
  }

  try {
    // URL'den dosya yolunu çıkar
    // Örnek URL: https://xxx.supabase.co/storage/v1/object/public/prompt-images/userId/filename.jpg
    const parts = imageUrl.split(`${BUCKET_NAME}/`);
    if (parts.length < 2) return;

    const filePath = parts[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Görsel silinemedi:', error.message);
    }
  } catch {
    // Silme hatası kritik değil, sessizce geç
  }
};
