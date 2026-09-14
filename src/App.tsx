import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  Camera,
  MessageCircle,
  Award,
  Sparkles,
  Truck,
  ShieldCheck,
  Clock,
  ChevronDown,
  Phone,
  HelpCircle,
  ExternalLink,
  PackageCheck,
} from 'lucide-react';
import { Product, ProductCategory, CartItem, Customer, AppNotification } from './types';
import { CATEGORIES } from './data/initialData';
import {
  getStoredProducts,
  saveProducts,
  getStoredCustomer,
  getStoredNotifications,
  saveNotifications,
  getStoredTheme,
  saveTheme,
  addBroadcastNotification,
  calculateTier,
  saveCustomer,
  clearAllProducts,
  getStoredOrders,
  getStoredAllCustomers,
  getStoredPrescriptions,
} from './services/storage';
import {
  subscribeToFirestoreProducts,
  subscribeToFirestoreNotifications,
  syncAddProductToFirestore,
  syncDeleteProductFromFirestore,
  syncBroadcastNotificationToFirestore,
  syncSaveCustomerToFirestore,
  syncClearAllFirestoreProducts,
  syncBatchUploadProductsToFirestore,
} from './services/firestoreSync';
import { PHARMACY_WHATSAPP_NUMBER, createConsultationWhatsAppUrl } from './services/whatsapp';
import { Navbar } from './components/Navbar';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { CartDrawer } from './components/CartDrawer';
import { CartDropAnimation, CartDropPayload } from './components/CartDropAnimation';
import { FlyToCartAnimation, FlyingProductItem } from './components/FlyToCartAnimation';
import { PrescriptionModal } from './components/PrescriptionModal';
import { LoyaltyModal } from './components/LoyaltyModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { AdminModal } from './components/AdminModal';
import { AdminPortal } from './components/AdminPortal';
import { CustomerWelcomeLoginModal } from './components/CustomerWelcomeLoginModal';
import { ProductImageZoomModal } from './components/ProductImageZoomModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { MascotPet } from './components/MascotPet';
import { Logo } from './components/Logo';

export default function App() {
  // State
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('eldeeb_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(getStoredCustomer);
  const [notifications, setNotifications] = useState<AppNotification[]>(getStoredNotifications);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => getStoredTheme() === 'dark');

  // Multi-view routing: Customer Store vs Standalone Admin Portal & App Hub
  const [viewMode, setViewMode] = useState<'store' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const h = window.location.hash.toLowerCase();
      if (
        urlParams.get('hub') === 'true' ||
        urlParams.get('admin') === 'true' ||
        urlParams.get('manage') === 'true' ||
        h === '#hub' ||
        h === '#admin' ||
        h === '#portal' ||
        h === '#manage'
      ) {
        return 'admin';
      }
    }
    return 'store';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const h = window.location.hash.toLowerCase();
      if (h === '#hub' || h === '#admin' || h === '#portal' || h === '#manage') {
        setViewMode('admin');
      } else if (h === '#store' || h === '') {
        setViewMode('store');
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    // Secret shortcut for owner: Alt + H or Ctrl + Alt + A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'h') || (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        window.location.hash = 'hub';
        setViewMode('admin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Modals state
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isGoogleDriveOpen, setIsGoogleDriveOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Customer Welcome Login Modal (opens when link is clicked if not logged in)
  const [isWelcomeLoginOpen, setIsWelcomeLoginOpen] = useState<boolean>(() => {
    try {
      const dismissed = sessionStorage.getItem('eldeeb_guest_dismissed') === 'true';
      const existingCustomer = getStoredCustomer();
      return !existingCustomer && !dismissed;
    } catch {
      return false;
    }
  });

  // Mobile Pinch/Tap Zoom Modal for product images
  const [zoomedProduct, setZoomedProduct] = useState<Product | null>(null);

  // Micro-interaction: Animated Cart Drop payload & Flying Item trajectory
  const [cartDropPayload, setCartDropPayload] = useState<CartDropPayload | null>(null);
  const [flyingItems, setFlyingItems] = useState<FlyingProductItem[]>([]);

  // Sync theme
  useEffect(() => {
    saveTheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Real-time Firestore synchronization
  useEffect(() => {
    const unsubProducts = subscribeToFirestoreProducts((updatedProducts) => {
      if (updatedProducts) {
        setProducts(updatedProducts);
        saveProducts(updatedProducts);
      }
    });

    const unsubNotifs = subscribeToFirestoreNotifications((updatedNotifs) => {
      if (updatedNotifs) {
        setNotifications(updatedNotifs);
      }
    });

    return () => {
      unsubProducts();
      unsubNotifs();
    };
  }, []);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem('eldeeb_cart_items', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Add to cart with smooth parabolic motion towards top header cart
  const handleAddToCart = (product: Product, event?: React.MouseEvent) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    // Calculate source and target coordinates for the fly-to-cart animation
    const cartBtn = document.getElementById('cart-nav-btn');
    const cartRect = cartBtn?.getBoundingClientRect();
    const targetX = cartRect ? cartRect.left + cartRect.width / 2 : window.innerWidth - 60;
    const targetY = cartRect ? cartRect.top + cartRect.height / 2 : 40;

    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;

    if (event) {
      const el = (event.currentTarget as HTMLElement) || (event.target as HTMLElement);
      const rect = el?.getBoundingClientRect?.();
      if (rect) {
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      }
    }

    const flyId = `${product.id}-${Date.now()}-${Math.random()}`;
    setFlyingItems((prev) => [
      ...prev,
      {
        id: flyId,
        image: product.image,
        nameAr: product.nameAr,
        startX,
        startY,
        targetX,
        targetY,
      },
    ]);

    // Also trigger gentle cart confirmation banner
    setCartDropPayload({ product, quantity: 1 });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((i): i is CartItem => i !== null)
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Mascot bonus rewards
  const handleMascotRewardPoints = (bonusPoints: number) => {
    if (activeCustomer) {
      const updated: Customer = {
        ...activeCustomer,
        points: activeCustomer.points + bonusPoints,
        tier: calculateTier(activeCustomer.points + bonusPoints),
      };
      setActiveCustomer(updated);
      saveCustomer(updated);
      syncSaveCustomerToFirestore(updated);
    }
  };

  // Admin handlers
  const handleAddProduct = (newProd: Product) => {
    const updated = [newProd, ...products];
    setProducts(updated);
    saveProducts(updated);
    syncAddProductToFirestore(newProd);
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    saveProducts(updated);
    syncDeleteProductFromFirestore(id);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    const updated = products.map((p) => (p.id === updatedProd.id ? updatedProd : p));
    setProducts(updated);
    saveProducts(updated);
    syncAddProductToFirestore(updatedProd);
  };

  const handleClearAllProducts = async () => {
    setProducts([]);
    clearAllProducts();
    await syncClearAllFirestoreProducts();
  };

  const handleBatchImportProducts = async (imported: Product[]) => {
    const map = new Map<string, Product>();
    products.forEach((p) => map.set(p.id, p));
    imported.forEach((p) => map.set(p.id, p));
    const merged = Array.from(map.values());
    setProducts(merged);
    saveProducts(merged);
    await syncBatchUploadProductsToFirestore(imported);
  };

  const handleBroadcastNotification = (title: string, message: string, productId?: string) => {
    addBroadcastNotification(title, message, productId);
    setNotifications(getStoredNotifications());
    syncBroadcastNotificationToFirestore(title, message, productId);
  };

  const handleMarkAllNotificationsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        product.nameAr.toLowerCase().includes(q) ||
        product.nameEn.toLowerCase().includes(q) ||
        product.activeIngredient.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.tags?.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const activeCategoryName =
    selectedCategory === 'all'
      ? 'جميع الأقسام'
      : CATEGORIES.find((c) => c.id === selectedCategory)?.nameAr;

  // Render Standalone Admin Portal & Connected Multi-App Hub if in admin mode
  if (viewMode === 'admin') {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <AdminPortal
          products={products}
          onAddProduct={handleAddProduct}
          onDeleteProduct={handleDeleteProduct}
          onUpdateProduct={handleUpdateProduct}
          onClearAllProducts={handleClearAllProducts}
          onBatchImportProducts={handleBatchImportProducts}
          onBroadcastNotification={handleBroadcastNotification}
          onBackToStore={() => {
            window.location.hash = '';
            setViewMode('store');
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-cairo transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        unreadNotifsCount={unreadNotifsCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        activeCustomer={activeCustomer}
        onOpenLoyalty={() => setIsLoyaltyOpen(true)}
        onOpenPrescription={() => setIsPrescriptionOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
        onOpenAdmin={() => {
          window.location.hash = 'hub';
          setViewMode('admin');
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Hero Banner with Official Identity & Direct WhatsApp Links */}
        <section
          id="hero-banner"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-blue-900 via-sky-800 to-cyan-800 text-white p-5 sm:p-8 shadow-xl"
        >
          {/* Background decorative circles & glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-right">
            <div className="flex-1 space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-sky-200 border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>صيدلية الديب أونلاين • توصيل سريع لجميع المناطق</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-snug">
                كل ما تحتاجه لصحتك وعائلتك.. <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-cyan-200 via-sky-200 to-white">
                  بلمسة واحدة وبأعلى رعاية صيدلانية
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-sky-100/90 max-w-xl leading-relaxed">
                تصفح جميع الأدوية والمستلزمات، ارفع روشتتك الطبية مباشرة لتصل لهاتف الصيدلية (+201009097378)، واجمع نقاط ولاء تُخصم فورياً من مشترياتك القادمة.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  id="hero-upload-rx-btn"
                  onClick={() => setIsPrescriptionOpen(true)}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-lg flex items-center gap-2 transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>إرسال روشتة مصورة 📸</span>
                </button>

                <a
                  href={`https://wa.me/${PHARMACY_WHATSAPP_NUMBER}?text=${encodeURIComponent('مرحباً صيدلية الديب، أود الاستفسار عن توفر دواء وطلب توصيل.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white rounded-2xl font-bold text-xs sm:text-sm border border-white/20 flex items-center gap-2 transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>تحدث مع الصيدلي واتساب 💬</span>
                </a>

                <button
                  id="hero-loyalty-btn"
                  onClick={() => setIsLoyaltyOpen(true)}
                  className="px-4 py-3 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/30 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all"
                >
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>برنامج نقاط الولاء</span>
                </button>
              </div>
            </div>

            {/* Emblem / Badge representation on the left */}
            <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-3xl border border-white/15 shadow-inner">
              <Logo size="lg" showSubtitle={true} className="text-white" />
              <div className="mt-3 flex items-center gap-2 text-[11px] text-sky-100 font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-300" />
                <span>خدمة متواصلة على مدار الساعة</span>
              </div>
            </div>
          </div>

          {/* Quick Pillars Footer */}
          <div className="mt-6 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-semibold text-sky-100">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-300 shrink-0" />
              <span>توصيل سريع وآمن</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-300 shrink-0" />
              <span>أدوية أصلية 100%</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-300 shrink-0" />
              <span>نقاط ولاء وهدايا مستمرة</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-sky-300 shrink-0" />
              <span>استشارات صيدلانية فورية</span>
            </div>
          </div>
        </section>

        {/* Categories Bar */}
        <section id="categories-section" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>أقسام الصيدلية</span>
              <span className="text-xs text-slate-500 font-normal">
                (اختر القسم لعرض محتوياته)
              </span>
            </h2>

            {searchQuery && (
              <span className="text-xs text-sky-600 dark:text-sky-400 font-medium">
                نتائج البحث عن: "{searchQuery}"
              </span>
            )}
          </div>

          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            counts={categoryCounts}
          />
        </section>

        {/* Product Grid */}
        <section id="products-grid-section" className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              عرض {filteredProducts.length} من أصل {products.length} صنف متاح
            </span>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-sky-600 dark:text-sky-400 font-bold hover:underline"
              >
                عرض كل الأقسام
              </button>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
              <div className="w-16 h-16 bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-200 mb-1">
                لم نجد نتائج مطابقة لبحثك "{searchQuery}"
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                هل تبحث عن دواء غير معروض؟ يمكنك إرسال صورة الروشتة أو اسم الصنف عبر الواتساب وسيقوم الصيدلي بتوفيره لك فوراً!
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setIsPrescriptionOpen(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow"
                >
                  إرسال روشتة مصورة
                </button>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  مسح البحث
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onViewDetails={setSelectedProduct}
                  onZoomImage={(p) => setZoomedProduct(p)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Floating Interactive Mascot Pet (Deebo) */}
      <MascotPet
        onRewardPoints={handleMascotRewardPoints}
        activeCategoryName={activeCategoryName}
      />

      {/* Fly-to-Cart Parabolic Motion (Product moves and flies directly into header cart) */}
      <FlyToCartAnimation
        flyingItems={flyingItems}
        onComplete={(id) => setFlyingItems((prev) => prev.filter((i) => i.id !== id))}
      />

      {/* Cart Drop Micro-Interaction (Item drops into cart with animation) */}
      <CartDropAnimation
        payload={cartDropPayload}
        onAnimationComplete={() => setCartDropPayload(null)}
      />

      {/* Footer */}
      <footer className="mt-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-8 pb-12 text-slate-600 dark:text-slate-400 font-cairo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-8 border-b border-slate-200 dark:border-slate-800 text-right">
            {/* Brand Col */}
            <div className="space-y-3">
              <Logo size="md" />
              <p className="text-xs leading-relaxed text-slate-500">
                صيدلية الديب - نسعى دائماً لتقديم أفضل خدمة دوائية واستشارات طبية معتمدة على مدار 24 ساعة بأحدث التقنيات الرقمية.
              </p>
              <div className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                خدمة التوصيل: +201009097378
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                روابط سريعة
              </h4>
              <ul className="text-xs space-y-1.5">
                <li>
                  <button onClick={() => setIsPrescriptionOpen(true)} className="hover:text-sky-600 transition-colors">
                    إرسال روشتة عبر الواتساب
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsLoyaltyOpen(true)} className="hover:text-sky-600 transition-colors">
                    نادي نقاط ولاء العملاء
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsCartOpen(true)} className="hover:text-sky-600 transition-colors">
                    سلة المشتريات
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsNotificationsOpen(true)} className="hover:text-sky-600 transition-colors">
                    إشعارات المنتجات الجديدة
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsGoogleDriveOpen(true)} className="hover:text-sky-600 transition-colors flex items-center gap-1">
                    <span>النسخ السحابي Google Drive</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Departments */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                أقسام الصيدلية
              </h4>
              <ul className="text-xs space-y-1.5">
                {CATEGORIES.slice(0, 4).map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => {
                        setSelectedCategory(c.id);
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      className="hover:text-sky-600 transition-colors"
                    >
                      {c.nameAr}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pharmacist direct consultation */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                استشارة صيدلانية مجانية
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                هل لديك سؤال عن جرعات الأدوية، التفاعلات الدوائية، أو البدائل المتوفرة؟ الصيدلي جاهز لمساعدتك.
              </p>
              <a
                href={createConsultationWhatsAppUrl()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>محادثة الصيدلي فوراً</span>
              </a>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>
              جميع الحقوق محفوظة © {new Date().getFullYear()} صيدلية الديب - El Deeb Pharmacy
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-slate-400 font-mono font-medium">WhatsApp: 01009097378</span>
              <span
                onClick={() => {
                  const now = Date.now();
                  const lastTap = Number(sessionStorage.getItem('eldeeb_footer_dot_tap') || '0');
                  const count = Number(sessionStorage.getItem('eldeeb_footer_dot_taps') || '0');
                  if (now - lastTap < 600) {
                    const next = count + 1;
                    sessionStorage.setItem('eldeeb_footer_dot_taps', String(next));
                    sessionStorage.setItem('eldeeb_footer_dot_tap', String(now));
                    if (next >= 3) {
                      sessionStorage.removeItem('eldeeb_footer_dot_taps');
                      window.location.hash = 'hub';
                      setViewMode('admin');
                    }
                  } else {
                    sessionStorage.setItem('eldeeb_footer_dot_taps', '1');
                    sessionStorage.setItem('eldeeb_footer_dot_tap', String(now));
                  }
                }}
                className="cursor-default select-none text-slate-400 hover:text-slate-200 transition-colors"
              >
                •
              </span>
              <span className="text-slate-400 font-medium">خدمة التوصيل السريع 24/7</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Customer Welcome Login Screen with Calm Motorcycle Delivery Animation */}
      <AnimatePresence>
        {isWelcomeLoginOpen && (
          <CustomerWelcomeLoginModal
            isOpen={isWelcomeLoginOpen}
            onClose={() => setIsWelcomeLoginOpen(false)}
            onLoginSuccess={(customer) => {
              setActiveCustomer(customer);
              setIsWelcomeLoginOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Mobile-Friendly Fullscreen Image Zoom (Tap / Pinch / Pan) */}
      <AnimatePresence>
        {zoomedProduct && (
          <ProductImageZoomModal
            product={zoomedProduct}
            onClose={() => setZoomedProduct(null)}
          />
        )}
      </AnimatePresence>

      {/* Modals & Drawers */}
      <AnimatePresence>
        {isPrescriptionOpen && (
          <PrescriptionModal
            isOpen={isPrescriptionOpen}
            onClose={() => setIsPrescriptionOpen(false)}
            activeCustomer={activeCustomer}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLoyaltyOpen && (
          <LoyaltyModal
            isOpen={isLoyaltyOpen}
            onClose={() => setIsLoyaltyOpen(false)}
            activeCustomer={activeCustomer}
            onCustomerUpdated={(c) => setActiveCustomer(c)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCartOpen && (
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            activeCustomer={activeCustomer}
            onOpenLoyalty={() => {
              setIsCartOpen(false);
              setIsLoyaltyOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNotificationsOpen && (
          <NotificationsDrawer
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            notifications={notifications}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onSelectProduct={(pId) => {
              const prod = products.find((p) => p.id === pId);
              if (prod) setSelectedProduct(prod);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdminOpen && (
          <AdminModal
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
            products={products}
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateProduct={handleUpdateProduct}
            onClearAllProducts={handleClearAllProducts}
            onBatchImportProducts={handleBatchImportProducts}
            onBroadcastNotification={handleBroadcastNotification}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGoogleDriveOpen && (
          <GoogleDriveModal
            isOpen={isGoogleDriveOpen}
            onClose={() => setIsGoogleDriveOpen(false)}
            products={products}
            orders={getStoredOrders()}
            customers={getStoredAllCustomers()}
            prescriptions={getStoredPrescriptions()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailsModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
            onZoomImage={(p) => setZoomedProduct(p)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
