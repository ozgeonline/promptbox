import { supabase } from '@/supabaseClient';

interface DeleteResult {
  deletedIds: string[];
  pendingCleanup: number | null;
  warnings: string[];
}

export async function deleteContent(target: 'prompt' | 'folder' | 'cleanup', ids: string[] = []): Promise<DeleteResult> {
  const { data, error } = await supabase.functions.invoke('delete-content', { body: { target, ids } });
  if (error) {
    let message = 'Silme servisine ulaşılamadı. Supabase delete-content fonksiyonunun kurulumunu kontrol edin.';
    if (error.context instanceof Response) {
      const body = await error.context.json().catch(() => null);
      if (typeof body?.error === 'string') message = body.error;
    }
    throw new Error(message);
  }
  if (!data || !Array.isArray(data.deletedIds) || !Array.isArray(data.warnings)) {
    throw new Error('Silme servisinden geçerli yanıt alınamadı. Listeyi yenileyerek kontrol edin.');
  }
  return data as DeleteResult;
}

export function showCleanupWarnings(result: DeleteResult): void {
  if (result.warnings.length > 0) window.alert(result.warnings.join('\n'));
}
