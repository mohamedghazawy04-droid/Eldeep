import { AppNotification } from '../types';
import { isSupabaseReady, supabase } from './supabase';

const TABLE = 'notifications';

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  type: AppNotification['type'];
  product_id?: string | null;
  created_at: string;
};

function rowToNotification(row: NotificationRow): AppNotification {
  const timestamp = new Date(row.created_at).getTime();
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    date: row.created_at,
    read: false,
    type: row.type,
    productId: row.product_id || undefined,
    timestamp,
  };
}

export async function createSupabaseNotification(input: {
  title: string;
  message: string;
  type?: AppNotification['type'];
  productId?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady) return { success: false, error: 'Supabase غير مُعد' };
  const { error } = await supabase.from(TABLE).insert({
    id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title,
    message: input.message,
    type: input.type || 'new_product',
    product_id: input.productId || null,
  });
  return error ? { success: false, error: error.message } : { success: true };
}

export function subscribeToSupabaseNotifications(
  onUpdate: (notifications: AppNotification[]) => void
): () => void {
  if (!isSupabaseReady) return () => {};
  let active = true;
  const load = async () => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && active) onUpdate((data || []).map((row) => rowToNotification(row as NotificationRow)));
  };
  load().catch(() => {});
  const channel = supabase
    .channel('public-notifications')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLE }, () => {
      load().catch(() => {});
    })
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

export function mergeCloudNotifications(
  cloud: AppNotification[],
  local: AppNotification[]
): AppNotification[] {
  const merged = new Map<string, AppNotification>();
  [...cloud, ...local].forEach((notification) => merged.set(notification.id, notification));
  return Array.from(merged.values())
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 50);
}
