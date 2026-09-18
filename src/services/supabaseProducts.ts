import { Product } from '../types';
import { isSupabaseReady, supabase, SupabaseProductRow } from './supabase';

const TABLE = 'products';

export function productToSupabaseRow(product: Product): SupabaseProductRow {
  return {
    id: product.id,
    name_ar: product.nameAr,
    name_en: product.nameEn,
    category: product.category,
    price: product.price,
    old_price: product.oldPrice ?? null,
    dosage_form: product.dosageForm,
    active_ingredient: product.activeIngredient,
    description: product.description,
    usage: product.usage,
    requires_prescription: product.requiresPrescription,
    in_stock: product.inStock,
    points: product.points,
    image: product.image,
    tags: product.tags ?? null,
    is_new: product.isNew ?? false,
    stock_quantity: product.stockQuantity ?? null,
    is_low_stock: product.isLowStock ?? false,
    is_coming_soon: product.isComingSoon ?? false,
    updated_at: new Date().toISOString(),
  };
}

export function supabaseRowToProduct(row: SupabaseProductRow): Product {
  return {
    id: row.id,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    category: row.category as Product['category'],
    price: Number(row.price || 0),
    oldPrice: row.old_price == null ? undefined : Number(row.old_price),
    dosageForm: row.dosage_form || '',
    activeIngredient: row.active_ingredient || '',
    description: row.description || '',
    usage: row.usage || '',
    requiresPrescription: Boolean(row.requires_prescription),
    inStock: Boolean(row.in_stock),
    points: Number(row.points || 0),
    image: row.image || '',
    tags: row.tags || undefined,
    isNew: Boolean(row.is_new),
    stockQuantity: row.stock_quantity == null ? undefined : Number(row.stock_quantity),
    isLowStock: Boolean(row.is_low_stock),
    isComingSoon: Boolean(row.is_coming_soon),
  };
}

export async function fetchSupabaseProducts(includeUnavailable = false): Promise<Product[] | null> {
  if (!isSupabaseReady) return null;
  let query = supabase.from(TABLE).select('*').order('updated_at', { ascending: false });
  if (!includeUnavailable) {
    query = query.eq('in_stock', true).eq('is_coming_soon', false);
  }
  const { data, error } = await query;
  if (error) {
    console.warn('Supabase products read failed:', error.message);
    return null;
  }
  return (data || []).map((row) => supabaseRowToProduct(row as SupabaseProductRow));
}

export async function upsertSupabaseProduct(product: Product): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady) return { success: false, error: 'Supabase غير مُعد' };
  const { error } = await supabase.from(TABLE).upsert(productToSupabaseRow(product), { onConflict: 'id' });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function deleteSupabaseProduct(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady) return { success: false, error: 'Supabase غير مُعد' };
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  return error ? { success: false, error: error.message } : { success: true };
}

export function subscribeToSupabaseProducts(
  onUpdate: (products: Product[]) => void,
  includeUnavailable = false
): () => void {
  if (!isSupabaseReady) return () => {};
  let active = true;
  fetchSupabaseProducts(includeUnavailable).then((products) => {
    if (active && products) onUpdate(products);
  });
  const channel = supabase
    .channel('public-products-catalog')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => {
      fetchSupabaseProducts(includeUnavailable).then((products) => {
        if (active && products) onUpdate(products);
      });
    })
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

export async function upsertSupabaseProducts(products: Product[]): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady) return { success: false, error: 'Supabase غير مُعد' };
  if (products.length === 0) return { success: true };
  const { error } = await supabase.from(TABLE).upsert(products.map(productToSupabaseRow), { onConflict: 'id' });
  return error ? { success: false, error: error.message } : { success: true };
}
