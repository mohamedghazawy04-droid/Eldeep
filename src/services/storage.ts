import { AppNotification, Customer, LoyaltyTier, OrderRecord, PrescriptionOrder, Product } from '../types';
import { INITIAL_NOTIFICATIONS, INITIAL_PRODUCTS } from '../data/initialData';
import { getIdbItem, setIdbItem, removeIdbItem } from './indexedDb';

const STORAGE_KEYS = {
  PRODUCTS: 'eldeeb_pharmacy_products_v1',
  CUSTOMER: 'eldeeb_pharmacy_active_customer_v1',
  ALL_CUSTOMERS: 'eldeeb_pharmacy_customers_list_v1',
  ORDERS: 'eldeeb_pharmacy_orders_v1',
  PRESCRIPTIONS: 'eldeeb_pharmacy_prescriptions_v1',
  NOTIFICATIONS: 'eldeeb_pharmacy_notifications_v1',
  THEME: 'eldeeb_pharmacy_theme_v1',
  ADMIN_PIN: 'eldeeb_pharmacy_admin_pin_v1',
  MASCOT_ENABLED: 'eldeeb_pharmacy_mascot_enabled_v1',
  CUSTOM_LOGO: 'eldeeb_pharmacy_custom_logo_v1',
};

// In-memory cache for ultra-fast access and safeguarding against quota limits
let memoryProductsCache: Product[] | null = null;

export function recalculateProductLoyaltyPoints(price: number): number {
  if (!price || price <= 0) return 0;
  const pts = price / 100;
  return Number(pts.toFixed(2));
}

export function ensureProductLoyaltySystem(products: Product[]): Product[] {
  return products.map((p) => ({
    ...p,
    points: recalculateProductLoyaltyPoints(p.price),
  }));
}

/**
 * Safely persists products to localStorage with intelligent quota handling:
 * 1. Tries saving full products
 * 2. If quota exceeded, sanitizes large base64 data URLs (>2KB) for localStorage copy
 * 3. If still exceeded, trims to essential items
 * 4. Never throws unhandled quota error or logs fatal console.error
 */
function saveProductsToLocalStorage(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return;
  } catch {
    // Quota exceeded: try sanitized copy (remove large data: URLs from localStorage)
  }

  try {
    const sanitized = products.map((p) => {
      if (p.image && p.image.startsWith('data:') && p.image.length > 2048) {
        return { ...p, image: '/eldeeb_logo.jpg' };
      }
      return p;
    });
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(sanitized));
    return;
  } catch {
    // Still quota exceeded: trim to top 35 products
  }

  try {
    const trimmed = products.slice(0, 35).map((p) => ({
      ...p,
      image: p.image && p.image.length < 2048 ? p.image : '/eldeeb_logo.jpg',
    }));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(trimmed));
    return;
  } catch {
    // LocalStorage is completely full: silently remove key so it won't leave corrupt data
  }

  try {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
  } catch {
    // Ignore
  }
}

export function getStoredProducts(): Product[] {
  // 1. Check in-memory cache first
  if (memoryProductsCache && memoryProductsCache.length > 0) {
    return memoryProductsCache;
  }

  // 2. Read from localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved) {
      const parsed: Product[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const calibrated = ensureProductLoyaltySystem(parsed);
        memoryProductsCache = calibrated;
        return calibrated;
      }
    }
  } catch {
    // Ignore parse or read error
  }

  return [];
}

/**
 * Asynchronously loads products from IndexedDB (no 5MB quota limit)
 */
export async function loadProductsFromIndexedDb(): Promise<Product[] | null> {
  try {
    const idbProducts = await getIdbItem<Product[]>(STORAGE_KEYS.PRODUCTS);
    if (idbProducts && Array.isArray(idbProducts) && idbProducts.length > 0) {
      const calibrated = ensureProductLoyaltySystem(idbProducts);
      memoryProductsCache = calibrated;
      return calibrated;
    }
  } catch {
    // Ignore
  }
  return null;
}

export function clearAllProducts(): void {
  memoryProductsCache = [];
  try {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
  } catch {
    // Ignore
  }
  removeIdbItem(STORAGE_KEYS.PRODUCTS).catch(() => {});
}

export function saveProducts(products: Product[]): void {
  const calibrated = ensureProductLoyaltySystem(products);
  // 1. In-memory cache
  memoryProductsCache = calibrated;

  // 2. IndexedDB (stores complete catalog including full-resolution images)
  setIdbItem(STORAGE_KEYS.PRODUCTS, calibrated).catch(() => {});

  // 3. Resilient localStorage fallback
  saveProductsToLocalStorage(calibrated);
}

export function calculateTier(points: number): LoyaltyTier {
  if (points >= 300) return 'diamond';
  if (points >= 150) return 'gold';
  if (points >= 50) return 'silver';
  return 'bronze';
}

export function getStoredCustomer(): Customer | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMER);
    if (saved) {
      const customer: Customer = JSON.parse(saved);
      // keep tier fresh
      customer.tier = calculateTier(customer.points);
      return customer;
    }
  } catch (e) {
    console.error('Failed to load customer', e);
  }
  return null;
}

export function saveCustomer(customer: Customer): void {
  try {
    customer.tier = calculateTier(customer.points);
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMER, JSON.stringify(customer));
    } catch {
      // Ignore quota error for customer session
    }

    // Also update in all customers directory with strict loyalty points protection
    const all = getStoredAllCustomers();
    const cleanPhone = customer.phone ? customer.phone.replace(/[^\d+]/g, '') : '';
    const existingIndex = all.findIndex(
      (c) =>
        (cleanPhone && c.phone && c.phone.replace(/[^\d+]/g, '') === cleanPhone) ||
        c.id === customer.id
    );

    if (existingIndex >= 0) {
      const existing = all[existingIndex];
      all[existingIndex] = {
        ...existing,
        ...customer,
        // Safeguard points: points should not be silently reduced by login/re-registration
        points: customer.points !== undefined ? customer.points : existing.points,
        tier: calculateTier(customer.points !== undefined ? customer.points : existing.points),
        totalOrders: Math.max(customer.totalOrders || 0, existing.totalOrders || 0),
        joinedDate: existing.joinedDate || customer.joinedDate,
      };
    } else {
      all.unshift(customer);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.ALL_CUSTOMERS, JSON.stringify(all));
    } catch {
      // Ignore quota error
    }
  } catch (e) {
    console.warn('Failed to save customer', e);
  }
}

export function saveAllCustomers(customers: Customer[]): void {
  try {
    const calibrated = customers.map((c) => ({
      ...c,
      tier: calculateTier(c.points || 0),
    }));
    localStorage.setItem(STORAGE_KEYS.ALL_CUSTOMERS, JSON.stringify(calibrated));
  } catch (e) {
    console.warn('Failed to save all customers', e);
  }
}

export function deleteStoredCustomer(customerId: string): Customer[] {
  try {
    const all = getStoredAllCustomers().filter((c) => c.id !== customerId);
    saveAllCustomers(all);

    // If active customer was deleted, clear active session
    const active = getStoredCustomer();
    if (active && active.id === customerId) {
      localStorage.removeItem(STORAGE_KEYS.CUSTOMER);
    }
    return all;
  } catch (e) {
    console.warn('Failed to delete customer', e);
    return getStoredAllCustomers();
  }
}

export function updateStoredCustomerPoints(customerId: string, newPoints: number): Customer[] {
  try {
    const all = getStoredAllCustomers().map((c) => {
      if (c.id === customerId) {
        const pts = Math.max(0, newPoints);
        return {
          ...c,
          points: pts,
          tier: calculateTier(pts),
        };
      }
      return c;
    });
    saveAllCustomers(all);

    const active = getStoredCustomer();
    if (active && active.id === customerId) {
      const updatedActive = {
        ...active,
        points: Math.max(0, newPoints),
        tier: calculateTier(Math.max(0, newPoints)),
      };
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOMER, JSON.stringify(updatedActive));
      } catch {
        // Ignore quota error
      }
    }
    return all;
  } catch (e) {
    console.warn('Failed to update customer points', e);
    return getStoredAllCustomers();
  }
}

export function exportCustomersAsJson(customers: Customer[]): void {
  const payload = {
    pharmacy: 'صيدلية الديب - El Deeb Pharmacy',
    type: 'customers_and_loyalty_points',
    exportedAt: new Date().toISOString(),
    totalCustomers: customers.length,
    customers,
  };
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
  const a = document.createElement('a');
  a.setAttribute('href', dataStr);
  a.setAttribute('download', `eldeeb_customers_loyalty_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function exportCustomersAsCsv(customers: Customer[]): void {
  const header = ['الاسم', 'رقم الهاتف', 'البريد الإلكتروني', 'حالة تأكيد البريد', 'العنوان', 'رصيد نقاط الولاء', 'المستوى', 'إجمالي الطلبات', 'تاريخ الانضمام'];
  const rows = customers.map((c) => [
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.phone || '').replace(/"/g, '""')}"`,
    `"${(c.email || '').replace(/"/g, '""')}"`,
    `"${c.isEmailVerified ? 'مؤكد ومفعل' : 'غير مؤكد'}"`,
    `"${(c.address || '').replace(/"/g, '""')}"`,
    c.points || 0,
    `"${c.tier || 'bronze'}"`,
    c.totalOrders || 0,
    `"${c.joinedDate || ''}"`,
  ]);
  const csvContent = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `eldeeb_customers_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function getStoredAllCustomers(): Customer[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ALL_CUSTOMERS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load all customers', e);
  }
  return [];
}

export function getStoredOrders(): OrderRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load orders', e);
  }
  return [];
}

export function saveOrder(order: OrderRecord): void {
  try {
    const orders = getStoredOrders();
    orders.unshift(order);
    const trimmed = orders.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save order to localStorage', e);
  }
}

export function getStoredPrescriptions(): PrescriptionOrder[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load prescriptions', e);
  }
  return [];
}

export function savePrescription(prescription: PrescriptionOrder): void {
  try {
    const list = getStoredPrescriptions();
    list.unshift(prescription);
    const trimmed = list.slice(0, 15);
    try {
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(trimmed));
    } catch {
      // If quota exceeded due to image, strip imageUrl from older items
      const lightweight = trimmed.map((item, idx) => (idx === 0 ? item : { ...item, imageUrl: '' }));
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(lightweight));
    }
  } catch (e) {
    console.warn('Failed to save prescription', e);
  }
}

export function updatePrescriptionStatus(id: string, status: PrescriptionOrder['status']): void {
  try {
    const list = getStoredPrescriptions().map((item) =>
      item.id === id ? { ...item, status } : item
    );
    localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to update prescription', e);
  }
}

export function getStoredNotifications(): AppNotification[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load notifications', e);
  }
  return INITIAL_NOTIFICATIONS;
}

export function saveNotifications(notifications: AppNotification[]): void {
  try {
    const trimmed = notifications.slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save notifications', e);
  }
}

export function addBroadcastNotification(
  title: string,
  message: string,
  productId?: string,
  customId?: string
): AppNotification {
  const current = getStoredNotifications();
  if (productId) {
    const existing = current.find(
      (n) => n.productId === productId && (Date.now() - (n.timestamp || 0) < 300000)
    );
    if (existing) {
      return existing;
    }
  }
  const newNotif: AppNotification = {
    id: customId || ('notif-' + Date.now()),
    title,
    message,
    date: 'الآن',
    read: false,
    type: 'new_product',
    productId,
    timestamp: Date.now(),
  };
  current.unshift(newNotif);
  saveNotifications(current);
  return newNotif;
}

export function deleteStoredNotification(id: string): AppNotification[] {
  const current = getStoredNotifications();
  const updated = current.filter((n) => n.id !== id);
  saveNotifications(updated);
  return updated;
}

export function getStoredTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // fallback
  }
  return 'light';
}

export function saveTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {
    console.warn('Failed to save theme', e);
  }
}

export function getAdminPin(): string {
  try {
    const pin = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN);
    if (pin && pin.trim() && pin !== '1234' && pin !== '1995' && pin !== '123456') return pin;
  } catch {
    // ignore
  }
  return 'MOhager191995';
}

export function setAdminPin(newPin: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, newPin);
  } catch {
    // ignore
  }
}

export function getMascotEnabled(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.MASCOT_ENABLED);
    return val !== 'false';
  } catch {
    return true;
  }
}

export function setMascotEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MASCOT_ENABLED, String(enabled));
  } catch {
    // ignore
  }
}

export function getStoredLogo(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.CUSTOM_LOGO);
  } catch {
    return null;
  }
}

export function saveStoredLogo(logoUrl: string | null): void {
  try {
    if (!logoUrl) {
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_LOGO);
      removeIdbItem(STORAGE_KEYS.CUSTOM_LOGO).catch(() => {});
    } else {
      setIdbItem(STORAGE_KEYS.CUSTOM_LOGO, logoUrl).catch(() => {});
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_LOGO, logoUrl);
      } catch {
        // Safe fallback: logo saved to IndexedDB, quota exceeded in localStorage
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('eldeeb_logo_updated'));
      // Dynamically update favicon
      try {
        const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
        if (favicon) {
          favicon.href = logoUrl || '/eldeeb_pharmacy_logo.jpg';
        }
      } catch {
        // ignore
      }
    }
  } catch (e) {
    console.warn('Failed to save logo', e);
  }
}


