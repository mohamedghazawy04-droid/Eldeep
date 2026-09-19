import { Customer, OrderRecord, Product } from '../types';
import {
  getStoredAllCustomers,
  getStoredOrders,
  getStoredProducts,
  saveProducts,
  saveAllCustomers,
  calculateTier,
} from './storage';
import {
  syncBatchUploadProductsToFirestore,
  syncBatchUploadCustomersToFirestore,
} from './firestoreSync';

export interface GitHubBackupConfig {
  enabled: boolean;
  repo: string; // e.g. "mohamedghazawy04-droid/Eldeep"
  branch: string; // e.g. "main"
  filePath: string; // e.g. "eldeeb_pharmacy_backup.json"
  customerFilePath?: string; // e.g. "eldeeb_customers_backup.json"
  token: string; // Personal Access Token (classic or fine-grained)
  gistId: string; // Optional: GitHub Gist ID
  rawUrl: string; // Optional: Direct raw URL
  autoSync: boolean; // Auto-backup on any product/order change
  lastBackupAt?: string;
  lastBackupStatus?: 'success' | 'error' | 'idle';
  lastBackupMessage?: string;
  lastCustomerBackupAt?: string;
  lastCustomerBackupStatus?: 'success' | 'error' | 'idle';
  lastCustomerBackupMessage?: string;
}

const GITHUB_CONFIG_KEY = 'eldeeb_github_backup_config_v1';

const DEFAULT_CONFIG: GitHubBackupConfig = {
  enabled: true,
  repo: 'mohamedghazawy04-droid/Eldeep',
  branch: 'main',
  filePath: 'eldeeb_pharmacy_backup.json',
  customerFilePath: 'eldeeb_customers_backup.json',
  token: '',
  gistId: '',
  rawUrl: '',
  autoSync: true,
  lastBackupStatus: 'idle',
  lastCustomerBackupStatus: 'idle',
};

/**
 * Retrieve GitHub Backup configuration from storage
 */
export function getGitHubBackupConfig(): GitHubBackupConfig {
  try {
    const raw = localStorage.getItem(GITHUB_CONFIG_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    // Automatically migrate old placeholder username to current GitHub user
    if (!parsed.repo || parsed.repo.includes('mohamedhgas4444')) {
      parsed.repo = 'mohamedghazawy04-droid/Eldeep';
    }
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function sanitizeGitHubToken(raw?: string): string {
  if (!raw) return '';
  let clean = raw.trim();
  clean = clean.replace(/^["'`]|["'`]$/g, '').trim();
  if (clean.toLowerCase().startsWith('bearer ')) {
    clean = clean.slice(7).trim();
  } else if (clean.toLowerCase().startsWith('token ')) {
    clean = clean.slice(6).trim();
  }
  return clean.replace(/\s+/g, '');
}

/**
 * Save GitHub Backup configuration
 */
export function saveGitHubBackupConfig(cfg: Partial<GitHubBackupConfig>): GitHubBackupConfig {
  const current = getGitHubBackupConfig();
  const sanitizedPatch = { ...cfg };
  if (sanitizedPatch.token !== undefined) {
    sanitizedPatch.token = sanitizeGitHubToken(sanitizedPatch.token);
  }
  const updated = { ...current, ...sanitizedPatch };
  try {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save GitHub backup config to localStorage', e);
  }
  return updated;
}

/**
 * Safely encode UTF-8 string to base64 in browser without breaking Arabic characters
 */
function utf8ToBase64(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    // Fallback using TextEncoder
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

/**
 * Safely decode base64 to UTF-8 string in browser
 */
function base64ToUtf8(b64: string): string {
  try {
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }
}

export interface BackupPayload {
  version: string;
  timestamp: string;
  pharmacyName: string;
  totalProducts: number;
  totalCustomers?: number;
  products: Product[];
  orders?: OrderRecord[];
  customers?: Customer[];
}

export interface CustomerBackupPayload {
  version: string;
  timestamp: string;
  pharmacyName: string;
  totalCustomers: number;
  totalLoyaltyPoints: number;
  customers: Customer[];
}

/**
 * Generates formatted backup payload for the entire pharmacy system
 */
export function generateBackupPayload(
  customProducts?: Product[],
  customCustomers?: Customer[]
): BackupPayload {
  const prods = customProducts || getStoredProducts();
  const orders = getStoredOrders();
  const customers = customCustomers || getStoredAllCustomers();

  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    pharmacyName: 'صيدلية الديب - ElDeeb Pharmacy',
    totalProducts: prods.length,
    totalCustomers: customers.length,
    products: prods,
    orders,
    customers,
  };
}

/**
 * Generates dedicated customer accounts & loyalty points backup payload
 */
export function generateCustomersBackupPayload(
  customCustomers?: Customer[]
): CustomerBackupPayload {
  const customers = customCustomers || getStoredAllCustomers();
  const totalLoyaltyPoints = customers.reduce((sum, c) => sum + (c.points || 0), 0);

  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    pharmacyName: 'صيدلية الديب - ElDeeb Pharmacy',
    totalCustomers: customers.length,
    totalLoyaltyPoints,
    customers,
  };
}

/**
 * Test GitHub connection with provided Token & Repo
 */
export async function testGitHubConnection(config?: Partial<GitHubBackupConfig>): Promise<{
  success: boolean;
  user?: string;
  repoExists?: boolean;
  error?: string;
}> {
  const cfg = { ...getGitHubBackupConfig(), ...(config || {}) };
  const token = sanitizeGitHubToken(cfg.token);

  if (!token) {
    return { success: false, error: 'يرجى إدخال رمز الوصول الشخصي (GitHub Personal Access Token)' };
  }

  try {
    // 1. Verify token & user with Bearer or Token header
    let userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    // If 401, retry with "token " scheme for classic tokens
    if (!userRes.ok && userRes.status === 401) {
      userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
    }

    if (!userRes.ok) {
      if (userRes.status === 401) {
        return {
          success: false,
          error:
            'رمز الوصول غير صالح أو انتهت صلاحيته على GitHub. تأكد من نسخ الرمز كاملاً واختيار (No expiration) عند توليده.',
        };
      }
      return { success: false, error: `فشل التحقق من الحساب (كود: ${userRes.status})` };
    }

    const userData = await userRes.json();

    // 2. Verify repository if provided
    let repoExists = false;
    if (cfg.repo.trim()) {
      const repoClean = cfg.repo.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
      let repoRes = await fetch(`https://api.github.com/repos/${repoClean}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (!repoRes.ok && repoRes.status === 401) {
        repoRes = await fetch(`https://api.github.com/repos/${repoClean}`, {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
      }
      repoExists = repoRes.ok;
    }

    return {
      success: true,
      user: userData.login || userData.name,
      repoExists,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'تعذر الاتصال بخوادم GitHub' };
  }
}

/**
 * Upload & commit permanent backup to GitHub Repository or Gist
 */
export async function uploadBackupToGitHub(
  customProducts?: Product[],
  overrideConfig?: Partial<GitHubBackupConfig>
): Promise<{ success: boolean; commitUrl?: string; error?: string }> {
  const cfg = { ...getGitHubBackupConfig(), ...(overrideConfig || {}) };
  const token = sanitizeGitHubToken(cfg.token);

  if (!token) {
    saveGitHubBackupConfig({
      lastBackupStatus: 'error',
      lastBackupMessage: 'رمز الوصول الشخصي لـ GitHub غير مدخل',
    });
    return {
      success: false,
      error: 'يرجى إدخال رمز الوصول الشخصي لـ GitHub (Token) في إعدادات النسخ الاحتياطي.',
    };
  }

  const payload = generateBackupPayload(customProducts);
  const jsonContent = JSON.stringify(payload, null, 2);
  const base64Content = utf8ToBase64(jsonContent);

  // A. Gist strategy (if gistId is specified)
  if (cfg.gistId.trim()) {
    try {
      const gistId = cfg.gistId.trim();
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: `نسخة احتياطية سحابية دائمة - صيدلية الديب (${new Date().toLocaleDateString('ar-EG')})`,
          files: {
            [cfg.filePath || 'eldeeb_pharmacy_backup.json']: {
              content: jsonContent,
            },
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`خطأ في تحديث Gist (كود: ${res.status})`);
      }

      const gistData = await res.json();
      const updatedTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      saveGitHubBackupConfig({
        lastBackupAt: updatedTime,
        lastBackupStatus: 'success',
        lastBackupMessage: `تم النسخ السحابي بنجاح إلى Gist (${payload.totalProducts} صنف)`,
      });

      return { success: true, commitUrl: gistData.html_url };
    } catch (err: any) {
      saveGitHubBackupConfig({
        lastBackupStatus: 'error',
        lastBackupMessage: err?.message || 'فشل الحفظ في GitHub Gist',
      });
      return { success: false, error: err?.message };
    }
  }

  // B. Repository strategy (default)
  const repoClean = cfg.repo.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
  if (!repoClean.includes('/')) {
    return { success: false, error: 'اسم المستودع يجب أن يكون بصيغة username/repository' };
  }

  const branch = cfg.branch.trim() || 'main';
  const filePath = cfg.filePath.trim() || 'eldeeb_pharmacy_backup.json';
  const apiUrl = `https://api.github.com/repos/${repoClean}/contents/${filePath}`;

  try {
    // 1. Check if file already exists to get its SHA (required for GitHub update)
    let fileSha: string | undefined;
    const existingRes = await fetch(`${apiUrl}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (existingRes.ok) {
      const existingData = await existingRes.json();
      fileSha = existingData.sha;
    }

    // 2. Put / Commit the file
    const commitBody: any = {
      message: `تحديث النسخة الاحتياطية السحابية الدائمة - ${payload.totalProducts} صنف [${new Date().toISOString().slice(0, 10)}]`,
      content: base64Content,
      branch,
    };

    if (fileSha) {
      commitBody.sha = fileSha;
    }

    const commitRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commitBody),
    });

    if (!commitRes.ok) {
      const errData = await commitRes.json().catch(() => ({}));
      throw new Error(errData.message || `فشل حفظ الملف على GitHub (كود: ${commitRes.status})`);
    }

    const commitData = await commitRes.json();
    const updatedTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    saveGitHubBackupConfig({
      lastBackupAt: updatedTime,
      lastBackupStatus: 'success',
      lastBackupMessage: `تم الحفظ السحابي بنجاح على GitHub (${payload.totalProducts} صنف)`,
    });

    return {
      success: true,
      commitUrl: commitData.commit?.html_url || `https://github.com/${repoClean}/blob/${branch}/${filePath}`,
    };
  } catch (err: any) {
    console.error('GitHub backup upload error:', err);
    saveGitHubBackupConfig({
      lastBackupStatus: 'error',
      lastBackupMessage: err?.message || 'فشل الاتصال بـ GitHub',
    });
    return { success: false, error: err?.message || 'فشل الاتصال بـ GitHub' };
  }
}

/**
 * Upload & commit dedicated Customers & Loyalty points backup to GitHub
 */
export async function uploadCustomersBackupToGitHub(
  customCustomers?: Customer[],
  overrideConfig?: Partial<GitHubBackupConfig>
): Promise<{ success: boolean; commitUrl?: string; error?: string }> {
  const cfg = { ...getGitHubBackupConfig(), ...(overrideConfig || {}) };
  const token = sanitizeGitHubToken(cfg.token);

  if (!token) {
    saveGitHubBackupConfig({
      lastCustomerBackupStatus: 'error',
      lastCustomerBackupMessage: 'رمز الوصول الشخصي لـ GitHub غير مدخل',
    });
    return {
      success: false,
      error: 'يرجى إدخال رمز الوصول الشخصي لـ GitHub (Token) في إعدادات النسخ الاحتياطي.',
    };
  }

  const payload = generateCustomersBackupPayload(customCustomers);
  const jsonContent = JSON.stringify(payload, null, 2);
  const base64Content = utf8ToBase64(jsonContent);

  const repoClean = cfg.repo.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
  if (!repoClean.includes('/')) {
    return { success: false, error: 'اسم المستودع يجب أن يكون بصيغة username/repository' };
  }

  const branch = cfg.branch.trim() || 'main';
  const filePath = cfg.customerFilePath?.trim() || 'eldeeb_customers_backup.json';
  const apiUrl = `https://api.github.com/repos/${repoClean}/contents/${filePath}`;

  try {
    let fileSha: string | undefined;
    const existingRes = await fetch(`${apiUrl}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (existingRes.ok) {
      const existingData = await existingRes.json();
      fileSha = existingData.sha;
    }

    const commitBody: any = {
      message: `حفظ بيانات عملاء الصيدلية ونقاط الولاء - ${payload.totalCustomers} عميل [${new Date().toISOString().slice(0, 10)}]`,
      content: base64Content,
      branch,
    };

    if (fileSha) {
      commitBody.sha = fileSha;
    }

    const commitRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commitBody),
    });

    if (!commitRes.ok) {
      const errData = await commitRes.json().catch(() => ({}));
      throw new Error(errData.message || `فشل حفظ ملف العملاء على GitHub (كود: ${commitRes.status})`);
    }

    const commitData = await commitRes.json();
    const updatedTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    saveGitHubBackupConfig({
      lastCustomerBackupAt: updatedTime,
      lastCustomerBackupStatus: 'success',
      lastCustomerBackupMessage: `تم حفظ بيانات العملاء بنجاح على GitHub (${payload.totalCustomers} عميل)`,
    });

    return {
      success: true,
      commitUrl: commitData.commit?.html_url || `https://github.com/${repoClean}/blob/${branch}/${filePath}`,
    };
  } catch (err: any) {
    console.error('GitHub customer backup error:', err);
    saveGitHubBackupConfig({
      lastCustomerBackupStatus: 'error',
      lastCustomerBackupMessage: err?.message || 'فشل الاتصال بـ GitHub',
    });
    return { success: false, error: err?.message || 'فشل الاتصال بـ GitHub' };
  }
}

/**
 * Fetch and restore backup from GitHub (Raw URL or Repository)
 */
export async function restoreFromGitHubBackup(
  customUrl?: string
): Promise<{ success: boolean; count?: number; products?: Product[]; error?: string }> {
  const cfg = getGitHubBackupConfig();
  let fetchUrl = customUrl?.trim() || cfg.rawUrl.trim();

  // If no direct raw URL, construct raw URL from repo + branch + filePath
  if (!fetchUrl && cfg.repo.trim()) {
    const repoClean = cfg.repo.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
    const branch = cfg.branch.trim() || 'main';
    const filePath = cfg.filePath.trim() || 'eldeeb_pharmacy_backup.json';
    fetchUrl = `https://raw.githubusercontent.com/${repoClean}/${branch}/${filePath}`;
  }

  if (!fetchUrl) {
    return { success: false, error: 'لم يتم تحديد رابط Raw أو مستودع GitHub لاستعادة النسخة منه' };
  }

  try {
    const headers: Record<string, string> = {
      'Cache-Control': 'no-cache',
    };
    if (cfg.token.trim()) {
      headers.Authorization = `Bearer ${cfg.token.trim()}`;
    }

    const res = await fetch(fetchUrl, { headers });
    if (!res.ok) {
      throw new Error(`تعذر جلب الملف من GitHub (كود الاستجابة: ${res.status})`);
    }

    const json = await res.json();
    let prods: Product[] = [];

    if (Array.isArray(json)) {
      prods = json;
    } else if (json && Array.isArray(json.products)) {
      prods = json.products;
    }

    if (prods.length === 0) {
      return { success: false, error: 'الملف المسترجع من GitHub لا يحتوي على أصناف صالحة' };
    }

    // Save restored products locally and sync to Firestore
    saveProducts(prods);
    syncBatchUploadProductsToFirestore(prods).catch(() => {});

    return {
      success: true,
      count: prods.length,
      products: prods,
    };
  } catch (err: any) {
    console.error('Failed to restore from GitHub:', err);
    return { success: false, error: err?.message || 'فشل استرجاع النسخة من GitHub' };
  }
}

/**
 * Instant 1-click download of the complete GitHub-ready JSON backup file
 */
export function downloadBackupJsonFile(customProducts?: Product[]): void {
  const payload = generateBackupPayload(customProducts);
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `eldeeb_pharmacy_backup_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Debounced auto-sync to GitHub
let autoSyncTimer: any = null;
export function triggerDebouncedGitHubAutoSync(products: Product[]): void {
  const cfg = getGitHubBackupConfig();
  if (!cfg.enabled || !cfg.autoSync || !cfg.token.trim()) return;

  if (autoSyncTimer) clearTimeout(autoSyncTimer);
  autoSyncTimer = setTimeout(() => {
    uploadBackupToGitHub(products).catch((e) => {
      console.warn('Background GitHub auto-sync failed:', e);
    });
  }, 4000);
}
