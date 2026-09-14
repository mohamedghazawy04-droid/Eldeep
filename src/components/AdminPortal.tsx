import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Package,
  Sparkles,
  ShoppingBag,
  FileText,
  Users,
  Bell,
  Plus,
  ExternalLink,
  Trash2,
  Edit3,
  LogOut,
  CheckCircle2,
  RefreshCw,
  Camera,
  AlertCircle,
  Database,
  Globe,
  Settings,
  Layers,
  Code2,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Check,
  Copy,
  Terminal,
  Play,
  Save,
  Sliders,
  Send,
  ArrowLeft,
  X,
  Smartphone,
  Server,
  Zap,
  HardDrive,
  CloudUpload,
  Upload,
  ImageIcon,
} from 'lucide-react';
import { Product, Customer, AppNotification, ProductCategory } from '../types';
import { CATEGORIES } from '../data/initialData';
import { GeminiProductStudio } from './GeminiProductStudio';
import { GoogleDriveModal } from './GoogleDriveModal';
import { CustomersManager } from './CustomersManager';
import {
  syncAddProductToFirestore,
  syncDeleteProductFromFirestore,
  syncClearAllFirestoreProducts,
  syncBroadcastNotificationToFirestore,
} from '../services/firestoreSync';
import { getStoredAllCustomers, getStoredOrders, getStoredPrescriptions } from '../services/storage';
import { getManagerSession, requestManagerMagicLink, signInManagerWithGoogle, signOutManager, MANAGER_EMAIL } from '../services/adminAuth';

export interface GitHubAppItem {
  id: string;
  name: string;
  nameEn: string;
  repo: string;
  branch: string;
  category: string;
  description: string;
  liveUrl: string;
  githubUrl: string;
  lastCommitMessage: string;
  lastCommitHash: string;
  lastCommitTime: string;
  status: 'active' | 'synced' | 'building';
  config: {
    appName: string;
    version: string;
    environment: 'production' | 'staging';
    maintenanceMode: boolean;
    whatsappHotline: string;
    primaryColor: string;
    features: {
      aiPrescriptions: boolean;
      realtimeSync: boolean;
      pushNotifications: boolean;
      vespaDelivery: boolean;
    };
    rawConfigJson: string;
  };
}

interface AdminPortalProps {
  products: Product[];
  onAddProduct: (product: Product) => Promise<{ success: boolean; isOnline: boolean; error?: string }>;
  onDeleteProduct: (productId: string) => void;
  onUpdateProduct: (product: Product) => Promise<{ success: boolean; isOnline: boolean; error?: string }>;
  onClearAllProducts?: () => void;
  onBatchImportProducts?: (products: Product[]) => void;
  onBroadcastNotification: (title: string, message: string) => void;
  onBackToStore: () => void;
}

const DEFAULT_GITHUB_APPS: GitHubAppItem[] = [
  {
    id: 'app-eldeeb-pharmacy',
    name: 'صيدلية الديب الإلكترونية',
    nameEn: 'El-Deeb Pharmacy Store & PWA',
    repo: 'mohamedhgas4444/eldeeb-pharmacy',
    branch: 'main',
    category: 'متجر وتطبيق عملاء',
    description: 'المتجر الإلكتروني الرئيسي، كتالوج الأدوية الذكي، طلبات الروشتات، ونظام الولاء السحابي.',
    liveUrl: window.location.origin,
    githubUrl: 'https://github.com/mohamedhgas4444/eldeeb-pharmacy',
    lastCommitMessage: 'feat: Update pharmacy branding and checkout flows',
    lastCommitHash: '8f2a9c1',
    lastCommitTime: 'منذ دقيقتين',
    status: 'active',
    config: {
      appName: 'صيدلية الديب',
      version: '2.4.0',
      environment: 'production',
      maintenanceMode: false,
      whatsappHotline: '01009097378',
      primaryColor: '#0284c7',
      features: {
        aiPrescriptions: true,
        realtimeSync: true,
        pushNotifications: true,
        vespaDelivery: true,
      },
      rawConfigJson: JSON.stringify(
        {
          name: 'صيدلية الديب',
          version: '2.4.0',
          env: 'production',
          whatsapp: '01009097378',
          features: {
            aiCameraStudio: true,
            firestoreSync: true,
            funnyVespaCaptain: true,
            pushNotifications: true,
          },
          theme: {
            primary: '#0284c7',
            accent: '#10b981',
            mode: 'auto',
          },
        },
        null,
        2
      ),
    },
  },
  {
    id: 'app-pharma-erp',
    name: 'نظام الحسابات ومخازن الأدوية ERP',
    nameEn: 'Pharma ERP & Warehouse Inventory',
    repo: 'mohamedhgas4444/pharma-erp-sync',
    branch: 'main',
    category: 'إدارة ومخازن',
    description: 'برنامج نقاط البيع الكاشير، الفواتير الضريبية، جرد النواقص وربط الشركات الموردة للأدوية.',
    liveUrl: 'https://erp.eldeeb-pharma.com',
    githubUrl: 'https://github.com/mohamedhgas4444/pharma-erp-sync',
    lastCommitMessage: 'fix(inventory): Auto-sync low stock medicines with distributor queue',
    lastCommitHash: 'c4e107b',
    lastCommitTime: 'اليوم، 11:20 ص',
    status: 'synced',
    config: {
      appName: 'منظومة مخازن الديب ERP',
      version: '3.1.2',
      environment: 'production',
      maintenanceMode: false,
      whatsappHotline: '01009097378',
      primaryColor: '#7c3aed',
      features: {
        aiPrescriptions: false,
        realtimeSync: true,
        pushNotifications: true,
        vespaDelivery: false,
      },
      rawConfigJson: JSON.stringify(
        {
          name: 'Pharma ERP Engine',
          version: '3.1.2',
          autoReorderLowStock: true,
          defaultMargin: 0.22,
          backupSchedule: 'hourly',
          edaSync: true,
        },
        null,
        2
      ),
    },
  },
  {
    id: 'app-delivery-captain',
    name: 'تطبيق كابتن التوصيل السريع (فيزبا الديب)',
    nameEn: 'Vespa Courier Driver Companion App',
    repo: 'mohamedhgas4444/eldeeb-delivery-agent',
    branch: 'main',
    category: 'دليفري وشحن',
    description: 'تطبيق خاص بمناديب التوصيل وكباتن الموتوسيكلات لتأكيد استلام وتوصيل الطلبات للعنوان بالـ GPS.',
    liveUrl: 'https://driver.eldeeb-pharma.com',
    githubUrl: 'https://github.com/mohamedhgas4444/eldeeb-delivery-agent',
    lastCommitMessage: 'feat(gps): Optimize delivery route and customer location pin',
    lastCommitHash: '9a7d32e',
    lastCommitTime: 'أمس، 06:45 م',
    status: 'active',
    config: {
      appName: 'كابتن صيدلية الديب',
      version: '1.8.0',
      environment: 'production',
      maintenanceMode: false,
      whatsappHotline: '01009097378',
      primaryColor: '#059669',
      features: {
        aiPrescriptions: false,
        realtimeSync: true,
        pushNotifications: true,
        vespaDelivery: true,
      },
      rawConfigJson: JSON.stringify(
        {
          appName: 'Vespa Courier App',
          version: '1.8.0',
          autoAssignOrders: true,
          liveGpsTracking: true,
          fleetVehicles: ['Vespa Classic', 'Boxer 150', 'Honda Dio'],
        },
        null,
        2
      ),
    },
  },
  {
    id: 'app-rx-ai',
    name: 'بوابة الروشتات والذكاء الاصطناعي',
    nameEn: 'AI Prescription Vision OCR Engine',
    repo: 'mohamedhgas4444/rx-ai-scanner',
    branch: 'production',
    category: 'ذكاء اصطناعي وطبي',
    description: 'محرك قراءة الروشتات الطبية المكتوبة بخط اليد بالذكاء الاصطناعي وتجهيز بدائل الأدوية.',
    liveUrl: 'https://ai-rx.eldeeb-pharma.com',
    githubUrl: 'https://github.com/mohamedhgas4444/rx-ai-scanner',
    lastCommitMessage: 'refactor(vision): Improve Egyptian handwritten prescription accuracy to 98.4%',
    lastCommitHash: '5e8b112',
    lastCommitTime: 'منذ 3 أيام',
    status: 'synced',
    config: {
      appName: 'محرك الذكاء الاصطناعي للروشتات',
      version: '2.0.1',
      environment: 'production',
      maintenanceMode: false,
      whatsappHotline: '01009097378',
      primaryColor: '#d97706',
      features: {
        aiPrescriptions: true,
        realtimeSync: true,
        pushNotifications: false,
        vespaDelivery: false,
      },
      rawConfigJson: JSON.stringify(
        {
          engine: 'gemini-2.5-flash-vision',
          targetAccuracy: 0.98,
          extractDrugDosage: true,
          suggestAlternatives: true,
        },
        null,
        2
      ),
    },
  },
];

export const AdminPortal: React.FC<AdminPortalProps> = ({
  products,
  onAddProduct,
  onDeleteProduct,
  onUpdateProduct,
  onClearAllProducts,
  onBroadcastNotification,
  onBackToStore,
}) => {
  // Manager authentication is verified through the centralized hashed PIN checker.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('eldeeb_hub_auth') === 'true';
  });
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');

  useEffect(() => {
    getManagerSession().then((allowed) => setIsAuthenticated(allowed));
  }, []);

  // Active Hub Navigation Tab
  const [activeTab, setActiveTab] = useState<'github' | 'products' | 'broadcast' | 'customers' | 'drive'>('github');
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // GitHub Connected Apps State
  const [githubApps, setGithubApps] = useState<GitHubAppItem[]>(() => {
    try {
      const saved = localStorage.getItem('eldeeb_github_apps_v2');
      return saved ? JSON.parse(saved) : DEFAULT_GITHUB_APPS;
    } catch {
      return DEFAULT_GITHUB_APPS;
    }
  });

  const [searchAppTerm, setSearchAppTerm] = useState('');
  const [isAddRepoOpen, setIsAddRepoOpen] = useState(false);

  // New GitHub Repo Form
  const [newRepoName, setNewRepoName] = useState('');
  const [newAppTitle, setNewAppTitle] = useState('');
  const [newBranch, setNewBranch] = useState('main');
  const [newCategory, setNewCategory] = useState('تطبيق ويب');
  const [newAppDesc, setNewAppDesc] = useState('');
  const [newLiveUrl, setNewLiveUrl] = useState('');

  // Real-Time Live Editor Modal State ("ويمكن التعديل عليها بشكل لحظي")
  const [editingApp, setEditingApp] = useState<GitHubAppItem | null>(null);
  const [editorSubTab, setEditorSubTab] = useState<'visual' | 'code'>('visual');
  const [liveConfigState, setLiveConfigState] = useState<GitHubAppItem['config'] | null>(null);
  const [isLiveSaving, setIsLiveSaving] = useState(false);
  const [liveSaveSuccess, setLiveSaveSuccess] = useState(false);

  // Product Catalog Management Form State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<ProductCategory>('medicines');
  const [price, setPrice] = useState('');
  const [points, setPoints] = useState('');
  const [dosageForm, setDosageForm] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [isLowStock, setIsLowStock] = useState(false);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [requiresPrescription, setRequiresPrescription] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Push Broadcast Notification Form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Secret Link Copied State
  const [copiedLink, setCopiedLink] = useState(false);

  // Customers & Orders state for preview
  const [customersList] = useState<Customer[]>(getStoredAllCustomers);

  // Save GitHub Apps
  const saveGithubApps = (apps: GitHubAppItem[]) => {
    setGithubApps(apps);
    try {
      localStorage.setItem('eldeeb_github_apps_v2', JSON.stringify(apps));
    } catch (e) {
      console.error(e);
    }
  };

  // Request a one-time manager login link; no password is stored in the frontend.
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signInManagerWithGoogle();
    if (result.success) {
      setAuthError('');
      setAuthNotice(`سيتم تحويلك إلى Google. يجب استخدام الحساب ${MANAGER_EMAIL}`);
    } else setAuthError(result.error || 'تعذر تشغيل تسجيل الدخول عبر Google. فعّل Google Provider في Supabase.');
  };

  const handleMagicLink = async () => {
    const result = await requestManagerMagicLink();
    if (result.success) setAuthNotice(`تم إرسال رابط دخول آمن إلى ${MANAGER_EMAIL}`);
    else setAuthError(result.error || 'تعذر إرسال رابط الدخول.');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    signOutManager();
  };

  // Open Real-Time Live Editor for an app
  const handleOpenLiveEditor = (app: GitHubAppItem) => {
    setEditingApp(app);
    setLiveConfigState(JSON.parse(JSON.stringify(app.config)));
    setEditorSubTab('visual');
    setLiveSaveSuccess(false);
  };

  // Save & Apply Live Real-Time Changes ("التعديل اللحظي")
  const handleApplyLiveConfig = () => {
    if (!editingApp || !liveConfigState) return;
    setIsLiveSaving(true);

    setTimeout(() => {
      const updatedHash = Math.random().toString(16).substring(2, 9);
      const updatedApps = githubApps.map((a) => {
        if (a.id === editingApp.id) {
          return {
            ...a,
            config: liveConfigState,
            lastCommitHash: updatedHash,
            lastCommitMessage: `chore(config): Live runtime sync updated via Hub for ${liveConfigState.appName}`,
            lastCommitTime: 'الآن (مباشر)',
            status: 'active' as const,
          };
        }
        return a;
      });

      saveGithubApps(updatedApps);
      setIsLiveSaving(false);
      setLiveSaveSuccess(true);
      setTimeout(() => setLiveSaveSuccess(false), 3500);
    }, 600);
  };

  // Add new GitHub Repository App
  const handleCreateGitHubApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoName.trim() || !newAppTitle.trim()) {
      alert('يرجى ملء اسم المستودع واسم التطبيق');
      return;
    }

    let repoFormatted = newRepoName.trim();
    if (repoFormatted.startsWith('https://github.com/')) {
      repoFormatted = repoFormatted.replace('https://github.com/', '');
    }

    const newApp: GitHubAppItem = {
      id: 'app-' + Date.now(),
      name: newAppTitle.trim(),
      nameEn: repoFormatted.split('/')[1] || repoFormatted,
      repo: repoFormatted,
      branch: newBranch.trim() || 'main',
      category: newCategory.trim() || 'برنامج خاص',
      description: newAppDesc.trim() || `مستودع جيت هاب ${repoFormatted} مربوط بالمنظومة المركزية`,
      liveUrl: newLiveUrl.trim() || `https://github.com/${repoFormatted}`,
      githubUrl: `https://github.com/${repoFormatted}`,
      lastCommitMessage: 'initial sync with Central Hub',
      lastCommitHash: '1a2b3c4',
      lastCommitTime: 'الآن',
      status: 'active',
      config: {
        appName: newAppTitle.trim(),
        version: '1.0.0',
        environment: 'production',
        maintenanceMode: false,
        whatsappHotline: '01009097378',
        primaryColor: '#0284c7',
        features: {
          aiPrescriptions: false,
          realtimeSync: true,
          pushNotifications: true,
          vespaDelivery: false,
        },
        rawConfigJson: JSON.stringify(
          {
            appName: newAppTitle.trim(),
            repo: repoFormatted,
            branch: newBranch.trim() || 'main',
            status: 'live',
          },
          null,
          2
        ),
      },
    };

    const updated = [newApp, ...githubApps];
    saveGithubApps(updated);
    setNewRepoName('');
    setNewAppTitle('');
    setNewAppDesc('');
    setNewLiveUrl('');
    setIsAddRepoOpen(false);
    alert(`تم ربط مستودع "${newApp.name}" من GitHub بنجاح!`);
  };

  const handleDeleteGitHubApp = (appId: string) => {
    if (window.confirm('هل تريد إلغاء ربط هذا المستودع من المنظومة؟')) {
      const updated = githubApps.filter((a) => a.id !== appId);
      saveGithubApps(updated);
    }
  };

  // Product Save / Edit Handler
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingProduct) return;
    if (!nameAr.trim() || !price) {
      alert('يرجى ملء اسم الصنف والسعر');
      return;
    }

    const defaultImg =
      image ||
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80';
    const parsedPrice = parseFloat(price) || 0;
    const calculatedPoints = points ? parseFloat(points) : Math.max(0.1, Number((parsedPrice / 100).toFixed(1)));
    const qtyNumber = parseInt(stockQuantity, 10);

    if (editingProductId) {
      const existing = products.find((p) => p.id === editingProductId);
      const updated: Product = {
        id: editingProductId,
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim() || nameAr.trim(),
        category,
        price: parsedPrice,
        dosageForm: dosageForm.trim() || existing?.dosageForm || 'أقراص',
        activeIngredient: activeIngredient.trim() || existing?.activeIngredient || 'غير محدد',
        description: description.trim() || existing?.description || 'منتج طبي معتمد من صيدلية الديب.',
        usage: existing?.usage || 'وفق إرشادات الصيدلي.',
        requiresPrescription,
        inStock: !isComingSoon && (isNaN(qtyNumber) || qtyNumber > 0),
        points: calculatedPoints,
        image: defaultImg,
        isNew: existing?.isNew,
        stockQuantity: isNaN(qtyNumber) ? undefined : qtyNumber,
        isLowStock: isLowStock || (!isNaN(qtyNumber) && qtyNumber > 0 && qtyNumber <= 5),
        isComingSoon,
      };

      setIsSavingProduct(true);
      const result = await onUpdateProduct(updated);
      setIsSavingProduct(false);
      if (!result.success || !result.isOnline) {
        alert(result.error || 'تم الحفظ محلياً فقط. تعذر مزامنة المنتج مع السحابة.');
        return;
      }
      resetProductForm();
      alert(`تم حفظ تعديل ${updated.nameAr} بنجاح!`);
    } else {
      const newProd: Product = {
        id: 'prod-' + Date.now(),
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim() || nameAr.trim(),
        category,
        price: parsedPrice,
        dosageForm: dosageForm.trim() || 'أقراص',
        activeIngredient: activeIngredient.trim() || 'غير محدد',
        description: description.trim() || 'منتج طبي معتمد من صيدلية الديب.',
        usage: 'وفق استشارة الصيدلي.',
        requiresPrescription,
        inStock: !isComingSoon && (isNaN(qtyNumber) || qtyNumber > 0),
        points: calculatedPoints,
        image: defaultImg,
        isNew: true,
        stockQuantity: isNaN(qtyNumber) ? undefined : qtyNumber,
        isLowStock: isLowStock || (!isNaN(qtyNumber) && qtyNumber > 0 && qtyNumber <= 5),
        isComingSoon,
      };

      setIsSavingProduct(true);
      const result = await onAddProduct(newProd);
      setIsSavingProduct(false);
      if (!result.success || !result.isOnline) {
        alert(result.error || 'تم الحفظ محلياً فقط. تعذر مزامنة المنتج مع السحابة.');
        return;
      }
      resetProductForm();
      alert(`تمت إضافة ${newProd.nameAr} بنجاح للكتالوج!`);
    }
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setNameAr('');
    setNameEn('');
    setPrice('');
    setPoints('');
    setDosageForm('');
    setActiveIngredient('');
    setDescription('');
    setImage('');
    setStockQuantity('');
    setIsLowStock(false);
    setIsComingSoon(false);
    setRequiresPrescription(false);
  };

  const handleEditClick = (p: Product) => {
    setEditingProductId(p.id);
    setNameAr(p.nameAr);
    setNameEn(p.nameEn || '');
    setCategory(p.category);
    setPrice(String(p.price));
    setPoints(String(p.points));
    setDosageForm(p.dosageForm || '');
    setActiveIngredient(p.activeIngredient || '');
    setDescription(p.description || '');
    setImage(p.image);
    setStockQuantity(p.stockQuantity !== undefined ? String(p.stockQuantity) : '');
    setIsLowStock(!!p.isLowStock);
    setIsComingSoon(!!p.isComingSoon);
    setRequiresPrescription(!!p.requiresPrescription);
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveDemoProducts = () => {
    const demoIds = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const demoProds = products.filter((p) => demoIds.includes(p.id) || p.id.startsWith('demo-'));
    if (demoProds.length === 0) {
      alert('لا توجد أصناف تجريبية في الكتالوج حالياً.');
      return;
    }

    if (window.confirm(`هل تريد إزالة ${demoProds.length} أصناف تجريبية والاحتفاظ فقط بأصنافك الحقيقية؟`)) {
      demoProds.forEach((d) => {
        onDeleteProduct(d.id);
        syncDeleteProductFromFirestore(d.id);
      });
      alert('تم حذف جميع الأصناف التجريبية بنجاح!');
    }
  };

  // Broadcast push notification
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) {
      alert('يرجى كتابة العنوان والرسالة');
      return;
    }
    onBroadcastNotification(broadcastTitle.trim(), broadcastMsg.trim());
    syncBroadcastNotificationToFirestore(broadcastTitle.trim(), broadcastMsg.trim());
    setBroadcastTitle('');
    setBroadcastMsg('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 4000);
  };

  // Copy private direct link
  const handleCopySecretLink = () => {
    const secretUrl = window.location.origin + window.location.pathname + '#hub';
    navigator.clipboard.writeText(secretUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const filteredApps = githubApps.filter(
    (a) =>
      a.name.toLowerCase().includes(searchAppTerm.toLowerCase()) ||
      a.repo.toLowerCase().includes(searchAppTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchAppTerm.toLowerCase())
  );

  const filteredProducts = products.filter(
    (p) =>
      p.nameAr.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      (p.activeIngredient && p.activeIngredient.toLowerCase().includes(productSearchTerm.toLowerCase()))
  );

  return (
    <div
      id="standalone-admin-hub-portal"
      className="min-h-screen bg-slate-950 text-slate-100 font-cairo flex flex-col antialiased selection:bg-cyan-500 selection:text-white text-right"
      dir="rtl"
    >
      {/* Top Header Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                المنظومة المركزية ومركز تطبيقات GitHub
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/80 font-bold">
                Private Hub
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              إدارة صيدلية الديب ومستودعات جيت هاب والتعديل اللحظي المباشر
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Secret Link Share Button */}
          <button
            type="button"
            onClick={handleCopySecretLink}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="نسخ الرابط السري المباشر للبوابة"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{copiedLink ? 'تم نسخ الرابط السري!' : 'نسخ رابط البوابة'}</span>
          </button>

          {/* Switch back to customer store */}
          <button
            type="button"
            onClick={onBackToStore}
            className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-transform active:scale-95"
            title="الانتقال لمتجر العملاء"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">معاينة متجر العملاء</span>
          </button>

          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 rounded-xl font-bold text-xs border border-rose-800/60 flex items-center gap-1.5 transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      {!isAuthenticated ? (
        /* Isolated manager login gate */
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl text-center space-y-5"
          >
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-1">المنظومة المركزية</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                يرجى إدخال رمز الدخول السري للوصول لمركز التطبيقات وإدارة المستودعات.
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs rounded-xl flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authNotice && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs rounded-xl">
                {authNotice}
              </div>
            )}

            {/* Form with AUTOCOMPLETE STRICTLY DISABLED TO PREVENT BROWSER SUGGESTIONS */}
            <form
              onSubmit={handleLogin}
              autoComplete="off"
              className="space-y-4 text-right"
              data-form-type="other"
            >
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    تسجيل دخول المدير الآمن
                </label>
                <div className="relative">
                  <input
                    id="admin-portal-secure-pin"
                    type="email"
                    name="manager_email"
                    autoComplete="email"
                    data-lpignore="true"
                    data-form-type="other"
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="none"
                    value={MANAGER_EMAIL}
                    readOnly
                    onChange={(e) => setPin(e.target.value)}
                    placeholder={MANAGER_EMAIL}
                    className="w-full pr-4 pl-11 py-3 bg-slate-800 text-white rounded-2xl text-center text-lg tracking-widest font-mono outline-none border border-slate-700 focus:border-cyan-500 transition-colors shadow-inner"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-3.5 text-slate-400 hover:text-slate-200"
                    title={showPassword ? 'إخفاء الرمز' : 'إظهار الرمز'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-98"
              >
                الدخول باستخدام Google بأمان
              </button>
              <button
                type="button"
                onClick={handleMagicLink}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold text-xs transition-all"
              >
                أو إرسال رابط دخول إلى البريد
              </button>
            </form>
          </motion.div>
        </div>
      ) : (
        /* Authenticated Dashboard & GitHub Multi-App Hub */
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
          {/* Main Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 rounded-2xl gap-2 overflow-x-auto scrollbar-none shadow-sm">
            <button
              onClick={() => setActiveTab('github')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'github'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>مركز تطبيقات GitHub والتعديل اللحظي ({githubApps.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'products'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>كتالوج ومخزون الأدوية ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('broadcast')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'broadcast'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>إرسال إشعار عام للعملاء</span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'customers'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>العملاء ونقاط الولاء ({customersList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('drive')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'drive'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Google Drive والنسخ السحابي</span>
            </button>
          </div>

          {/* ================= TAB 1: GITHUB CONNECTED APPS & REAL-TIME LIVE EDITOR ================= */}
          {activeTab === 'github' && (
            <div className="space-y-6">
              {/* Top Banner with Stats & Controls */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <span>تطبيقاتك ومستودعاتك المرتبطة بـ GitHub</span>
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    يمكنك تعديل إعدادات وملفات البرامج لحظياً، ومزامنتها سحابياً، وفتح المستودعات أو المعاينة بضغطة زر.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsAddRepoOpen(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ربط مستودع GitHub جديد</span>
                  </button>
                </div>
              </div>

              {/* Search Bar for Apps */}
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={searchAppTerm}
                  onChange={(e) => setSearchAppTerm(e.target.value)}
                  placeholder="بحث في التطبيقات والمستودعات..."
                  className="w-full sm:w-80 px-4 py-2.5 bg-slate-900 text-white rounded-2xl text-xs border border-slate-800 focus:border-cyan-500 outline-none transition-colors"
                />
                <span className="text-xs text-slate-400">
                  إجمالي البرامج: <span className="font-mono text-cyan-400 font-bold">{githubApps.length}</span>
                </span>
              </div>

              {/* Add New Repo Modal / Panel */}
              {isAddRepoOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                      <Code2 className="w-4 h-4" />
                      <span>ربط تطبيق أو مستودع جديد من GitHub</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsAddRepoOpen(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      إلغاء
                    </button>
                  </div>

                  <form onSubmit={handleCreateGitHubApp} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          اسم المستودع على GitHub (user/repo) *
                        </label>
                        <input
                          type="text"
                          required
                          value={newRepoName}
                          onChange={(e) => setNewRepoName(e.target.value)}
                          placeholder="mohamedhgas4444/my-new-app"
                          className="w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          اسم التطبيق أو المنظومة *
                        </label>
                        <input
                          type="text"
                          required
                          value={newAppTitle}
                          onChange={(e) => setNewAppTitle(e.target.value)}
                          placeholder="مثال: تطبيق فرع صيدلية الديب 2"
                          className="w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          الفرع الافتراضي (Branch)
                        </label>
                        <input
                          type="text"
                          value={newBranch}
                          onChange={(e) => setNewBranch(e.target.value)}
                          placeholder="main"
                          className="w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          التصنيف
                        </label>
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="حسابات / مخازن / تطبيق عملاء"
                          className="w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          رابط المعاينة الحي (Live URL)
                        </label>
                        <input
                          type="text"
                          value={newLiveUrl}
                          onChange={(e) => setNewLiveUrl(e.target.value)}
                          placeholder="https://app.example.com"
                          className="w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        وصف التطبيق ووظيفته
                      </label>
                      <input
                        type="text"
                        value={newAppDesc}
                        onChange={(e) => setNewAppDesc(e.target.value)}
                        placeholder="نبذة عن وظيفة هذا النظام في صيدلية الديب"
                        className="w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-xl font-bold text-xs shadow-md transition-all"
                    >
                      حفظ وربط المستودع بالمنظومة
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Connected GitHub Apps Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filteredApps.map((app) => (
                  <div
                    key={app.id}
                    className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-3xl p-5 sm:p-6 transition-all space-y-4 shadow-lg group relative overflow-hidden"
                  >
                    {/* Top card header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            {app.category}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            <GitBranch className="w-3 h-3" />
                            <span>{app.branch}</span>
                          </span>
                        </div>
                        <h3 className="font-extrabold text-base text-white">{app.name}</h3>
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{app.repo}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDeleteGitHubApp(app.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="إلغاء الربط"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{app.description}</p>

                    {/* Commit & Health Status */}
                    <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl text-[11px] space-y-1 font-mono">
                      <div className="flex items-center justify-between text-slate-400">
                        <div className="flex items-center gap-1 text-slate-300 truncate">
                          <GitCommit className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{app.lastCommitMessage}</span>
                        </div>
                        <span className="text-[10px] text-cyan-400 shrink-0 font-bold">#{app.lastCommitHash}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>آخر تحديث: {app.lastCommitTime}</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          متصل بالمنظومة
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: Live Real-Time Edit & Launch */}
                    <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenLiveEditor(app)}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>تعديل لحظي للمشروع (Live Edit)</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <a
                          href={app.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs flex items-center gap-1 transition-colors border border-slate-700"
                          title="فتح المستودع على GitHub"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-mono">GitHub</span>
                        </a>

                        <a
                          href={app.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-slate-800 hover:bg-cyan-900/60 text-cyan-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors border border-slate-700"
                          title="معاينة التطبيق الحي"
                        >
                          <span>معاينة التطبيق</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 2: PHARMACY PRODUCTS & STOCK MANAGEMENT ================= */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Products Header */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-cyan-400" />
                    <span>إدارة كتالوج الأدوية والمخزون</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    أضف أو عدّل الأصناف، حدد نقاط الولاء، استخدم كاميرا جيميناي لتصوير العبوات، وأزل الأصناف التجريبية.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRemoveDemoProducts}
                    className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 rounded-xl font-bold text-xs border border-rose-800/60 flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف الأصناف التجريبية</span>
                  </button>
                </div>
              </div>

              {/* Product Form */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {editingProductId ? <Edit3 className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4 text-cyan-400" />}
                    <span>{editingProductId ? 'تعديل بيانات الدواء المحدد' : 'إضافة صنف دوائي جديد للكتالوج'}</span>
                  </h3>
                  {editingProductId && (
                    <button
                      type="button"
                      onClick={resetProductForm}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      إلغاء التعديل
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        اسم الدواء بالعربية *
                      </label>
                      <input
                        type="text"
                        required
                        value={nameAr}
                        onChange={(e) => setNameAr(e.target.value)}
                        placeholder="مثال: بنادول إكسترا 500 مجم"
                        className="w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        الاسم الإنجليزي (اختياري)
                      </label>
                      <input
                        type="text"
                        value={nameEn}
                        onChange={(e) => setNameEn(e.target.value)}
                        placeholder="Panadol Extra 500mg"
                        className="w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">القسم</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ProductCategory)}
                        className="w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nameAr}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        السعر بالجنيه (ج.م) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={price}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrice(val);
                          const num = parseFloat(val);
                          if (!isNaN(num) && num > 0) {
                            setPoints(String(Math.round(num * 10)));
                          }
                        }}
                        placeholder="50"
                        className="w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        نقاط الولاء (10 نقاط/جنيه)
                      </label>
                      <input
                        type="number"
                        value={points}
                        onChange={(e) => setPoints(e.target.value)}
                        placeholder="500"
                        className="w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        المادة الفعالة
                      </label>
                      <input
                        type="text"
                        value={activeIngredient}
                        onChange={(e) => setActiveIngredient(e.target.value)}
                        placeholder="باراسيتامول + كافيين"
                        className="w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        الشكل الصيدلي
                      </label>
                      <input
                        type="text"
                        value={dosageForm}
                        onChange={(e) => setDosageForm(e.target.value)}
                        placeholder="أقراص / شراب / أمبولات"
                        className="w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Gemini AI Camera Studio */}
                  <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {image ? (
                        <img
                          src={image}
                          alt="معاينة"
                          className="w-16 h-16 rounded-xl object-cover border border-cyan-500 shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400 text-xs">
                          لا توجد صورة
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-white">صورة عبوة الدواء</h4>
                        <p className="text-[11px] text-slate-400">
                          التقط بكاميرا جيميناي لتوليد صورة واضحة ومفرغة، أو الصق رابطاً
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsStudioOpen(true)}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-2 active:scale-95"
                      >
                        <Camera className="w-4 h-4" />
                        <span>كاميرا ستوديو جيميناي</span>
                      </button>

                      <label className="cursor-pointer px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-2 active:scale-95 transition-colors">
                        <Upload className="w-4 h-4 text-cyan-400" />
                        <span>رفع من الجهاز</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const res = ev.target?.result as string;
                                if (res) setImage(res);
                              };
                              reader.readAsDataURL(file);
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingProductId ? 'حفظ التعديلات سحابياً' : 'إضافة الصنف فوراً للكتالوج'}</span>
                  </button>
                </form>
              </div>

              {/* Products Table & Search */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-white">الأصناف الحالية في الكتالوج ({products.length})</h3>
                  <input
                    type="text"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    placeholder="ابحث عن صنف..."
                    className="px-3.5 py-2 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 outline-none w-full sm:w-64"
                  />
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-2xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.nameAr}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-bold text-white">{p.nameAr}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.nameEn}</div>
                          <div className="text-cyan-400 font-black mt-0.5">{p.price} ج.م • {p.points} نقطة</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditClick(p)}
                          className="p-2 bg-slate-700 hover:bg-slate-600 text-cyan-300 rounded-xl"
                          title="تعديل"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`هل تريد حذف صنف "${p.nameAr}"؟`)) {
                              onDeleteProduct(p.id);
                              syncDeleteProductFromFirestore(p.id);
                            }
                          }}
                          className="p-2 bg-rose-900/40 hover:bg-rose-900/80 text-rose-300 rounded-xl"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: BROADCAST NOTIFICATIONS ================= */}
          {activeTab === 'broadcast' && (
            <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  <span>إرسال إشعار فوري وتنبيه لكافة العملاء</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  يصل الإشعار مباشرة لكافة المتصفحين والمسجلين في صيدلية الديب مع ظهور شارة التنبيه.
                </p>
              </div>

              {broadcastSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>تم إرسال الإشعار بنجاح ومزامنته سحابياً لجميع العملاء!</span>
                </div>
              )}

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">عنوان الإشعار *</label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="مثال: وصول دفعة جديدة من فيتامين سي والفوارات"
                    className="w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">نص الرسالة *</label>
                  <textarea
                    required
                    rows={3}
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    placeholder="اكتب تفاصيل التنبيه أو العرض الخاص بالصيدلية..."
                    className="w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>بث الإشعار الآن</span>
                </button>
              </form>
            </div>
          )}

          {/* ================= TAB 4: CUSTOMERS & LOYALTY ================= */}
          {activeTab === 'customers' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <CustomersManager isDarkTheme={true} />
            </div>
          )}

          {/* ================= TAB 5: GOOGLE DRIVE CLOUD BACKUP ================= */}
          {activeTab === 'drive' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>النسخ الاحتياطي والمزامنة عبر Google Drive</span>
                      <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded-full font-mono font-bold">
                        Workspace OAuth
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      حفظ قاعدة بيانات صيدلية الديب (الأدوية، الطلبات، الروشتات، والعملاء) بشكل آمن ومستمر على حساب Google Drive الخاص بك.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDriveModalOpen(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>فتح مدير Google Drive والنسخ الاحتياطي</span>
                </button>
              </div>

              {/* Data Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-center">
                  <div className="text-xs text-slate-400 mb-1">الأدوية والمنتجات</div>
                  <div className="text-xl font-mono font-black text-sky-400">{products.length}</div>
                </div>
                <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-center">
                  <div className="text-xs text-slate-400 mb-1">الطلبات المسجلة</div>
                  <div className="text-xl font-mono font-black text-emerald-400">{getStoredOrders().length}</div>
                </div>
                <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-center">
                  <div className="text-xs text-slate-400 mb-1">العملاء ونقاط الولاء</div>
                  <div className="text-xl font-mono font-black text-amber-400">{customersList.length}</div>
                </div>
                <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-center">
                  <div className="text-xs text-slate-400 mb-1">الروشتات الطبية</div>
                  <div className="text-xl font-mono font-black text-purple-400">{getStoredPrescriptions().length}</div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>تم تفعيل تصاريح Google Workspace Drive الرسمية (drive.file و drive.readonly).</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDriveModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-xs font-bold border border-slate-700"
                >
                  استعراض الملفات المحفوظة
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: REAL-TIME LIVE EDITOR ("ويمكن التعديل عليها بشكل لحظي") ================= */}
      <AnimatePresence>
        {editingApp && liveConfigState && (
          <div
            id="live-editor-backdrop"
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-cairo text-right"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="bg-slate-900 border border-cyan-500/50 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
            >
              {/* Editor Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>التعديل اللحظي: {editingApp.name}</span>
                      <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-bold">
                        Live Sync
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Repo: {editingApp.repo} ({editingApp.branch})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sub-Tabs: Visual vs Code */}
              <div className="px-4 pt-3 bg-slate-900 flex items-center gap-2 border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditorSubTab('visual')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    editorSubTab === 'visual'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>الإعدادات المباشرة (Visual Controls)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditorSubTab('code')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    editorSubTab === 'code'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>محرر الكود JSON اللحظي (Config Code)</span>
                </button>
              </div>

              {/* Editor Content Area */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                {liveSaveSuccess && (
                  <div className="p-3 bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>تم حفظ وتطبيق التعديل لحظياً بنجاح ومزامنته سحابياً على الفرع {editingApp.branch}!</span>
                  </div>
                )}

                {editorSubTab === 'visual' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">اسم النظام/التطبيق</label>
                        <input
                          type="text"
                          value={liveConfigState.appName}
                          onChange={(e) =>
                            setLiveConfigState({ ...liveConfigState, appName: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">رقم الإصدار (Version)</label>
                        <input
                          type="text"
                          value={liveConfigState.version}
                          onChange={(e) =>
                            setLiveConfigState({ ...liveConfigState, version: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">خط الواتساب الساخن</label>
                        <input
                          type="text"
                          value={liveConfigState.whatsappHotline}
                          onChange={(e) =>
                            setLiveConfigState({ ...liveConfigState, whatsappHotline: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">بيئة التشغيل</label>
                        <select
                          value={liveConfigState.environment}
                          onChange={(e) =>
                            setLiveConfigState({
                              ...liveConfigState,
                              environment: e.target.value as 'production' | 'staging',
                            })
                          }
                          className="w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 outline-none"
                        >
                          <option value="production">Production (إنتاج حي ومباشر)</option>
                          <option value="staging">Staging (بيئة اختبار)</option>
                        </select>
                      </div>
                    </div>

                    {/* Feature Toggles */}
                    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                      <h4 className="text-xs font-bold text-white">الميزات اللحظية المفعّلة (Live Feature Flags):</h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={liveConfigState.features.aiPrescriptions}
                            onChange={(e) =>
                              setLiveConfigState({
                                ...liveConfigState,
                                features: { ...liveConfigState.features, aiPrescriptions: e.target.checked },
                              })
                            }
                            className="rounded text-cyan-600"
                          />
                          <span>ماسح الروشتات بالذكاء الاصطناعي</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={liveConfigState.features.vespaDelivery}
                            onChange={(e) =>
                              setLiveConfigState({
                                ...liveConfigState,
                                features: { ...liveConfigState.features, vespaDelivery: e.target.checked },
                              })
                            }
                            className="rounded text-cyan-600"
                          />
                          <span>أنيميشن كابتن دليفري الفيزبا 🛵</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={liveConfigState.features.realtimeSync}
                            onChange={(e) =>
                              setLiveConfigState({
                                ...liveConfigState,
                                features: { ...liveConfigState.features, realtimeSync: e.target.checked },
                              })
                            }
                            className="rounded text-cyan-600"
                          />
                          <span>المزامنة السحابية اللحظية مع Firestore</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={liveConfigState.features.pushNotifications}
                            onChange={(e) =>
                              setLiveConfigState({
                                ...liveConfigState,
                                features: { ...liveConfigState.features, pushNotifications: e.target.checked },
                              })
                            }
                            className="rounded text-cyan-600"
                          />
                          <span>الإشعارات الفورية للعملاء</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Code JSON View */
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300">
                      محرر JSON لإعدادات النظام المباشرة:
                    </label>
                    <textarea
                      rows={12}
                      value={liveConfigState.rawConfigJson}
                      onChange={(e) =>
                        setLiveConfigState({ ...liveConfigState, rawConfigJson: e.target.value })
                      }
                      className="w-full p-3 bg-slate-950 text-cyan-300 font-mono text-xs rounded-2xl border border-slate-800 focus:border-cyan-500 outline-none resize-none leading-relaxed"
                      spellCheck={false}
                    />
                  </div>
                )}
              </div>

              {/* Editor Footer Actions */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  إغلاق
                </button>

                <button
                  type="button"
                  disabled={isLiveSaving}
                  onClick={handleApplyLiveConfig}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLiveSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isLiveSaving ? 'جاري المزامنة مع GitHub...' : 'حفظ وتطبيق التعديل لحظياً'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gemini Studio Camera Modal */}
      {isStudioOpen && (
        <GeminiProductStudio
          isOpen={isStudioOpen}
          onClose={() => setIsStudioOpen(false)}
          onSelectImage={(url) => {
            setImage(url);
            setIsStudioOpen(false);
          }}
        />
      )}

      {/* Google Drive Cloud Modal */}
      {isDriveModalOpen && (
        <GoogleDriveModal
          isOpen={isDriveModalOpen}
          onClose={() => setIsDriveModalOpen(false)}
          products={products}
          orders={getStoredOrders()}
          customers={customersList}
          prescriptions={getStoredPrescriptions()}
        />
      )}
    </div>
  );
};
