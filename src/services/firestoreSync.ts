import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseReady } from '../firebase';
import { AppNotification, Customer, OrderRecord, PrescriptionOrder, Product } from '../types';
import { INITIAL_NOTIFICATIONS, INITIAL_PRODUCTS } from '../data/initialData';
import {
  saveProducts,
  getStoredProducts,
  saveNotifications,
  saveOrder,
  savePrescription,
  saveCustomer,
  saveAllCustomers,
  getStoredAllCustomers,
  calculateTier,
} from './storage';

const PRODUCTS_COL = 'products';
const ORDERS_COL = 'orders';
const PRESCRIPTIONS_COL = 'prescriptions';
const CUSTOMERS_COL = 'customers';
const NOTIFICATIONS_COL = 'notifications';

/**
 * Recursively sanitizes objects before saving to Firestore.
 * Strips all keys whose values are `undefined` to prevent Firestore
 * "Unsupported field value: undefined" errors.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value);
      }
    }
    return clean as any;
  }
  return data;
}

/**
 * Initialize and subscribe to real-time Products in Firestore
 */
export function subscribeToFirestoreProducts(
  onUpdate: (products: Product[]) => void
): () => void {
  if (!isFirebaseReady) return () => {};

  try {
    const productsRef = collection(db, PRODUCTS_COL);

    const unsubscribe = onSnapshot(
      productsRef,
      async (snapshot) => {
        if (snapshot.empty) {
          const stored = getStoredProducts();
          if (stored && stored.length > 0) {
            onUpdate(stored);
            syncBatchUploadProductsToFirestore(stored).catch(() => {});
          }
          return;
        }

        const items: Product[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d && d.id && d.nameAr) {
            items.push(d as Product);
          }
        });

        if (items.length > 0) {
          saveProducts(items);
          onUpdate(items);
        }
      },
      (error) => {
        console.warn('Firestore products listener notification:', error);
        const stored = getStoredProducts();
        if (stored.length > 0) {
          onUpdate(stored);
        }
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to Firestore products:', err);
    return () => {};
  }
}

/**
 * Add or update a Product in Firestore (with merge guarantee and status return)
 */
export async function syncAddProductToFirestore(
  product: Product
): Promise<{ success: boolean; isOnline: boolean; error?: string }> {
  if (!isFirebaseReady) {
    return { success: true, isOnline: false };
  }
  try {
    const cleanProduct = sanitizeForFirestore(product);
    await setDoc(doc(db, PRODUCTS_COL, product.id), cleanProduct, { merge: true });
    return { success: true, isOnline: true };
  } catch (err: any) {
    console.error('Failed to save product to Firestore:', err);
    return {
      success: false,
      isOnline: false,
      error: err?.message || 'تعذر الاتصال بالسيرفر السحابي حالياً',
    };
  }
}

/**
 * Batch upload multiple Products to Firestore Cloud Database using writeBatch
 */
export async function syncBatchUploadProductsToFirestore(
  products: Product[]
): Promise<{ successCount: number; error?: string }> {
  if (!isFirebaseReady) {
    saveProducts(products);
    return { successCount: products.length };
  }

  let count = 0;
  try {
    // Firestore supports up to 500 writes in a single batch
    const BATCH_LIMIT = 250;
    for (let i = 0; i < products.length; i += BATCH_LIMIT) {
      const chunk = products.slice(i, i + BATCH_LIMIT);
      const batch = writeBatch(db);
      for (const product of chunk) {
        const cleanProduct = sanitizeForFirestore(product);
        batch.set(doc(db, PRODUCTS_COL, product.id), cleanProduct, { merge: true });
      }
      await batch.commit();
      count += chunk.length;
    }
    return { successCount: count };
  } catch (err: any) {
    console.error('Batch upload error:', err);
    // Fallback save to localStorage & IndexedDB in case of network issue
    saveProducts(products);
    return { successCount: count, error: err?.message || 'خطأ أثناء رفع بعض المنتجات' };
  }
}

/**
 * Test round-trip latency and connection health to Cloud Firestore
 */
export async function checkFirestoreHealth(): Promise<{
  isHealthy: boolean;
  latencyMs: number;
  message: string;
}> {
  if (!isFirebaseReady) {
    return {
      isHealthy: false,
      latencyMs: 0,
      message: 'إعدادات الاتصال السحابي غير مكتملة',
    };
  }

  const start = performance.now();
  try {
    const healthDoc = doc(db, '_health', 'status');
    await setDoc(healthDoc, { lastPing: Date.now() }, { merge: true });
    const latencyMs = Math.round(performance.now() - start);
    return {
      isHealthy: true,
      latencyMs,
      message: `متصل بنجاح بالسحابة (زمن الاستجابة: ${latencyMs}ms)`,
    };
  } catch (err: any) {
    return {
      isHealthy: false,
      latencyMs: 0,
      message: err?.message || 'تعذر الوصول لقاعدة البيانات السحابية',
    };
  }
}

/**
 * Download a full JSON backup of the products catalog
 */
export function downloadProductsBackupFile(products: Product[]): void {
  const exportPayload = {
    pharmacyName: 'صيدلية الديب - El Deeb Pharmacy',
    exportedAt: new Date().toISOString(),
    totalProducts: products.length,
    products,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute(
    'download',
    `eldeeb_pharmacy_backup_${new Date().toISOString().slice(0, 10)}.json`
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Parse products from a JSON backup file
 */
export function parseProductsBackupJson(jsonString: string): Product[] {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      return parsed.filter((p) => p && p.id && p.nameAr);
    }
    if (parsed && Array.isArray(parsed.products)) {
      return parsed.products.filter((p: any) => p && p.id && p.nameAr);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Delete a Product in Firestore
 */
export async function syncDeleteProductFromFirestore(productId: string): Promise<void> {
  if (!isFirebaseReady) return;
  try {
    await deleteDoc(doc(db, PRODUCTS_COL, productId));
  } catch (err) {
    console.error('Failed to delete product from Firestore:', err);
  }
}

/**
 * Clear all Products in Firestore (Start Fresh / Clean Slate)
 */
export async function syncClearAllFirestoreProducts(): Promise<void> {
  if (!isFirebaseReady) return;
  try {
    const snap = await getDocs(collection(db, PRODUCTS_COL));
    const batchPromises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(batchPromises);
    saveProducts([]);
  } catch (err) {
    console.error('Failed to clear all products in Firestore:', err);
  }
}

/**
 * Save an Order to Firestore
 */
export async function syncSaveOrderToFirestore(order: OrderRecord): Promise<void> {
  saveOrder(order);
  if (!isFirebaseReady) return;
  try {
    const cleanOrder = sanitizeForFirestore({
      ...order,
      createdAt: Date.now(),
    });
    await setDoc(doc(db, ORDERS_COL, order.id), cleanOrder);
  } catch (err) {
    console.error('Failed to save order to Firestore:', err);
  }
}

/**
 * Subscribe to Orders in Firestore (Admin)
 */
export function subscribeToFirestoreOrders(
  onUpdate: (orders: OrderRecord[]) => void
): () => void {
  if (!isFirebaseReady) return () => {};
  try {
    const ordersRef = collection(db, ORDERS_COL);
    const q = query(ordersRef, orderBy('createdAt', 'desc'), limit(100));

    return onSnapshot(
      q,
      (snapshot) => {
        const items: OrderRecord[] = [];
        snapshot.forEach((d) => items.push(d.data() as OrderRecord));
        if (items.length > 0) {
          onUpdate(items);
        }
      },
      (err) => console.warn('Firestore orders sync err:', err)
    );
  } catch (e) {
    console.error('Orders sync failed:', e);
    return () => {};
  }
}

/**
 * Save a Prescription to Firestore
 */
export async function syncSavePrescriptionToFirestore(rx: PrescriptionOrder): Promise<void> {
  savePrescription(rx);
  if (!isFirebaseReady) return;
  try {
    const cleanRx = sanitizeForFirestore({
      ...rx,
      createdAt: Date.now(),
    });
    await setDoc(doc(db, PRESCRIPTIONS_COL, rx.id), cleanRx);
  } catch (err) {
    console.error('Failed to save prescription to Firestore:', err);
  }
}

/**
 * Subscribe to Prescriptions in Firestore (Admin)
 */
export function subscribeToFirestorePrescriptions(
  onUpdate: (prescriptions: PrescriptionOrder[]) => void
): () => void {
  if (!isFirebaseReady) return () => {};
  try {
    const rxRef = collection(db, PRESCRIPTIONS_COL);
    const q = query(rxRef, orderBy('createdAt', 'desc'), limit(100));

    return onSnapshot(
      q,
      (snapshot) => {
        const items: PrescriptionOrder[] = [];
        snapshot.forEach((d) => items.push(d.data() as PrescriptionOrder));
        if (items.length > 0) {
          onUpdate(items);
        }
      },
      (err) => console.warn('Firestore rx sync err:', err)
    );
  } catch (e) {
    console.error('Prescriptions sync failed:', e);
    return () => {};
  }
}

/**
 * Fetch a single prescription by ID from Firestore
 */
export async function fetchPrescriptionFromFirestore(rxId: string): Promise<PrescriptionOrder | null> {
  if (!isFirebaseReady) return null;
  try {
    const docRef = doc(db, PRESCRIPTIONS_COL, rxId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as PrescriptionOrder;
    }
  } catch (err) {
    console.warn('Error fetching prescription from Firestore:', err);
  }
  return null;
}

/**
 * Save or Update Customer in Firestore
 * Connects any customer who registers or places an order directly to the Firestore customers collection
 */
export async function syncSaveCustomerToFirestore(
  customer: Customer
): Promise<{ success: boolean; isOnline: boolean; error?: string }> {
  // 1. Immediately cache locally
  saveCustomer(customer);
  try {
    const all = getStoredAllCustomers();
    const idx = all.findIndex(
      (c) => c.id === customer.id ||
             (customer.phone && c.phone && c.phone.replace(/[^\d+]/g, '') === customer.phone.replace(/[^\d+]/g, '')) ||
             (customer.email && c.email && c.email.toLowerCase() === customer.email.toLowerCase())
    );
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...customer };
    } else {
      all.unshift(customer);
    }
    saveAllCustomers(all);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('eldeeb_customers_updated'));
    }
  } catch (e) {
    console.warn('Local customer cache error:', e);
  }

  if (!isFirebaseReady) {
    return { success: true, isOnline: false, error: 'وضع أوفلاين مؤقت' };
  }

  try {
    // Determine the unique, clean document ID for Firestore
    const cleanPhoneDigits = (customer.phone || '').replace(/[^\d+]/g, '');
    let docId = cleanPhoneDigits.length >= 7 ? cleanPhoneDigits : '';
    if (!docId && customer.email && customer.email.includes('@')) {
      docId = 'em_' + customer.email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
    if (!docId) {
      docId = customer.id || 'cust_' + Date.now();
    }

    const cleanCustomer = sanitizeForFirestore({
      ...customer,
      docId,
      updatedAt: Date.now(),
      registeredOnline: true,
    });

    await setDoc(
      doc(db, CUSTOMERS_COL, docId),
      cleanCustomer,
      { merge: true }
    );
    return { success: true, isOnline: true };
  } catch (err: any) {
    console.error('Failed to save customer to Firestore:', err);
    return { success: false, isOnline: false, error: err?.message || 'خطأ في الحفظ السحابي' };
  }
}

/**
 * Batch upload multiple Customers to Firestore Cloud Database using writeBatch
 */
export async function syncBatchUploadCustomersToFirestore(
  customers: Customer[]
): Promise<{ successCount: number; error?: string }> {
  if (!isFirebaseReady) {
    saveAllCustomers(customers);
    return { successCount: customers.length };
  }

  let count = 0;
  try {
    const BATCH_LIMIT = 250;
    for (let i = 0; i < customers.length; i += BATCH_LIMIT) {
      const chunk = customers.slice(i, i + BATCH_LIMIT);
      const batch = writeBatch(db);
      for (const cust of chunk) {
        const cleanPhoneDigits = (cust.phone || '').replace(/[^\d+]/g, '');
        const docId =
          cleanPhoneDigits.length >= 7
            ? cleanPhoneDigits
            : cust.email
            ? 'em_' + cust.email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')
            : cust.id;
        const cleanCustomer = sanitizeForFirestore({
          ...cust,
          points: cust.points || 0,
          tier: cust.tier || calculateTier(cust.points || 0),
          lastUpdated: new Date().toISOString(),
        });
        batch.set(doc(db, CUSTOMERS_COL, docId), cleanCustomer, { merge: true });
      }
      await batch.commit();
      count += chunk.length;
    }
    saveAllCustomers(customers);
    return { successCount: count };
  } catch (err: any) {
    console.error('Batch customer upload error:', err);
    saveAllCustomers(customers);
    return { successCount: count, error: err?.message || 'خطأ أثناء رفع بعض بيانات العملاء' };
  }
}

/**
 * Delete a Customer from Firestore
 */
export async function syncDeleteCustomerFromFirestore(customer: Customer): Promise<void> {
  if (!isFirebaseReady) return;
  try {
    const cleanPhoneDigits = (customer.phone || '').replace(/[^\d+]/g, '');
    const docId = cleanPhoneDigits.length >= 7 
      ? cleanPhoneDigits 
      : (customer.email ? 'em_' + customer.email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') : customer.id);
    await deleteDoc(doc(db, CUSTOMERS_COL, docId));
  } catch (err) {
    console.error('Failed to delete customer from Firestore:', err);
  }
}

/**
 * Update Customer Points directly in Firestore
 */
export async function syncUpdateCustomerPointsInFirestore(
  customer: Customer,
  newPoints: number
): Promise<{ success: boolean; isOnline: boolean }> {
  const updatedCustomer: Customer = {
    ...customer,
    points: newPoints,
    tier: calculateTier(newPoints),
  };
  return syncSaveCustomerToFirestore(updatedCustomer);
}

/**
 * Fetch Customer Profile from Firestore by phone, email, or customer ID
 */
export async function fetchCustomerFromFirestore(identifier: string): Promise<Customer | null> {
  if (!isFirebaseReady || !identifier) return null;
  const clean = identifier.trim();
  try {
    // 1. If searching by Email
    if (clean.includes('@')) {
      const emailDocId = 'em_' + clean.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const directSnap = await getDoc(doc(db, CUSTOMERS_COL, emailDocId));
      if (directSnap.exists()) {
        return directSnap.data() as Customer;
      }
      const q = query(collection(db, CUSTOMERS_COL), where('email', '==', clean.toLowerCase()), limit(1));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        return qSnap.docs[0].data() as Customer;
      }
    }

    // 2. If searching by Phone
    const phoneDigits = clean.replace(/[^\d+]/g, '');
    if (phoneDigits.length >= 7) {
      const directSnap = await getDoc(doc(db, CUSTOMERS_COL, phoneDigits));
      if (directSnap.exists()) {
        return directSnap.data() as Customer;
      }
      const q = query(collection(db, CUSTOMERS_COL), where('phone', '==', clean), limit(1));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        return qSnap.docs[0].data() as Customer;
      }
    }

    // 3. If searching by direct ID
    const idSnap = await getDoc(doc(db, CUSTOMERS_COL, clean));
    if (idSnap.exists()) {
      return idSnap.data() as Customer;
    }
  } catch (err) {
    console.warn('Could not fetch customer from Firestore:', err);
  }
  return null;
}

/**
 * Subscribe to Customers in Firestore (Live Admin & Store sync)
 */
export function subscribeToFirestoreCustomers(
  onUpdate: (customers: Customer[]) => void
): () => void {
  if (!isFirebaseReady) return () => {};
  try {
    const custRef = collection(db, CUSTOMERS_COL);
    return onSnapshot(
      custRef,
      (snapshot) => {
        const items: Customer[] = [];
        snapshot.forEach((d) => items.push(d.data() as Customer));
        if (items.length > 0) {
          saveAllCustomers(items);
          onUpdate(items);
        }
      },
      (err) => console.warn('Firestore customers sync err:', err)
    );
  } catch (e) {
    console.error('Customers sync failed:', e);
    return () => {};
  }
}

/**
 * Subscribe to Broadcast Notifications in Firestore
 */
export function subscribeToFirestoreNotifications(
  onUpdate: (notifications: AppNotification[]) => void
): () => void {
  if (!isFirebaseReady) return () => {};
  try {
    const notifsRef = collection(db, NOTIFICATIONS_COL);
    const q = query(notifsRef, orderBy('timestamp', 'desc'), limit(50));

    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          // Seed initial notifications
          try {
            for (const notif of INITIAL_NOTIFICATIONS) {
              await setDoc(doc(db, NOTIFICATIONS_COL, notif.id), {
                ...notif,
                timestamp: Date.now(),
              });
            }
          } catch (seedErr) {
            console.warn('Initial notifications seed deferred or offline:', seedErr);
          }
          onUpdate(INITIAL_NOTIFICATIONS);
          saveNotifications(INITIAL_NOTIFICATIONS);
          return;
        }

        const items: AppNotification[] = [];
        snapshot.forEach((d) => items.push(d.data() as AppNotification));
        saveNotifications(items);
        onUpdate(items);
      },
      (err) => console.warn('Firestore notifications sync err:', err)
    );
  } catch (e) {
    console.error('Notifications sync failed:', e);
    return () => {};
  }
}

/**
 * Broadcast Notification to Firestore
 */
export async function syncBroadcastNotificationToFirestore(
  title: string,
  message: string,
  productId?: string,
  customId?: string
): Promise<void> {
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

  if (!isFirebaseReady) return;
  try {
    await setDoc(doc(db, NOTIFICATIONS_COL, newNotif.id), {
      ...newNotif,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('Failed to broadcast notification to Firestore:', err);
  }
}

/**
 * Mark notifications as read in Firestore
 */
export async function syncMarkNotificationsReadInFirestore(
  notificationIds: string[]
): Promise<void> {
  if (!isFirebaseReady || !notificationIds || notificationIds.length === 0) return;
  try {
    const batch = writeBatch(db);
    for (const id of notificationIds) {
      const docRef = doc(db, NOTIFICATIONS_COL, id);
      batch.update(docRef, { read: true });
    }
    await batch.commit();
  } catch (err) {
    console.warn('Failed to mark notifications read in Firestore:', err);
  }
}

/**
 * Delete a notification from Firestore
 */
export async function syncDeleteNotificationFromFirestore(id: string): Promise<void> {
  if (!isFirebaseReady || !id) return;
  try {
    await deleteDoc(doc(db, NOTIFICATIONS_COL, id));
  } catch (err) {
    console.warn('Failed to delete notification from Firestore:', err);
  }
}

/**
 * Settings & Branding Synchronization for El Deeb Pharmacy
 */
export const SETTINGS_COL = 'settings';
export const BRANDING_DOC_ID = 'branding';

export interface BrandingSettings {
  logoUrl: string | null;
  updatedAt: number;
}

/**
 * Save custom logo to Firestore so all clients and devices see it
 */
export async function syncSaveLogoToFirestore(logoUrl: string | null): Promise<boolean> {
  if (!isFirebaseReady) return false;
  try {
    const docRef = doc(db, SETTINGS_COL, BRANDING_DOC_ID);
    await setDoc(docRef, {
      logoUrl: logoUrl || null,
      updatedAt: Date.now(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to sync logo to Firestore:', err);
    return false;
  }
}

/**
 * Fetch current logo from Firestore
 */
export async function fetchLogoFromFirestore(): Promise<string | null> {
  if (!isFirebaseReady) return null;
  try {
    const docRef = doc(db, SETTINGS_COL, BRANDING_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return (data.logoUrl as string) || null;
    }
  } catch (err) {
    console.warn('Failed to fetch logo from Firestore:', err);
  }
  return null;
}

/**
 * Real-time subscription to logo updates in Firestore
 */
export function subscribeToFirestoreLogo(
  onUpdate: (logoUrl: string | null) => void
): () => void {
  if (!isFirebaseReady) return () => {};
  try {
    const docRef = doc(db, SETTINGS_COL, BRANDING_DOC_ID);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          onUpdate((data.logoUrl as string) || null);
        } else {
          onUpdate(null);
        }
      },
      (err) => console.warn('Firestore logo sync listener err:', err)
    );
  } catch (e) {
    console.error('Logo sync subscription failed:', e);
    return () => {};
  }
}

