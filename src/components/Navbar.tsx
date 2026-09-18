import React, { useState, useEffect } from 'react';
import { verifyAdminPin } from '../services/adminSecurity';
import { Search, Moon, Sun, ShoppingCart, Bell, Award, Camera, Lock, PhoneCall, HardDrive, ShieldCheck, X } from 'lucide-react';
import { Logo } from './Logo';
import { Customer } from '../types';
import { PHARMACY_WHATSAPP_NUMBER } from '../services/whatsapp';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  cartCount: number;
  onOpenCart: () => void;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  activeCustomer: Customer | null;
  onOpenLoyalty: () => void;
  onOpenPrescription: () => void;
  onOpenAdmin: () => void;
  onOpenGoogleDrive?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  isDarkMode,
  onToggleTheme,
  cartCount,
  onOpenCart,
  unreadNotifsCount,
  onOpenNotifications,
  activeCustomer,
  onOpenLoyalty,
  onOpenPrescription,
  onOpenAdmin,
  onOpenGoogleDrive,
}) => {
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');

  // Listen for items landing into the cart to trigger bounce animation
  useEffect(() => {
    const handleCartLanded = () => {
      setIsCartBouncing(true);
      setTimeout(() => setIsCartBouncing(false), 600);
    };

    window.addEventListener('cart_item_landed', handleCartLanded);
    return () => {
      window.removeEventListener('cart_item_landed', handleCartLanded);
    };
  }, []);

  // Handle backup click with strict manager privilege verification
  const handleBackupClick = () => {
    // Check if manager is already authenticated in this session
    const isAuth = sessionStorage.getItem('eldeeb_hub_auth') === 'true';
    if (isAuth) {
      onOpenGoogleDrive?.();
    } else {
      // Require manager credentials
      setAdminPinInput('');
      setAdminAuthError('');
      setShowAdminAuthModal(true);
    }
  };

  const handleVerifyAdminBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = adminPinInput.trim();
    if (await verifyAdminPin(cleanPin)) {
      sessionStorage.setItem('eldeeb_hub_auth', 'true');
      setShowAdminAuthModal(false);
      onOpenGoogleDrive?.();
    } else {
      setAdminAuthError('عفواً، كلمة مرور المدير غير صحيحة. هذا الإعداد من صلاحيات الإدارة فقط.');
    }
  };
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors font-cairo">
      {/* Top micro-bar: Emergency & Pharmacy Contact */}
      <div className="bg-gradient-to-r from-sky-700 via-blue-700 to-cyan-700 text-white text-[11px] py-1 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">صيدلية الديب في خدمتك 24 ساعة يومياً</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-white/15 px-2 py-0.5 rounded-full text-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
              قاعدة بيانات سحابية نشطة
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`https://api.whatsapp.com/send?phone=${PHARMACY_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-emerald-300 font-bold tracking-wider font-mono text-[11px] transition-colors"
            >
              <PhoneCall className="w-3 h-3" />
              <span>+201009097378</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo with secret 5-tap owner shortcut (zero hint to public) */}
          <div
            className="cursor-pointer select-none"
            onClick={(e) => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              // Secret owner gesture: Alt+click or 5 fast taps
              if (e.altKey && onOpenAdmin) {
                onOpenAdmin();
                return;
              }
              const now = Date.now();
              const lastTap = Number(sessionStorage.getItem('eldeeb_logo_tap') || '0');
              const tapCount = Number(sessionStorage.getItem('eldeeb_logo_taps') || '0');
              if (now - lastTap < 600) {
                const newCount = tapCount + 1;
                sessionStorage.setItem('eldeeb_logo_taps', String(newCount));
                sessionStorage.setItem('eldeeb_logo_tap', String(now));
                if (newCount >= 5 && onOpenAdmin) {
                  sessionStorage.removeItem('eldeeb_logo_taps');
                  onOpenAdmin();
                }
              } else {
                sessionStorage.setItem('eldeeb_logo_taps', '1');
                sessionStorage.setItem('eldeeb_logo_tap', String(now));
              }
            }}
          >
            <Logo size="md" />
          </div>

          {/* Search bar on desktop/tablet */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              id="desktop-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث عن اسم الدواء، المادة الفعالة، فيتامينات، أو مستلزمات..."
              className="w-full pr-10 pl-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs sm:text-sm font-medium border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                مسح
              </button>
            )}
          </div>

          {/* Actions Button Row */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Prescription CTA button */}
            <button
              id="send-rx-nav-btn"
              onClick={onOpenPrescription}
              className="px-3 py-2 sm:px-3.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-xs shadow-sm hover:shadow flex items-center gap-1.5 transition-all active:scale-95"
              title="إرسال روشتة للواتساب"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">إرسال روشتة</span>
            </button>

            {/* Loyalty Points Button */}
            <button
              id="loyalty-nav-btn"
              onClick={onOpenLoyalty}
              className="px-2.5 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-xs font-bold flex items-center gap-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
              title="نقاط الولاء"
            >
              <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden lg:inline">نقاطي:</span>
              <span className="font-black font-mono">{activeCustomer ? activeCustomer.points : '50 🎁'}</span>
            </button>

            {/* Notifications Bell */}
            <button
              id="notifications-nav-btn"
              onClick={onOpenNotifications}
              className="p-2 sm:p-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              title="الإشعارات"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Google Drive Cloud Sync (Admin Privilege Only - Desktop/Tablet) */}
            {onOpenGoogleDrive && (
              <button
                id="google-drive-nav-btn"
                onClick={handleBackupClick}
                className="hidden sm:flex p-2 sm:p-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors relative"
                title="النسخ الاحتياطي السحابي والمزامنة (صلاحيات المدير)"
              >
                <HardDrive className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center shadow" title="يتطلب إذن الإدارة">
                  <Lock className="w-2 h-2" />
                </span>
              </button>
            )}

            {/* Theme Toggle (Day/Night Mode) */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleTheme}
              className="p-2 sm:p-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
              )}
            </button>

            {/* Shopping Cart Button with Animated Red Badge & Glowing Dot */}
            <button
              id="cart-nav-btn"
              onClick={onOpenCart}
              className={`px-2.5 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-sky-500/25 flex items-center gap-1.5 sm:gap-2 transition-all active:scale-95 relative shrink-0 ${
                isCartBouncing ? 'scale-110 ring-4 ring-rose-400/50 shadow-xl shadow-rose-500/30' : ''
              }`}
              title="سلة التسوق"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {cartCount > 0 && (
                  /* Glowing pulsing red dot */
                  <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600 border border-white dark:border-slate-900"></span>
                  </span>
                )}
              </div>

              <span className="font-bold text-xs inline-block">السلة</span>

              {/* Exact Count Quantity Badge */}
              {cartCount > 0 ? (
                <span className="min-w-[20px] h-5 px-1.5 bg-rose-600 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-md border border-white/60 dark:border-slate-900 animate-in zoom-in-50 duration-200">
                  {cartCount}
                </span>
              ) : (
                <span className="hidden md:inline-block w-2 h-2 rounded-full bg-sky-300/60" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (Sticky under header, keyboard friendly) */}
        <div className="mt-2.5 md:hidden relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            id="mobile-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث عن اسم الدواء أو المنتج..."
            className="w-full pr-10 pl-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-medium border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Admin Privilege Security Gate Modal for Backup Settings */}
      {showAdminAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 font-cairo animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>صلاحيات الإدارة فقط</span>
              </div>
              <button
                onClick={() => setShowAdminAuthModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-right space-y-1.5">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                إعدادات <strong>النسخ الاحتياطي السحابي والمزامنة (Google Drive)</strong> من صلاحيات مدير صيدلية الديب فقط.
              </p>
              <p className="text-[11px] text-slate-400">
                يرجى إدخال كلمة مرور الإدارة للمتابعة:
              </p>
            </div>

            <form onSubmit={handleVerifyAdminBackup} className="space-y-3">
              <input
                type="password"
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                placeholder="كلمة مرور الإدارة..."
                autoFocus
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-center tracking-widest outline-none focus:border-sky-500"
              />

              {adminAuthError && (
                <p className="text-[11px] text-rose-500 font-medium text-center">
                  {adminAuthError}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow active:scale-95 transition-all"
                >
                  تأكيد والدخول للباك أب
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdminAuthModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
