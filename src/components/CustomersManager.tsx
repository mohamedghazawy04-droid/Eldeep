import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Edit3,
  Trash2,
  MessageCircle,
  Award,
  Sparkles,
  Check,
  X,
  ShieldCheck,
  Copy,
  Phone,
  MapPin,
  RefreshCw,
  Gift,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { Customer, LoyaltyTier } from '../types';
import {
  getStoredAllCustomers,
  saveCustomer,
  saveAllCustomers,
  deleteStoredCustomer,
  exportCustomersAsCsv,
  exportCustomersAsJson,
  calculateTier,
} from '../services/storage';
import {
  subscribeToFirestoreCustomers,
  syncSaveCustomerToFirestore,
  syncDeleteCustomerFromFirestore,
} from '../services/firestoreSync';

interface CustomersManagerProps {
  isDarkTheme?: boolean;
}

export const CustomersManager: React.FC<CustomersManagerProps> = ({ isDarkTheme = false }) => {
  const [customers, setCustomers] = useState<Customer[]>(getStoredAllCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | LoyaltyTier>('all');
  const [sortBy, setSortBy] = useState<'points-desc' | 'points-asc' | 'orders-desc' | 'name-asc'>('points-desc');

  // Modals state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formIsEmailVerified, setFormIsEmailVerified] = useState(false);
  const [formAddress, setFormAddress] = useState('');
  const [formPoints, setFormPoints] = useState<number>(0);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Subscribe to live Firestore updates
  useEffect(() => {
    const unsub = subscribeToFirestoreCustomers((liveCustomers) => {
      if (liveCustomers && liveCustomers.length > 0) {
        setCustomers(liveCustomers);
        saveAllCustomers(liveCustomers);
      }
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Manual Email Verification toggle by Admin
  const handleManualVerifyEmail = async (cust: Customer) => {
    const updated: Customer = {
      ...cust,
      isEmailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
    };
    saveCustomer(updated);
    setCustomers((prev) => prev.map((c) => (c.id === cust.id ? updated : c)));
    showToast(`تم تأكيد وتفعيل بريد العميل ${cust.name} بنجاح ✅`);
    await syncSaveCustomerToFirestore(updated);
  };

  // Quick Bonus Points (+5, +10, +50)
  const handleQuickAddPoints = async (cust: Customer, bonus: number) => {
    const newPoints = Math.max(0, (cust.points || 0) + bonus);
    const updated: Customer = {
      ...cust,
      points: newPoints,
      tier: calculateTier(newPoints),
    };

    saveCustomer(updated);
    setCustomers((prev) => prev.map((c) => (c.id === cust.id ? updated : c)));
    showToast(`تمت إضافة +${bonus} نقطة للعميل ${cust.name}! (الرصيد الجديد: ${newPoints} نقطة)`);

    await syncSaveCustomerToFirestore(updated);
  };

  // Delete Customer
  const handleDelete = async (cust: Customer) => {
    const confirmMsg = `هل أنت متأكد من رغبتك في حذف حساب العميل "${cust.name}" نهائياً من سجلات صيدلية الديب؟\nسيتم حذف نقاط الولاء وسجل الطلبات.`;
    if (!window.confirm(confirmMsg)) return;

    deleteStoredCustomer(cust.id);
    setCustomers((prev) => prev.filter((c) => c.id !== cust.id));
    showToast(`تم حذف العميل ${cust.name} بنجاح.`);

    await syncDeleteCustomerFromFirestore(cust);
  };

  // Copy phone number
  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // Open WhatsApp direct message with loyalty points statement
  const handleOpenWhatsApp = (cust: Customer) => {
    const cleanPhone = cust.phone.replace(/[^\d+]/g, '');
    const points = cust.points || 0;
    const msg = encodeURIComponent(
      `السلام عليكم أ / ${cust.name} 🌿\nمعك صيدلية الديب - خدمة العملاء.\nنحيطكم علماً بأن رصيد نقاط الولاء الخاص بكم في حسابكم لدينا هو: ${points} نقطة (تمنحك خصماً مباشراً بقيمة ${points} جنيه مصري عند طلبك القادم).\n\nيسعدنا خدمتكم وتجهيز وتوصيل طلباتكم دوماً على مدار 24 ساعة!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  // Start Editing
  const handleStartEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormName(cust.name);
    setFormPhone(cust.phone);
    setFormEmail(cust.email || '');
    setFormIsEmailVerified(Boolean(cust.isEmailVerified));
    setFormAddress(cust.address || '');
    setFormPoints(cust.points || 0);
  };

  // Start Adding
  const handleStartAdd = () => {
    setIsAddOpen(true);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormIsEmailVerified(true);
    setFormAddress('');
    setFormPoints(0); // Points start at 0, earned through purchases
  };

  // Save Customer (Add or Edit)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      alert('يرجى إدخال اسم ورقم هاتف العميل');
      return;
    }

    setFormSubmitting(true);
    const pts = Math.max(0, Number(formPoints) || 0);

    if (editingCustomer) {
      const updated: Customer = {
        ...editingCustomer,
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim().toLowerCase() || undefined,
        isEmailVerified: formIsEmailVerified,
        emailVerifiedAt: formIsEmailVerified ? (editingCustomer.emailVerifiedAt || new Date().toISOString()) : undefined,
        address: formAddress.trim(),
        points: pts,
        tier: calculateTier(pts),
      };
      saveCustomer(updated);
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      await syncSaveCustomerToFirestore(updated);
      showToast(`تم تحديث بيانات ونقاط العميل ${updated.name} بنجاح ✅`);
      setEditingCustomer(null);
    } else {
      const newCust: Customer = {
        id: 'cust-' + Date.now(),
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim().toLowerCase() || undefined,
        isEmailVerified: formIsEmailVerified,
        emailVerifiedAt: formIsEmailVerified ? new Date().toISOString() : undefined,
        address: formAddress.trim(),
        points: pts,
        tier: calculateTier(pts),
        totalOrders: 0,
        joinedDate: new Date().toLocaleDateString('ar-EG'),
      };
      saveCustomer(newCust);
      setCustomers((prev) => [newCust, ...prev]);
      await syncSaveCustomerToFirestore(newCust);
      showToast(`تمت إضافة العميل ${newCust.name} بنجاح ✅`);
      setIsAddOpen(false);
    }

    setFormSubmitting(false);
  };

  // Statistics
  const stats = useMemo(() => {
    const totalCount = customers.length;
    const totalPoints = customers.reduce((acc, c) => acc + (c.points || 0), 0);
    const diamondGoldCount = customers.filter((c) => c.tier === 'diamond' || c.tier === 'gold').length;
    return { totalCount, totalPoints, diamondGoldCount };
  }, [customers]);

  // Filtered & Sorted customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const matchesSearch =
          (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.phone || '').includes(searchTerm) ||
          (c.address || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
        return matchesSearch && matchesTier;
      })
      .sort((a, b) => {
        if (sortBy === 'points-desc') return (b.points || 0) - (a.points || 0);
        if (sortBy === 'points-asc') return (a.points || 0) - (b.points || 0);
        if (sortBy === 'orders-desc') return (b.totalOrders || 0) - (a.totalOrders || 0);
        if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
        return 0;
      });
  }, [customers, searchTerm, tierFilter, sortBy]);

  const getTierBadge = (tier: LoyaltyTier) => {
    switch (tier) {
      case 'diamond':
        return {
          label: 'عميل ماسي 💎',
          bg: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
        };
      case 'gold':
        return {
          label: 'عميل ذهبي 🥇',
          bg: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
        };
      case 'silver':
        return {
          label: 'عميل فضي 🥈',
          bg: 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        };
      default:
        return {
          label: 'عميل برونزي 🥉',
          bg: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
        };
    }
  };

  return (
    <div className="space-y-5 text-right font-cairo">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-2xl flex items-center gap-2 border border-emerald-400"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-200" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner & Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-300/40 dark:border-emerald-800/60 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">إجمالي العملاء المسجلين</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.totalCount} <span className="text-xs font-normal text-slate-400">عميل</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/40 dark:border-amber-800/60 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">إجمالي نقاط الولاء الموزعة</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {stats.totalPoints}{' '}
              <span className="text-xs font-normal text-amber-600/80">نقطة (= {stats.totalPoints} ج.م)</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent border border-sky-300/40 dark:border-sky-800/60 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">حالة المزامنة السحابية</div>
            <div className="text-sm font-bold text-sky-700 dark:text-sky-300 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>محفوظة سحابياً (Firestore)</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Controls Bar: Search, Filters & Export Buttons */}
      <div className="p-4 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-3xl space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث باسم العميل، الهاتف، أو العنوان..."
              className="w-full pl-3 pr-9 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl text-xs border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => exportCustomersAsCsv(customers)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
              title="تصدير كشف إكسل CSV لبيانات العملاء ونقاطهم"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>تصدير Excel/CSV</span>
            </button>

            <button
              onClick={() => exportCustomersAsJson(customers)}
              className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
              title="تنزيل نسخة احتياطية JSON لكافة العملاء"
            >
              <Download className="w-3.5 h-3.5" />
              <span>نسخة JSON</span>
            </button>

            <button
              onClick={handleStartAdd}
              className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عميل جديد</span>
            </button>
          </div>
        </div>

        {/* Filter Pills & Sort Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-bold shrink-0 ml-1">
              المستوى:
            </span>
            {(
              [
                { key: 'all', label: 'الكل' },
                { key: 'diamond', label: 'الماسي 💎' },
                { key: 'gold', label: 'الذهبي 🥇' },
                { key: 'silver', label: 'الفضي 🥈' },
                { key: 'bronze', label: 'البرونزي 🥉' },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                onClick={() => setTierFilter(item.key)}
                className={`px-3 py-1 rounded-xl font-bold text-[11px] transition-all shrink-0 ${
                  tierFilter === item.key
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-bold">الترتيب:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs px-2.5 py-1 rounded-xl border border-slate-300 dark:border-slate-700 outline-none font-medium"
            >
              <option value="points-desc">الأعلى نقاط ولاء 💰</option>
              <option value="points-asc">الأقل نقاطاً</option>
              <option value="orders-desc">الأكثر طلباً 📦</option>
              <option value="name-asc">الأبجدي (أ - ي)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl space-y-2">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300">
              {searchTerm ? 'لم يتم العثور على أي عميل يطابق بحثك' : 'لا يوجد عملاء مسجلين حالياً'}
            </h4>
            <p className="text-xs text-slate-400">
              {searchTerm ? 'جرّب البحث باسم آخر أو برقم هاتف مختلف' : 'سجل عميلك الأول أو دعه يسجل بنفسه لحفظ نقاطه دائماً!'}
            </p>
          </div>
        ) : (
          filteredCustomers.map((c) => {
            const badge = getTierBadge(c.tier || 'bronze');
            return (
              <div
                key={c.id}
                className="p-4 bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl shadow-sm hover:shadow-md transition-all space-y-3"
              >
                {/* Top Details & Identity */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-500/30 text-sky-700 dark:text-sky-300 flex items-center justify-center font-black text-sm shrink-0">
                      {c.name ? c.name.charAt(0) : 'ع'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                          {c.name}
                        </span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" />
                          <span>سحابي محفوظ</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        <div className="flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.phone}</span>
                          <button
                            onClick={() => handleCopyPhone(c.phone, c.id)}
                            className="p-1 hover:text-sky-600 transition-colors"
                            title="نسخ رقم الهاتف"
                          >
                            {copiedPhoneId === c.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        </div>

                        {c.email && (
                          <div className="flex items-center gap-1.5 font-mono">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{c.email}</span>
                            {c.isEmailVerified ? (
                              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>مؤكد ومفعل</span>
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-1.5 py-0.5 rounded-md font-bold">
                                بانتظار التأكيد ⏳
                              </span>
                            )}
                          </div>
                        )}

                        {c.address && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="line-clamp-1">{c.address}</span>
                          </div>
                        )}

                        <div className="text-[11px] text-slate-400">
                          الطلبات: <strong className="text-slate-700 dark:text-slate-300">{c.totalOrders || 0}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Points Box */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 px-3.5 py-2 rounded-2xl shrink-0">
                    <div className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
                      رصيد نقاط الولاء:
                    </div>
                    <div className="font-mono font-black text-lg text-amber-600 dark:text-amber-300">
                      {c.points || 0} <span className="text-xs font-normal">نقطة</span>
                    </div>
                    <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-bold">
                      خصم {c.points || 0} جنيه مصري
                    </div>
                  </div>
                </div>

                {/* Bottom Interactive Control Center: Quick Bonus + Edit + WhatsApp + Delete */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  {/* Quick Reward Buttons & Manual Verify */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-400 ml-1">إضافة مكافأة:</span>
                    <button
                      onClick={() => handleQuickAddPoints(c, 5)}
                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-300/40 rounded-xl font-bold text-[11px] transition-all active:scale-95"
                    >
                      +5 نقاط
                    </button>
                    <button
                      onClick={() => handleQuickAddPoints(c, 10)}
                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-300/40 rounded-xl font-bold text-[11px] transition-all active:scale-95"
                    >
                      +10 نقاط
                    </button>
                    <button
                      onClick={() => handleQuickAddPoints(c, 50)}
                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-300/40 rounded-xl font-bold text-[11px] transition-all active:scale-95"
                    >
                      +50 نقطة 🎁
                    </button>

                    {!c.isEmailVerified && (
                      <button
                        onClick={() => handleManualVerifyEmail(c)}
                        className="px-2.5 py-1 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
                        title="تأكيد وتفعيل بريد العميل يدوياً"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>تأكيد البريد يدوياً</span>
                      </button>
                    )}
                  </div>

                  {/* Operational Controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenWhatsApp(c)}
                      className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-800 rounded-xl font-bold text-xs flex items-center gap-1 transition-all"
                      title="مراسلة العميل برصيد نقاطه على واتساب"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>واتساب</span>
                    </button>

                    <button
                      onClick={() => handleStartEdit(c)}
                      className="px-3 py-1.5 bg-sky-600/10 hover:bg-sky-600/20 text-sky-700 dark:text-sky-300 border border-sky-300/40 dark:border-sky-800 rounded-xl font-bold text-xs flex items-center gap-1 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                      <span>تعديل النقاط والبيانات</span>
                    </button>

                    <button
                      onClick={() => handleDelete(c)}
                      className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-xl transition-all"
                      title="حذف حساب العميل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      <AnimatePresence>
        {(isAddOpen || editingCustomer) && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsAddOpen(false);
                setEditingCustomer(null);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4 my-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>{editingCustomer ? 'تعديل بيانات ورصيد نقاط العميل' : 'إضافة عميل جديد في صيدلية الديب'}</span>
                </h3>
                <button
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم العميل *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: محمد السيد"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-sky-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف / الواتساب *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    البريد الإلكتروني للعميل
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-sky-500 font-mono text-left"
                    dir="ltr"
                  />
                  <label className="mt-2 flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formIsEmailVerified}
                      onChange={(e) => setFormIsEmailVerified(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                      تم تأكيد البريد الإلكتروني وتفعيله (حساب موثق ✅)
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان العميل أو المنطقة
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="مثال: دمنهور - شارع الجمهورية"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-sky-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-700 dark:text-amber-400 mb-1">
                    رصيد نقاط الولاء (كل 1 نقطة = 1 جنيه خصم) 💰
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formPoints}
                    onChange={(e) => setFormPoints(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-xl outline-none focus:border-amber-500 font-mono font-black text-sm text-amber-800 dark:text-amber-300"
                  />
                  <div className="text-[11px] text-slate-400 mt-1">
                    المستوى الحالي المحتسب: <strong className="text-slate-600 dark:text-slate-200">{calculateTier(formPoints)}</strong>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddOpen(false);
                      setEditingCustomer(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5"
                  >
                    {formSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>{editingCustomer ? 'حفظ التعديلات سحابياً' : 'إضافة العميل وتثبيت نقاطه'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
