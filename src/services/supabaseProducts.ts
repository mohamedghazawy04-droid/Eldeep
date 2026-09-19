import { Product, ProductCategory } from '../types';
import { isSupabaseReady, supabase, SupabaseProductRow } from './supabase';

const TABLE = 'products';
export const PUBLIC_PAGE_SIZE = 24;

export type PublicProductPage = {
  products: Product[];
  total: number;
  hasMore: boolean;
};

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
    isNew: Boolean(row.is_new) && (!row.updated_at || Date.now() - new Date(row.updated_at).getTime() < 24 * 60 * 60 * 1000),
    stockQuantity: row.stock_quantity == null ? undefined : Number(row.stock_quantity),
    isLowStock: Boolean(row.is_low_stock),
    isComingSoon: Boolean(row.is_coming_soon),
  };
}

export async function fetchPublicProductPage(
  page: number,
  category: ProductCategory | 'all',
  search: string
): Promise<PublicProductPage | null> {
  if (!isSupabaseReady) return null;
  const from = Math.max(0, page) * PUBLIC_PAGE_SIZE;
  const to = from + PUBLIC_PAGE_SIZE - 1;
  let query = supabase
    .from(TABLE)
    .select('*', { count: 'exact' })
    .eq('in_stock', true)
    .eq('is_coming_soon', false)
    .order('updated_at', { ascending: false })
    .range(from, to);
  if (category !== 'all') query = query.eq('category', category);
  const safeSearch = search.trim().replace(/[%,()]/g, ' ');
  if (safeSearch) {
    query = query.or(
      `name_ar.ilike.%${safeSearch}%,name_en.ilike.%${safeSearch}%,active_ingredient.ilike.%${safeSearch}%`
    );
  }
  const { data, count, error } = await query;
  if (error) {
    console.warn('Supabase public page read failed:', error.message);
    return null;
  }
  const products = (data || []).map((row) => supabaseRowToProduct(row as SupabaseProductRow));
  const total = count || 0;
  return { products, total, hasMore: from + products.length < total };
}

export async function fetchSupabaseProducts(includeUnavailable = false): Promise<Product[] | null> {
  if (!isSupabaseReady) return null;
  const pageSize = 1000;
  const rows: SupabaseProductRow[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = await fetchSupabaseProductPage(offset, pageSize, includeUnavailable);
    if (page.error) {
      console.warn('Supabase products read failed:', page.error);
      return null;
    }
    const data = page.data;
    rows.push(...((data || []) as SupabaseProductRow[]));
    if (!data || data.length < pageSize) break;
  }
  return rows.map((row) => supabaseRowToProduct(row));
}

async function fetchSupabaseProductPage(
  offset: number,
  pageSize: number,
  includeUnavailable: boolean
): Promise<{ data: SupabaseProductRow[]; error?: string }> {
  let query = supabase
    .from(TABLE)
    .select('*')
    .order('updated_at', { ascending: false })
    .range(offset, offset + pageSize - 1);
  if (!includeUnavailable) query = query.eq('in_stock', true).eq('is_coming_soon', false);
  const { data, error } = await query;
  return { data: (data || []) as SupabaseProductRow[], error: error?.message };
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
  const load = async () => {
    if (!includeUnavailable) {
      const products = await fetchSupabaseProducts(false);
      if (active && products) onUpdate(products);
      return;
    }
    const allRows: SupabaseProductRow[] = [];
    for (let offset = 0; ; offset += 1000) {
      const page = await fetchSupabaseProductPage(offset, 1000, true);
      if (page.error) return;
      allRows.push(...page.data);
      if (active) onUpdate(allRows.map((row) => supabaseRowToProduct(row)));
      if (page.data.length < 1000) break;
    }
  };
  load().catch((error) => console.warn('Supabase catalog stream failed:', error));
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
