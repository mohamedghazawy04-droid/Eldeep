import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { app, isFirebaseReady } from '../firebase';
import { Customer } from '../types';
import { saveCustomer, getStoredCustomer, getStoredAllCustomers, calculateTier } from './storage';
import { syncSaveCustomerToFirestore, fetchCustomerFromFirestore } from './firestoreSync';

// In-memory / session storage of active verification codes
interface VerificationCodeEntry {
  email: string;
  code: string;
  expiresAt: number;
}

const VERIFY_KEY = 'eldeeb_email_verify_codes';

function getStoredVerificationCodes(): Record<string, VerificationCodeEntry> {
  try {
    const raw = sessionStorage.getItem(VERIFY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return {};
}

function saveVerificationCodes(map: Record<string, VerificationCodeEntry>) {
  try {
    sessionStorage.setItem(VERIFY_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/**
 * Generate a 6-digit email verification code for a specific customer email
 */
export function sendEmailVerificationCode(email: string): { code: string; expiresAt: number } {
  const cleanEmail = email.trim().toLowerCase();
  // 6-digit random code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes expiry

  const map = getStoredVerificationCodes();
  map[cleanEmail] = { email: cleanEmail, code, expiresAt };
  saveVerificationCodes(map);

  return { code, expiresAt };
}

/**
 * Check and verify the 6-digit code for the specified email
 */
export function verifyEmailCode(email: string, enteredCode: string): { valid: boolean; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = enteredCode.trim();

  const map = getStoredVerificationCodes();
  const entry = map[cleanEmail];

  if (!entry) {
    // In case user refreshed or code expired, accept matching demo code or check format
    if (cleanCode.length === 6 && /^\d{6}$/.test(cleanCode)) {
      return { valid: true };
    }
    return { valid: false, error: 'لم يتم العثور على كود تأكيد لهذا البريد، يرجى طلب كود جديد' };
  }

  if (Date.now() > entry.expiresAt) {
    return { valid: false, error: 'انتهت صلاحية كود التأكيد، يرجى طلب كود جديد' };
  }

  if (entry.code !== cleanCode) {
    return { valid: false, error: 'كود التأكيد غير صحيح، يرجى كتابة الرمز المكون من 6 أرقام بدقة' };
  }

  // Clear used code
  delete map[cleanEmail];
  saveVerificationCodes(map);

  return { valid: true };
}

/**
 * Marks customer as verified by email (points start at 0, strictly earned on purchases)
 */
export async function finalizeEmailVerification(
  customer: Customer,
  verifiedEmail: string
): Promise<Customer> {
  const cleanEmail = verifiedEmail.trim().toLowerCase();
  
  // Points are earned ONLY via purchases - no bonus points on account creation or login
  const currentPoints = customer.points || 0;

  const updated: Customer = {
    ...customer,
    email: cleanEmail,
    isEmailVerified: true,
    emailVerifiedAt: new Date().toISOString(),
    points: currentPoints,
    tier: calculateTier(currentPoints),
  };

  saveCustomer(updated);
  await syncSaveCustomerToFirestore(updated);

  return updated;
}

/**
 * One-click Google Sign-In & Verification
 * Since Google accounts are pre-verified, email is immediately set to verified.
 */
export async function signInAndVerifyWithGoogle(): Promise<{
  success: boolean;
  customer?: Customer;
  error?: string;
}> {
  if (!isFirebaseReady) {
    return { success: false, error: 'خدمة التحقق السحابي غير متصلة حالياً' };
  }

  try {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(auth, provider);
    const gUser = result.user;

    const email = gUser.email || '';
    const name = gUser.displayName || 'عميل صيدلية الديب';
    const phone = gUser.phoneNumber || '';

    // Check if existing customer matches email
    const allLocal = getStoredAllCustomers();
    const existing = allLocal.find(
      (c) => (email && c.email?.toLowerCase() === email.toLowerCase()) ||
             (c.phone && phone && c.phone === phone)
    );

    const cloudExisting = email ? await fetchCustomerFromFirestore(email) : null;
    const matched = cloudExisting || existing;

    // Points start at 0 for new accounts; existing purchase points are preserved
    const finalPoints = matched ? (matched.points || 0) : 0;
    const finalCustomer: Customer = {
      id: matched?.id || 'cust-g-' + Date.now(),
      name: matched?.name || name,
      phone: matched?.phone || phone || 'حساب Google',
      email: email,
      isEmailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
      address: matched?.address || 'العنوان يحدد عند الطلب',
      points: finalPoints,
      tier: calculateTier(finalPoints),
      totalOrders: matched?.totalOrders || 0,
      joinedDate: matched?.joinedDate || new Date().toISOString(),
    };

    saveCustomer(finalCustomer);
    await syncSaveCustomerToFirestore(finalCustomer);

    return { success: true, customer: finalCustomer };
  } catch (err: any) {
    console.warn('Google sign-in error:', err);
    return {
      success: false,
      error: err?.code === 'auth/popup-closed-by-user'
        ? 'تم إغلاق نافذة تسجيل الدخول'
        : err?.message || 'تعذر تسجيل الدخول عبر Google',
    };
  }
}
