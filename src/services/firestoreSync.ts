import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, isFirebaseReady } from '../firebase';
import { AppNotification, Customer, OrderRecord, PrescriptionOrder, Product } from '../types';
import { INITIAL_NOTIFICATIONS, INITIAL_PRODUCTS } from '../data/initialData';
import { saveProducts, saveNotifications, saveOrder, savePrescription, saveCustomer } from './storage';

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
          // Seed initial products to Firestore
          try {
            for (const prod of INITIAL_PRODUCTS) {
              await setDoc(doc(db, PRODUCTS_COL, prod.id), prod);
            }
            onUpdate(INITIAL_PRODUCTS);
            saveProducts(INITIAL_PRODUCTS);
          } catch (seedErr) {
            console.error('Error seeding initial products to Firestore:', seedErr);
            onUpdate(INITIAL_PRODUCTS);
          }
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
        console.warn('Firestore products listener error:', error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to Firestore products:', err);
    return () => {};
  }
}

/**
 * Add or update a Product in Firestore
 */
export async function syncAddProductToFirestore(product: Product): Promise<void> {
  if (!isFirebaseReady) return;
  try {
    await setDoc(doc(db, PRODUCTS_COL, product.id), product);
  } catch (err) {
    console.error('Failed to save product to Firestore:', err);
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
export async function syncSaveCustomerToFirestore(customer: Customer): Promise<void> {
  saveCustomer(customer);
  if (!isFirebaseReady) return;
  try {
    await setDoc(doc(db, CUSTOMERS_COL, customer.phone), {
      ...customer,
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.error('Failed to save customer to Firestore:', err);
  }
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
          for (const notif of INITIAL_NOTIFICATIONS) {
            await setDoc(doc(db, NOTIFICATIONS_COL, notif.id), {
              ...notif,
              timestamp: Date.now(),
            });
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
