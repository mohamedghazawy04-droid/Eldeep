import React, { useState, useEffect } from 'react';
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
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Customer } from '../types';
import { DeliveryCaptainAnimation } from './DeliveryCaptainAnimation';
import { calculateTier, saveCustomer, getStoredAllCustomers } from '../services/storage';
import { syncSaveCustomerToFirestore, fetchCustomerFromFirestore } from '../services/firestoreSync';
import { Logo } from './Logo';
import {
  sendEmailVerificationCode,
  verifyEmailCode,
  finalizeEmailVerification,
  signInAndVerifyWithGoogle,
} from '../services/authVerification';

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
  // Mode: 'register_email' (default with email verification), 'phone_quick', 'verify_code'
  const [authTab, setAuthTab] = useState<'email' | 'phone'>('email');
  const [currentStep, setCurrentStep] = useState<'form' | 'verify'>('form');

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Verification step state
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedAccountMsg, setDetectedAccountMsg] = useState<string | null>(null);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Auto-detect existing account when typing email or phone
  const handleEmailChange = async (val: string) => {
    setEmail(val);
    setVerifyError('');
    const cleanEmail = val.trim().toLowerCase();
    if (cleanEmail.includes('@') && cleanEmail.includes('.')) {
      const allLocal = getStoredAllCustomers();
      const existing = allLocal.find((c) => c.email?.toLowerCase() === cleanEmail || c.phone.toLowerCase() === cleanEmail);
      if (existing) {
        if (!name) setName(existing.name);
        if (!phone && existing.phone && !existing.phone.includes('@')) setPhone(existing.phone);
        if (!address && existing.address) setAddress(existing.address);
        setDetectedAccountMsg(
          existing.isEmailVerified
            ? `مرحباً بعودتك! بريدك مؤكد بالفعل ولديك حساب نشط`
            : `مرحباً بعودتك! لديك حساب مسجل، تابع لتأكيد بريدك الإلكتروني`
        );
        return;
      }

      // Check Cloud Firestore
      const cloudCust = await fetchCustomerFromFirestore(cleanEmail);
      if (cloudCust) {
        if (!name) setName(cloudCust.name);
        if (!phone && cloudCust.phone && !cloudCust.phone.includes('@')) setPhone(cloudCust.phone);
        if (!address && cloudCust.address) setAddress(cloudCust.address);
        setDetectedAccountMsg(`مرحباً بعودتك! تم العثور على حسابك بالسيرفر السحابي`);
      } else {
        setDetectedAccountMsg(null);
      }
    } else {
      setDetectedAccountMsg(null);
    }
  };

  const handlePhoneChange = async (val: string) => {
    setPhone(val);
    const cleanPhone = val.replace(/[^\d+]/g, '');
    if (cleanPhone.length >= 10) {
      const allLocal = getStoredAllCustomers();
      const existing = allLocal.find((c) => c.phone.replace(/[^\d+]/g, '') === cleanPhone);
      if (existing) {
        if (!name) setName(existing.name);
        if (!email && existing.email) setEmail(existing.email);
        if (!address && existing.address) setAddress(existing.address);
        setDetectedAccountMsg(`مرحباً بعودتك! تم العثور على حسابك المسجل`);
        return;
      }
      const cloudCust = await fetchCustomerFromFirestore(cleanPhone);
      if (cloudCust) {
        if (!name) setName(cloudCust.name);
        if (!email && cloudCust.email) setEmail(cloudCust.email);
        if (!address && cloudCust.address) setAddress(cloudCust.address);
        setDetectedAccountMsg(`مرحباً بعودتك! تم العثور على حسابك بالسيرفر السحابي`);
      } else {
        setDetectedAccountMsg(null);
      }
    } else {
      setDetectedAccountMsg(null);
    }
  };

  // Step 1 Submit: Validate & Trigger Email Verification Code
  const handleInitiateEmailVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('يرجى كتابة الاسم الكريم');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      alert('يرجى إدخال بريد إلكتروني صالح للتأكيد');
      return;
    }

    // Generate & Dispatch 6-digit verification code
    const result = sendEmailVerificationCode(cleanEmail);
    setGeneratedCode(result.code);
    setVerificationCode('');
    setVerifyError('');
    setResendCooldown(30);
    setCurrentStep('verify');
  };

  // Step 2 Submit: Verify 6-digit code and activate customer account
  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setVerifyError('يرجى إدخال كود التأكيد المكون من 6 أرقام');
      return;
    }

    setIsVerifying(true);
    setVerifyError('');

    const cleanEmail = email.trim().toLowerCase();
    const verification = verifyEmailCode(cleanEmail, verificationCode.trim());

    if (!verification.valid) {
      setIsVerifying(false);
      setVerifyError(verification.error || 'كود التأكيد غير صحيح');
      return;
    }

    // Verification succeeded!
    try {
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0284c7', '#06b6d4', '#10b981', '#f59e0b'],
        });
      } catch {
        // ignore if confetti fails
      }

      const allLocal = getStoredAllCustomers();
      const cleanPhone = phone.trim().replace(/[^\d+]/g, '');
      const existing = allLocal.find(
        (c) => (c.email && c.email.toLowerCase() === cleanEmail) ||
               (cleanPhone && c.phone && c.phone.replace(/[^\d+]/g, '') === cleanPhone)
      );

      const previousPoints = existing ? existing.points : 0;
      // No bonus points on registration - points are earned strictly from completed orders
      const finalPoints = previousPoints;

      const customerToSave: Customer = {
        id: existing?.id || 'cust-' + Date.now(),
        name: name.trim() || existing?.name || 'عميل صيدلية الديب',
        phone: phone.trim() || existing?.phone || cleanEmail,
        email: cleanEmail,
        isEmailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        address: address.trim() || existing?.address || 'العنوان يحدد عند الطلب',
        points: finalPoints,
        tier: calculateTier(finalPoints),
        totalOrders: existing?.totalOrders || 0,
        joinedDate: existing?.joinedDate || new Date().toISOString(),
      };

      saveCustomer(customerToSave);
      await syncSaveCustomerToFirestore(customerToSave);

      setTimeout(() => {
        setIsVerifying(false);
        onLoginSuccess(customerToSave);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Finalize verification error:', err);
      setIsVerifying(false);
      setVerifyError('حدث خطأ أثناء حفظ التفعيل، يرجى المحاولة مرة أخرى');
    }
  };

  // Resend code handler
  const handleResendCode = () => {
    if (resendCooldown > 0) return;
    const cleanEmail = email.trim().toLowerCase();
    const result = sendEmailVerificationCode(cleanEmail);
    setGeneratedCode(result.code);
    setResendCooldown(30);
    setVerifyError('');
  };

  // Instant Copy & Fill
  const handleAutoFillCode = () => {
    if (generatedCode) {
      setVerificationCode(generatedCode);
      navigator.clipboard?.writeText(generatedCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Quick Google Sign-In with pre-verified email
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const res = await signInAndVerifyWithGoogle();
    setIsGoogleLoading(false);
    if (res.success && res.customer) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
      onLoginSuccess(res.customer);
      onClose();
    } else if (res.error) {
      alert(res.error);
    }
  };

  // Quick Phone login fallback
  const handlePhoneQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('يرجى كتابة الاسم ورقم الهاتف للبدء');
      return;
    }
    setIsSubmitting(true);
    const cleanPhone = phone.trim().replace(/[^\d+]/g, '');
    const allLocal = getStoredAllCustomers();
    const existing = allLocal.find((c) => c.phone.replace(/[^\d+]/g, '') === cleanPhone);

    const finalPoints = existing ? existing.points : 0;
    const finalCust: Customer = {
      id: existing?.id || 'cust-' + Date.now(),
      name: name.trim() || existing?.name || 'عميل صيدلية الديب',
      phone: phone.trim(),
      email: existing?.email,
      isEmailVerified: Boolean(existing?.isEmailVerified),
      address: address.trim() || existing?.address || 'العنوان يحدد عند الطلب',
      points: finalPoints,
      tier: calculateTier(finalPoints),
      totalOrders: existing?.totalOrders || 0,
      joinedDate: existing?.joinedDate || new Date().toISOString(),
    };

    saveCustomer(finalCust);
    await syncSaveCustomerToFirestore(finalCust);

    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess(finalCust);
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
            <div className="flex items-center gap-2.5">
              <Logo size="sm" showSubtitle={false} className="text-white" />
              <div>
                <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                  صيدلية الديب
                </h3>
                <span className="text-[11px] text-sky-100/90 block">
                  {currentStep === 'verify' ? 'تأكيد البريد وتفعيل الحساب' : 'تسجيل وتفعيل حساب العميل'}
                </span>
              </div>
            </div>
            <button
              onClick={handleBrowseAsGuest}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
              title="تصفح كزائر"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Calm Motorcycle Delivery Animation */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950">
            <DeliveryCaptainAnimation isFocused={isFocused} />
          </div>

          {/* Content Area */}
          <div className="p-4 sm:p-5 space-y-4">
            {/* ================= STEP 1: REGISTRATION FORM ================= */}
            {currentStep === 'form' && (
              <>
                {/* Method Navigation Tabs */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setAuthTab('email')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      authTab === 'email'
                        ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>تأكيد بالبريد الإلكتروني ✉️</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthTab('phone')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      authTab === 'phone'
                        ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>دخول برقم الهاتف 📱</span>
                  </button>
                </div>

                {/* Email Verification Assurance Banner */}
                {authTab === 'email' && (
                  <div className="p-3 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-right">
                      <h4 className="text-xs font-bold text-sky-950 dark:text-sky-200 flex items-center gap-1">
                        <span>تأكيد وتفعيل الحساب بالبريد الإلكتروني</span>
                      </h4>
                      <p className="text-[11px] text-sky-700 dark:text-sky-400 leading-relaxed mt-0.5">
                        أدخل بريدك الإلكتروني وسيتم إرسال كود التأكيد (6 أرقام) للتحقق وحفظ حسابك وطلباتك سحابياً.
                      </p>
                    </div>
                  </div>
                )}

                {/* One-Click Google Verification Alternative */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2.5 shadow-xs transition-all active:scale-98"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>
                    {isGoogleLoading
                      ? 'جاري التحقق عبر Google...'
                      : 'تسجيل وتأكيد فوري عبر حساب Google'}
                  </span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-slate-400">أو إدخال البيانات يدوياً</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>

                {/* Form based on selected tab */}
                {authTab === 'email' ? (
                  <form onSubmit={handleInitiateEmailVerification} className="space-y-3">
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
                          placeholder="مثال: د. أحمد الشريف"
                          className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all shadow-xs"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        البريد الإلكتروني (لتأكيد التسجيل) *
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          placeholder="yourname@gmail.com"
                          className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-mono shadow-xs text-left"
                          dir="ltr"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                      </div>
                      {detectedAccountMsg && (
                        <div className="mt-1.5 p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{detectedAccountMsg}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        رقم الموبايل أو الواتساب (للتوصيل والمتابعة)
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          placeholder="010XXXXXXXX"
                          className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-mono shadow-xs text-left"
                          dir="ltr"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        منطقة أو عنوان التوصيل (اختياري)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          placeholder="مثال: شارع الجمهورية، بجوار المحطة"
                          className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all shadow-xs"
                        />
                        <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Mail className="w-4 h-4" />
                        <span>إرسال كود تأكيد البريد ومتابعة التسجيل</span>
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
                ) : (
                  /* Phone quick login form */
                  <form onSubmit={handlePhoneQuickSubmit} className="space-y-3">
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
                          placeholder="مثال: محمود عبد الرازق"
                          className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:border-sky-500 outline-none"
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
                          placeholder="010XXXXXXXX"
                          className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:border-sky-500 outline-none font-mono text-left"
                          dir="ltr"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        العنوان (اختياري)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="العنوان للتوصيل"
                          className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:border-sky-500 outline-none"
                        />
                        <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isSubmitting ? 'جاري الدخول...' : 'دخول فوري ومتابعة'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* ================= STEP 2: EMAIL VERIFICATION CODE STEP ================= */}
            {currentStep === 'verify' && (
              <form onSubmit={handleVerifyCodeSubmit} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                {/* Email Display Card with Edit option */}
                <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-center justify-between">
                  <div className="text-right">
                    <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold block">
                      كود التأكيد مرسل إلى البريد الإلكتروني:
                    </span>
                    <span className="text-xs font-mono font-bold text-sky-950 dark:text-sky-200" dir="ltr">
                      {email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep('form')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 rounded-xl text-[11px] font-bold flex items-center gap-1 border border-sky-200 dark:border-sky-700 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>تعديل</span>
                  </button>
                </div>

                {/* Instant Verification Code helper for 100% reliable preview/testing */}
                {generatedCode && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                        <span>كود تأكيد البريد الإلكتروني:</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">صالحة لـ 15 دقيقة</span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-700">
                      <span className="font-mono text-xl font-black tracking-widest text-emerald-600 dark:text-emerald-400">
                        {generatedCode}
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoFillCode}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'تم النسخ والتعبئة' : 'تعبئة الكود تلقائياً'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 6-Digit Code Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                    أدخل كود التأكيد المكون من 6 أرقام لتأكيد حسابك:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={verificationCode}
                    onChange={(e) => {
                      const normalized = e.target.value
                        .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
                        .replace(/[^\d]/g, '');
                      setVerificationCode(normalized);
                      setVerifyError('');
                    }}
                    placeholder="••••••"
                    className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-center font-mono font-black text-2xl tracking-[0.4em] border-2 border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all shadow-inner"
                  />
                  {verifyError && (
                    <p className="mt-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 text-center">
                      {verifyError}
                    </p>
                  )}
                </div>

                {/* Submit & Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    disabled={isVerifying || verificationCode.length < 6}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isVerifying ? 'جاري التحقق وتفعيل الحساب...' : 'تأكيد التسجيل وتفعيل الحساب الآن'}</span>
                  </button>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      disabled={resendCooldown > 0}
                      onClick={handleResendCode}
                      className="text-sky-600 dark:text-sky-400 disabled:text-slate-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                      <span>
                        {resendCooldown > 0 ? `إعادة الإرسال خلال (${resendCooldown}ث)` : 'إعادة إرسال كود التأكيد'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentStep('form')}
                      className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                    >
                      رجوع لتعديل البيانات
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>نظام حماية الحسابات ونقاط الولاء المعتمد بصيدلية الديب</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
