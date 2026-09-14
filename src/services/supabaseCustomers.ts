import { Customer, OrderRecord } from '../types';
import { isSupabaseReady, supabase } from './supabase';

function normalizePhone(phone: string): string {
  const clean = phone.replace(/[^\d+]/g, '');
  if (clean.startsWith('01')) return `+20${clean.slice(1)}`;
  if (clean.startsWith('20')) return `+${clean}`;
  return clean;
}

export function customerAuthPhone(phone: string): string {
  return normalizePhone(phone);
}

export async function sendCustomerOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithOtp({ phone: normalizePhone(phone) });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function verifyCustomerOtp(phone: string, token: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.verifyOtp({ phone: normalizePhone(phone), token, type: 'sms' });
  return error ? { success: false, error: error.message } : { success: true };
}

function customerToRow(customer: Customer) {
  return {
    id: customer.id,
    name: customer.name,
    phone: normalizePhone(customer.phone),
    address: customer.address || '',
    points: customer.points,
    tier: customer.tier,
    total_orders: customer.totalOrders,
    joined_date: customer.joinedDate,
    updated_at: new Date().toISOString(),
  };
}

function rowToCustomer(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    address: row.address || '',
    points: Number(row.points || 0),
    tier: row.tier || 'bronze',
    totalOrders: Number(row.total_orders || 0),
    joinedDate: row.joined_date || new Date().toISOString(),
  };
}

export async function fetchSupabaseCustomer(phone: string): Promise<Customer | null> {
  if (!isSupabaseReady) return null;
  const normalized = normalizePhone(phone);
  const { data, error } = await supabase.from('customers').select('*').eq('phone', normalized).limit(1);
  if (error || !data?.[0]) return null;
  return rowToCustomer(data[0]);
}

export async function upsertSupabaseCustomer(customer: Customer): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady) return { success: false, error: 'Supabase غير مُعد' };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'يجب التحقق من رقم الهاتف أولاً' };
  const { error } = await supabase.from('customers').upsert({ ...customerToRow(customer), user_id: user.id }, { onConflict: 'phone' });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function upsertSupabaseOrder(order: OrderRecord): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady) return { success: false, error: 'Supabase غير مُعد' };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'يجب التحقق من رقم الهاتف أولاً' };
  const { error } = await supabase.from('orders').upsert({
    id: order.id,
    customer_phone: normalizePhone(order.customerPhone),
    customer_name: order.customerName,
    customer_address: order.customerAddress,
    items: order.items,
    total_price: order.totalPrice,
    discount: order.discount,
    points_used: order.pointsUsed,
    points_earned: order.pointsEarned,
    payment_method: order.paymentMethod || null,
    order_date: order.date,
    status: order.status,
    notes: order.notes || '',
    user_id: user.id,
  }, { onConflict: 'id' });
  return error ? { success: false, error: error.message } : { success: true };
}
