import { AppNotification, Customer, LoyaltyTier, OrderRecord, PrescriptionOrder, Product } from '../types';
import { INITIAL_NOTIFICATIONS, INITIAL_PRODUCTS } from '../data/initialData';

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

export function getStoredProducts(): Product[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved) {
      const parsed: Product[] = JSON.parse(saved);
      return ensureProductLoyaltySystem(parsed);
    }
  } catch (e) {
    console.error('Failed to load products from storage', e);
  }
  return [];
}

export function clearAllProducts(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to clear products', e);
  }
}

export function saveProducts(products: Product[]): void {
  try {
    const calibrated = ensureProductLoyaltySystem(products);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(calibrated));
  } catch (e) {
    console.error('Failed to save products', e);
  }
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
    localStorage.setItem(STORAGE_KEYS.CUSTOMER, JSON.stringify(customer));

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
    localStorage.setItem(STORAGE_KEYS.ALL_CUSTOMERS, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to save customer', e);
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
    console.error('Failed to save all customers', e);
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
    console.error('Failed to delete customer', e);
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
      localStorage.setItem(STORAGE_KEYS.CUSTOMER, JSON.stringify(updatedActive));
    }
    return all;
  } catch (e) {
    console.error('Failed to update customer points', e);
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
  const header = ['الاسم', 'رقم الهاتف', 'العنوان', 'رصيد نقاط الولاء', 'المستوى', 'إجمالي الطلبات', 'تاريخ الانضمام'];
  const rows = customers.map((c) => [
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.phone || '').replace(/"/g, '""')}"`,
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
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save order', e);
  }
}

export function getStoredPrescriptions(): PrescriptionOrder[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load prescriptions', e);
  }
  return [];
}

export function savePrescription(prescription: PrescriptionOrder): void {
  try {
    const list = getStoredPrescriptions();
    list.unshift(prescription);
    localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save prescription', e);
  }
}

export function updatePrescriptionStatus(id: string, status: PrescriptionOrder['status']): void {
  try {
    const list = getStoredPrescriptions().map((item) =>
      item.id === id ? { ...item, status } : item
    );
    localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to update prescription', e);
  }
}

export function getStoredNotifications(): AppNotification[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load notifications', e);
  }
  return INITIAL_NOTIFICATIONS;
}

export function saveNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  } catch (e) {
    console.error('Failed to save notifications', e);
  }
}

export function addBroadcastNotification(title: string, message: string, productId?: string): void {
  const current = getStoredNotifications();
  const newNotif: AppNotification = {
    id: 'notif-' + Date.now(),
    title,
    message,
    date: 'الآن',
    read: false,
    type: 'new_product',
    productId,
  };
  current.unshift(newNotif);
  saveNotifications(current);
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
    console.error('Failed to save theme', e);
  }
}

export function getAdminPin(): string {
  try {
    const pin = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN);
    if (pin && pin.trim() && pin !== '1234' && pin !== '1995' && pin !== '123456') return pin;
  } catch {
    // ignore
  }
  return '__HASHED_DEFAULT__';
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
    } else {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_LOGO, logoUrl);
    }
  } catch (e) {
    console.error('Failed to save logo', e);
  }
}
