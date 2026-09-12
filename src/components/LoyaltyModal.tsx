import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Award, Sparkles, User, Phone, MapPin, Check, Gift, ArrowRight, ShieldCheck } from 'lucide-react';
import { Customer, LoyaltyTier } from '../types';
import { calculateTier, saveCustomer } from '../services/storage';
import { syncSaveCustomerToFirestore, fetchCustomerFromFirestore } from '../services/firestoreSync';
import { PharmacyDeliveryAnimation } from './PharmacyDeliveryAnimation';
import confetti from 'canvas-confetti';

interface LoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCustomer: Customer | null;
  onCustomerUpdated: (customer: Customer) => void;
}

export const LoyaltyModal: React.FC<LoyaltyModalProps> = ({
  isOpen,
  onClose,
  activeCustomer,
  onCustomerUpdated,
}) => {
  const [name, setName] = useState(activeCustomer?.name || '');
  const [phone, setPhone] = useState(activeCustomer?.phone || '');
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

    const currentPoints = activeCustomer ? activeCustomer.points : 50; // 50 welcome bonus points!
    const newCustomer: Customer = {
      id: activeCustomer?.id || 'cust-' + Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      points: currentPoints,
      tier: calculateTier(currentPoints),
      totalOrders: activeCustomer?.totalOrders || 0,
      joinedDate: activeCustomer?.joinedDate || new Date().toLocaleDateString('ar-EG'),
    };

    saveCustomer(newCustomer);
    const cloudRes = await syncSaveCustomerToFirestore(newCustomer);
    if (cloudRes.isOnline) {
      setOnlineStatus('تم تأكيد الحفظ أونلاين في سيرفر صيدلية الديب السحابي بنجاح ☁️✅');
    } else {
      setOnlineStatus('تم حفظ الحساب محلياً وجاهز للمزامنة الأوتوماتيكية فور توفر الاتصال');
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
          color: 'from-cyan-500 to-blue-600',
          nextGoal: 'أعلى مستوى ولاء',
          progress: 100,
          perks: ['مضاعفة نقاط الولاء 2x على كل طلب', 'شحن مجاني دائم', 'صيدلي مخصص واستشارات VIP'],
        };
      case 'gold':
        return {
          title: 'العميل الذهبي 🥇',
          color: 'from-amber-400 to-yellow-600',
          nextGoal: 'باقي ' + Math.max(0, 1000 - (activeCustomer?.points || 0)) + ' نقطة للماسي',
          progress: Math.min(100, (((activeCustomer?.points || 0) - 500) / 500) * 100),
          perks: ['مضاعفة نقاط 1.5x على الأدوية والمستلزمات', 'شحن مجاني للطلبات فوق 200 جنيه', 'أولوية تجهيز الروشتات'],
        };
      case 'silver':
        return {
          title: 'العميل الفضي 🥈',
          color: 'from-slate-400 to-slate-600',
          nextGoal: 'باقي ' + Math.max(0, 500 - (activeCustomer?.points || 0)) + ' نقطة للذهبي',
          progress: Math.min(100, (((activeCustomer?.points || 0) - 200) / 300) * 100),
          perks: ['مضاعفة نقاط 1.2x', 'عروض حصرية وخصومات على منتجات العناية بالبشرة'],
        };
      default:
        return {
          title: 'العميل البرونزي 🥉',
          color: 'from-amber-600 to-amber-800',
          nextGoal: 'باقي ' + Math.max(0, 200 - (activeCustomer?.points || 0)) + ' نقطة للفضي',
          progress: Math.min(100, ((activeCustomer?.points || 0) / 200) * 100),
          perks: ['احتساب 10 نقاط لكل 1 جنيه مشتريات (1000 نقطة = 10 ج.م خصم)', 'استبدال وتصفير النقاط بخصم مالي فوري في السلة'],
        };
    }
  };

  const tierInfo = getTierDetails(activeCustomer?.tier || 'bronze');
  const pointsWorthEgp = (((activeCustomer?.points || 0) / 1000) * 10).toFixed(1);

  return (
    <div
      id="loyalty-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-cairo text-right"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-sky-100 dark:border-slate-800 overflow-hidden font-cairo my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-cyan-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
              <Award className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg">نادي نقاط ولاء صيدلية الديب</h3>
              <p className="text-xs text-sky-100">اطلب أكتر، وفر أكتر، واكسب هدايا وخصومات مستمرة</p>
            </div>
          </div>
          <button
            id="close-loyalty-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {activeCustomer && !isEditing ? (
            <>
              {/* Member Card */}
              <div className={`p-5 rounded-3xl text-white bg-gradient-to-br ${tierInfo.color} shadow-xl relative overflow-hidden`}>
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-200" />
                    <span className="font-bold text-sm tracking-wide">{tierInfo.title}</span>
                  </div>
                  <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-semibold">
                    عضو منذ {activeCustomer.joinedDate}
                  </span>
                </div>

                <div className="my-3">
                  <span className="text-xs text-white/80 block">رصيد نقاطك الحالي</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-4xl font-extrabold tracking-tight">{activeCustomer.points}</span>
                    <span className="text-sm font-semibold">نقطة ولاء</span>
                  </div>
                  <span className="text-xs text-white/90 mt-1 inline-block bg-black/15 px-2 py-0.5 rounded-lg">
                    تعادل خصماً بقيمة {pointsWorthEgp} جنيه مصري في سلة المشتريات
                  </span>
                </div>

                {/* Progress bar to next tier */}
                <div className="mt-4 pt-3 border-t border-white/20">
                  <div className="flex justify-between text-xs mb-1 font-medium">
                    <span>الترقية للمستوى التالي</span>
                    <span>{tierInfo.nextGoal}</span>
                  </div>
                  <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, tierInfo.progress)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Customer Info & Edit trigger */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{activeCustomer.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activeCustomer.phone}</div>
                  {activeCustomer.address && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                      {activeCustomer.address}
                    </div>
                  )}
                </div>
                <button
                  id="edit-profile-btn"
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline px-2 py-1"
                >
                  تعديل البيانات
                </button>
              </div>

              {/* Tier Perks list */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>مميزات مستواك الحالي:</span>
                </h4>
                <div className="space-y-2">
                  {tierInfo.perks.map((perk, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-medium border border-emerald-200/50 dark:border-emerald-900/40"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* How points work notice */}
              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 text-xs text-sky-900 dark:text-sky-200 leading-relaxed flex items-start gap-2.5">
                <Gift className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong>كيف تكسب نقاطاً إضافية؟</strong> لكل 1 جنيه في طلبك تكسب 10 نقاط ولاء (الـ 1000 نقطة تعادل 10 جنيه خصم فوري)، بالإضافة لنقاط البونص على كل منتج، مع تصفير النقاط عند الاستفادة من الخصم!
                </span>
              </div>
            </>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSave} className="space-y-4">
              {/* Pharmacy with animated delivery motorcycle */}
              <PharmacyDeliveryAnimation isInteracting={isInputFocused} />

              <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-100 dark:border-sky-900/50 text-xs text-sky-800 dark:text-sky-300">
                🎉 <strong>هدية ترحيبية فورية:</strong> سجّل بياناتك الآن واحصل على <strong>50 نقطة ولاء مجاناً</strong> تضاف لحسابك فوراً وتخصم من أول أوردر!
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الاسم بالكامل <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    id="reg-cust-name"
                    type="text"
                    required
                    value={name}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: د. محمد الديب"
                    className="w-full pr-9 pl-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs sm:text-sm font-medium border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم الهاتف (المرتبط بالواتساب) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
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
                    placeholder="010XXXXXXXX"
                    className="w-full pr-9 pl-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs sm:text-sm font-medium border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-colors"
                  />
                </div>
                {isCheckingPhone && (
                  <p className="text-[10px] text-sky-600 mt-1">جاري التحقق من الحساب أونلاين في قاعدة البيانات...</p>
                )}
              </div>

              {onlineStatus && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{onlineStatus}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان التوصيل المفضل
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    id="reg-cust-address"
                    type="text"
                    value={address}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="الشارع، العمارة، الشقة"
                    className="w-full pr-9 pl-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs sm:text-sm font-medium border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  id="save-customer-btn"
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-transform active:scale-95"
                >
                  {activeCustomer ? 'حفظ التعديلات' : 'تسجيل وتفعيل 50 نقطة هدية 🎁'}
                </button>
                {activeCustomer && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors"
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
