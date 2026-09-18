import { isSupabaseReady, supabase } from './supabase';

const BUCKET = 'product-images';

function dataUrlToBlob(dataUrl: string): Blob | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: match[1] });
}

export async function uploadProductImage(image: string, productId: string): Promise<{ success: boolean; url: string; error?: string }> {
  if (!image || !image.startsWith('data:')) return { success: true, url: image };
  if (!isSupabaseReady) return { success: false, url: image, error: 'Supabase غير مُعد' };

  const blob = dataUrlToBlob(image);
  if (!blob) return { success: false, url: image, error: 'صيغة الصورة غير صالحة' };

  const extension = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
  const path = `products/${productId}-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type,
    cacheControl: '31536000',
    upsert: true,
  });
  if (uploadError) return { success: false, url: image, error: uploadError.message };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}
