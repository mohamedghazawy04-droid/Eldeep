import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Lock,
  Plus,
  Trash2,
  Bell,
  Send,
  ShoppingBag,
  FileText,
  Users,
  CheckCircle2,
  Search,
  ExternalLink,
  Pill,
  Database,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  Camera,
  Sparkles,
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Check,
  Cloud,
  HardDrive,
  Download,
  Edit3,
  Server,
  Activity,
} from 'lucide-react';
import {
  AppNotification,
  Customer,
  OrderRecord,
  PrescriptionOrder,
  Product,
  ProductCategory,
} from '../types';
import { CATEGORIES } from '../data/initialData';
import { CustomersManager } from './CustomersManager';
import {
  addBroadcastNotification,
  getStoredAllCustomers,
  getStoredOrders,
  getStoredPrescriptions,
  setAdminPin,
  updatePrescriptionStatus,
  getStoredLogo,
  saveStoredLogo,
  saveProducts,
  clearAllProducts,
} from '../services/storage';
import {
  subscribeToFirestoreOrders,
  subscribeToFirestorePrescriptions,
  subscribeToFirestoreCustomers,
  syncAddProductToFirestore,
  syncDeleteProductFromFirestore,
  syncClearAllFirestoreProducts,
  syncBatchUploadProductsToFirestore,
  checkFirestoreHealth,
  downloadProductsBackupFile,
  parseProductsBackupJson,
} from '../services/firestoreSync';
import { optimizeProductImage, estimateProductsStorageSize } from '../utils/imageOptimizer';
import { GeminiProductStudio } from './GeminiProductStudio';
import { getManagerSession, requestManagerMagicLink } from '../services/adminAuth';
import { verifyAdminPin } from '../services/adminSecurity';
import { clearSharedLogo, saveSharedLogo } from '../services/siteSettings';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateProduct?: (product: Product) => void;
  onClearAllProducts?: () => void;
  onBatchImportProducts?: (products: Product[]) => void;
  onBroadcastNotification: (title: string, message: string, productId?: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddProduct,
  onDeleteProduct,
  onUpdateProduct,
  onClearAllProducts,
  onBatchImportProducts,
  onBroadcastNotification,
}) => {
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'products' | 'cloud' | 'broadcast' | 'orders' | 'prescriptions' | 'customers' | 'branding' | 'security'
  >('products');
  const [currentLogo, setCurrentLogo] = useState<string>(() => getStoredLogo() || '/eldeeb_logo.jpg');
  const [logoSaveSuccess, setLogoSaveSuccess] = useState(false);

  // Edit Product Mode State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Smart Image Optimization State
  const [optimizingImage, setOptimizingImage] = useState(false);
  const [imageOptimizationInfo, setImageOptimizationInfo] = useState<{
    originalKb: number;
    compressedKb: number;
    ratio: number;
  } | null>(null);

  // Cloud Health & Ping State
  const [pingTesting, setPingTesting] = useState(false);
  const [pingResult, setPingResult] = useState<{
    healthy: boolean;
    latency: number;
    msg: string;
  } | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // New Product Form State
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<ProductCategory>('medicines');
  const [price, setPrice] = useState('');
  const [dosageForm, setDosageForm] = useState('أقراص');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [description, setDescription] = useState('');
  const [usage, setUsage] = useState('');
  const [requiresPrescription, setRequiresPrescription] = useState(false);
  const [points, setPoints] = useState('20');
  const [image, setImage] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [isLowStock, setIsLowStock] = useState(false);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [broadcastNewProduct, setBroadcastNewProduct] = useState(true);

  // Studio modal state
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  // Products filter state
  const [stockFilter, setStockFilter] = useState<'all' | 'lowStock' | 'comingSoon' | 'outOfStock'>('all');
  const [productSearch, setProductSearch] = useState('');

  // Broadcast Message State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Security / PIN change state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  // Orders & Prescriptions data (Live Firestore + Local cache)
  const [orders, setOrders] = useState<OrderRecord[]>(getStoredOrders);
  const [prescriptions, setPrescriptions] = useState<PrescriptionOrder[]>(getStoredPrescriptions);
  const [customers, setCustomers] = useState<Customer[]>(getStoredAllCustomers);

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    const unsubOrders = subscribeToFirestoreOrders((liveOrders) => {
      setOrders(liveOrders);
    });

    const unsubRx = subscribeToFirestorePrescriptions((liveRx) => {
      setPrescriptions(liveRx);
    });

    const unsubCust = subscribeToFirestoreCustomers((liveCust) => {
      setCustomers(liveCust);
    });

    return () => {
      unsubOrders();
      unsubRx();
      unsubCust();
    };
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const isPinValid = await verifyAdminPin(pin);
    const isManager = await getManagerSession();
    if (isPinValid || isManager) {
      setIsAuthenticated(true);
    } else {
      const result = await requestManagerMagicLink();
      alert(result.success ? 'تم إرسال رابط دخول المدير إلى البريد المسجل.' : 'كلمة المرور غير صحيحة، يرجى التأكد من الرمز السري.');
    }
  };

  // Calculate estimated cloud storage used
  const storageStats = React.useMemo(() => estimateProductsStorageSize(products), [products]);

  const handleStartEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setNameAr(prod.nameAr);
    setNameEn(prod.nameEn);
    setCategory(prod.category);
    setPrice(prod.price.toString());
    setDosageForm(prod.dosageForm);
    setActiveIngredient(prod.activeIngredient);
    setDescription(prod.description);
    setUsage(prod.usage);
    setRequiresPrescription(prod.requiresPrescription);
    setPoints(prod.points.toString());
    setImage(prod.image);
    setStockQuantity(prod.stockQuantity !== undefined ? prod.stockQuantity.toString() : '');
    setIsLowStock(Boolean(prod.isLowStock));
    setIsComingSoon(Boolean(prod.isComingSoon));
    setActiveTab('products');
    setImageOptimizationInfo(null);
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setNameAr('');
    setNameEn('');
    setPrice('');
    setActiveIngredient('');
    setDescription('');
    setUsage('');
    setImage('');
    setStockQuantity('');
    setIsLowStock(false);
    setIsComingSoon(false);
    setImageOptimizationInfo(null);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setOptimizingImage(true);
      const result = await optimizeProductImage(file, 1000, 1000, 0.82);
      setImage(result.dataUrl);
      setImageOptimizationInfo({
        originalKb: result.originalSizeKb,
        compressedKb: result.compressedSizeKb,
        ratio: result.compressionRatioPercent,
      });
    } catch (err) {
      console.error('Failed to optimize image:', err);
      alert('تعذر تحسين وضغط الصورة، يرجى تجربة صورة أخرى');
    } finally {
      setOptimizingImage(false);
      e.target.value = '';
    }
  };

  const handleTestCloudPing = async () => {
    setPingTesting(true);
    setPingResult(null);
    try {
      const res = await checkFirestoreHealth();
      setPingResult({
        healthy: res.isHealthy,
        latency: res.latencyMs,
        msg: res.message,
      });
    } catch {
      setPingResult({ healthy: false, latency: 0, msg: 'فشل فحص الاتصال بالسيرفر السحابي' });
    } finally {
      setPingTesting(false);
    }
  };

  const handleSyncAllProductsToCloud = async () => {
    if (products.length === 0) {
      alert('لا توجد منتجات حالياً للمزامنة.');
      return;
    }
    setSyncingAll(true);
    setSyncResult(null);
    try {
      const res = await syncBatchUploadProductsToFirestore(products);
      setSyncResult(`تمت المزامنة وحفظ ${res.successCount} صنف بنجاح في قاعدة البيانات السحابية!`);
      setTimeout(() => setSyncResult(null), 5000);
    } catch (e: any) {
      setSyncResult('حدث خطأ أثناء المزامنة: ' + (e?.message || 'خطأ غير معروف'));
    } finally {
      setSyncingAll(false);
    }
  };

  const handleExportBackup = () => {
    if (products.length === 0) {
      alert('لا توجد منتجات لتصديرها.');
      return;
    }
    downloadProductsBackupFile(products);
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      const parsedProds = parseProductsBackupJson(content);
      if (parsedProds.length === 0) {
        alert('لم يتم العثور على منتجات صالحة داخل الملف، يرجى التأكد من اختيار ملف JSON صحيح.');
        return;
      }

      const confirmed = window.confirm(
        `تم العثور على ${parsedProds.length} صنف في النسخة الاحتياطية. هل تريد استيرادها وحفظها سحابياً في قاعدة بيانات صيدلية الديب؟`
      );
      if (!confirmed) return;

      if (onBatchImportProducts) {
        onBatchImportProducts(parsedProds);
      } else {
        await syncBatchUploadProductsToFirestore(parsedProds);
      }
      alert(`تم استيراد ${parsedProds.length} صنف بنجاح وحفظها سحابياً في السيرفر!`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() || !price) {
      alert('يرجى كتابة اسم الصنف والسعر على الأقل');
      return;
    }

    const defaultImg =
      image.trim() ||
      (category === 'skincare'
        ? 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80'
        : category === 'baby'
        ? 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&auto=format&fit=crop&q=80'
        : category === 'vitamins'
        ? 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=500&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80');

    const qtyNumber = parseInt(stockQuantity, 10);
    const parsedPrice = parseFloat(price) || 0;
    const calculatedPoints = points ? parseFloat(points) : Math.max(0.1, Number((parsedPrice / 100).toFixed(1)));

    // If Editing Existing Product
    if (editingProductId) {
      const existing = products.find((p) => p.id === editingProductId);
      const updatedProd: Product = {
        ...existing,
        id: editingProductId,
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim() || nameAr.trim(),
        category,
        price: parsedPrice,
        dosageForm: dosageForm.trim() || 'أقراص',
        activeIngredient: activeIngredient.trim() || 'غير محدد',
        description: description.trim() || 'منتج طبي معتمد من صيدلية الديب.',
        usage: usage.trim() || 'وفق إرشادات الصيدلي والطبيب.',
        requiresPrescription,
        inStock: !isComingSoon && (isNaN(qtyNumber) || qtyNumber > 0),
        points: calculatedPoints,
        image: defaultImg,
        stockQuantity: isNaN(qtyNumber) ? undefined : qtyNumber,
        isLowStock: isLowStock || (!isNaN(qtyNumber) && qtyNumber > 0 && qtyNumber <= 5),
        isComingSoon,
      };

      if (onUpdateProduct) {
        onUpdateProduct(updatedProd);
      }
      syncAddProductToFirestore(updatedProd);
      setEditingProductId(null);
      setNameAr('');
      setNameEn('');
      setPrice('');
      setPoints('');
      setActiveIngredient('');
      setDescription('');
      setUsage('');
      setImage('');
      setStockQuantity('');
      setIsLowStock(false);
      setIsComingSoon(false);
      setImageOptimizationInfo(null);
      alert(`تم حفظ تعديلات ${updatedProd.nameAr} بنجاح وتحديثها سحابياً!`);
      return;
    }

    const newProd: Product = {
      id: 'prod-' + Date.now(),
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      category,
      price: parsedPrice,
      dosageForm: dosageForm.trim() || 'أقراص',
      activeIngredient: activeIngredient.trim() || 'غير محدد',
      description: description.trim() || 'منتج طبي معتمد من صيدلية الديب.',
      usage: usage.trim() || 'وفق إرشادات الصيدلي والطبيب.',
      requiresPrescription,
      inStock: !isComingSoon && (isNaN(qtyNumber) || qtyNumber > 0),
      points: calculatedPoints,
      image: defaultImg,
      isNew: true,
      stockQuantity: isNaN(qtyNumber) ? undefined : qtyNumber,
      isLowStock: isLowStock || (!isNaN(qtyNumber) && qtyNumber > 0 && qtyNumber <= 5),
      isComingSoon,
    };

    onAddProduct(newProd);

    // If requested, broadcast notification to users
    if (broadcastNewProduct) {
      if (isComingSoon) {
        onBroadcastNotification(
          `⏳ قريباً بصيدلية الديب: ${newProd.nameAr}`,
          `سيتم توفير الصنف قريباً في قسم ${CATEGORIES.find((c) => c.id === category)?.nameAr}! تابع التطبيق للحصول عليه فور وصوله.`,
          newProd.id
        );
      } else if (isLowStock) {
        onBroadcastNotification(
          `⚠️ تنبيه كمية محدودة: ${newProd.nameAr}`,
          `متبقي كمية محدودة من ${newProd.nameAr} بسعر ${newProd.price} ج.م، احجز طلبك الآن قبل نفاد الكمية!`,
          newProd.id
        );
      } else {
        onBroadcastNotification(
          `📦 صنف جديد: ${newProd.nameAr}`,
          `وصل حديثاً في قسم ${CATEGORIES.find((c) => c.id === category)?.nameAr}: ${newProd.nameAr} بسعر ${newProd.price} ج.م مع +${newProd.points} نقطة ولاء!`,
          newProd.id
        );
      }
    }

    // Reset Form
    setNameAr('');
    setNameEn('');
    setPrice('');
    setActiveIngredient('');
    setDescription('');
    setUsage('');
    setImage('');
    setStockQuantity('');
    setIsLowStock(false);
    setIsComingSoon(false);
    setImageOptimizationInfo(null);
    alert('تمت إضافة المنتج بنجاح وحفظه سحابياً في قاعدة البيانات!');
  };

  const handleToggleLowStock = (prod: Product) => {
    const updated: Product = {
      ...prod,
      isLowStock: !prod.isLowStock,
      isComingSoon: false,
    };
    if (onUpdateProduct) {
      onUpdateProduct(updated);
    } else {
      syncAddProductToFirestore(updated);
    }
  };

  const handleToggleComingSoon = (prod: Product) => {
    const updated: Product = {
      ...prod,
      isComingSoon: !prod.isComingSoon,
      inStock: prod.isComingSoon ? true : false,
    };
    if (onUpdateProduct) {
      onUpdateProduct(updated);
    } else {
      syncAddProductToFirestore(updated);
    }
  };

  const handleSendStockAlert = (prod: Product, type: 'lowStock' | 'comingSoon') => {
    if (type === 'lowStock') {
      onBroadcastNotification(
        `⚠️ كمية أوشكت على النفاذ: ${prod.nameAr}`,
        `تنبيه للعملاء: الكمية المتوفرة من ${prod.nameAr} أوشكت على النفاذ، اطلب علبتك الآن من صيدلية الديب قبل انتهاء المخزون.`,
        prod.id
      );
      alert(`تم إرسال إشعار للعملاء بأن ${prod.nameAr} أوشك على النفاذ!`);
    } else {
      onBroadcastNotification(
        `⏳ قريباً في صيدلية الديب: ${prod.nameAr}`,
        `بشرى سارة لعملائنا: جاري توفير ${prod.nameAr} في أقرب وقت. يمكنك حجز استشارتك أو طلبك مسبقاً.`,
        prod.id
      );
      alert(`تم إرسال إشعار للعملاء بقرب توفر ${prod.nameAr}!`);
    }
  };

  const handleClearAllCatalog = async () => {
    const confirmDelete = window.confirm(
      'تحذير: هل أنت متأكد من تفريغ كافة المنتجات؟ سيتم حذف جميع الأصناف القديمة لتبدأ بكتالوج صيدلية الديب النقي الخاص بك فقط.'
    );
    if (!confirmDelete) return;

    if (onClearAllProducts) {
      onClearAllProducts();
    } else {
      clearAllProducts();
      await syncClearAllFirestoreProducts();
    }
    alert('تم تفريغ الكتالوج بنجاح! الموقع فارغ وجاهز لرفع أصنافك الحصرية.');
  };

  const handleRemoveDemoProducts = async () => {
    const demoIds = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const demoProds = products.filter((p) => demoIds.includes(p.id) || p.id.startsWith('demo-'));
    if (demoProds.length === 0) {
      alert('لا توجد أي أصناف وهمية أو تجريبية، جميع المنتجات الحالية هي منتجاتك المرفوعة!');
      return;
    }

    const confirmDelete = window.confirm(
      `هل تريد إزالة ${demoProds.length} صنف تجريبي/وهمي والاحتفاظ فقط بالأصناف التي أضفتها بنفسك؟`
    );
    if (!confirmDelete) return;

    for (const d of demoProds) {
      onDeleteProduct(d.id);
      syncDeleteProductFromFirestore(d.id);
    }
    alert('تمت إزالة الأصناف الوهمية والتجريبية بنجاح!');
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      alert('يرجى كتابة العنوان والرسالة');
      return;
    }

    onBroadcastNotification(broadcastTitle.trim(), broadcastMessage.trim());
    setBroadcastTitle('');
    setBroadcastMessage('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 4000);
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim() || newPin.length < 4) {
      alert('يرجى إدخال رمز سري لا يقل عن 4 أحرف أو أرقام');
      return;
    }
    if (newPin !== confirmPin) {
      alert('الرمزان غير متطابقين، يرجى التأكد');
      return;
    }

    setAdminPin(newPin.trim());
    setPinChangeSuccess(true);
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => setPinChangeSuccess(false), 4000);
    alert('تم تغيير الرمز السري للإدارة بنجاح!');
  };

  // Filter products based on stock status and search
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.nameAr.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(productSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (stockFilter === 'lowStock') return p.isLowStock;
    if (stockFilter === 'comingSoon') return p.isComingSoon;
    if (stockFilter === 'outOfStock') return !p.inStock && !p.isComingSoon;
    return true;
  });

  const lowStockCount = products.filter((p) => p.isLowStock).length;
  const comingSoonCount = products.filter((p) => p.isComingSoon).length;
  const outOfStockCount = products.filter((p) => !p.inStock && !p.isComingSoon).length;

  return (
    <div
      id="admin-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-cairo text-right"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        id="admin-modal-container"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">لوحة تحكم إدارة صيدلية الديب</h3>
              <p className="text-[11px] text-slate-400">
                إدارة الأدوية، التنبيهات الذكية، المخزون، والعملاء
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth Gate */}
        {!isAuthenticated ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4 border border-sky-200 dark:border-sky-800 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              تسجيل دخول مالك الصيدلية
            </h4>
            <p className="text-xs text-slate-500 mb-6 max-w-xs leading-relaxed">
              يرجى إدخال كلمة المرور للوصول الآمن لإدارة المحتوى والمخزون
            </p>

            <form
              onSubmit={handleLogin}
              autoComplete="off"
              data-form-type="other"
              className="w-full max-w-xs space-y-3"
            >
              <div className="relative">
                <input
                  id="admin-pin-input"
                  type={showPassword ? 'text' : 'password'}
                  name="admin_secret_key_field"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="none"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="كلمة المرور السرية"
                  className="w-full pr-4 pl-11 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-center text-base tracking-wider font-mono outline-none border border-transparent focus:border-sky-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <button
                id="submit-admin-pin"
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95"
              >
                دخول للوحة التحكم
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.location.hash = 'admin';
                  }}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-bold"
                >
                  الذهاب للبوابة الإدارية المستقلة ومركز التطبيقات ↗
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Dashboard Navigation & Content */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 overflow-x-auto scrollbar-none px-3 pt-2 gap-1">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-3 sm:px-4 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'products'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>إدارة الأدوية والمخزون ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('cloud')}
                className={`px-3 sm:px-4 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'cloud'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Cloud className="w-4 h-4 text-sky-500" />
                <span>المساحة السحابية والحفظ الدائم ☁️</span>
              </button>

              <button
                onClick={() => setActiveTab('broadcast')}
                className={`px-3 sm:px-4 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'broadcast'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>إرسال إشعارات للعملاء</span>
              </button>

              <button
                onClick={() => setActiveTab('customers')}
                className={`px-3 sm:px-4 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'customers'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>العملاء المسجلين ({customers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 sm:px-4 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'orders'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>الطلبات ({orders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('prescriptions')}
                className={`px-3 sm:px-4 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'prescriptions'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>الروشتات ({prescriptions.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('branding')}
                className={`px-3 sm:px-4 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'branding'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>الهوية والشعار</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`px-3 sm:px-4 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'security'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>الأمان والرمز السري</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-right">
              {/* TAB 1: PRODUCTS & STOCK MANAGEMENT */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  {/* Clean Slate Action Banner */}
                  <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>الكتالوج الخاص بك:</strong> يمكنك تفريغ أي منتجات افتراضية سابقة للبدء بكتالوج نقي ترفعه أنت فقط.
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRemoveDemoProducts}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shrink-0 shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
                        title="إزالة الأصناف الوهمية والتجريبية والاحتفاظ بالأصناف التي قمت برفعها بنفسك فقط"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>إزالة الأصناف الوهمية</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleClearAllCatalog}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shrink-0 shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>تفريغ الكتالوج بالكامل</span>
                      </button>
                    </div>
                  </div>

                  {/* Add / Edit Product Form */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                    {editingProductId && (
                      <div className="p-3.5 bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 rounded-2xl flex items-center justify-between gap-3 text-xs text-sky-900 dark:text-sky-200">
                        <div className="flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-sky-600 shrink-0" />
                          <span>
                            أنت الآن في وضع <strong>تعديل بيانات الصنف</strong> ({nameAr}). سيتم حفظ التعديلات سحابياً فور النقر على حفظ.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl font-bold shrink-0 transition-colors"
                        >
                          إلغاء التعديل
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                        {editingProductId ? (
                          <Edit3 className="w-4 h-4 text-sky-600" />
                        ) : (
                          <Plus className="w-4 h-4 text-sky-600" />
                        )}
                        <span>{editingProductId ? 'تعديل الصنف وحفظ التغييرات سحابياً' : 'إضافة صنف دوائي أو مستلزم جديد'}</span>
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        يدعم كاميرا التعديلات الذكية، الضغط السحابي، والتنبيهات
                      </span>
                    </div>

                    <form onSubmit={handleCreateProduct} className="space-y-4">
                      {/* Name Ar & En */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            اسم الصنف بالعربي *
                          </label>
                          <input
                            type="text"
                            required
                            value={nameAr}
                            onChange={(e) => setNameAr(e.target.value)}
                            placeholder="مثال: بنادول أدفانس 24 قرص"
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 outline-none focus:border-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            الاسم بالإنجليزي
                          </label>
                          <input
                            type="text"
                            value={nameEn}
                            onChange={(e) => setNameEn(e.target.value)}
                            placeholder="Panadol Advance 24 Tabs"
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 outline-none focus:border-sky-500 font-mono text-left"
                          />
                        </div>
                      </div>

                      {/* Category, Price, Points, Stock */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            قسم الصيدلية *
                          </label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as ProductCategory)}
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 outline-none focus:border-sky-500"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nameAr}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            السعر بالجنيه (ج.م) *
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={price}
                            onChange={(e) => {
                              const newPrice = e.target.value;
                              setPrice(newPrice);
                              const parsed = parseFloat(newPrice);
                              if (!isNaN(parsed) && parsed > 0) {
                                setPoints(String(Math.round(parsed * 10)));
                              }
                            }}
                            placeholder="50"
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 outline-none focus:border-sky-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            نقاط الولاء الممنوحة (10 نقاط/جنيه)
                          </label>
                          <input
                            type="number"
                            value={points}
                            onChange={(e) => setPoints(e.target.value)}
                            placeholder="500"
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 outline-none focus:border-sky-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            الكمية المتوفرة (المخزون)
                          </label>
                          <input
                            type="number"
                            value={stockQuantity}
                            onChange={(e) => {
                              setStockQuantity(e.target.value);
                              const val = parseInt(e.target.value, 10);
                              if (val > 0 && val <= 5) {
                                setIsLowStock(true);
                              }
                            }}
                            placeholder="مثال: 12 علبة"
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 outline-none focus:border-sky-500 font-mono"
                          />
                        </div>
                      </div>

                      {/* Active Ingredient & Dosage Form */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            المادة الفعالة
                          </label>
                          <input
                            type="text"
                            value={activeIngredient}
                            onChange={(e) => setActiveIngredient(e.target.value)}
                            placeholder="باراسيتامول 500 مجم"
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 outline-none focus:border-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            الشكل الصيدلي
                          </label>
                          <input
                            type="text"
                            value={dosageForm}
                            onChange={(e) => setDosageForm(e.target.value)}
                            placeholder="أقراص / شراب / فوار / كريم"
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>

                      {/* Gemini Studio Camera Photo Section */}
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div>
                            <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              <span>صورة المنتج (معالجة ستوديو إعلانية)</span>
                            </label>
                            <p className="text-[11px] text-slate-500">
                              التقط مباشرة بكاميرا الهاتف أو ارفع صورة لإضافة إضاءة وظل ثلاثي الأبعاد وشارة صيدلية الديب
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsStudioOpen(true)}
                              className="px-4 py-2 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition-transform active:scale-95"
                            >
                              <Camera className="w-4 h-4" />
                              <span>كاميرا ستوديو جيميناي (Gemini AI Studio)</span>
                            </button>

                            <label className="cursor-pointer px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors shadow-xs">
                              <Upload className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                              <span>{optimizingImage ? 'جاري الضغط السحابي...' : 'رفع صورة من جهازك (ضغط ذكي)'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={optimizingImage}
                                onChange={handleImageFileUpload}
                              />
                            </label>
                          </div>
                        </div>

                        {imageOptimizationInfo && (
                          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              تم تحسين وضغط الصورة بنجاح! الحجم المحسّن: <strong>{imageOptimizationInfo.compressedKb} KB</strong> (تم توفير <strong>{imageOptimizationInfo.ratio}%</strong> من المساحة السحابية للحفاظ على سرعة وسعة لا نهائية).
                            </span>
                          </div>
                        )}

                        {/* Image Preview & URL input */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                          {image ? (
                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-sky-500 shadow-sm shrink-0 bg-slate-100 dark:bg-slate-800">
                              <img src={image} alt="معاينة" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setImage('')}
                                className="absolute top-1 left-1 bg-rose-600 text-white p-1 rounded-full text-xs shadow"
                                title="إزالة الصورة"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 shrink-0">
                              <ImageIcon className="w-6 h-6 mb-1" />
                              <span className="text-[9px]">لا توجد صورة</span>
                            </div>
                          )}

                          <input
                            type="url"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            placeholder="أو ضع رابط صورة مباشر هنا (https://...)"
                            className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-left font-mono outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>

                      {/* Flags & Toggles */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                        <label className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isLowStock}
                            onChange={(e) => {
                              setIsLowStock(e.target.checked);
                              if (e.target.checked) setIsComingSoon(false);
                            }}
                            className="w-4 h-4 text-amber-600 rounded"
                          />
                          <span className="text-amber-800 dark:text-amber-300 font-bold">
                            ⚠️ إشارة "أوشك على النفاذ" (كمية محدودة)
                          </span>
                        </label>

                        <label className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isComingSoon}
                            onChange={(e) => {
                              setIsComingSoon(e.target.checked);
                              if (e.target.checked) setIsLowStock(false);
                            }}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span className="text-purple-800 dark:text-purple-300 font-bold">
                            ⏳ إشارة "قريباً" (صنف مرتقب)
                          </span>
                        </label>

                        <label className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={requiresPrescription}
                            onChange={(e) => setRequiresPrescription(e.target.checked)}
                            className="w-4 h-4 text-rose-600 rounded"
                          />
                          <span className="text-rose-800 dark:text-rose-300 font-bold">
                            يلزم روشتة طبية (أدوية جدول/مضادات)
                          </span>
                        </label>
                      </div>

                      {/* Auto broadcast checkbox & submit */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={broadcastNewProduct}
                            onChange={(e) => setBroadcastNewProduct(e.target.checked)}
                            className="w-4 h-4 text-sky-600 rounded"
                          />
                          <span>إرسال إشعار تلقائي لجميع العملاء عند حفظ هذا الصنف 🔔</span>
                        </label>

                        <button
                          type="submit"
                          className="w-full sm:w-auto py-3 px-6 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          {editingProductId ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>حفظ التعديلات سحابياً 💾</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>حفظ وإضافة الصنف سحابياً للموقع</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Current Products List with Stock Filter */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          قائمة المنتجات الحالية ({products.length}):
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          يمكنك تبديل حالة التوفر وإرسال تنبيهات سريعة بنقرة واحدة
                        </p>
                      </div>

                      {/* Search in admin */}
                      <div className="w-full sm:w-64 relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="بحث في المنتجات..."
                          className="w-full pr-8 pl-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs border border-transparent focus:border-sky-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setStockFilter('all')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                          stockFilter === 'all'
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        الكل ({products.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setStockFilter('lowStock')}
                        className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-colors ${
                          stockFilter === 'lowStock'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>أوشك على النفاذ ({lowStockCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStockFilter('comingSoon')}
                        className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-colors ${
                          stockFilter === 'comingSoon'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>قريباً ({comingSoonCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStockFilter('outOfStock')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                          stockFilter === 'outOfStock'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        غير متوفر ({outOfStockCount})
                      </button>
                    </div>

                    {/* Products Grid / List */}
                    {filteredProducts.length === 0 ? (
                      <div className="py-10 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                        لا توجد أصناف تطابق الفلتر الحالي.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {filteredProducts.map((p) => (
                          <div
                            key={p.id}
                            className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image}
                                alt={p.nameAr}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                    {p.nameAr}
                                  </span>
                                  {p.isComingSoon && (
                                    <span className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                      ⏳ قريباً
                                    </span>
                                  )}
                                  {p.isLowStock && !p.isComingSoon && (
                                    <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                      ⚠️ أوشك على النفاذ
                                    </span>
                                  )}
                                  {!p.inStock && !p.isComingSoon && (
                                    <span className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                      غير متوفر
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-500 text-[11px] mt-0.5">
                                  {p.dosageForm} • {p.price} ج.م • +{p.points} نقطة
                                  {p.stockQuantity !== undefined && ` • المخزون: ${p.stockQuantity}`}
                                </div>
                              </div>
                            </div>

                            {/* Quick Action Badges */}
                            <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
                              {/* Toggle Low Stock */}
                              <button
                                type="button"
                                onClick={() => handleToggleLowStock(p)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                  p.isLowStock
                                    ? 'bg-amber-500 text-slate-950 border-amber-500'
                                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                }`}
                                title="تبديل علامة أوشك على النفاذ"
                              >
                                {p.isLowStock ? '⚠️ معلّم كنفاذ' : 'تفعيل نفاذ المخزون'}
                              </button>

                              {/* Toggle Coming Soon */}
                              <button
                                type="button"
                                onClick={() => handleToggleComingSoon(p)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                  p.isComingSoon
                                    ? 'bg-purple-600 text-white border-purple-600'
                                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                }`}
                                title="تبديل علامة قريباً"
                              >
                                {p.isComingSoon ? '⏳ معلّم كقريباً' : 'تفعيل قريباً'}
                              </button>

                              {/* Send Quick Alert to Customers */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleSendStockAlert(p, p.isComingSoon ? 'comingSoon' : 'lowStock')
                                }
                                className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 hover:bg-sky-100 rounded-lg text-[11px] font-bold border border-sky-200 dark:border-sky-800 transition-colors flex items-center gap-1"
                                title="إرسال إشعار فوري للعملاء"
                              >
                                <Bell className="w-3 h-3" />
                                <span>تنبيه العملاء</span>
                              </button>

                              {/* Edit Product */}
                              <button
                                type="button"
                                onClick={() => handleStartEditProduct(p)}
                                className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded-lg text-[11px] font-bold border border-amber-200 dark:border-amber-800 transition-colors flex items-center gap-1"
                                title="تعديل بيانات وسعر ومخزون الصنف"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>تعديل</span>
                              </button>

                              {/* Delete Product */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`هل أنت متأكد من حذف ${p.nameAr}؟`)) {
                                    onDeleteProduct(p.id);
                                    syncDeleteProductFromFirestore(p.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                                title="حذف الصنف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: CLOUD STORAGE & PERSISTENCE */}
              {activeTab === 'cloud' && (
                <div className="space-y-6">
                  {/* Top Cloud Overview Banner */}
                  <div className="p-5 bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white rounded-3xl border border-sky-800/40 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shadow-inner shrink-0">
                          <Cloud className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base sm:text-lg">
                              المساحة السحابية والحفظ الدائم (Google Firestore)
                            </h4>
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-bold">
                              نشط وسحابي
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">
                            سيرفر سحابي مخصص لصيدلية الديب لحفظ المنتجات، الحسابات، الروشتات، والمخزون بدون أي فقدان للبيانات.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleTestCloudPing}
                        disabled={pingTesting}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-transform active:scale-95 flex items-center gap-1.5 shrink-0 shadow"
                      >
                        <Activity className={`w-3.5 h-3.5 ${pingTesting ? 'animate-spin' : ''}`} />
                        <span>{pingTesting ? 'جاري الفحص...' : 'فحص سرعة الاتصال بالسحابة'}</span>
                      </button>
                    </div>

                    {/* Ping Test Result Alert */}
                    {pingResult && (
                      <div
                        className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
                          pingResult.healthy
                            ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                            : 'bg-rose-950/80 border-rose-600 text-rose-200'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          {pingResult.msg} (زمن الاستجابة: {pingResult.latency} مللي ثانية). قاعدة البيانات السحابية جاهزة لاستقبال وحفظ أي كمية أصناف!
                        </span>
                      </div>
                    )}

                    {/* 4 Live Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                          <span>المنتجات بالسحابة</span>
                          <Database className="w-3.5 h-3.5 text-sky-400" />
                        </div>
                        <div className="text-xl font-bold text-white font-mono">
                          {products.length}{' '}
                          <span className="text-xs font-sans text-slate-300 font-normal">صنف</span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                          <span>الحجم المستهلك</span>
                          <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <div className="text-xl font-bold text-white font-mono">
                          {storageStats.formattedSize}
                        </div>
                      </div>

                      <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                          <span>سعة التخزين</span>
                          <Server className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <div className="text-sm font-bold text-emerald-400 leading-tight mt-1">
                          سعة سحابية مرنة
                          <div className="text-[10px] text-slate-300 font-normal">
                            (تتسع لملايين الأصناف)
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                          <span>حالة المزامنة</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="text-sm font-bold text-sky-400 mt-1">
                          حفظ سحابي فوري
                          <div className="text-[10px] text-slate-300 font-normal">
                            Google Cloud
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cloud Actions & Tools */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tool 1: Force Sync All to Cloud */}
                    <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                        <RefreshCw className="w-4 h-4 text-sky-600" />
                        <span>مزامنة فورية شاملة لكل الأصناف السحابية</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        تقوم هذه الميزة برفع وتأكيد حفظ كافة الأصناف الحالية ({products.length} صنف) في قاعدة بيانات Firestore دفعة واحدة بضغطة زر.
                      </p>

                      {syncResult && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{syncResult}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleSyncAllProductsToCloud}
                        disabled={syncingAll}
                        className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-98"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
                        <span>{syncingAll ? 'جاري المزامنة السحابية...' : 'مزامنة وتأكيد حفظ جميع المنتجات سحابياً'}</span>
                      </button>
                    </div>

                    {/* Tool 2: Backup & Restore */}
                    <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                        <Download className="w-4 h-4 text-emerald-600" />
                        <span>النسخ الاحتياطي والاستيراد السريع</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        حمّل نسخة احتياطية آمنة (JSON) من منتجات صيدليتك على هاتفك أو كمبيوترك، أو استورد كتالوجاً جاهزاً في أي وقت.
                      </p>

                      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleExportBackup}
                          className="w-full sm:flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تنزيل نسخة احتياطية</span>
                        </button>

                        <label className="w-full sm:flex-1 cursor-pointer py-2.5 px-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs">
                          <Upload className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                          <span>استيراد ملف منتجات</span>
                          <input
                            type="file"
                            accept=".json,application/json"
                            className="hidden"
                            onChange={handleImportBackupFile}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Architecture & Tech Specs Card */}
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                    <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-sky-600" />
                      <span>مواصفات التخزين السحابي لصيدلية الديب:</span>
                    </h5>
                    <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside">
                      <li>
                        <strong>مزامنة فورية (Real-time):</strong> أي منتج يتم رفعه أو تعديل سعره أو كميته ينعكس على الفور لدى جميع زوار التطبيق.
                      </li>
                      <li>
                        <strong>ضغط الصور التلقائي الذكي:</strong> يتم تحسين صور الأدوية آلياً لتقليل حجمها بنسبة تتجاوز 80% دون التأثير على وضوح الكتابة أو العلبة، مما يمنحك مساحة تخزينية ضخمة جداً.
                      </li>
                      <li>
                        <strong>مقاومة مسح المتصفح:</strong> بياناتك وكتالوج أدويتك مخزنة في قاعدة البيانات السحابية المركزية، ولن تتأثر بمسح الكاش أو استخدام جهاز جديد.
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 2: BROADCAST NOTIFICATION */}
              {activeTab === 'broadcast' && (
                <div className="space-y-4">
                  <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-100 dark:border-sky-900 text-xs text-sky-800 dark:text-sky-300">
                    📢 <strong>بث الإشعارات الحية:</strong> يتيح لك إرسال تنبيه مباشر يظهر فورياً لجميع زوار وعملاء التطبيق على هواتفهم، مثل وصول شحنة جديدة، تنبيه بكمية أوشكت على النفاذ، أو عروض صيدلية الديب.
                  </div>

                  {broadcastSuccess && (
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تم بث الإشعار لجميع العملاء وحفظه بنجاح!</span>
                    </div>
                  )}

                  <form onSubmit={handleSendBroadcast} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        عنوان الإشعار *
                      </label>
                      <input
                        type="text"
                        required
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        placeholder="مثال: ✨ توفرت أدوية الضغط والسكر الناقصة الآن بصيدلية الديب"
                        className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium outline-none border border-transparent focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        نص الرسالة *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        placeholder="وصلت شحنة جديدة بأسعار الصيدلية الرسمية، اطلبها فوراً عبر الواتساب 01009097378 لتصلك خلال نصف ساعة مع نقاط ولاء مجانية."
                        className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium outline-none border border-transparent focus:border-sky-500 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="py-3 px-6 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center gap-2"
                    >
                      <Send className="w-4 h-4 rotate-180" />
                      <span>إرسال وتنبيه جميع العملاء</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: REGISTERED CUSTOMERS (ONLINE FIRESTORE GUARANTEE) */}
              {activeTab === 'customers' && (
                <div className="pt-1">
                  <CustomersManager />
                </div>
              )}

              {/* TAB 4: ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                    سجل الطلبات الواردة عبر الواتساب:
                  </h4>
                  {orders.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">لا توجد طلبات بعد.</div>
                  ) : (
                    orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {ord.customerName} ({ord.customerPhone})
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">{ord.date}</span>
                        </div>
                        <div className="text-slate-600 dark:text-slate-300">
                          {ord.items.map((i) => `${i.product.nameAr} (${i.quantity})`).join('، ')}
                        </div>
                        <div className="flex items-center justify-between font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-sky-600 dark:text-sky-400">
                            الإجمالي: {ord.totalAmount} ج.م
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            {ord.deliveryAddress || 'العنوان عبر الواتساب'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 5: PRESCRIPTIONS */}
              {activeTab === 'prescriptions' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                    الروشتات المرفوعة من العملاء:
                  </h4>
                  {prescriptions.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">لا توجد روشتات مرفوعة.</div>
                  ) : (
                    prescriptions.map((rx) => (
                      <div
                        key={rx.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {rx.customerName} ({rx.customerPhone})
                          </span>
                          <span className="text-slate-400 text-[10px]">{rx.date}</span>
                        </div>
                        {rx.notes && <p className="text-slate-600 dark:text-slate-300">{rx.notes}</p>}
                        {rx.imageUrl && (
                          <div>
                            <a
                              href={rx.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-bold text-[11px] mb-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>فتح صورة الروشتة بالحجم الكامل</span>
                            </a>
                            <img
                              src={rx.imageUrl}
                              alt="Rx"
                              className="max-h-36 rounded-xl border border-slate-200 dark:border-slate-700 mt-1 object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 6: BRANDING & LOGO */}
              {activeTab === 'branding' && (
                <div className="space-y-6 max-w-lg mx-auto py-2">
                  <div className="text-center space-y-1">
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">
                      شعار وهوية صيدلية الديب
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      يمكنك استخدام الشعار الرسمي أو رفع صورتك الخاصة من جهازك ليتم تعيينها كشعار للصفحة فوراً.
                    </p>
                  </div>

                  {/* Active Logo Display */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4">
                    <div className="w-28 h-28 rounded-3xl overflow-hidden p-1 bg-gradient-to-tr from-sky-600 via-cyan-500 to-blue-700 shadow-xl">
                      <img
                        src={currentLogo}
                        alt="شعار الصيدلية الحالي"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-[20px] bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        الشعار الفعّال حالياً
                      </span>
                      <p className="text-[11px] text-slate-400">يظهر في الشريط العلوي وفافيكون المتصفح</p>
                    </div>
                  </div>

                  {/* Upload from device */}
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-sky-400/50 dark:border-sky-600/40 rounded-3xl cursor-pointer hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition-all text-center">
                      <Upload className="w-8 h-8 text-sky-600 dark:text-sky-400 mb-2" />
                      <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                        انقر لاختيار لوجو من هاتفك أو جهازك
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const result = event.target?.result as string;
                              if (result) {
                                setCurrentLogo(result);
                                saveStoredLogo(result);
                                saveSharedLogo(result).catch((error) => console.error('Shared logo save failed:', error));
                                window.dispatchEvent(new Event('eldeeb_logo_updated'));
                                setLogoSaveSuccess(true);
                                setTimeout(() => setLogoSaveSuccess(false), 3000);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Reset to official logo button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        const defaultUrl = '/eldeeb_logo.jpg';
                        setCurrentLogo(defaultUrl);
                        saveStoredLogo(null);
                        clearSharedLogo().catch((error) => console.error('Shared logo reset failed:', error));
                        window.dispatchEvent(new Event('eldeeb_logo_updated'));
                        setLogoSaveSuccess(true);
                        setTimeout(() => setLogoSaveSuccess(false), 3000);
                      }}
                      className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>استعادة الشعار الرسمي الافتراضي</span>
                    </button>

                    {logoSaveSuccess && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        تم تحديث الشعار بنجاح!
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: SECURITY & PASSWORD CHANGE */}
              {activeTab === 'security' && (
                <div className="space-y-6 max-w-md mx-auto py-3">
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center mx-auto mb-2">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">
                      إعدادات كلمة مرور لوحة التحكم
                    </h4>
                    <p className="text-xs text-slate-500">
                      يتم التحقق من كلمة المرور محليًا دون عرضها أو كشفها داخل لوحة التحكم.
                    </p>
                  </div>

                  {pinChangeSuccess && (
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تم تحديث كلمة المرور وحفظها بأمان!</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveNewPin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        كلمة المرور الجديدة
                      </label>
                      <input
                        type="text"
                        required
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        placeholder="أدخل كلمة المرور الجديدة"
                        className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs sm:text-sm font-mono outline-none border border-transparent focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        تأكيد كلمة المرور الجديدة
                      </label>
                      <input
                        type="text"
                        required
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value)}
                        placeholder="أعد إدخال كلمة المرور"
                        className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs sm:text-sm font-mono outline-none border border-transparent focus:border-sky-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-transform active:scale-95"
                    >
                      حفظ كلمة المرور الجديدة
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Gemini Product Studio Camera Modal */}
      {isStudioOpen && (
        <GeminiProductStudio
          initialImage={image}
          productName={nameAr || 'صيدلية الديب'}
          onImageEnhanced={(enhancedUrl) => {
            setImage(enhancedUrl);
            setIsStudioOpen(false);
          }}
          onCancel={() => setIsStudioOpen(false)}
        />
      )}
    </div>
  );
};
