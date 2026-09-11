import React from 'react';
import { Search, Moon, Sun, ShoppingCart, Bell, Award, Camera, Lock, PhoneCall } from 'lucide-react';
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
}) => {
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
              href={`https://wa.me/${PHARMACY_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-emerald-300 font-bold tracking-wider font-mono text-[11px] transition-colors"
            >
              <PhoneCall className="w-3 h-3" />
              <span>+201009097378</span>
            </a>

            <button
              id="admin-login-top-btn"
              onClick={onOpenAdmin}
              className="flex items-center gap-1 text-[10px] bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded-md transition-colors"
              title="دخول مالك الصيدلية"
            >
              <Lock className="w-2.5 h-2.5" />
              <span>لوحة الإدارة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
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

            {/* Theme Toggle (Day/Night Mode) */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleTheme}
              className="p-2 sm:p-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              id="cart-nav-btn"
              onClick={onOpenCart}
              className="p-2 sm:px-3.5 sm:py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all active:scale-95 relative"
              title="سلة التسوق"
            >
              <ShoppingCart className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span className="hidden sm:inline">السلة</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 bg-rose-500 text-white text-xs font-black rounded-full flex items-center justify-center -mr-1 shadow">
                  {cartCount}
                </span>
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
    </header>
  );
};
