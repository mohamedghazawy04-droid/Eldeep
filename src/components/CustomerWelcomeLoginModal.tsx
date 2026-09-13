import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Phone, User, MapPin, ArrowLeft, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { Customer } from '../types';
import { DeliveryCaptainAnimation } from './DeliveryCaptainAnimation';
import { calculateTier, saveCustomer } from '../services/storage';
import { syncSaveCustomerToFirestore } from '../services/firestoreSync';

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
  const [address, setAddress] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('يرجى كتابة الاسم ورقم الهاتف للبدء');
      return;
    }

    setIsSubmitting(true);

    // Initial 10 welcome points for new customer (= 10 EGP discount!)
    const welcomePoints = 10;
    const newCustomer: Customer = {
      id: 'cust-' + Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || 'العنوان يحدد عند الطلب',
      points: welcomePoints,
      tier: calculateTier(welcomePoints),
      totalOrders: 0,
      joinedDate: new Date().toISOString(),
    };

    saveCustomer(newCustomer);
    syncSaveCustomerToFirestore(newCustomer);

    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess(newCustomer);
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
                صيدليات الديب - خدمة التوصيل 24/7
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
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="010XXXXXXXX"
                    className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-mono shadow-xs"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
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
                  <span>{isSubmitting ? 'جاري تفعيل الحساب...' : 'دخول واستلام 50 نقطة هدية 🎁'}</span>
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
              <span>بياناتك في أمان تام ومعتمدة في سجلات صيدليات الديب</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
