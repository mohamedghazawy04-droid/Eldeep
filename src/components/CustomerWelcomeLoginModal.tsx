import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Phone, User, MapPin, ArrowLeft, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { Customer } from '../types';
import { DeliveryCaptainAnimation } from './DeliveryCaptainAnimation';
import { calculateTier, saveCustomer, getStoredAllCustomers } from '../services/storage';
import { syncSaveCustomerToFirestore, fetchCustomerFromFirestore } from '../services/firestoreSync';
import { fetchSupabaseCustomer, sendCustomerEmailOtp, upsertSupabaseCustomer, verifyCustomerEmailOtp } from '../services/supabaseCustomers';

interface CustomerWelcomeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (customer: Customer) => void;
}

export const CustomerWelcomeLoginModal: React.FC<CustomerWelcomeLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedAccountMsg, setDetectedAccountMsg] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  if (!isOpen) return null;

  // Auto-detect existing account when typing phone number to reassure customer
  const handlePhoneChange = async (val: string) => {
    setPhone(val);
    const clean = val.replace(/[^\d+]/g, '');
    if (clean.length >= 10) {
      const allLocal = getStoredAllCustomers();
      const existing = allLocal.find((c) => c.phone.replace(/[^\d+]/g, '') === clean);
      if (existing) {
        if (!name) setName(existing.name);
        if (!address && existing.address) setAddress(existing.address);
        setDetectedAccountMsg(`مرحباً بعودتك! تم العثور على رصيدك المحفوظ (${existing.points} نقطة ولاء)`);
        return;
      }
      // Check the shared Supabase account first, then keep Firebase as fallback.
      const cloudCust = (await fetchSupabaseCustomer(clean)) || (await fetchCustomerFromFirestore(clean));
      if (cloudCust) {
        if (!name) setName(cloudCust.name);
        if (!address && cloudCust.address) setAddress(cloudCust.address);
        setDetectedAccountMsg(`مرحباً بعودتك! تم العثور على حسابك بالسيرفر السحابي (${cloudCust.points} نقطة ولاء)`);
      } else {
        setDetectedAccountMsg(null);
      }
    } else {
      setDetectedAccountMsg(null);
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setOtp('');
    setOtpSent(false);
    setOtpVerified(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('يرجى كتابة الاسم والبريد الإلكتروني للبدء');
      return;
    }

    setIsSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();
    if (!otpVerified) {
      if (!otpSent) {
        const sent = await sendCustomerEmailOtp(cleanEmail);
        setIsSubmitting(false);
        if (!sent.success) {
          alert(`تعذر إرسال رمز التحقق: ${sent.error || 'تحقق من إعداد Email Auth في Supabase'}`);
          return;
        }
        setOtpSent(true);
        alert('تم إرسال رمز تحقق إلى بريدك الإلكتروني. اكتب الرمز ثم اضغط متابعة.');
        return;
      }
      const verified = await verifyCustomerEmailOtp(cleanEmail, otp.trim());
      if (!verified.success) {
        setIsSubmitting(false);
        alert('رمز التحقق غير صحيح أو انتهت صلاحيته.');
        return;
      }
      setOtpVerified(true);
    }
    const allLocal = getStoredAllCustomers();
    const existingLocal = allLocal.find((c) => c.email?.toLowerCase() === cleanEmail);
    const existingCloud = (await fetchSupabaseCustomer(phone)) || (await fetchCustomerFromFirestore(phone));
    const matched = existingCloud || existingLocal;

    // Preserve points if account existed! Never wipe out hard-earned points!
    const finalPoints = matched ? matched.points : 10;
    const finalCustomer: Customer = {
      id: matched?.id || 'cust-' + Date.now(),
      name: name.trim() || matched?.name || 'عميل صيدلية الديب',
      phone: phone.trim(),
      email: cleanEmail,
      address: address.trim() || matched?.address || 'العنوان يحدد عند الطلب',
      points: finalPoints,
      tier: calculateTier(finalPoints),
      totalOrders: matched?.totalOrders || 0,
      joinedDate: matched?.joinedDate || new Date().toISOString(),
    };

    saveCustomer(finalCustomer);
    const cloudSave = await upsertSupabaseCustomer(finalCustomer);
    if (!cloudSave.success) syncSaveCustomerToFirestore(finalCustomer);

    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess(finalCustomer);
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
        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-cairo text-right"
      >
        <motion.div
          id="customer-welcome-modal-container"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-sky-200/80 dark:border-slate-800 overflow-hidden my-auto"
        >
          {/* Header Bar */}
          <div className="p-3.5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="font-extrabold text-sm sm:text-base">
                صيدلية الديب - خدمة التوصيل 24/7
              </h3>
            </div>
            <button
              onClick={handleBrowseAsGuest}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
              title="تصفح كزائر"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Gentle Animated Delivery Captain Scene */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950">
            <DeliveryCaptainAnimation isFocused={isFocused} />
          </div>

          {/* Form Content */}
          <div className="p-4 sm:p-5 space-y-4">
            {/* Welcome Reward Banner */}
            <div className="p-3 bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-orange-500/10 border border-amber-400/40 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5 fill-amber-200" />
              </div>
              <div className="text-right">
                <h4 className="text-xs font-black text-amber-900 dark:text-amber-300">
                  هدية ترحيبية فورية: 10 نقاط ولاء (تخصم 10 جنيه من أول طلب)!
                </h4>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-400/90 leading-tight">
                  نظام الولاء: كل 100 جنيه = 1 نقطة، والنقطة = 1 جنيه خصم مباشر!
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الاسم الكريم *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="مثال: محمد علي"
                    className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all shadow-xs"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم الهاتف أو الواتساب *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="010XXXXXXXX"
                    className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-mono shadow-xs"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 mt-3">
                  البريد الإلكتروني للتحقق الآمن *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:border-sky-500 outline-none"
                />
                {detectedAccountMsg && (
                  <div className="mt-1.5 p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{detectedAccountMsg}</span>
                  </div>
                )}
                {otpSent && !otpVerified && (
                  <div className="mt-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      رمز التحقق المرسل إلى البريد الإلكتروني
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full px-3 py-2.5 bg-amber-50 dark:bg-amber-950/30 text-slate-900 dark:text-white rounded-xl text-center tracking-[0.4em] border border-amber-300 outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  منطقة أو عنوان التوصيل (اختياري الآن)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="مثال: شارع التحرير، عمارة 5"
                    className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all shadow-xs"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'جاري التحقق...' : otpSent && !otpVerified ? 'تأكيد رمز البريد' : 'إرسال رمز التحقق للبريد'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBrowseAsGuest}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-medium text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <span>تصفح الصيدلية كزائر أولاً</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>بياناتك في أمان تام ومعتمدة في سجلات صيدلية الديب</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
