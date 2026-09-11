import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
} from 'lucide-react';
import { AppNotification, Customer, OrderRecord, PrescriptionOrder, Product, ProductCategory } from '../types';
import { CATEGORIES } from '../data/initialData';
import {
  addBroadcastNotification,
  getAdminPin,
  getStoredAllCustomers,
  getStoredOrders,
  getStoredPrescriptions,
  setAdminPin,
  updatePrescriptionStatus,
  getStoredLogo,
  saveStoredLogo,
} from '../services/storage';
import {
  subscribeToFirestoreOrders,
  subscribeToFirestorePrescriptions,
  subscribeToFirestoreCustomers,
} from '../services/firestoreSync';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onBroadcastNotification: (title: string, message: string, productId?: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddProduct,
  onDeleteProduct,
  onBroadcastNotification,
}) => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'broadcast' | 'orders' | 'prescriptions' | 'customers' | 'branding'>('products');
  const [currentLogo, setCurrentLogo] = useState<string>(() => getStoredLogo() || '/eldeeb_logo.jpg');
  const [logoSaveSuccess, setLogoSaveSuccess] = useState(false);

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
  const [broadcastNewProduct, setBroadcastNewProduct] = useState(true);

  // Broadcast Message State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = getAdminPin();
    if (pin === correctPin || pin === '1234') {
      setIsAuthenticated(true);
    } else {
      alert('الرمز السري غير صحيح! الرمز الافتراضي هو 1234');
    }
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

    const newProd: Product = {
      id: 'prod-' + Date.now(),
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      category,
      price: parseFloat(price) || 0,
      dosageForm: dosageForm.trim() || 'أقراص',
      activeIngredient: activeIngredient.trim() || 'غير محدد',
      description: description.trim() || 'منتج طبي معتمد من صيدليات الديب.',
      usage: usage.trim() || 'وفق إرشادات الصيدلي والطبيب.',
      requiresPrescription,
      inStock: true,
      points: parseInt(points, 10) || 15,
      image: defaultImg,
      isNew: true,
    };

    onAddProduct(newProd);

    // If requested, broadcast notification to users
    if (broadcastNewProduct) {
      onBroadcastNotification(
        `📦 صنف جديد: ${newProd.nameAr}`,
        `وصل حديثاً في قسم ${CATEGORIES.find((c) => c.id === category)?.nameAr}: ${newProd.nameAr} بسعر ${newProd.price} ج.م مع +${newProd.points} نقطة ولاء!`,
        newProd.id
      );
    }

    // Reset Form
    setNameAr('');
    setNameEn('');
    setPrice('');
    setActiveIngredient('');
    setDescription('');
    setUsage('');
    setImage('');
    alert('تمت إضافة المنتج بنجاح وإرسال الإشعار للعملاء!');
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      alert('يرجى ملء عنوان ونص الإشعار');
      return;
    }

    onBroadcastNotification(broadcastTitle.trim(), broadcastMessage.trim());
    setBroadcastTitle('');
    setBroadcastMessage('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 3000);
  };

  return (
    <div
      id="admin-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden font-cairo my-auto max-h-[92vh] flex flex-col text-right"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg">لوحة الإدارة والتحكم الكامل لصاحب الصيدلية</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>سحابي Firestore متصل</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">إدارة الأدوية، الإشعارات، وسجلات الطلبات والعملاء بتزامن فوري</p>
            </div>
          </div>

          <button
            id="close-admin-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth Gate */}
        {!isAuthenticated ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              تسجيل دخول مالك الصيدلية
            </h4>
            <p className="text-xs text-slate-500 mb-6 max-w-xs">
              أدخل الرمز السري للتحكم الكامل (الرمز الافتراضي: <strong>1234</strong>)
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-xs space-y-3">
              <input
                id="admin-pin-input"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="أدخل الرمز السري"
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-center text-lg tracking-widest font-mono outline-none border border-transparent focus:border-sky-500"
                autoFocus
              />
              <button
                id="submit-admin-pin"
                type="submit"
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold text-sm shadow transition-colors"
              >
                دخول للوحة التحكم
              </button>
            </form>
          </div>
        ) : (
          /* Dashboard Navigation & Content */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 overflow-x-auto scrollbar-none px-4 pt-2">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'products'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>إضافة وإدارة الأدوية</span>
              </button>

              <button
                onClick={() => setActiveTab('broadcast')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'broadcast'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>إرسال إشعارات للعملاء</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'orders'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>الطلبات الواردة ({orders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('prescriptions')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'prescriptions'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>الروشتات المرفوعة ({prescriptions.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('customers')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'customers'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>العملاء ونقاط الولاء ({customers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('branding')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'branding'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>لوجو وهوية الصيدلية</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {/* TAB 1: ADD / MANAGE PRODUCTS */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  {/* Add Product Form */}
                  <form onSubmit={handleCreateProduct} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-sky-500" />
                      <span>إضافة دواء أو منتج جديد إلى الصيدلية</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          الاسم التجاري بالعربي *
                        </label>
                        <input
                          type="text"
                          required
                          value={nameAr}
                          onChange={(e) => setNameAr(e.target.value)}
                          placeholder="مثال: بنادول أدفانس 24 قرص"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
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
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 font-mono text-left"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          قسم الصيدلية *
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as ProductCategory)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
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
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="50"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          نقاط الولاء الممنوحة للعميل
                        </label>
                        <input
                          type="number"
                          value={points}
                          onChange={(e) => setPoints(e.target.value)}
                          placeholder="15"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 font-mono"
                        />
                      </div>
                    </div>

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
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
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
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        رابط الصورة (اختياري، أو سيتم استخدام صورة طبية ذكية تلقائياً)
                      </label>
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-left font-mono"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={requiresPrescription}
                          onChange={(e) => setRequiresPrescription(e.target.checked)}
                          className="w-4 h-4 text-sky-600 rounded"
                        />
                        <span>يلزم روشتة طبية (أدوية جدول/مضادات حيوية)</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={broadcastNewProduct}
                          onChange={(e) => setBroadcastNewProduct(e.target.checked)}
                          className="w-4 h-4 text-sky-600 rounded"
                        />
                        <span>إرسال إشعار فوري للعملاء بإضافة هذا المنتج 🔔</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
                    >
                      حفظ ونشر المنتج في الصيدلية
                    </button>
                  </form>

                  {/* Current Products List */}
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2.5">
                      قائمة المنتجات الحالية ({products.length}):
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {products.map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={p.image}
                              alt={p.nameAr}
                              className="w-10 h-10 rounded-lg object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-100">{p.nameAr}</div>
                              <div className="text-slate-400 text-[10px]">
                                {p.dosageForm} • {p.price} ج.م • +{p.points} نقطة
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="حذف الصنف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BROADCAST NOTIFICATION */}
              {activeTab === 'broadcast' && (
                <div className="space-y-4">
                  <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-100 dark:border-sky-900 text-xs text-sky-800 dark:text-sky-300">
                    📢 <strong>بث الإشعارات:</strong> يتيح لك إرسال تنبيه مباشر يظهر لجميع زوار وعملاء التطبيق المحملين له على هواتفهم، كوصول أدوية ناقصة أو عروض خاصة.
                  </div>

                  {broadcastSuccess && (
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تم إرسال الإشعار لجميع العملاء بنجاح!</span>
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
                        placeholder="مثال: ✨ توفر حقن وحبوب أوزمبك للتخسيس والسكر الآن"
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
                        placeholder="وصلت شحنة جديدة بأسعار الصيدلية الرسمية، اطلبها فوراً عبر الواتساب لتصلك خلال نصف ساعة."
                        className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium outline-none border border-transparent focus:border-sky-500 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="py-3 px-6 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center gap-2"
                    >
                      <Send className="w-4 h-4 rotate-180" />
                      <span>إرسال وتنبيه جميع العملاء</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                    سجل الطلبات الواردة عبر الواتساب:
                  </h4>
                  {orders.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      لا توجد طلبات مسجلة حتى الآن.
                    </div>
                  ) : (
                    orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-900 dark:text-white">
                            العميل: {ord.customerName} ({ord.customerPhone})
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">{ord.date}</span>
                        </div>
                        {ord.customerAddress && (
                          <div className="text-slate-500">العنوان: {ord.customerAddress}</div>
                        )}
                        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-[11px]">
                              <span>
                                {item.productName} × {item.quantity}
                              </span>
                              <span className="font-mono">{item.price * item.quantity} ج.م</span>
                            </div>
                          ))}
                          <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between font-bold text-sky-600 dark:text-sky-400">
                            <span>المبلغ المطلوب: {ord.totalPrice} ج.م</span>
                            <span>نقاط مكتسبة: +{ord.pointsEarned}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: PRESCRIPTIONS */}
              {activeTab === 'prescriptions' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                    الروشتات الطبية المرفوعة:
                  </h4>
                  {prescriptions.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      لا توجد روشتات مرفوعة حتى الآن.
                    </div>
                  ) : (
                    prescriptions.map((rx) => (
                      <div
                        key={rx.id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-900 dark:text-white">
                            {rx.customerName} - {rx.customerPhone}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">{rx.timestamp}</span>
                        </div>
                        {rx.customerAddress && (
                          <div className="text-slate-500">العنوان: {rx.customerAddress}</div>
                        )}
                        {rx.notes && (
                          <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-slate-600 dark:text-slate-300">
                            <strong>ملاحظات:</strong> {rx.notes}
                          </div>
                        )}
                        {rx.imageUrl && (
                          <div className="mt-2">
                            <a
                              href={rx.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-sky-600 font-bold hover:underline"
                            >
                              <span>معاينة صورة الروشتة المكبرة</span>
                              <ExternalLink className="w-3.5 h-3.5" />
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

              {/* TAB 5: CUSTOMERS & LOYALTY */}
              {activeTab === 'customers' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                    العملاء المسجلين ونقاط الولاء:
                  </h4>
                  {customers.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      لم يقم أي عميل بالتسجيل بعد.
                    </div>
                  ) : (
                    customers.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                          <div className="text-slate-500 font-mono text-[11px]">{c.phone}</div>
                          {c.address && <div className="text-slate-400 text-[10px]">{c.address}</div>}
                        </div>

                        <div className="text-left">
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[11px]">
                            {c.points} نقطة ({c.tier})
                          </span>
                          <div className="text-slate-400 text-[10px] mt-0.5">
                            {c.totalOrders} أوردرات
                          </div>
                        </div>
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
                      شعار وهوية صيدليات الديب
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
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      رفع صورة شعار من جهازك:
                    </label>
                    <label
                      htmlFor="custom-logo-file-upload"
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-sky-400 dark:border-sky-600/60 rounded-3xl bg-sky-50/50 dark:bg-sky-950/20 hover:bg-sky-100/50 dark:hover:bg-sky-900/30 cursor-pointer transition-colors group"
                    >
                      <Upload className="w-8 h-8 text-sky-600 dark:text-sky-400 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-sky-700 dark:text-sky-300">
                        اضغط لاختيار صورة اللوجو من هاتفك أو جهازك
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP, SVG</span>
                      <input
                        id="custom-logo-file-upload"
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
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
