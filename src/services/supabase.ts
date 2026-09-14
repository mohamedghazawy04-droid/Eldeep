import { createClient } from '@supabase/supabase-js';

const metaEnv = ((import.meta as unknown) as { env?: Record<string, string | undefined> })?.env || {};

export const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://hcexmqwhvybtuvsduref.supabase.co';
export const supabasePublishableKey =
  metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_WECN_9hIlPR5_rmawGajKw_CWc_mvzc';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } },
});

export const isSupabaseReady = Boolean(supabaseUrl && supabasePublishableKey);

export type SupabaseProductRow = {
  id: string;
  name_ar: string;
  name_en: string;
  category: string;
  price: number;
  old_price?: number | null;
  dosage_form: string;
  active_ingredient: string;
  description: string;
  usage: string;
  requires_prescription: boolean;
  in_stock: boolean;
  points: number;
  image: string;
  tags?: string[] | null;
  is_new?: boolean;
  stock_quantity?: number | null;
  is_low_stock?: boolean;
  is_coming_soon?: boolean;
  updated_at?: string;
};
