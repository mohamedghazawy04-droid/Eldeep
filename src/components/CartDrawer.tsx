import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Send,
  ShoppingBag,
  Sparkles,
  MapPin,
  User,
  Phone,
  CheckCircle,
  Banknote,
  CreditCard,
  Zap,
  AlertCircle,
  FileText,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { CartItem, Customer, PaymentMethod } from '../types';
import { createOrderWhatsAppUrl } from '../services/whatsapp';
import { saveOrder, saveCustomer, getStoredAllCustomers } from '../services/storage';
import { syncSaveOrderToFirestore, syncSaveCustomerToFirestore } from '../services/firestoreSync';
import { upsertSupabaseCustomer, upsertSupabaseOrder } from '../services/supabaseCustomers';
import confetti from 'canvas-confetti';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  activeCustomer: Customer | null;
  onOpenLoyalty: () => void;
  onCustomerUpdated?: (customer: Customer) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  activeCustomer,
  onOpenLoyalty,
  onCustomerUpdated,
}) => {
  const [usePoints, setUsePoints] = useState(false);
  const [customerName, setCustomerName] = useState(activeCustomer?.name || '');
  const [customerPhone, setCustomerPhone] = useState(activeCustomer?.phone || '');
  const [customerAddress, setCustomerAddress] = useState(activeCustomer?.address || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [orderNotes, setOrderNotes] = useState('');
  const [isOrdered, setIsOrdered] = useState(false);

  // Form validation errors
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Dynamic customer detection if user wasn't logged in but entered existing phone
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (activeCustomer) {
      setCustomerName(activeCustomer.name || '');
      setCustomerPhone(activeCustomer.phone || '');
      setCustomerAddress(activeCustomer.address || '');
    }
  }, [activeCustomer]);

  // When phone changes, check if it matches an existing customer in storage
  const handlePhoneChange = (val: string) => {
    setCustomerPhone(val);
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }

    const clean = val.replace(/\s+/g, '');
    if (clean.length >= 10 && !activeCustomer) {
      const all = getStoredAllCustomers();
      const found = all.find((c) => c.phone.replace(/\s+/g, '') === clean);
      if (found) {
        setMatchedCustomer(found);
        if (!customerName) setCustomerName(found.name);
        if (!customerAddress) setCustomerAddress(found.address);
      } else {
        setMatchedCustomer(null);
      }
    }
  };

  const handleNameChange = (val: string) => {
    setCustomerName(val);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleAddressChange = (val: string) => {
    setCustomerAddress(val);
    if (errors.address) {
      setErrors((prev) => ({ ...prev, address: undefined }));
    }
  };

  if (!isOpen) return null;

  const currentCustomer = activeCustomer || matchedCustomer;

  // Subtotal
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Loyalty calculation per added product: 100 EGP = 1 point
  const multiplier =
    currentCustomer?.tier === 'diamond'
      ? 2
      : currentCustomer?.tier === 'gold'
      ? 1.5
      : currentCustomer?.tier === 'silver'
      ? 1.2
      : 1;

  const totalEarnedPoints = Math.max(
    0,
    Number(
      items
        .reduce((sum, item) => {
          const itemPoints = (item.product.price / 100) * item.quantity * multiplier;
          return sum + itemPoints;
        }, 0)
        .toFixed(2)
    )
  );

  // Points redemption calculation: 1 point = 1 EGP discount
  const availablePoints = currentCustomer?.points || 0;
  const maxPossibleDiscount = Math.min(subtotal, Math.floor(availablePoints));
  const pointsDiscount = usePoints ? maxPossibleDiscount : 0;
  const pointsToDeduct = usePoints ? pointsDiscount : 0;
  const finalTotal = Math.max(0, subtotal - pointsDiscount);
  const remainingPointsAfterOrder = currentCustomer
    ? Math.max(0, currentCustomer.points - pointsToDeduct)
    : 0;

  const validateForm = () => {
    const newErrors: { name?: string; phone?: string; address?: string } = {};

    if (!customerName.trim()) {
      newErrors.name = 'يرجى إدخال اسم العميل بالكامل';
    } else if (customerName.trim().length < 3) {
      newErrors.name = 'يرجى كتابة الاسم ثلاثي أو اسم صحيح (3 أحرف على الأقل)';
    }

    const cleanPhone = customerPhone.replace(/\s+/g, '');
    if (!cleanPhone) {
      newErrors.phone = 'يرجى إدخال رقم الهاتف للتواصل والدليفري';
    } else if (cleanPhone.length < 10) {
      newErrors.phone = 'يرجى كتابة رقم هاتف صحيح مكون من 11 رقم (010 / 011 / 012 / 015)';
    }

    if (!customerAddress.trim()) {
      newErrors.address = 'يرجى إدخال عنوان التوصيل بالتفصيل (المنطقة، الشارع، العمارة، الشقة)';
    } else if (customerAddress.trim().length < 4) {
      newErrors.address = 'يرجى توضيح تفاصيل العنوان بدقة لمندوب الصيدلية';
    }

    setErrors(newErrors);
    setHasAttemptedSubmit(true);

    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      const targetEl = document.getElementById(`cart-input-${firstKey}`);
      if (targetEl) {
        targetEl.focus();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    return true;
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) return;

    // Save order in records
    const newOrder = {
      id: 'ord-' + Date.now(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      items: items.map((i) => ({
        productName: i.product.nameAr,
        quantity: i.quantity,
        price: i.product.price,
      })),
      totalPrice: finalTotal,
      discount: pointsDiscount,
      pointsUsed: pointsToDeduct,
      pointsEarned: totalEarnedPoints,
      paymentMethod,
      date: new Date().toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'sent_whatsapp' as const,
      notes: orderNotes.trim(),
    };

    saveOrder(newOrder);
    upsertSupabaseOrder(newOrder).then((result) => {
      if (!result.success) syncSaveOrderToFirestore(newOrder);
    });

    // Update customer points: strictly deduct used points and credit newly earned points
    let updatedCustomerObj: Customer;
    if (currentCustomer) {
      const remainingBase = Math.max(0, currentCustomer.points - pointsToDeduct);
      updatedCustomerObj = {
        ...currentCustomer,
        name: customerName.trim(),
        phone: customerPhone.trim(),
        address: customerAddress.trim() || currentCustomer.address,
        points: Number((remainingBase + totalEarnedPoints).toFixed(1)),
        totalOrders: currentCustomer.totalOrders + 1,
      };
    } else {
      // Auto-create customer profile with 50 welcome points plus earned points
      updatedCustomerObj = {
        id: 'cust-' + Date.now(),
        name: customerName.trim(),
        phone: customerPhone.trim(),
        address: customerAddress.trim(),
        points: Number((50 + totalEarnedPoints).toFixed(1)),
        tier: 'bronze',
        totalOrders: 1,
        joinedDate: new Date().toISOString(),
      };
    }

    saveCustomer(updatedCustomerObj);
    upsertSupabaseCustomer(updatedCustomerObj).then((result) => {
      if (!result.success) syncSaveCustomerToFirestore(updatedCustomerObj);
    });
    onCustomerUpdated?.(updatedCustomerObj);

    // Launch WhatsApp with detailed loyalty points audit
    const waUrl = createOrderWhatsAppUrl({
      items,
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        address: customerAddress.trim(),
      },
      pointsDiscount,
      earnedPoints: totalEarnedPoints,
      pointsUsed: pointsToDeduct,
      remainingPoints: currentCustomer ? remainingPointsAfterOrder : undefined,
      previousPoints: currentCustomer?.points,
      paymentMethod,
      notes: orderNotes.trim(),
    });

    setIsOrdered(true);
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      window.open(waUrl, '_blank');
      onClearCart();
    }, 1000);
  };

  return (
    <div
      id="cart-drawer-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col font-cairo text-right border-l border-slate-200 dark:border-slate-800"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-inner">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>سلة المشتريات</span>
                {items.length > 0 && (
                  <span className="bg-sky-600 text-white text-[11px] font-mono px-2 py-0.5 rounded-full font-bold">
                    {items.length} {items.length === 1 ? 'صنف' : 'أصناف'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                صيدلية الديب • توصيل سريع للمنازل
              </p>
            </div>
          </div>

          <button
            id="close-cart-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {isOrdered ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              تم تحويل طلبك لصيدلية الديب بنجاح!
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs mb-3">
              تم فتح الواتساب برقم الصيدلية (+201009097378) مع تفاصيل الطلب وبيانات التوصيل وحساب نقاط الولاء.
            </p>
            {pointsDiscount > 0 && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 dark:border-emerald-800 mb-6 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                🎉 تم خصم {pointsDiscount} جنيه من الفاتورة مقابل نقاط الولاء!
              </div>
            )}
            <button
              onClick={() => {
                setIsOrdered(false);
                onClose();
              }}
              className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-colors"
            >
              متابعة التسوق
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
              <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base mb-1">
              سلة التسوق فارغة حالياً
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-5">
              تصفح أصناف صيدلية الديب وأضف ما تحتاجه من أدوية ومستلزمات لتصلك فوراً.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold text-xs rounded-xl shadow-md hover:from-sky-700 hover:to-blue-700 transition-all"
            >
              تصفح الأدوية والمنتجات
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* SECTION 1: Items List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 text-[10px] font-bold flex items-center justify-center">
                    1
                  </span>
                  <span>أصناف ومشتريات السلة</span>
                </h4>
                <button
                  onClick={onClearCart}
                  className="text-[11px] text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>تفريغ السلة</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-sm"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.nameAr}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 bg-white"
                      referrerPolicy="no-referrer"
                    />

                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                        {item.product.nameAr}
                      </h5>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-sky-600 dark:text-sky-400 font-bold block">
                          {item.product.price} ج.م
                        </span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md">
                          +{(item.product.price / 100).toFixed(2)} نقطة
                        </span>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 shadow-sm">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, -1)}
                            className="text-slate-500 hover:text-rose-500 p-0.5 active:scale-95"
                            title="تقليل الكمية"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold px-2.5 font-mono">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, 1)}
                            className="text-slate-500 hover:text-emerald-500 p-0.5 active:scale-95"
                            title="زيادة الكمية"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                          title="حذف الصنف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-left font-black text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-mono">
                      {item.product.price * item.quantity} ج.م
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: Loyalty Points & Instant Discount */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <span>برنامج نقاط الولاء والخصم الفوري</span>
                </h4>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                  100 ج.م = 1 نقطة (1 ج.م خصم)
                </span>
              </div>

              {currentCustomer ? (
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    usePoints
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-emerald-400 dark:border-emerald-600 shadow-sm'
                      : 'bg-gradient-to-r from-amber-500/10 to-sky-500/10 dark:from-amber-950/30 dark:to-sky-950/30 border-amber-200/60 dark:border-amber-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        رصيد نقاطك الحالي: <strong className="text-amber-600 dark:text-amber-400 font-mono">{availablePoints} نقطة</strong>
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-mono">
                      تساوي {availablePoints} ج.م خصم
                    </span>
                  </div>

                  {maxPossibleDiscount > 0 ? (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2.5 cursor-pointer bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-300/60 dark:border-amber-800/60 hover:border-amber-400 transition-all shadow-sm">
                        <input
                          id="redeem-points-checkbox"
                          type="checkbox"
                          checked={usePoints}
                          onChange={(e) => setUsePoints(e.target.checked)}
                          className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 select-none">
                          خصم <strong className="text-emerald-600 dark:text-emerald-400 underline decoration-2 font-mono">{maxPossibleDiscount} جنيه</strong> من إجمالي الفاتورة الآن
                        </span>
                      </label>

                      {usePoints && (
                        <div className="p-2 bg-emerald-100/70 dark:bg-emerald-950/60 rounded-xl text-[11px] text-emerald-900 dark:text-emerald-200 font-semibold flex items-center justify-between border border-emerald-300/70">
                          <span>✅ سيتم خصم {pointsToDeduct} نقطة من حسابك</span>
                          <span>الرصيد المتبقي: {remainingPointsAfterOrder} نقطة</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      ستحصل من هذا الطلب على <strong>+{totalEarnedPoints} نقطة</strong> تضاف فوراً لحسابك وتستبدلها بخصم في طلباتك القادمة.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200/60 dark:border-sky-900/50 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-sky-900 dark:text-sky-200 block">
                      اكسب +{totalEarnedPoints} نقطة ولاء من هذا الطلب
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      أدخل هاتفك بالأسفل لتسجيل النقاط أو اضغط تسجيل
                    </span>
                  </div>
                  <button
                    onClick={onOpenLoyalty}
                    className="text-xs bg-sky-600 text-white font-bold px-3 py-1.5 rounded-xl shadow-sm hover:bg-sky-700 transition-colors shrink-0"
                  >
                    تسجيل حساب
                  </button>
                </div>
              )}
            </div>

            {/* SECTION 3: Customer Checkout Delivery Details (Required Section) */}
            <div
              id="customer-delivery-section"
              className={`p-3.5 rounded-2xl border transition-all ${
                hasAttemptedSubmit && Object.keys(errors).length > 0
                  ? 'border-2 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 text-[10px] font-bold flex items-center justify-center">
                    3
                  </span>
                  <span>بيانات العميل والتوصيل</span>
                </h4>
                <span className="text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  مطلوب لإتمام الطلب
                </span>
              </div>

              {/* Alert banner if data is missing upon submission */}
              {hasAttemptedSubmit && Object.keys(errors).length > 0 && (
                <div className="p-3 mb-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-500/80 rounded-xl flex items-start gap-2 text-rose-700 dark:text-rose-300 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <strong className="block font-bold">يرجى استكمال البيانات الناقصة أدناه:</strong>
                    الحقول المحددة باللون الأحمر مطلوبة حتى يتمكن مندوب صيدلية الديب من تجهيز وتوصيل طلبك.
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {/* Name Input */}
                <div>
                  <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>اسم العميل بالكامل</span>
                    </span>
                    <span className="text-[11px] text-rose-500 font-bold">* مطلوب</span>
                  </label>
                  <div className="relative">
                    <input
                      id="cart-input-name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="مثال: أحمد محمد علي"
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium outline-none transition-all ${
                        errors.name
                          ? 'border-2 border-rose-500 bg-rose-50/80 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/20'
                          : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-sky-500'
                      }`}
                    />
                    {errors.name && (
                      <span className="absolute left-3 top-2.5 text-rose-500 font-bold text-xs">
                        ⚠️
                      </span>
                    )}
                  </div>
                  {errors.name && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 mt-1 animate-in slide-in-from-top-1">
                      <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                      <span>{errors.name}</span>
                    </p>
                  )}
                </div>

                {/* Phone Input */}
                <div>
                  <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>رقم الهاتف للتواصل والدليفري</span>
                    </span>
                    <span className="text-[11px] text-rose-500 font-bold">* مطلوب</span>
                  </label>
                  <div className="relative">
                    <input
                      id="cart-input-phone"
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="مثال: 01012345678"
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium outline-none transition-all ${
                        errors.phone
                          ? 'border-2 border-rose-500 bg-rose-50/80 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/20'
                          : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-sky-500'
                      }`}
                    />
                    {errors.phone && (
                      <span className="absolute left-3 top-2.5 text-rose-500 font-bold text-xs">
                        ⚠️
                      </span>
                    )}
                  </div>
                  {errors.phone && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 mt-1 animate-in slide-in-from-top-1">
                      <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                      <span>{errors.phone}</span>
                    </p>
                  )}
                </div>

                {/* Address Input */}
                <div>
                  <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>عنوان التوصيل بالتفصيل</span>
                    </span>
                    <span className="text-[11px] text-rose-500 font-bold">* مطلوب للتوصيل</span>
                  </label>
                  <div className="relative">
                    <input
                      id="cart-input-address"
                      type="text"
                      required
                      value={customerAddress}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      placeholder="المنطقة، الشارع، رقم العمارة، الدور أو علامة مميزة"
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium outline-none transition-all ${
                        errors.address
                          ? 'border-2 border-rose-500 bg-rose-50/80 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/20'
                          : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-sky-500'
                      }`}
                    />
                    {errors.address && (
                      <span className="absolute left-3 top-2.5 text-rose-500 font-bold text-xs">
                        ⚠️
                      </span>
                    )}
                  </div>
                  {errors.address && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 mt-1 animate-in slide-in-from-top-1">
                      <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                      <span>{errors.address}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 4: Payment Method Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 text-[10px] font-bold flex items-center justify-center">
                    4
                  </span>
                  <span>طريقة الدفع عند الطلب</span>
                </h4>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  id="payment-method-cash"
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2.5 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>نقدي</span>
                  <span className="text-[9px] opacity-75 font-normal">عند الاستلام</span>
                </button>

                <button
                  id="payment-method-instapay"
                  type="button"
                  onClick={() => setPaymentMethod('instapay')}
                  className={`py-2.5 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    paymentMethod === 'instapay'
                      ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-800 dark:text-purple-300 shadow-sm ring-2 ring-purple-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>انستاباي</span>
                  <span className="text-[9px] opacity-75 font-normal">تحويل لحظي</span>
                </button>

                <button
                  id="payment-method-visa"
                  type="button"
                  onClick={() => setPaymentMethod('visa')}
                  className={`py-2.5 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    paymentMethod === 'visa'
                      ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-800 dark:text-sky-300 shadow-sm ring-2 ring-sky-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>فيزا / كارت</span>
                  <span className="text-[9px] opacity-75 font-normal">مع المندوب</span>
                </button>
              </div>
            </div>

            {/* SECTION 5: Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ملاحظات إضافية للصيدلي (اختياري):
              </label>
              <textarea
                rows={2}
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="اكتب أي ملاحظة عن الموعد المفضل، بدائل مقبولة، أو استفسارات..."
                className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium outline-none border border-transparent focus:border-sky-500 resize-none transition-colors"
              />
            </div>
          </div>
        )}

        {/* Footer with totals and WhatsApp button */}
        {items.length > 0 && !isOrdered && (
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>إجمالي الأصناف:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{subtotal} ج.م</span>
              </div>
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>خصم نقاط الولاء:</span>
                  <span className="font-mono">-{pointsDiscount} ج.م</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-800">
                <span>المبلغ النهائي المطلوب للدفع:</span>
                <span className="text-xl text-sky-600 dark:text-sky-400 font-mono font-black">{finalTotal} ج.م</span>
              </div>
            </div>

            <button
              id="whatsapp-checkout-btn"
              onClick={handleCheckout}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Send className="w-4 h-4 rotate-180" />
              <span>إرسال الطلب فوراً للواتساب (+201009097378)</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
