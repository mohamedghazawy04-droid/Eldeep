import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
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
} from './storage';

const PRODUCTS_COL = 'products';
const ORDERS_COL = 'orders';
const PRESCRIPTIONS_COL = 'prescriptions';
const CUSTOMERS_COL = 'customers';
const NOTIFICATIONS_COL = 'notifications';

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
          const itemsToKeep = stored.length > 0 ? stored : INITIAL_PRODUCTS;
          onUpdate(itemsToKeep);
          saveProducts(itemsToKeep);
          return;
        }

        const items: Product[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Product);
        });

        // Keep local cache up to date
        saveProducts(items);
        onUpdate(items);
      },
      (error) => {
        // When backend is temporarily unreachable or offline, keep cached/local products intact
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
    await setDoc(doc(db, PRODUCTS_COL, product.id), product, { merge: true });
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
 * Batch upload multiple Products to Firestore Cloud Database
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
    for (const product of products) {
      await setDoc(doc(db, PRODUCTS_COL, product.id), product, { merge: true });
      count++;
    }
    return { successCount: count };
  } catch (err: any) {
    console.error('Batch upload partial error:', err);
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
    await setDoc(doc(db, ORDERS_COL, order.id), {
      ...order,
      createdAt: Date.now(),
    });
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
    await setDoc(doc(db, PRESCRIPTIONS_COL, rx.id), {
      ...rx,
      createdAt: Date.now(),
    });
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
 * Save or Update Customer in Firestore
 */
export async function syncSaveCustomerToFirestore(
  customer: Customer
): Promise<{ success: boolean; isOnline: boolean; error?: string }> {
  saveCustomer(customer);
  if (!isFirebaseReady) {
    return { success: true, isOnline: false, error: 'وضع أوفلاين مؤقت' };
  }
  try {
    const docId = customer.phone.replace(/[^\d+]/g, '') || customer.id;
    await setDoc(
      doc(db, CUSTOMERS_COL, docId),
      {
        ...customer,
        docId,
        updatedAt: Date.now(),
        registeredOnline: true,
      },
      { merge: true }
    );
    return { success: true, isOnline: true };
  } catch (err: any) {
    console.error('Failed to save customer to Firestore:', err);
    return { success: false, isOnline: false, error: err?.message || 'خطأ في الحفظ السحابي' };
  }
}

/**
 * Fetch Customer Profile from Firestore by phone
 */
export async function fetchCustomerFromFirestore(phone: string): Promise<Customer | null> {
  if (!isFirebaseReady) return null;
  try {
    const docId = phone.replace(/[^\d+]/g, '');
    if (!docId) return null;
    const snap = await getDoc(doc(db, CUSTOMERS_COL, docId));
    if (snap.exists()) {
      return snap.data() as Customer;
    }
  } catch (err) {
    console.warn('Could not fetch customer by phone:', err);
  }
  return null;
}

/**
 * Subscribe to Customers in Firestore (Admin)
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
  productId?: string
): Promise<void> {
  const newNotif: AppNotification = {
    id: 'notif-' + Date.now(),
    title,
    message,
    date: 'الآن',
    read: false,
    type: 'new_product',
    productId,
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
