import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Phone,
  User,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  X,
  Mail,
  Check,
  CloudRain,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Customer } from '../types';
import { DeliveryCaptainAnimation } from './DeliveryCaptainAnimation';
import { calculateTier, saveCustomer, getStoredAllCustomers } from '../services/storage';
import { syncSaveCustomerToFirestore, fetchCustomerFromFirestore } from '../services/firestoreSync';

interface CustomerWelcomeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (customer: Customer) => void;
}

/**
 * Unified, streamlined customer login & registration modal.
 * Pure, serene rain animation streaming smoothly behind the entire card and form fields.
 * Any autumn leaves/references completely removed.
 * Pharmacy logo removed from login interface.
 * Glassmorphic data entry fields allow the quiet rain and gentle motion to be seen right behind them.
 */
export const CustomerWelcomeLoginModal: React.FC<CustomerWelcomeLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  // Form inputs
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedAccountMsg, setDetectedAccountMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-detect existing customer profile when phone is typed (10+ digits)
  const handlePhoneChange = async (val: string) => {
    setPhone(val);
    const cleanPhone = val.trim().replace(/[^\d+]/g, '');
    if (cleanPhone.length >= 10) {
      const allLocal = getStoredAllCustomers();
      const existing = allLocal.find(
        (c) => c.phone && c.phone.replace(/[^\d+]/g, '') === cleanPhone
      );
      if (existing) {
        if (!name) setName(existing.name);
        if (!email && existing.email) setEmail(existing.email);
        if (!address && existing.address) setAddress(existing.address);
        setDetectedAccountMsg(`مرحباً بعودتك يا ${existing.name}! تم استرجاع بياناتك ونقاطك تلقائياً ✅`);
        return;
      }

      // Check Cloud Firestore for returning customers across devices
      const cloudCust = await fetchCustomerFromFirestore(cleanPhone);
      if (cloudCust) {
        if (!name) setName(cloudCust.name);
        if (!email && cloudCust.email) setEmail(cloudCust.email);
        if (!address && cloudCust.address) setAddress(cloudCust.address);
        setDetectedAccountMsg(`مرحباً بعودتك! تم العثور على حسابك المسجل بالسيرفر السحابي ☁️`);
      } else {
        setDetectedAccountMsg(null);
      }
    } else {
      setDetectedAccountMsg(null);
    }
  };

  // Unified single-step registration / login handler
  const handleUnifiedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('يرجى كتابة الاسم الكريم للمتابعة');
      return;
    }
    if (!phone.trim()) {
      alert('يرجى كتابة رقم الموبايل أو الواتساب');
      return;
    }

    setIsSubmitting(true);
    const cleanPhone = phone.trim().replace(/[^\d+]/g, '');
    const allLocal = getStoredAllCustomers();
    const existingLocal = allLocal.find(
      (c) => c.phone && c.phone.replace(/[^\d+]/g, '') === cleanPhone
    );
    const existingCloud = await fetchCustomerFromFirestore(cleanPhone);
    const existing = existingLocal || existingCloud;

    const previousPoints = existing ? existing.points : 0;
    const finalPoints = previousPoints;

    const customerToSave: Customer = {
      id: existing?.id || 'cust-' + Date.now(),
      name: name.trim() || existing?.name || 'عميل صيدلية الديب',
      phone: phone.trim(),
      email: email.trim().toLowerCase() || existing?.email,
      isEmailVerified: Boolean(existing?.isEmailVerified),
      address: address.trim() || existing?.address || 'العنوان يحدد عند الطلب',
      points: finalPoints,
      tier: calculateTier(finalPoints),
      totalOrders: existing?.totalOrders || 0,
      joinedDate: existing?.joinedDate || new Date().toISOString(),
    };

    // Save locally and in IndexedDB/Storage
    saveCustomer(customerToSave);

    // Save to Firestore cloud database so customer never loses data
    await syncSaveCustomerToFirestore(customerToSave);

    try {
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0284c7', '#06b6d4', '#10b981', '#38bdf8'],
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess(customerToSave);
      onClose();
    }, 400);
  };

  const handleBrowseAsGuest = () => {
    sessionStorage.setItem('eldeeb_guest_dismissed', 'true');
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        id="customer-welcome-modal-backdrop"
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-cairo text-right"
      >
        <motion.div
          id="customer-welcome-modal-container"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-slate-950/95 text-white rounded-3xl w-full max-w-md shadow-2xl border border-sky-500/30 overflow-hidden my-auto"
        >
          {/* Serene Rain & Motion Canvas Layer behind the entire modal card and input fields */}
          <DeliveryCaptainAnimation isFocused={isFocused} mode="backdrop" />

          {/* Foreground Interactive Content Layer */}
          <div className="relative z-10 flex flex-col">
            {/* Header Bar - Clean & Logo-free */}
            <div className="p-4 bg-slate-900/70 backdrop-blur-md border-b border-sky-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 shadow-inner">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight text-white flex items-center gap-1.5">
                    <span>تسجيل الدخول وحفظ البيانات</span>
                  </h3>
                  <span className="text-[11px] text-sky-200/80 block">
                    طريقة موحدة وسريعة للتسجيل أول مرة أو المرات اللاحقة
                  </span>
                </div>
              </div>
              <button
                onClick={handleBrowseAsGuest}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center transition-colors"
                title="تصفح كزائر"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Calm Atmospheric Rain Tag */}
            <div className="px-4 pt-3 pb-1 flex items-center justify-between text-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950/60 backdrop-blur-md border border-sky-500/25 text-sky-300 text-[11px] font-semibold">
                <CloudRain className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                <span>أجواء ماطرة هادئة ومريحة</span>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <Sparkles className="w-3 h-3 text-sky-400" />
                <span>حفظ تلقائي ودائم</span>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Auto-detected message for returning customers */}
              {detectedAccountMsg ? (
                <div className="p-3 bg-emerald-950/60 backdrop-blur-md border border-emerald-500/40 rounded-2xl text-xs text-emerald-200 flex items-center gap-2 shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold">{detectedAccountMsg}</span>
                </div>
              ) : (
                <div className="p-3 bg-sky-950/50 backdrop-blur-md border border-sky-500/30 rounded-2xl text-xs text-sky-200 flex items-center gap-2.5 shadow-lg">
                  <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="leading-relaxed">
                    <strong>تسجيل ذكي ودائم:</strong> سجّل بياناتك مرة واحدة فقط، ويتم حفظ الاسم، العنوان، والنقاط تلقائياً لاسترجاعها بكل سهولة في كل زيارة.
                  </span>
                </div>
              )}

              {/* Unified Form - Input boxes with translucent glassmorphism so rain visibly drifts behind them */}
              <form onSubmit={handleUnifiedSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    الاسم بالكامل <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="الاسم الثلاثي أو الثنائي"
                      className="w-full pl-3 pr-10 py-3.5 bg-slate-900/60 hover:bg-slate-900/75 focus:bg-slate-900/85 backdrop-blur-md text-white placeholder-slate-400 rounded-2xl text-xs sm:text-sm border border-slate-700/60 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/25 outline-none transition-all shadow-md"
                    />
                    <User className="w-4 h-4 text-sky-300/80 absolute right-3.5 top-4 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    رقم الهاتف أو الواتساب <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="01xxxxxxxxx (رقم الهاتف للتواصل وحفظ الحساب)"
                      className="w-full pl-3 pr-10 py-3.5 bg-slate-900/60 hover:bg-slate-900/75 focus:bg-slate-900/85 backdrop-blur-md text-white placeholder-slate-400 rounded-2xl text-xs sm:text-sm border border-slate-700/60 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/25 outline-none transition-all font-mono shadow-md text-left"
                      dir="ltr"
                    />
                    <Phone className="w-4 h-4 text-sky-300/80 absolute right-3.5 top-4 pointer-events-none" />
                  </div>
                  <span className="text-[10px] text-sky-200/70 mt-1 block">
                    رقم الهاتف هو معرّف حسابك الدائم لتسجيل الدخول في المرات القادمة واسترجاع نقاطك تلقائياً
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    عنوان التوصيل المفضل (اختياري)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="المنطقة، الشارع، رقم العمارة أو الشقة"
                      className="w-full pl-3 pr-10 py-3.5 bg-slate-900/60 hover:bg-slate-900/75 focus:bg-slate-900/85 backdrop-blur-md text-white placeholder-slate-400 rounded-2xl text-xs sm:text-sm border border-slate-700/60 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/25 outline-none transition-all shadow-md"
                    />
                    <MapPin className="w-4 h-4 text-sky-300/80 absolute right-3.5 top-4 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    البريد الإلكتروني (اختياري للإشعارات)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="name@gmail.com"
                      className="w-full pl-3 pr-10 py-3.5 bg-slate-900/60 hover:bg-slate-900/75 focus:bg-slate-900/85 backdrop-blur-md text-white placeholder-slate-400 rounded-2xl text-xs sm:text-sm border border-slate-700/60 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/25 outline-none transition-all font-mono shadow-md text-left"
                      dir="ltr"
                    />
                    <Mail className="w-4 h-4 text-sky-300/80 absolute right-3.5 top-4 pointer-events-none" />
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-sky-600/30 transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-60 border border-sky-400/30 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? 'جاري الحفظ والتفعيل...' : 'حفظ البيانات وتسجيل الدخول فوراً'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBrowseAsGuest}
                    className="w-full py-2.5 bg-slate-900/60 hover:bg-slate-800/80 backdrop-blur-md text-slate-300 hover:text-white rounded-2xl font-medium text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-700/50 cursor-pointer"
                  >
                    <span>تصفح الأصناف كزائر</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
