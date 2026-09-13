import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseAppletConfig from '../firebase-applet-config.json';

const metaEnv = ((import.meta as unknown) as { env?: Record<string, string | undefined> })?.env || {};

export const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey || '',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain || '',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId || '',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket || '',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId || '',
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId || '',
};

export const databaseId = (firebaseAppletConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId || '(default)';

let appInstance;
if (!getApps().length) {
  appInstance = initializeApp(firebaseConfig);
} else {
  appInstance = getApp();
}

export const app = appInstance;

function createFirestoreInstance(): Firestore {
  try {
    return initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
      },
      databaseId
    );
  } catch {
    return getFirestore(app, databaseId);
  }
}

export const db: Firestore = createFirestoreInstance();
export const isFirebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Test Firestore connection on boot with graceful offline resilience
async function testConnection() {
  if (!isFirebaseReady) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network connectivity.");
    }
  }
}

if (typeof window !== 'undefined') {
  setTimeout(() => {
    testConnection().catch(() => {});
  }, 1500);
} else {
  testConnection().catch(() => {});
}

export interface FirebaseConfigStatus {
  isConfigured: boolean;
  projectId?: string;
  databaseId?: string;
}

export function getFirebaseStatus(): FirebaseConfigStatus {
  return {
    isConfigured: isFirebaseReady,
    projectId: firebaseConfig.projectId || undefined,
    databaseId,
  };
}
