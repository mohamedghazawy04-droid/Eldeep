import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Award, Sparkles, User, Phone, MapPin, Check, Gift, ArrowRight, ShieldCheck, Mail, CheckCircle2, ShoppingBag, Coins } from 'lucide-react';
import { Customer, LoyaltyTier } from '../types';
import { calculateTier, saveCustomer, getStoredAllCustomers } from '../services/storage';
import { syncSaveCustomerToFirestore, fetchCustomerFromFirestore } from '../services/firestoreSync';
import { PharmacyDeliveryAnimation } from './PharmacyDeliveryAnimation';
import confetti from 'canvas-confetti';

interface LoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCustomer: Customer | null;
  onCustomerUpdated: (customer: Customer) => void;
}

/**
 * Large, Clear, and Prominent Customer Dashboard & Loyalty Hub
 * Designed with high clarity, prominent metrics, and seamless editing.
 */
export const LoyaltyModal: React.FC<LoyaltyModalProps> = ({
  isOpen,
  onClose,
  activeCustomer,
  onCustomerUpdated,
}) => {
  const [name, setName] = useState(activeCustomer?.name || '');
  const [phone, setPhone] = useState(activeCustomer?.phone || '');
  const [email, setEmail] = useState(activeCustomer?.email || '');
  const [address, setAddress] = useState(activeCustomer?.address || '');
  const [isEditing, setIsEditing] = useState(!activeCustomer);
  const [onlineStatus, setOnlineStatus] = useState<string | null>(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  if (!isOpen) return null;

  const handlePhoneBlur = async () => {
    if (!phone || activeCustomer || phone.length < 10) return;
    setIsCheckingPhone(true);
    const existing = await fetchCustomerFromFirestore(phone);
    setIsCheckingPhone(false);
    if (existing) {
      setName(existing.name);
      if (existing.email) setEmail(existing.email);
      setAddress(existing.address);
      onCustomerUpdated(existing);
      saveCustomer(existing);
      setIsEditing(false);
      setOnlineStatus('مرحباً بعودتك! تم العثور على حسابك المسجل أونلاين بنقاطك السابقة.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('يرجى كتابة الاسم ورقم الهاتف للتسجيل');
      return;
    }

    const cleanPhone = phone.trim().replace(/[^\d+]/g, '');
    const allLocal = getStoredAllCustomers();
    const existingLocal = allLocal.find((c) => c.phone.replace(/[^\d+]/g, '') === cleanPhone);
    const existingCloud = await fetchCustomerFromFirestore(cleanPhone);
    const matched = activeCustomer || existingCloud || existingLocal;

    // Never reset existing points!
    const currentPoints = matched ? matched.points : 0;
    const newCustomer: Customer = {
      id: matched?.id || activeCustomer?.id || 'cust-' + Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase() || matched?.email || activeCustomer?.email,
      isEmailVerified: matched?.isEmailVerified ?? activeCustomer?.isEmailVerified ?? false,
      emailVerifiedAt: matched?.emailVerifiedAt || activeCustomer?.emailVerifiedAt,
      address: address.trim() || matched?.address || '',
      points: currentPoints,
      tier: calculateTier(currentPoints),
      totalOrders: matched?.totalOrders || activeCustomer?.totalOrders || 0,
      joinedDate: matched?.joinedDate || activeCustomer?.joinedDate || new Date().toLocaleDateString('ar-EG'),
    };

    saveCustomer(newCustomer);
    const cloudRes = await syncSaveCustomerToFirestore(newCustomer);
    if (cloudRes.isOnline) {
      setOnlineStatus('تم حفظ البيانات ومزامنة الحساب سحابياً بنجاح ☁️✅');
    } else {
      setOnlineStatus('تم حفظ الحساب محلياً وجاهز للمزامنة الأوتوماتيكية');
    }

    onCustomerUpdated(newCustomer);
    setIsEditing(false);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const getTierDetails = (tier: LoyaltyTier) => {
    switch (tier) {
      case 'diamond':
        return {
          title: 'العميل الماسي 💎',
          color: 'from-cyan-600 via-blue-700 to-indigo-800',
          nextGoal: 'أعلى مستوى ولاء وتميز',
          progress: 100,
          perks: ['مضاعفة نقاط الولاء 2x على كل طلب', 'شحن وتوصيل مجاني دائم', 'صيدلي مخصص واستشارات VIP مجانية'],
        };
      case 'gold':
        return {
          title: 'العميل الذهبي 🥇',
          color: 'from-amber-500 via-orange-600 to-amber-700',
          nextGoal: 'باقي ' + Math.max(0, 300 - (activeCustomer?.points || 0)) + ' نقطة للماسي',
          progress: Math.min(100, (((activeCustomer?.points || 0) - 150) / 150) * 100),
          perks: ['مضاعفة نقاط 1.5x على الأدوية والمستلزمات', 'شحن مجاني للطلبات فوق 200 جنيه', 'أولوية فورية في تجهيز الطلبات'],
        };
      case 'silver':
        return {
          title: 'العميل الفضي 🥈',
          color: 'from-slate-600 via-slate-700 to-zinc-800',
          nextGoal: 'باقي ' + Math.max(0, 150 - (activeCustomer?.points || 0)) + ' نقطة للذهبي',
          progress: Math.min(100, (((activeCustomer?.points || 0) - 50) / 100) * 100),
          perks: ['مضاعفة نقاط 1.2x', 'عروض حصرية وخصومات دورية على المستلزمات الطبية'],
        };
      default:
        return {
          title: 'العميل البرونزي 🥉',
          color: 'from-amber-700 via-amber-800 to-amber-900',
          nextGoal: 'باقي ' + Math.max(0, 50 - (activeCustomer?.points || 0)) + ' نقطة للمستوى الفضي',
          progress: Math.min(100, ((activeCustomer?.points || 0) / 50) * 100),
          perks: ['احتساب 1 نقطة لكل 100 جنيه مشتريات', 'كل 1 نقطة ولاء = 1 جنيه مصري خصم مالي مباشر بالسلة'],
        };
    }
  };

  const tierInfo = getTierDetails(activeCustomer?.tier || 'bronze');
  const pointsWorthEgp = ((activeCustomer?.points || 0) * 1).toFixed(1);

  return (
    <div
      id="loyalty-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-cairo text-right"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden font-cairo my-auto max-h-[92vh] flex flex-col"
      >
        {/* Large Prominent Header */}
        <div className="bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-800 text-white p-5 sm:p-6 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner text-amber-300">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-2xl leading-tight">
                لوحة حساب العميل والمكافآت
              </h3>
              <p className="text-xs sm:text-sm text-sky-100 mt-0.5">
                متابعة الرصيد، تعديل العنوان، والخصومات الفورية على مشترياتك
              </p>
            </div>
          </div>
          <button
            id="close-loyalty-modal-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
          {activeCustomer && !isEditing ? (
            <>
              {/* Grand Member Loyalty Card */}
              <div className={`p-6 sm:p-8 rounded-3xl text-white bg-gradient-to-br ${tierInfo.color} shadow-2xl relative overflow-hidden border border-white/15`}>
                <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute top-0 left-0 w-32 h-32 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-6 h-6 text-amber-300" />
                    <span className="font-black text-base sm:text-lg tracking-wide">{tierInfo.title}</span>
                  </div>
                  <span className="text-xs sm:text-sm bg-white/20 backdrop-blur-sm px-3.5 py-1.5 rounded-full font-bold">
                    عضو مسجل منذ {activeCustomer.joinedDate?.slice(0, 10) || 'فترة'}
                  </span>
                </div>

                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                  {/* Points Box */}
                  <div className="bg-black/25 backdrop-blur-sm p-4 rounded-2xl border border-white/15">
                    <span className="text-xs text-sky-100 font-semibold block mb-1">رصيد نقاط الولاء الحالي</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-black tracking-tight">{activeCustomer.points}</span>
                      <span className="text-sm sm:text-base font-bold text-amber-200">نقطة ولاء</span>
                    </div>
                  </div>

                  {/* Value in EGP Box */}
                  <div className="bg-black/25 backdrop-blur-sm p-4 rounded-2xl border border-white/15 flex flex-col justify-center">
                    <span className="text-xs text-sky-100 font-semibold block mb-1">القيمة المادية للخصم المباشر</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-black text-emerald-300 tracking-tight">{pointsWorthEgp}</span>
                      <span className="text-sm font-bold">جنيه مصري خصم بالسلة</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar to next tier */}
                <div className="relative z-10 mt-5 pt-4 border-t border-white/20">
                  <div className="flex justify-between text-xs sm:text-sm mb-1.5 font-bold">
                    <span>مؤشر الترقية للمستوى القادم:</span>
                    <span className="text-amber-200">{tierInfo.nextGoal}</span>
                  </div>
                  <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-amber-300 via-amber-200 to-white rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${Math.max(6, tierInfo.progress)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Customer Profile Details Card (Clear, Large, and Prominent) */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100">بيانات العميل المسجلة</h4>
                  </div>
                  <button
                    id="edit-profile-btn"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    تعديل البيانات
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-bold text-slate-400 block mb-0.5">الاسم المسجل:</span>
                    <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">{activeCustomer.name}</span>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-bold text-slate-400 block mb-0.5">رقم الهاتف / الواتساب:</span>
                    <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 font-mono" dir="ltr">{activeCustomer.phone}</span>
                  </div>

                  {activeCustomer.email && (
                    <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 sm:col-span-2">
                      <span className="text-[11px] font-bold text-slate-400 block mb-0.5">البريد الإلكتروني:</span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 font-mono" dir="ltr">{activeCustomer.email}</span>
                    </div>
                  )}

                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 sm:col-span-2">
                    <span className="text-[11px] font-bold text-slate-400 block mb-0.5">عنوان التوصيل المعتمد:</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {activeCustomer.address || 'العنوان يحدد تلقائياً عند تأكيد الطلب'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tier Perks List */}
              <div className="space-y-3">
                <h4 className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span>مزايا مستواك الحالي الحصرية:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {tierInfo.perks.map((perk, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs sm:text-sm font-bold border border-emerald-200/80 dark:border-emerald-800/50"
                    >
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* How points work notice */}
              <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-xs sm:text-sm text-sky-950 dark:text-sky-200 leading-relaxed flex items-start gap-3">
                <Coins className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong>طريقة احتساب النقاط:</strong> كل 100 جنيه تمنحك 1 نقطة ولاء على كل صنف، وتخصم النقطة الواحدة 1 جنيه مصري حقيقي من إجمالي فاتورة مشترياتك في السلة عند الشراء.
                </span>
              </div>
            </>
          ) : (
            /* Registration / Edit Form with Serene Calm Rain Animation */
            <form onSubmit={handleSave} className="space-y-4">
              <PharmacyDeliveryAnimation isInteracting={isInputFocused} />

              <div className="p-3.5 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-800/60 text-xs sm:text-sm text-sky-900 dark:text-sky-200 font-medium">
                💡 <strong>حفظ البيانات وتجميع النقاط:</strong> يتم حفظ بياناتك أوتوماتيكياً محلياً وسحابياً لتسجيل دخول فوري وحفظ مستمر لنقاطك مع كل طلب.
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  الاسم بالكامل <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    id="reg-cust-name"
                    type="text"
                    required
                    value={name}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="الاسم الثلاثي أو الثنائي"
                    className="w-full pr-10 pl-3 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs sm:text-sm font-medium border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  رقم الهاتف أو الواتساب <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    id="reg-cust-phone"
                    type="tel"
                    required
                    value={phone}
                    onFocus={() => setIsInputFocused(true)}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={(e) => {
                      setIsInputFocused(false);
                      handlePhoneBlur();
                    }}
                    placeholder="01xxxxxxxxx"
                    className="w-full pr-10 pl-3 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs sm:text-sm font-medium border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-colors font-mono text-left"
                    dir="ltr"
                  />
                </div>
                {isCheckingPhone && (
                  <p className="text-[11px] text-sky-600 mt-1 font-bold">جاري فحص الحساب أونلاين في قاعدة البيانات...</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  عنوان التوصيل المفضل
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    id="reg-cust-address"
                    type="text"
                    value={address}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="المنطقة، الشارع، رقم العمارة أو الشقة"
                    className="w-full pr-10 pl-3 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs sm:text-sm font-medium border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  البريد الإلكتروني (اختياري)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    id="reg-cust-email"
                    type="email"
                    value={email}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pr-10 pl-3 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs sm:text-sm font-medium border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-colors font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {onlineStatus && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{onlineStatus}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-3">
                <button
                  id="save-customer-btn"
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md transition-transform active:scale-98"
                >
                  {activeCustomer ? 'حفظ التعديلات' : 'تسجيل وتفعيل الحساب فوراً'}
                </button>
                {activeCustomer && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-3.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-sm transition-colors"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
