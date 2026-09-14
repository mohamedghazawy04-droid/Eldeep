import { isSupabaseReady, supabase } from './supabase';

const LOGO_KEY = 'pharmacy_logo_data_url';

export async function fetchSharedLogo(): Promise<string | null> {
  if (!isSupabaseReady) return null;
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', LOGO_KEY).limit(1);
  if (error || !data?.[0]?.value) return null;
  return data[0].value;
}

export async function saveSharedLogo(value: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady) return { success: false, error: 'Supabase غير مُعد' };
  const { error } = await supabase.from('site_settings').upsert({ key: LOGO_KEY, value, updated_at: new Date().toISOString() });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function clearSharedLogo(): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady) return { success: false, error: 'Supabase غير مُعد' };
  const { error } = await supabase.from('site_settings').delete().eq('key', LOGO_KEY);
  return error ? { success: false, error: error.message } : { success: true };
}
