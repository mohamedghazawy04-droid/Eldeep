import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Package,
  Sparkles,
  ShoppingBag,
  FileSpreadsheet,
  Users,
  Bell,
  Plus,
  Trash2,
  Edit3,
  LogOut,
  CheckCircle2,
  RefreshCw,
  Camera,
  SwitchCamera,
  Video,
  VideoOff,
  Wand2,
  AlertCircle,
  Database,
  Globe,
  Settings,
  Send,
  ArrowLeft,
  X,
  HardDrive,
  CloudUpload,
  Upload,
  ImageIcon,
  Search,
  Filter,
  AlertTriangle,
  Download,
  Store,
  Layers,
  Check,
  Percent,
  SlidersHorizontal,
  CloudCheck,
} from 'lucide-react';
import { Product, Customer, AppNotification, ProductCategory } from '../types';
import { CATEGORIES } from '../data/initialData';
import { GeminiProductStudio, enhanceMedicinePhotoWithAI, StudioPreset } from './GeminiProductStudio';
import { GoogleDriveModal } from './GoogleDriveModal';
import { CustomersManager } from './CustomersManager';
import { ExcelProductImporter } from './ExcelProductImporter';
import {
  syncAddProductToFirestore,
  syncDeleteProductFromFirestore,
  syncClearAllFirestoreProducts,
  syncBroadcastNotificationToFirestore,
  syncSaveLogoToFirestore,
  subscribeToFirestoreCustomers,
  subscribeToFirestoreLogo,
  fetchCustomersFromFirestore,
} from '../services/firestoreSync';
import {
  getStoredAllCustomers,
  getStoredOrders,
  getStoredPrescriptions,
  getStoredLogo,
  saveStoredLogo,
  recalculateProductLoyaltyPoints,
} from '../services/storage';
import { optimizeProductImage } from '../utils/imageOptimizer';
import { enrichProductsWithImages, resolveProductImage } from '../utils/productImageResolver';
import { GitHubBackupManager } from './GitHubBackupManager';
import confetti from 'canvas-confetti';

export interface AdminPortalProps {
  products: Product[];
  onAddProduct: (product: Product) => Promise<{ success: boolean; error?: string }> | void;
  onDeleteProduct: (productId: string) => Promise<void> | void;
  onUpdateProduct: (product: Product) => Promise<{ success: boolean; error?: string }> | void;
  onClearAllProducts?: () => Promise<void> | void;
  onRemoveUnavailableProducts?: () => Promise<number> | void;
  onBatchImportProducts?: (products: Product[]) => Promise<number | void> | void;
  onBroadcastNotification: (title: string, message: string) => void;
  onBackToStore: () => void;
}

type AdminModule =
  | 'products'
  | 'add-product'
  | 'excel'
  | 'cleanup'
  | 'customers'
  | 'broadcast'
  | 'cloud'
  | 'branding';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  products,
  onAddProduct,
  onDeleteProduct,
  onUpdateProduct,
  onClearAllProducts,
  onRemoveUnavailableProducts,
  onBatchImportProducts,
  onBroadcastNotification,
  onBackToStore,
}) => {
  // STRICT AUTHENTICATION - PASSWORD: MOhager191995
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('eldeeb_hub_auth') === 'true';
  });
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Active Icon Navigation Module
  const [activeModule, setActiveModule] = useState<AdminModule>('products');
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isEnrichingImages, setIsEnrichingImages] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Form State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<ProductCategory>('medicines');
  const [price, setPrice] = useState('');
  const [points, setPoints] = useState('');
  const [dosageForm, setDosageForm] = useState('أقراص');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [stockQuantity, setStockQuantity] = useState('20');
  const [isLowStock, setIsLowStock] = useState(false);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [requiresPrescription, setRequiresPrescription] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Studio / Camera Modal State
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  // Continuous Live Camera for Pharmacy Manager
  const [isLiveCameraActive, setIsLiveCameraActive] = useState<boolean>(false);
  const [liveCameraFacing, setLiveCameraFacing] = useState<'environment' | 'user'>('environment');
  const [liveCameraError, setLiveCameraError] = useState<string | null>(null);
  const [selectedAIPreset, setSelectedAIPreset] = useState<StudioPreset>('commercial3d');
  const [isAIProcessing, setIsAIProcessing] = useState<boolean>(false);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks on unmount
  useEffect(() => {
    return () => {
      if (liveStreamRef.current) {
        liveStreamRef.current.getTracks().forEach((track) => track.stop());
        liveStreamRef.current = null;
      }
    };
  }, []);

  // Search & Filter State
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'in_stock' | 'out_of_stock' | 'low_stock'>('all');

  // Push Broadcast Notification Form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Pharmacy Branding
  const [portalLogo, setPortalLogo] = useState<string>(() => getStoredLogo() || '/eldeeb_pharmacy_logo.jpg');
  const [isSavingLogo, setIsSavingLogo] = useState(false);

  // Confirmation dialogs
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);
  const [isConfirmingRemoveUnavailable, setIsConfirmingRemoveUnavailable] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Customers data
  const [customersList, setCustomersList] = useState<Customer[]>(() => getStoredAllCustomers());

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackToast({ type, message });
    setTimeout(() => setFeedbackToast(null), 4500);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubLogo = subscribeToFirestoreLogo((cloudLogo) => {
      if (cloudLogo) setPortalLogo(cloudLogo);
    });
    const unsubCust = subscribeToFirestoreCustomers((cloudCustomers) => {
      if (cloudCustomers && cloudCustomers.length > 0) setCustomersList(cloudCustomers);
    });
    fetchCustomersFromFirestore().then((cloudCust) => {
      if (cloudCust && cloudCust.length > 0) setCustomersList(cloudCust);
    });
    return () => {
      unsubLogo();
      unsubCust();
    };
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === 'MOhager191995') {
      sessionStorage.setItem('eldeeb_hub_auth', 'true');
      setIsAuthenticated(true);
      setAuthError('');
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } else {
      setAuthError('كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('eldeeb_hub_auth');
    setIsAuthenticated(false);
    setPin('');
  };

  // Reset form
  const resetForm = () => {
    setEditingProductId(null);
    setNameAr('');
    setNameEn('');
    setCategory('medicines');
    setPrice('');
    setPoints('');
    setDosageForm('أقراص');
    setActiveIngredient('');
    setDescription('');
    setImage('');
    setStockQuantity('20');
    setIsLowStock(false);
    setIsComingSoon(false);
    setRequiresPrescription(false);
  };

  const handleStartEdit = (product: Product) => {
    setEditingProductId(product.id);
    setNameAr(product.nameAr);
    setNameEn(product.nameEn || '');
    setCategory(product.category);
    setPrice(product.price.toString());
    setPoints(product.points?.toString() || (product.price * 10).toString());
    setDosageForm(product.dosageForm || 'أقراص');
    setActiveIngredient(product.activeIngredient || '');
    setDescription(product.description || '');
    setImage(product.image);
    setStockQuantity(product.stockQuantity !== undefined ? product.stockQuantity.toString() : '20');
    setIsLowStock(product.isLowStock || false);
    setIsComingSoon(product.isComingSoon || false);
    setRequiresPrescription(product.requiresPrescription || false);
    setActiveModule('add-product');
  };

  // Start Continuous Live Camera for Manager
  const startLiveCamera = async (mode: 'environment' | 'user' = liveCameraFacing) => {
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach((track) => track.stop());
      liveStreamRef.current = null;
    }
    setLiveCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setLiveCameraError('الكاميرا تحتاج إلى إذن المتصفح ورابط آمن HTTPS.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      liveStreamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        await liveVideoRef.current.play();
      }
      setIsLiveCameraActive(true);
      showToast('تم تفعيل الكاميرا المباشرة بنجاح - وجه الكاميرا نحو عبوة الدواء', 'info');
    } catch (err: any) {
      console.error('Camera access error:', err);
      const name = err?.name === 'NotAllowedError' ? 'تم رفض إذن الكاميرا من المتصفح.' : 'تعذر تشغيل الكاميرا.';
      setLiveCameraError(`${name} يرجى السماح بالإذن أو رفع صورة العبوة من جهازك.`);
      setIsLiveCameraActive(false);
    }
  };

  // Stop Live Camera
  const stopLiveCamera = () => {
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach((track) => track.stop());
      liveStreamRef.current = null;
    }
    setIsLiveCameraActive(false);
  };

  // Toggle Camera Front / Back
  const toggleLiveCameraFacing = () => {
    const next = liveCameraFacing === 'environment' ? 'user' : 'environment';
    setLiveCameraFacing(next);
    startLiveCamera(next);
  };

  // Capture Live Frame and immediately apply AI Studio enhancement
  const captureLiveCameraSnapshot = async () => {
    if (!liveVideoRef.current) return;
    try {
      setIsAIProcessing(true);
      const video = liveVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 800;
      canvas.height = video.videoHeight || 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.92);

      // AI studio enhancement: commercial studio lighting, drop shadow, and authenticity stamp
      const enhanced = await enhanceMedicinePhotoWithAI(rawDataUrl, selectedAIPreset, true);
      setImage(enhanced);
      setIsAIProcessing(false);
      showToast('✨ تم التقاط العبوة وتطبيق معالجة الذكاء الاصطناعي بنجاح!', 'success');
    } catch {
      setIsAIProcessing(false);
      showToast('تعذر معالجة الصورة بالذكاء الاصطناعي', 'error');
    }
  };

  // Apply chosen AI Preset on existing image
  const handleApplyPresetToCurrentImage = async (preset: StudioPreset) => {
    if (!image) {
      showToast('يرجى التقاط أو رفع صورة الصنف أولاً لتطبيق النمط', 'info');
      return;
    }
    try {
      setIsAIProcessing(true);
      setSelectedAIPreset(preset);
      const enhanced = await enhanceMedicinePhotoWithAI(image, preset, true);
      setImage(enhanced);
      setIsAIProcessing(false);
      showToast('تم تطبيق نمط الاستوديو بنجاح', 'success');
    } catch {
      setIsAIProcessing(false);
      showToast('حدث خطأ في تطبيق النمط', 'error');
    }
  };

  // Image Upload handler with instant AI studio enhancement
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsAIProcessing(true);
      const optimized = await optimizeProductImage(file, 800, 800, 0.85);
      const enhanced = await enhanceMedicinePhotoWithAI(optimized.dataUrl, selectedAIPreset, true);
      setImage(enhanced);
      setIsAIProcessing(false);
      showToast('تم تحميل ومعالجة صورة الصنف بالذكاء الاصطناعي بنجاح', 'success');
    } catch {
      setIsAIProcessing(false);
      showToast('فشل قراءة ومعالجة ملف الصورة', 'error');
    }
  };

  // Save product (Add or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) {
      showToast('يرجى كتابة اسم الصنف بالعربية', 'error');
      return;
    }
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      showToast('يرجى إدخال سعر صحيح', 'error');
      return;
    }

    setIsSavingProduct(true);
    const finalImage = image.trim() || resolveProductImage({ nameAr, nameEn, category, dosageForm, activeIngredient });
    const numericStock = parseInt(stockQuantity, 10);
    const validStock = isNaN(numericStock) ? 20 : numericStock;
    const finalPoints = points.trim() ? parseFloat(points) : recalculateProductLoyaltyPoints(numericPrice);

    const productData: Product = {
      id: editingProductId || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      category,
      price: numericPrice,
      points: finalPoints,
      dosageForm: dosageForm.trim() || 'أقراص',
      activeIngredient: activeIngredient.trim() || 'وفق التركيبة المعتمدة',
      description: description.trim() || 'منتج طبي معتمد في صيدلية الديب.',
      image: finalImage,
      inStock: validStock > 0,
      stockQuantity: validStock,
      isLowStock: validStock > 0 && validStock <= 5,
      isComingSoon,
      requiresPrescription,
      usage: 'وفق إرشادات الطبيب أو الصيدلي.',
      isNew: true,
      createdAt: Date.now(),
    };

    try {
      if (editingProductId) {
        await onUpdateProduct(productData);
        showToast(`تم بنجاح تعديل الصنف "${productData.nameAr}" ومزامنته سحابياً`);
      } else {
        await onAddProduct(productData);
        showToast(`تم بنجاح إضافة الصنف "${productData.nameAr}" وحفظه سحابياً`);
      }
      resetForm();
      setActiveModule('products');
    } catch (err: any) {
      showToast(err?.message || 'حدث خطأ أثناء حفظ الصنف', 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Delete single product
  const handleExecuteDelete = async (id: string) => {
    setIsActionInProgress(true);
    try {
      await onDeleteProduct(id);
      showToast('تم حذف الصنف ومزامنته سحابياً بنجاح (Supabase & Firestore)');
    } catch {
      showToast('فشل حذف الصنف سحابياً', 'error');
    } finally {
      setConfirmDeleteId(null);
      setIsActionInProgress(false);
    }
  };

  // Bulk remove unavailable products
  const handleExecuteRemoveUnavailable = async () => {
    setIsActionInProgress(true);
    try {
      if (onRemoveUnavailableProducts) {
        const count = await onRemoveUnavailableProducts();
        showToast(`تم بنجاح إزالة ومسح ${count} صنف غير متوفر من الكتالوج والسحابة`);
      } else {
        const unavailable = products.filter((p) => !p.inStock || p.stockQuantity <= 0 || p.isComingSoon);
        for (const item of unavailable) {
          await onDeleteProduct(item.id);
        }
        showToast(`تم إزالة ${unavailable.length} صنف غير متوفر بنجاح`);
      }
    } catch {
      showToast('حدث خطأ أثناء إزالة الأصناف غير المتوفرة', 'error');
    } finally {
      setIsConfirmingRemoveUnavailable(false);
      setIsActionInProgress(false);
    }
  };

  // Total wipe catalog
  const handleExecuteClearAll = async () => {
    setIsActionInProgress(true);
    try {
      if (onClearAllProducts) {
        await onClearAllProducts();
      }
      setSelectedProductIds([]);
      showToast('تم مسح كافة الأصناف وتصفير الكتالوج سحابياً ومحلياً بنجاح! الموقع فارغ وجاهز لإضافة ما تريده.');
      setActiveModule('products');
    } catch {
      showToast('حدث خطأ أثناء مسح الأصناف', 'error');
    } finally {
      setIsConfirmingClearAll(false);
      setIsActionInProgress(false);
    }
  };

  // Toggle single product stock directly
  const handleToggleStock = async (product: Product) => {
    const nextInStock = !product.inStock || (product.stockQuantity !== undefined && product.stockQuantity <= 0);
    const updated: Product = {
      ...product,
      inStock: nextInStock,
      stockQuantity: nextInStock ? (product.stockQuantity && product.stockQuantity > 0 ? product.stockQuantity : 20) : 0,
      isLowStock: false,
    };
    try {
      await onUpdateProduct(updated);
      showToast(nextInStock ? `أصبح "${product.nameAr}" متوفراً بالصيدلية` : `تم تعيين "${product.nameAr}" كغير متوفر`);
    } catch {
      showToast('فشل تحديث حالة الصنف سحابياً', 'error');
    }
  };

  // Bulk delete selected products
  const handleBulkDeleteSelected = async () => {
    if (selectedProductIds.length === 0) return;
    if (!window.confirm(`هل أنت متأكد من حذف ${selectedProductIds.length} صنفاً نهائياً من الصيدلية والسحابة؟`)) return;
    setIsActionInProgress(true);
    const countToDelete = selectedProductIds.length;
    try {
      for (const id of selectedProductIds) {
        await onDeleteProduct(id);
      }
      setSelectedProductIds([]);
      showToast(`تم بنجاح حذف ${countToDelete} صنف ومزامنتها سحابياً`);
    } catch {
      showToast('حدث خطأ أثناء حذف الأصناف المحددة', 'error');
    } finally {
      setIsActionInProgress(false);
    }
  };

  // Bulk Enrich Images
  const handleAutoEnrichImages = async () => {
    if (products.length === 0) {
      showToast('الكتالوج فارغ حالياً، يرجى إضافة أصناف أولاً', 'info');
      return;
    }
    setIsEnrichingImages(true);
    try {
      const { updatedCount, enrichedProducts } = enrichProductsWithImages(products);
      if (updatedCount > 0) {
        if (onBatchImportProducts) {
          await onBatchImportProducts(enrichedProducts);
        }
        showToast(`تم بنجاح تحديث وتوليد صور دوائية وطبية حقيقية لـ ${updatedCount} صنف وحفظها سحابياً!`);
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } else {
        showToast('جميع الأصناف في الكتالوج تحتوي بالفعل على صور حقيقية ومحدثة!', 'info');
      }
    } catch {
      showToast('حدث خطأ أثناء فحص الصور', 'error');
    } finally {
      setIsEnrichingImages(false);
    }
  };

  // Send broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) {
      showToast('يرجى ملء عنوان ونص الإشعار', 'error');
      return;
    }
    setIsSendingBroadcast(true);
    try {
      await onBroadcastNotification(broadcastTitle.trim(), broadcastMsg.trim());
      showToast('تم بنجاح إرسال وبث الإشعار العام لجميع الزبائن!');
      setBroadcastTitle('');
      setBroadcastMsg('');
    } catch {
      showToast('تعذر إرسال الإشعار', 'error');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  // Save pharmacy logo
  const handleSaveLogo = async () => {
    setIsSavingLogo(true);
    try {
      saveStoredLogo(portalLogo);
      await syncSaveLogoToFirestore(portalLogo);
      showToast('تم بنجاح حفظ وتحديث شعار وهوية الصيدلية سحابياً!');
    } catch {
      showToast('حدث خطأ أثناء حفظ الشعار', 'error');
    } finally {
      setIsSavingLogo(false);
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesSearch =
        !productSearchTerm.trim() ||
        prod.nameAr.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        (prod.nameEn && prod.nameEn.toLowerCase().includes(productSearchTerm.toLowerCase())) ||
        (prod.activeIngredient && prod.activeIngredient.toLowerCase().includes(productSearchTerm.toLowerCase())) ||
        (prod.dosageForm && prod.dosageForm.toLowerCase().includes(productSearchTerm.toLowerCase()));

      const matchesCategory = filterCategory === 'all' || prod.category === filterCategory;

      let matchesStock = true;
      if (filterStock === 'in_stock') matchesStock = prod.inStock && prod.stockQuantity > 0;
      if (filterStock === 'out_of_stock') matchesStock = !prod.inStock || prod.stockQuantity <= 0;
      if (filterStock === 'low_stock') matchesStock = prod.inStock && prod.stockQuantity > 0 && prod.stockQuantity <= 5;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, productSearchTerm, filterCategory, filterStock]);

  const unavailableCount = useMemo(() => {
    return products.filter((p) => !p.inStock || p.stockQuantity <= 0 || p.isComingSoon).length;
  }, [products]);

  // Download Catalog JSON backup
  const handleExportJsonBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `eldeeb_pharmacy_catalog_backup_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
    showToast('تم تصدير نسخة احتياطية من الكتالوج بنجاح (JSON)');
  };

  // ICON DASHBOARD TILES DEFINITION
  const dashboardIcons = [
    {
      id: 'products' as AdminModule,
      title: 'كتالوج ومخزون الأدوية',
      description: 'البحث، التعديل والحذف الفوري',
      badge: `${products.length} صنف`,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      icon: Package,
      gradient: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
      activeRing: 'ring-2 ring-cyan-500 border-cyan-400',
    },
    {
      id: 'add-product' as AdminModule,
      title: 'إضافة صنف دوائي',
      description: 'إدراج دواء وتوليد صورته ذكياً',
      badge: editingProductId ? 'وضع التعديل' : 'إضافة فورية',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: Plus,
      gradient: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
      activeRing: 'ring-2 ring-emerald-500 border-emerald-400',
    },
    {
      id: 'excel' as AdminModule,
      title: 'استيراد كشف Excel / CSV',
      description: 'رفع دفعات ضخمة حتى 25,000 صنف',
      badge: 'إكسيل و CSV',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      icon: FileSpreadsheet,
      gradient: 'from-teal-500/20 to-emerald-500/10 border-teal-500/30 text-teal-400',
      activeRing: 'ring-2 ring-teal-500 border-teal-400',
    },
    {
      id: 'cleanup' as AdminModule,
      title: 'تنظيف وتصفية المخزون',
      description: 'إزالة النواقص أو مسح الكتالوج للبدء',
      badge: unavailableCount > 0 ? `${unavailableCount} غير متوفر` : 'المخزون مضبوط',
      badgeColor: unavailableCount > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-700 text-slate-300 border-slate-600',
      icon: SlidersHorizontal,
      gradient: 'from-amber-500/20 to-rose-500/10 border-amber-500/30 text-amber-400',
      activeRing: 'ring-2 ring-amber-500 border-amber-400',
    },
    {
      id: 'customers' as AdminModule,
      title: 'سجل العملاء والولاء',
      description: 'بيانات الزبائن ورصيد نقاط المكافآت',
      badge: `${customersList.length} عميل`,
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      icon: Users,
      gradient: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400',
      activeRing: 'ring-2 ring-purple-500 border-purple-400',
    },
    {
      id: 'broadcast' as AdminModule,
      title: 'إرسال إشعار وبث عروض',
      description: 'إرسال تنبيه مباشر لشاشات العملاء',
      badge: 'بث عام',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      icon: Bell,
      gradient: 'from-sky-500/20 to-blue-500/10 border-sky-500/30 text-sky-400',
      activeRing: 'ring-2 ring-sky-500 border-sky-400',
    },
    {
      id: 'cloud' as AdminModule,
      title: 'السحابة والنسخ الاحتياطي',
      description: 'حالة Supabase و Firestore والتصدير',
      badge: 'متصل 🟢',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: Database,
      gradient: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400',
      activeRing: 'ring-2 ring-blue-500 border-blue-400',
    },
    {
      id: 'branding' as AdminModule,
      title: 'هوية وشعار الصيدلية',
      description: 'تخصيص اللوجو واسم المنظومة',
      badge: 'الهوية',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      icon: Store,
      gradient: 'from-pink-500/20 to-rose-500/10 border-pink-500/30 text-pink-400',
      activeRing: 'ring-2 ring-pink-500 border-pink-400',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-cairo" dir="rtl">
      {/* Toast Notification */}
      <AnimatePresence>
        {feedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-2.5 backdrop-blur-md ${
              feedbackToast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
                : feedbackToast.type === 'info'
                ? 'bg-sky-950/90 text-sky-200 border-sky-500/50'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
            }`}
          >
            {feedbackToast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : feedbackToast.type === 'info' ? (
              <AlertTriangle className="w-5 h-5 text-sky-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span>{feedbackToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={portalLogo}
              alt="صيدلية الديب"
              className="w-10 h-10 rounded-2xl object-cover border border-cyan-500/30 shadow-md bg-white p-0.5"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/eldeeb_pharmacy_logo.jpg';
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white">لوحة إدارة صيدلية الديب</h1>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  مزامنة سحابية نشطة
                </span>
              </div>
              <p className="text-xs text-slate-400">تحكم كامل في المخزون، الأسعار، العملاء، وتوليد الصور</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToStore}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">العودة للمتجر</span>
            </button>
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-rose-800/40 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {!isAuthenticated ? (
          /* Password Authentication Gate */
          <div className="flex-1 flex items-center justify-center py-16 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center"
            >
              <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-1.5">تسجيل الدخول للإدارة</h2>
                <p className="text-xs text-slate-400">
                  لوحة إدارة صيدلية الديب محمية برمز أمان خاص بالمسؤول فقط
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs rounded-xl flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} autoComplete="off" className="space-y-4 text-right">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    رمز الدخول السري
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pr-4 pl-11 py-3 bg-slate-800 text-white rounded-2xl text-center text-lg tracking-widest font-mono outline-none border border-slate-700 focus:border-cyan-500 transition-colors shadow-inner"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3.5 top-3.5 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-98"
                >
                  تأكيد الدخول
                </button>
              </form>
            </motion.div>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <>
            {/* 1. ICON DASHBOARD GRID - ليس جرار وإنما شبكة أيقونات منظمة */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-400">أقسام ولوحات الإدارة المباشرة (اختر قسماً):</span>
                <span className="text-[11px] text-cyan-400 font-bold">
                  {dashboardIcons.find((d) => d.id === activeModule)?.title}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                {dashboardIcons.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'excel') {
                          setIsExcelModalOpen(true);
                        } else {
                          setActiveModule(item.id);
                        }
                      }}
                      className={`relative p-3 rounded-2xl border transition-all duration-200 flex flex-col items-center text-center group cursor-pointer ${
                        isActive
                          ? `bg-slate-900 shadow-xl ${item.activeRing}`
                          : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2 border transition-transform group-hover:scale-105 ${
                          isActive ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : item.gradient
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black text-white leading-tight mb-1 line-clamp-1">
                        {item.title}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. MODULE: PRODUCTS CATALOG (كتالوج ومخزون الأدوية) */}
            {activeModule === 'products' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Search & Actions Bar */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    {/* Search box */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type="text"
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        placeholder="ابحث باسم الدواء، المادة الفعالة، الشكل الدوائي..."
                        className="w-full pr-10 pl-4 py-2.5 bg-slate-800 text-white rounded-2xl text-xs sm:text-sm border border-slate-700 focus:border-cyan-500 outline-none"
                      />
                      {productSearchTerm && (
                        <button
                          onClick={() => setProductSearchTerm('')}
                          className="absolute left-3 top-3 text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Filter Category */}
                    <div className="flex items-center gap-2">
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-2.5 bg-slate-800 text-white rounded-2xl text-xs border border-slate-700 focus:border-cyan-500 outline-none"
                      >
                        <option value="all">كل الأقسام الطبية</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nameAr}
                          </option>
                        ))}
                      </select>

                      {/* Filter Stock */}
                      <select
                        value={filterStock}
                        onChange={(e) => setFilterStock(e.target.value as any)}
                        className="px-3 py-2.5 bg-slate-800 text-white rounded-2xl text-xs border border-slate-700 focus:border-cyan-500 outline-none"
                      >
                        <option value="all">كل الحالات</option>
                        <option value="in_stock">متوفر فقط</option>
                        <option value="out_of_stock">غير متوفر (Out of stock)</option>
                        <option value="low_stock">أوشك على النفاد</option>
                      </select>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          resetForm();
                          setActiveModule('add-product');
                        }}
                        className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-transform active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ إضافة صنف جديد</span>
                      </button>

                      <button
                        onClick={() => setIsExcelModalOpen(true)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        <span>استيراد كشف Excel / CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsConfirmingClearAll(true)}
                        disabled={products.length === 0 || isActionInProgress}
                        className="px-3.5 py-2 bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 rounded-xl text-xs font-bold border border-rose-800/50 flex items-center gap-1.5 transition-colors disabled:opacity-40"
                        title="مسح وتصفير كافة الأصناف للبدء بكتالوج نظيف وفارغ"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>مسح كافة الأصناف ({products.length}) ⚠️</span>
                      </button>

                      <button
                        onClick={handleAutoEnrichImages}
                        disabled={isEnrichingImages || products.length === 0}
                        className="px-3.5 py-2 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 rounded-xl text-xs font-bold border border-purple-800/40 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        title="فحص الكتالوج وتوليد صور حقيقية للأصناف التي تفتقر لصورة"
                      >
                        <Sparkles className={`w-4 h-4 text-purple-400 ${isEnrichingImages ? 'animate-spin' : ''}`} />
                        <span>{isEnrichingImages ? 'جاري التوليد...' : '⚡ توليد صور الأصناف تلقائياً'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        المعروض: <span className="text-white font-mono font-bold">{filteredProducts.length}</span> من أصل{' '}
                        <span className="text-cyan-400 font-mono font-bold">{products.length}</span> صنف
                      </span>
                    </div>
                  </div>

                  {/* Bulk Selection Bar */}
                  {selectedProductIds.length > 0 && (
                    <div className="bg-cyan-950/90 border border-cyan-800/80 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg animate-in fade-in">
                      <div className="flex items-center gap-2 text-cyan-200 font-bold">
                        <Check className="w-4 h-4 text-cyan-400" />
                        <span>تم تحديد: {selectedProductIds.length} صنف</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleBulkDeleteSelected}
                          disabled={isActionInProgress}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف الأصناف المحددة نهائياً ({selectedProductIds.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedProductIds([])}
                          className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700"
                        >
                          إلغاء التحديد
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Products Table / Empty State */}
                {products.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
                      <Package className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-white">كتالوج الصيدلية فارغ تماماً</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      تم تصفير الأصناف بنجاح. يمكنك الآن البدء بإضافة الأدوية بانتقائية صنفاً صنفاً، أو استيراد كشف إكسيل للأصناف التي تختارها.
                    </p>
                    <div className="flex justify-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          resetForm();
                          setActiveModule('add-product');
                        }}
                        className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg"
                      >
                        + إضافة أول صنف دوائي
                      </button>
                      <button
                        onClick={() => setIsExcelModalOpen(true)}
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700"
                      >
                        استيراد كشف Excel
                      </button>
                    </div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs">
                    لا توجد أصناف مطابقة لبحثك "{productSearchTerm}"
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-850 text-slate-400 font-bold border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-3 text-center w-10">
                              <input
                                type="checkbox"
                                checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProductIds(filteredProducts.map((p) => p.id));
                                  } else {
                                    setSelectedProductIds([]);
                                  }
                                }}
                                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-600 cursor-pointer"
                                title="تحديد جميع الأصناف"
                              />
                            </th>
                            <th className="py-3 px-4">الصورة</th>
                            <th className="py-3 px-4">اسم الدواء / الصنف</th>
                            <th className="py-3 px-4">القسم الطبي</th>
                            <th className="py-3 px-4">الشكل والتركيبة</th>
                            <th className="py-3 px-4">السعر</th>
                            <th className="py-3 px-4">المخزون والحالة (انقر للتبديل)</th>
                            <th className="py-3 px-4 text-center">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-200">
                          {filteredProducts.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedProductIds.includes(p.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedProductIds((prev) => [...prev, p.id]);
                                    } else {
                                      setSelectedProductIds((prev) => prev.filter((id) => id !== p.id));
                                    }
                                  }}
                                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-600 cursor-pointer"
                                />
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                  <img
                                    src={p.image}
                                    alt={p.nameAr}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/eldeeb_pharmacy_logo.jpg';
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="py-2.5 px-4 font-bold">
                                <div className="text-white text-sm">{p.nameAr}</div>
                                {p.nameEn && <div className="text-[11px] text-slate-400 font-mono">{p.nameEn}</div>}
                              </td>
                              <td className="py-2.5 px-4">
                                <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                                  {CATEGORIES.find((c) => c.id === p.category)?.nameAr || p.category}
                                </span>
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="text-slate-300">{p.dosageForm || 'أقراص'}</div>
                                <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                                  {p.activeIngredient || 'وفق التركيبة'}
                                </div>
                              </td>
                              <td className="py-2.5 px-4 font-bold font-mono">
                                <span className="text-emerald-400 text-sm">{p.price} ج.م</span>
                                <div className="text-[10px] text-cyan-400 font-normal">
                                  {p.points !== undefined ? p.points : recalculateProductLoyaltyPoints(p.price)} نقطة
                                </div>
                              </td>
                              <td className="py-2.5 px-4">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStock(p)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border shadow-sm ${
                                    !p.inStock || (p.stockQuantity !== undefined && p.stockQuantity <= 0)
                                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40'
                                      : p.stockQuantity && p.stockQuantity <= 5
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40'
                                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40'
                                  }`}
                                  title="اضغط هنا للتبديل الفوري بين متوفر وغير متوفر"
                                >
                                  {!p.inStock || (p.stockQuantity !== undefined && p.stockQuantity <= 0) ? (
                                    <>
                                      <span>غير متوفر ✕</span>
                                      <span className="text-[9px] underline opacity-75">(انقر للتوفر)</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>متوفر ({p.stockQuantity || 20}) ✓</span>
                                      <span className="text-[9px] underline opacity-75">(انقر للإيقاف)</span>
                                    </>
                                  )}
                                </button>
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(p)}
                                    className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-700 text-cyan-300 hover:text-white border border-cyan-800/60 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                                    title="تعديل كافة بيانات الصنف، السعر، والكمية، والصورة"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>تعديل</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(p.id)}
                                    className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-700 text-rose-300 hover:text-white border border-rose-800/60 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                                    title="حذف الصنف من الدليل ومزامنته سحابياً"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>حذف</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. MODULE: ADD / EDIT PRODUCT (إضافة أو تعديل صنف مع توليد الصورة) */}
            {activeModule === 'add-product' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white">
                        {editingProductId ? `✏️ تعديل بيانات وصورة الصنف: "${nameAr}"` : 'إضافة صنف دوائي جديد للكتالوج'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {editingProductId
                          ? 'يمكنك تعديل الأسعار، الكميات، وتوليد أو تحديث الصورة فورياً مع الحفظ السحابي التلقائي'
                          : 'أدخل تفاصيل الدواء واستخدم التوليد التلقائي لتعيين صورة صيدلية فائقة الجودة'}
                      </p>
                    </div>
                  </div>

                  {editingProductId && (
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setActiveModule('products');
                      }}
                      className="px-3.5 py-1.5 bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-bold hover:bg-slate-700 border border-slate-700"
                    >
                      إلغاء التعديل ✕
                    </button>
                  )}
                </div>

                {editingProductId && (
                  <div className="bg-cyan-950/70 border border-cyan-800/70 rounded-2xl p-3 px-4 flex items-center justify-between text-xs text-cyan-200 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>أنت الآن في وضع تعديل بيانات الصنف: <strong className="text-white font-bold">{nameAr}</strong>. اضغط على "حفظ التعديلات سحابياً" بالأسفل بعد الانتهاء.</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSaveProduct} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        اسم الدواء بالعربية <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={nameAr}
                        onChange={(e) => setNameAr(e.target.value)}
                        placeholder="مثال: بنادول أدفانس، كونجستال"
                        className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        اسم الدواء بالإنجليزية
                      </label>
                      <input
                        type="text"
                        value={nameEn}
                        onChange={(e) => setNameEn(e.target.value)}
                        placeholder="مثال: Panadol Advance 500mg"
                        className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        القسم الطبي <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ProductCategory)}
                        className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nameAr}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        الشكل الدوائي
                      </label>
                      <input
                        type="text"
                        value={dosageForm}
                        onChange={(e) => setDosageForm(e.target.value)}
                        placeholder="أقراص، كبسولات، شراب، أمبولات، مرهم..."
                        className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        المادة الفعالة
                      </label>
                      <input
                        type="text"
                        value={activeIngredient}
                        onChange={(e) => setActiveIngredient(e.target.value)}
                        placeholder="مثال: Paracetamol 500mg"
                        className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        السعر للجمهور (ج.م) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="مثال: 35"
                        className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        الكمية في المخزون
                      </label>
                      <input
                        type="number"
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(e.target.value)}
                        placeholder="20"
                        className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        نقاط الولاء المكتسبة
                      </label>
                      <input
                        type="number"
                        value={points}
                        onChange={(e) => setPoints(e.target.value)}
                        placeholder="اتركه فارغاً للحساب التلقائي (10 نقاط/جنيه)"
                        className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-4 pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={requiresPrescription}
                          onChange={(e) => setRequiresPrescription(e.target.checked)}
                          className="w-4 h-4 text-cyan-600 rounded bg-slate-800 border-slate-700"
                        />
                        <span>يتطلب روشتة طبية 📋</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={isComingSoon}
                          onChange={(e) => setIsComingSoon(e.target.checked)}
                          className="w-4 h-4 text-amber-600 rounded bg-slate-800 border-slate-700"
                        />
                        <span>قريباً بالصيدلية ⏳</span>
                      </label>
                    </div>
                  </div>

                  {/* CONTINUOUS CAMERA & AI PRODUCT STUDIO */}
                  <div className="p-4 sm:p-5 bg-slate-850 border border-slate-750 rounded-3xl space-y-4 shadow-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <Camera className="w-4 h-4 text-cyan-400" />
                            <span>كاميرا التقاط العبوة واستوديو المعالجة الذكي (AI Studio)</span>
                          </h4>
                          <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                            مباشر ومستمر
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          التقط صورة العبوة الحقيقية بالكاميرا المباشرة المستمرة أو ارفعها لتتحول فورياً لبوستر دعائي ثلاثي الأبعاد وإضاءة صيدلية نقية
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => {
                            if (isLiveCameraActive) {
                              stopLiveCamera();
                            } else {
                              startLiveCamera();
                            }
                          }}
                          className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                            isLiveCameraActive
                              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                              : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white shadow-cyan-600/20'
                          }`}
                        >
                          {isLiveCameraActive ? (
                            <>
                              <VideoOff className="w-4 h-4" />
                              <span>إيقاف الكاميرا</span>
                            </>
                          ) : (
                            <>
                              <Video className="w-4 h-4" />
                              <span>تشغيل الكاميرا المباشرة</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsStudioOpen(true)}
                          className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Wand2 className="w-4 h-4 text-purple-400" />
                          <span>استوديو التعديل المتقدم</span>
                        </button>
                      </div>
                    </div>

                    {/* LIVE CAMERA VIEWFINDER (Continuously open for the manager) */}
                    {isLiveCameraActive && (
                      <div className="relative w-full aspect-video max-h-[380px] bg-black rounded-2xl overflow-hidden border-2 border-cyan-500/50 shadow-2xl flex items-center justify-center">
                        <video
                          ref={liveVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />

                        {/* Framing guide overlay */}
                        <div className="absolute inset-6 sm:inset-10 border-2 border-white/50 border-dashed rounded-2xl pointer-events-none flex flex-col items-center justify-between p-3">
                          <span className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                            ضع عبوة الدواء داخل الإطار 🎯
                          </span>
                          <span className="text-[10px] text-cyan-300 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                            النمط المختار: {selectedAIPreset === 'clinicalWhite' ? 'أبيض صيدلاني ناصع' : selectedAIPreset === 'goldenGlow' ? 'إشراق تسويقي ذهبي' : 'ستوديو ثلاثي الأبعاد 3D'}
                          </span>
                        </div>

                        {/* Top camera controls */}
                        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-600/90 text-white rounded-full text-[11px] font-black tracking-wider animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-white"></span>
                            <span>LIVE</span>
                          </span>

                          <button
                            type="button"
                            onClick={toggleLiveCameraFacing}
                            className="p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-transform active:scale-90"
                            title="تبديل الكاميرا (أمامية / خلفية)"
                          >
                            <SwitchCamera className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Bottom action controls */}
                        <div className="absolute bottom-3 inset-x-3 flex flex-col items-center gap-2 pointer-events-auto">
                          {/* Preset selection chips */}
                          <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1 rounded-full border border-white/10">
                            <button
                              type="button"
                              onClick={() => setSelectedAIPreset('commercial3d')}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                                selectedAIPreset === 'commercial3d'
                                  ? 'bg-cyan-500 text-slate-950'
                                  : 'text-white/80 hover:text-white'
                              }`}
                            >
                              ستوديو 3D
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedAIPreset('clinicalWhite')}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                                selectedAIPreset === 'clinicalWhite'
                                  ? 'bg-cyan-500 text-slate-950'
                                  : 'text-white/80 hover:text-white'
                              }`}
                            >
                              أبيض صيدلاني
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedAIPreset('goldenGlow')}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                                selectedAIPreset === 'goldenGlow'
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'text-white/80 hover:text-white'
                              }`}
                            >
                              إشراق ذهبي
                            </button>
                          </div>

                          {/* Snapshot Button */}
                          <button
                            type="button"
                            onClick={captureLiveCameraSnapshot}
                            disabled={isAIProcessing}
                            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 text-slate-950 font-black text-xs sm:text-sm rounded-full shadow-lg shadow-cyan-500/40 flex items-center gap-2 border-2 border-white transition-transform active:scale-95 disabled:opacity-50"
                          >
                            {isAIProcessing ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                                <span>جاري المعالجة بالذكاء الاصطناعي...</span>
                              </>
                            ) : (
                              <>
                                <Camera className="w-4 h-4" />
                                <span>⚡ التقاط ومعالجة بالذكاء الاصطناعي فوراً</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {liveCameraError && (
                      <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{liveCameraError}</span>
                      </div>
                    )}

                    {/* Image Preview & Enhancement Tools */}
                    <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                      {/* Thumbnail with Authenticity Badge */}
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center shrink-0 shadow-inner group">
                        {image ? (
                          <>
                            <img
                              src={image}
                              alt="معاينة الصنف"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/eldeeb_pharmacy_logo.jpg';
                              }}
                            />
                            {isAIProcessing && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-2 text-center">
                            <ImageIcon className="w-6 h-6 text-slate-600 mb-1" />
                            <span className="text-[10px] text-slate-500">لا توجد صورة</span>
                          </div>
                        )}
                      </div>

                      {/* Image Details & Quick AI Controls */}
                      <div className="flex-1 w-full space-y-2.5">
                        {image && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-300">
                              تغيير نمط الإخراج بالذكاء الاصطناعي بنقرة واحدة:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApplyPresetToCurrentImage('commercial3d')}
                                disabled={isAIProcessing}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                                  selectedAIPreset === 'commercial3d'
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                                }`}
                              >
                                <span>💎 ستوديو 3D وظل واقعي</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApplyPresetToCurrentImage('clinicalWhite')}
                                disabled={isAIProcessing}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                                  selectedAIPreset === 'clinicalWhite'
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                                }`}
                              >
                                <span>🏥 أبيض صيدلاني ناصع</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApplyPresetToCurrentImage('goldenGlow')}
                                disabled={isAIProcessing}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                                  selectedAIPreset === 'goldenGlow'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                                }`}
                              >
                                <span>✨ إشراق دعائي ذهبي</span>
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">
                              رفع صورة العبوة من الجهاز (معالجة AI تلقائية):
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileUpload}
                              className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">
                              أو رابط الصورة المباشر (URL):
                            </label>
                            <input
                              type="text"
                              value={image}
                              onChange={(e) => setImage(e.target.value)}
                              placeholder="https://... رابط صورة مباشرة"
                              className="w-full px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setActiveModule('products');
                      }}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                    >
                      إلغاء
                    </button>

                    <button
                      type="submit"
                      disabled={isSavingProduct}
                      className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                    >
                      {isSavingProduct ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري الحفظ والمزامنة السحابية...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>{editingProductId ? 'حفظ التعديلات سحابياً' : 'إضافة الصنف وحفظه سحابياً'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 4. MODULE: CLEANUP & WIPE (تنظيف وتصفية المخزون) */}
            {activeModule === 'cleanup' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                      <span>إدارة وتصفية المخزون (خيارات الحذف والتنظيف السحابي)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      خيارات إزالة الأصناف غير المتوفرة أو مسح الكتالوج بالكامل للبدء على بياض بانتقائية
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Option 1: Remove unavailable */}
                    <div className="p-5 bg-slate-850 border border-amber-500/30 rounded-2xl space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                          <Trash2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">إزالة الأصناف غير المتاحة بالصيدلية</h4>
                          <span className="text-[11px] text-amber-300">
                            عدد الأصناف غير المتوفرة حالياً: {unavailableCount} صنف
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        يمسح فورياً كافة الأدوية المنتهية من المخزون أو غير المتوفرة، ويحذفها سحابياً من سوبابيس وفايربيس، ليبقى المتجر عارضاً للأصناف المتوفرة فقط.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingRemoveUnavailable(true)}
                        disabled={unavailableCount === 0 || isActionInProgress}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow"
                      >
                        إزالة كافة الأصناف غير المتوفرة ({unavailableCount})
                      </button>
                    </div>

                    {/* Option 2: Total Wipe Catalog */}
                    <div className="p-5 bg-slate-850 border border-rose-500/30 rounded-2xl space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">تصفير ومسح كافة الأصناف (للبدء بانتقائية)</h4>
                          <span className="text-[11px] text-rose-300">إجمالي الأصناف: {products.length} صنف</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        يمسح كافة الأصناف من قاعدة البيانات السحابية (Supabase & Firestore) ومن الجهاز، ويترك المتجر فارغاً تماماً وجاهزاً لإضافة الأصناف التي تختارها أنت فقط.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingClearAll(true)}
                        disabled={products.length === 0 || isActionInProgress}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow"
                      >
                        مسح كافة الأصناف وتصفير الموقع بالكامل ⚠️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. MODULE: CUSTOMERS & LOYALTY (سجل العملاء والولاء) */}
            {activeModule === 'customers' && (
              <div className="animate-in fade-in duration-200">
                <CustomersManager
                  customers={customersList}
                  onUpdateCustomer={(cust) => {
                    setCustomersList((prev) => prev.map((c) => (c.id === cust.id ? cust : c)));
                    showToast(`تم تحديث نقاط العميل ${cust.name}`);
                  }}
                  onAddCustomer={(cust) => {
                    setCustomersList((prev) => [cust, ...prev]);
                    showToast(`تم تسجيل العميل ${cust.name}`);
                  }}
                />
              </div>
            )}

            {/* 6. MODULE: BROADCAST NOTIFICATIONS (إرسال إشعار وبث عروض) */}
            {activeModule === 'broadcast' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">إرسال إشعار عام وبث عروض للزبائن</h3>
                    <p className="text-xs text-slate-400">
                      يصل هذا التنبيه فورياً لكافة زبائن صيدلية الديب على شاشات هواتفهم وتطبيقاتهم
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSendBroadcast} className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">عنوان الإشعار</label>
                    <input
                      type="text"
                      required
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="مثال: خصم 20% على منتجات العناية بالبشرة"
                      className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">نص الرسالة</label>
                    <textarea
                      required
                      rows={4}
                      value={broadcastMsg}
                      onChange={(e) => setBroadcastMsg(e.target.value)}
                      placeholder="اكتب تفاصيل العرض أو الإعلان الصيدلي هنا..."
                      className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingBroadcast}
                    className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 disabled:opacity-60 transition-all active:scale-95"
                  >
                    {isSendingBroadcast ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري البث للعملاء...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>إرسال وبث التنبيه فوراً</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* 7. MODULE: CLOUD & BACKUP (السحابة والنسخ الاحتياطي) */}
            {activeModule === 'cloud' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Cloud Status Cards */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <Database className="w-5 h-5 text-cyan-400" />
                      <span>حالة الاتصال السحابي والنسخ الاحتياطي</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      بيانات الصيدلية مخزنة ومحمية على خوادم سحابية فائقة السرعة ومتزامنة لحظياً
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-850 border border-emerald-500/30 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">قاعدة بيانات Supabase</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                          متصل 🟢
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        تخزين الأصناف الضخمة والبحث السريع والطلبات المشفرة
                      </p>
                    </div>

                    <div className="p-4 bg-slate-850 border border-emerald-500/30 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">سحابة Google Firebase</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                          متصل 🟢
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        التحديث اللحظي للعملاء، الإشعارات، والروشتات الطبية
                      </p>
                    </div>

                    <div className="p-4 bg-slate-850 border border-cyan-500/30 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">الذاكرة المحلية IndexedDB</span>
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-bold">
                          نشط ⚡
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        كاش محلي عالي السرعة لدعم العمل حتى بدون إنترنت
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleExportJsonBackup}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span>تصدير نسخة احتياطية لكافة الأصناف (ملف JSON)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsDriveModalOpen(true)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-colors"
                    >
                      <HardDrive className="w-4 h-4 text-emerald-400" />
                      <span>ربط ونسخ إلى Google Drive</span>
                    </button>
                  </div>
                </div>

                {/* Permanent GitHub Backup Manager */}
                <GitHubBackupManager
                  products={products}
                  onProductsRestored={(restored) => onBatchImportProducts?.(restored)}
                />
              </div>
            )}

            {/* 8. MODULE: BRANDING & LOGO (هوية وشعار الصيدلية) */}
            {activeModule === 'branding' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">تخصيص هوية وشعار صيدلية الديب</h3>
                    <p className="text-xs text-slate-400">تغيير اللوجو المعروض للعملاء والمزامنة السحابية الفورية</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 max-w-xl">
                  <div className="w-24 h-24 rounded-2xl bg-white p-2 border-2 border-slate-700 shadow-lg flex items-center justify-center shrink-0">
                    <img
                      src={portalLogo}
                      alt="لوجو صيدلية الديب"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/eldeeb_pharmacy_logo.jpg';
                      }}
                    />
                  </div>

                  <div className="flex-1 w-full space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">رابط الشعار المباشر (URL):</label>
                      <input
                        type="text"
                        value={portalLogo}
                        onChange={(e) => setPortalLogo(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:border-cyan-500 outline-none font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPortalLogo('/eldeeb_pharmacy_logo.jpg')}
                        className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-[11px] font-bold hover:bg-slate-700"
                      >
                        اللوجو الافتراضي
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveLogo}
                        disabled={isSavingLogo}
                        className="px-5 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all"
                      >
                        {isSavingLogo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span>حفظ الشعار سحابياً</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* CONFIRMATION DIALOG: DELETE SINGLE PRODUCT */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">تأكيد حذف الصنف</h3>
                <p className="text-xs text-slate-400 mt-1">
                  سيتم حذف هذا الصنف ومزامنته سحابياً فورياً من قواعد بيانات Supabase و Firestore.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteDelete(confirmDeleteId)}
                  disabled={isActionInProgress}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg"
                >
                  {isActionInProgress ? 'جاري الحذف...' : 'نعم، احذف الصنف'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION DIALOG: REMOVE UNAVAILABLE */}
      <AnimatePresence>
        {isConfirmingRemoveUnavailable && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">إزالة كافة الأصناف غير المتوفرة</h3>
                <p className="text-xs text-slate-400 mt-1">
                  سيتم حذف {unavailableCount} صنف غير متوفر من المخزون والسحابة فوراً.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingRemoveUnavailable(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRemoveUnavailable}
                  disabled={isActionInProgress}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg"
                >
                  {isActionInProgress ? 'جاري الإزالة...' : 'تأكيد إزالة غير المتوفر'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION DIALOG: CLEAR ALL PRODUCTS */}
      <AnimatePresence>
        {isConfirmingClearAll && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-rose-500/60 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">مسح كافة الأصناف وتصفير الموقع؟</h3>
                <p className="text-xs text-rose-300/90 mt-2 leading-relaxed">
                  تحذير: سيتم حذف جميع الأصناف البالغ عددها ({products.length}) صنفاً من السحابة (Supabase و Firestore) ومن الموقع تماماً ليبقى الكتالوج فارغاً وجاهزاً للبدء بانتقائية.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsConfirmingClearAll(false)}
                  className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="button"
                  onClick={handleExecuteClearAll}
                  disabled={isActionInProgress}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30"
                >
                  {isActionInProgress ? 'جاري التصفير السحابي...' : 'نعم، امسح كل شيء الآن'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EXCEL / CSV IMPORTER MODAL */}
      <AnimatePresence>
        {isExcelModalOpen && (
          <ExcelProductImporter
            isOpen={isExcelModalOpen}
            existingProducts={products}
            currentProducts={products}
            onImportComplete={async (imported, mode) => {
              if (onBatchImportProducts) {
                await onBatchImportProducts(imported);
              }
              setIsExcelModalOpen(false);
              showToast(`تم استيراد ${imported.length} صنف وحفظها سحابياً بنجاح!`);
              setActiveModule('products');
            }}
            onClose={() => setIsExcelModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* GOOGLE DRIVE MODAL */}
      <AnimatePresence>
        {isDriveModalOpen && (
          <GoogleDriveModal
            isOpen={isDriveModalOpen}
            products={products}
            customers={customersList}
            onClose={() => setIsDriveModalOpen(false)}
            onRestoreProducts={(restored) => {
              if (onBatchImportProducts) {
                onBatchImportProducts(restored);
              }
              showToast('تمت استعادة الأصناف من Google Drive بنجاح');
            }}
          />
        )}
      </AnimatePresence>

      {/* GEMINI PRODUCT CAMERA STUDIO */}
      {isStudioOpen && (
        <GeminiProductStudio
          isOpen={isStudioOpen}
          productName={nameAr || 'صنف دوائي'}
          initialImage={image}
          autoStartCamera={true}
          onApplyImage={(generatedUrl) => {
            setImage(generatedUrl);
            setIsStudioOpen(false);
            showToast('تم تطبيق الصورة من استوديو الكاميرا بنجاح!');
          }}
          onImageEnhanced={(generatedUrl) => {
            setImage(generatedUrl);
            setIsStudioOpen(false);
            showToast('تم تطبيق الصورة من استوديو الكاميرا بنجاح!');
          }}
          onClose={() => setIsStudioOpen(false)}
          onCancel={() => setIsStudioOpen(false)}
        />
      )}
    </div>
  );
};
