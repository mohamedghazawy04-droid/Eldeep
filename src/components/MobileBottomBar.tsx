import React from 'react';
import { Home, Camera, ShoppingBag, Award, MessageCircle, ArrowLeft } from 'lucide-react';
import { Customer } from '../types';
import { PHARMACY_WHATSAPP_NUMBER } from '../services/whatsapp';

interface MobileBottomBarProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenPrescription: () => void;
  onOpenLoyalty: () => void;
  activeCustomer: Customer | null;
  onGoHome?: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenPrescription,
  onOpenLoyalty,
  activeCustomer,
  onGoHome,
}) => {
  return (
    <>
      {/* Floating Active Cart Pill (Appears above the bottom bar whenever cart has items) */}
      {cartCount > 0 && (
        <div className="fixed bottom-16 left-3 right-3 z-40 sm:hidden animate-in slide-in-from-bottom-3 duration-200">
          <button
            id="mobile-floating-cart-pill"
            onClick={onOpenCart}
            className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 via-blue-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-2xl shadow-xl shadow-sky-900/30 flex items-center justify-between font-cairo font-bold text-xs border border-white/20 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-7 h-7 rounded-xl bg-white text-sky-700 flex items-center justify-center font-mono font-black text-xs shadow-inner">
                  {cartCount}
                </div>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              </div>
              <div className="text-right">
                <span className="block text-xs font-bold">سلة المشتريات</span>
                <span className="text-[11px] text-sky-100 font-mono font-bold">
                  {cartTotal} ج.م • اضغط لإتمام الطلب
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors">
              <span>طلب الآن</span>
              <ArrowLeft className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Main Persistent Mobile Navigation Bar */}
      <nav
        id="mobile-bottom-navbar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 py-1.5 px-2 flex items-center justify-around sm:hidden font-cairo shadow-[0_-4px_25px_rgba(0,0,0,0.06)]"
      >
        {/* 1. Home / Products */}
        <button
          id="mobile-nav-home"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            onGoHome?.();
          }}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 active:scale-95 transition-all min-w-[58px]"
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">الرئيسية</span>
        </button>

        {/* 2. Send Rx / Camera */}
        <button
          id="mobile-nav-rx"
          onClick={onOpenPrescription}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-emerald-600 dark:text-emerald-400 active:scale-95 transition-all min-w-[58px]"
        >
          <Camera className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">روشتة</span>
        </button>

        {/* 3. Primary Center Cart Action Button */}
        <button
          id="mobile-nav-cart-center"
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center -mt-4 active:scale-95 transition-all group"
        >
          <div
            className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg transition-transform relative ${
              cartCount > 0
                ? 'bg-gradient-to-tr from-rose-600 to-sky-600 text-white ring-4 ring-sky-500/20 shadow-sky-500/30'
                : 'bg-gradient-to-tr from-sky-600 to-blue-600 text-white ring-4 ring-slate-100 dark:ring-slate-800'
            }`}
          >
            <ShoppingBag className="w-6 h-6" />

            {/* Glowing red badge with item count */}
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 bg-rose-600 text-white font-mono font-black text-[11px] rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 animate-bounce">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-black text-sky-600 dark:text-sky-400 mt-0.5">
            السلة {cartCount > 0 ? `(${cartCount})` : ''}
          </span>
        </button>

        {/* 4. Loyalty Points */}
        <button
          id="mobile-nav-loyalty"
          onClick={onOpenLoyalty}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-amber-600 dark:text-amber-400 active:scale-95 transition-all min-w-[58px]"
        >
          <div className="relative">
            <Award className="w-5 h-5 mb-0.5" />
            <span className="absolute -top-1 -right-2 text-[9px] bg-amber-500 text-slate-950 font-black px-1 rounded-full font-mono">
              {activeCustomer ? activeCustomer.points : '50'}
            </span>
          </div>
          <span className="text-[10px] font-bold">نقاطي</span>
        </button>

        {/* 5. WhatsApp Instant Contact */}
        <a
          id="mobile-nav-whatsapp"
          href={`https://wa.me/${PHARMACY_WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-teal-600 dark:text-teal-400 active:scale-95 transition-all min-w-[58px]"
        >
          <MessageCircle className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">واتساب</span>
        </a>
      </nav>
    </>
  );
};
