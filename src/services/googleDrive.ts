import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { app } from '../firebase';
import { Customer, OrderRecord, PrescriptionOrder, Product } from '../types';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
];

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  createdTime?: string;
  size?: string;
  description?: string;
}

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Request Workspace Google Drive scopes
SCOPES.forEach((scope) => {
  provider.addScope(scope);
});

// Avoid duplicate popups & cache token in-memory ONLY (per security rules)
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

/**
 * Initialize Google Auth State
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    cachedUser = user;
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token isn't in memory yet; user needs to click Sign In to authorize Drive scopes
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google using popup to retrieve OAuth access token
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('لم نتمكن من استلام تصريح الدخول من Google Drive');
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentGoogleUser = (): User | null => {
  return cachedUser;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedUser = null;
};

/**
 * Upload a file to Google Drive using multipart upload
 */
export const uploadFileToDrive = async (params: {
  name: string;
  mimeType: string;
  content: string | Blob;
  description?: string;
}): Promise<DriveFileItem> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('يرجى تسجيل الدخول إلى Google أولاً');
  }

  const metadata = {
    name: params.name,
    mimeType: params.mimeType,
    description: params.description || 'تم الحفظ من منصة صيدلية الديب الرقمية',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  let bodyContent: string;
  if (params.content instanceof Blob) {
    // If blob, convert to base64 or arraybuffer text
    const buffer = await params.content.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    bodyContent = btoa(binary);

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${params.mimeType}\r\n` +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      bodyContent +
      closeDelimiter;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,createdTime,size,description',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || 'فشل رفع الملف إلى Google Drive');
    }

    return await response.json();
  } else {
    bodyContent = params.content;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${params.mimeType}\r\n\r\n` +
      bodyContent +
      closeDelimiter;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,createdTime,size,description',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || 'فشل رفع الملف إلى Google Drive');
    }

    return await response.json();
  }
};

/**
 * List files uploaded by or accessible through this app
 */
export const listDriveFiles = async (): Promise<DriveFileItem[]> => {
  const token = await getAccessToken();
  if (!token) {
    return [];
  }

  try {
    const q = encodeURIComponent("trashed = false and (name contains 'eldeeb' or name contains 'روشتة' or name contains 'صيدلية')");
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,webViewLink,createdTime,size,description)&orderBy=createdTime desc&pageSize=30`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      // If query fails, fallback to simple list
      const fallback = await fetch(
        `https://www.googleapis.com/drive/v3/files?fields=files(id,name,mimeType,webViewLink,createdTime,size,description)&orderBy=createdTime desc&pageSize=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!fallback.ok) return [];
      const data = await fallback.json();
      return data.files || [];
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Failed to list drive files:', error);
    return [];
  }
};

/**
 * Delete a file from Google Drive
 * Must only be called after explicit user confirmation in UI!
 */
export const deleteDriveFile = async (fileId: string): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) throw new Error('يرجى تسجيل الدخول إلى Google أولاً');

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.ok;
};

/**
 * Backup full pharmacy data to Google Drive
 */
export const backupPharmacyDataToDrive = async (data: {
  products: Product[];
  orders: OrderRecord[];
  customers: Customer[];
  prescriptions: PrescriptionOrder[];
}): Promise<DriveFileItem> => {
  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-');
  const fileName = `eldeeb_pharmacy_backup_${dateStr}_${timeStr}.json`;

  const payload = {
    pharmacy: 'صيدلية الديب - El Deeb Pharmacy',
    backupDate: new Date().toISOString(),
    version: '2.0.0',
    stats: {
      totalProducts: data.products.length,
      totalOrders: data.orders.length,
      totalCustomers: data.customers.length,
      totalPrescriptions: data.prescriptions.length,
    },
    data,
  };

  return await uploadFileToDrive({
    name: fileName,
    mimeType: 'application/json',
    content: JSON.stringify(payload, null, 2),
    description: `نسخة احتياطية لقاعدة بيانات صيدلية الديب: ${data.products.length} منتج، ${data.orders.length} طلب، ${data.customers.length} عميل`,
  });
};
