import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Trash2, Plus, Minus, Send, ShoppingBag, Sparkles, MapPin, User, Phone, CheckCircle, Tag } from 'lucide-react';
import { CartItem, Customer } from '../types';
import { createOrderWhatsAppUrl } from '../services/whatsapp';
import { saveOrder, saveCustomer } from '../services/storage';
import { syncSaveOrderToFirestore, syncSaveCustomerToFirestore } from '../services/firestoreSync';
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
}) => {
  const [usePoints, setUsePoints] = useState(false);
  const [customerName, setCustomerName] = useState(activeCustomer?.name || '');
  const [customerPhone, setCustomerPhone] = useState(activeCustomer?.phone || '');
  const [customerAddress, setCustomerAddress] = useState(activeCustomer?.address || '');
  const [orderNotes, setOrderNotes] = useState('');
  const [isOrdered, setIsOrdered] = useState(false);

  if (!isOpen) return null;

  // Subtotal
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Points earned based on price: 10 points per 1 EGP spent
  const basePointsFromSpend = Math.round(subtotal * 10);
  const productBonusPoints = items.reduce((sum, item) => sum + item.product.points * item.quantity, 0);
  
  // Tier multiplier
  const multiplier = activeCustomer?.tier === 'diamond' ? 2 : activeCustomer?.tier === 'gold' ? 1.5 : activeCustomer?.tier === 'silver' ? 1.2 : 1;
  const totalEarnedPoints = Math.round((basePointsFromSpend + productBonusPoints) * multiplier);

  // Points redemption calculation: 1000 points = 10 EGP discount (100 points = 1 EGP)
  const availablePoints = activeCustomer?.points || 0;
  const maxPossibleDiscount = Math.floor((availablePoints / 1000) * 10);
  const pointsDiscount = usePoints ? Math.min(subtotal, maxPossibleDiscount) : 0;
  const pointsToDeduct = usePoints ? availablePoints : 0;
  const finalTotal = Math.max(0, subtotal - pointsDiscount);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('يرجى إدخال اسمك ورقم هاتفك لتأكيد الطلب');
      return;
    }

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
    syncSaveOrderToFirestore(newOrder);

    // Update customer points: if redeemed, points are zeroed out then new order points added
    if (activeCustomer) {
      const remainingPoints = usePoints ? 0 : activeCustomer.points;
      const updatedCustomer: Customer = {
        ...activeCustomer,
        name: customerName.trim(),
        phone: customerPhone.trim(),
        address: customerAddress.trim() || activeCustomer.address,
        points: Math.max(0, remainingPoints + totalEarnedPoints),
        totalOrders: activeCustomer.totalOrders + 1,
      };
      saveCustomer(updatedCustomer);
      syncSaveCustomerToFirestore(updatedCustomer);
    }

    // Launch WhatsApp
    const waUrl = createOrderWhatsAppUrl(
      items,
      {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        address: customerAddress.trim(),
      },
      pointsDiscount,
      totalEarnedPoints,
      orderNotes
    );

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
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">سلة المشتريات</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {items.length} {items.length === 1 ? 'صنف مختار' : 'أصناف مختارة'}
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
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              تم تحويل طلبك لصيدلية الديب بنجاح!
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs mb-6">
              تم فتح الواتساب برقم الصيدلية (+201009097378) مع تفاصيل طلبك وحساب النقاط.
            </p>
            <button
              onClick={() => {
                setIsOrdered(false);
                onClose();
              }}
              className="bg-sky-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs"
            >
              متابعة التسوق
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <ShoppingBag className="w-16 h-16 stroke-1 mb-3 text-slate-300 dark:text-slate-700" />
            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-base mb-1">
              سلة التسوق فارغة حالياً
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mb-5">
              تصفح أقسام الصيدلية وأضف الأدوية والمستلزمات لتصلك فوراً إلى باب المنزل.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow hover:bg-sky-700 transition-colors"
            >
              تصفح الأدوية
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Items List */}
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.nameAr}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    referrerPolicy="no-referrer"
                  />

                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                      {item.product.nameAr}
                    </h5>
                    <span className="text-[11px] text-sky-600 dark:text-sky-400 font-bold block">
                      {item.product.price} ج.م
                    </span>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 px-1.5 py-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="text-slate-500 hover:text-rose-500 p-0.5"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-2 font-mono">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="text-slate-500 hover:text-emerald-500 p-0.5"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-left font-black text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                    {item.product.price * item.quantity} ج.م
                  </div>
                </div>
              ))}
            </div>

            {/* Loyalty Points Redemption Box */}
            {activeCustomer ? (
              <div className="p-3.5 bg-gradient-to-r from-amber-500/10 to-sky-500/10 dark:from-amber-950/30 dark:to-sky-950/30 rounded-2xl border border-amber-200/50 dark:border-amber-800/40">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      نقاط الولاء المتاحة: {availablePoints} نقطة
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    تساوي خصم {maxPossibleDiscount} ج.م (كل 1000 نقطة = 10 ج.م)
                  </span>
                </div>

                {maxPossibleDiscount > 0 ? (
                  <label className="flex items-center gap-2 cursor-pointer mt-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl border border-amber-300/40">
                    <input
                      type="checkbox"
                      checked={usePoints}
                      onChange={(e) => setUsePoints(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                    />
                    <span>
                      استبدال وتصفير النقاط للحصول على خصم <strong>{pointsDiscount} جنيه</strong> فورياً
                    </span>
                  </label>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    اطلب هذا الأوردر واكسب <strong>+{totalEarnedPoints} نقطة</strong> (10 نقاط لكل 1 جنيه) لتستخدمها في طلبك القادم!
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200/60 dark:border-sky-900/50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-sky-900 dark:text-sky-200 block">
                    اكسب +{totalEarnedPoints} نقطة ولاء
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    سجل حسابك مجاناً لتجميع النقاط
                  </span>
                </div>
                <button
                  onClick={onOpenLoyalty}
                  className="text-xs bg-sky-600 text-white font-bold px-3 py-1.5 rounded-xl shadow-sm hover:bg-sky-700 transition-colors"
                >
                  تسجيل حساب
                </button>
              </div>
            )}

            {/* Customer checkout details */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                بيانات التوصيل للواتساب:
              </h4>

              <div>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="اسمك بالكامل *"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium outline-none border border-transparent focus:border-sky-500"
                />
              </div>

              <div>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="رقم الهاتف للتواصل *"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium outline-none border border-transparent focus:border-sky-500"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="عنوان التوصيل (الشارع، العمارة، الشقة)"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium outline-none border border-transparent focus:border-sky-500"
                />
              </div>

              <div>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="ملاحظات للصيدلي (اختياري)..."
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium outline-none border border-transparent focus:border-sky-500 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer with totals and WhatsApp button */}
        {items.length > 0 && !isOrdered && (
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>مجموع الأصناف:</span>
                <span className="font-bold text-slate-900 dark:text-white">{subtotal} ج.م</span>
              </div>
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>خصم نقاط الولاء:</span>
                  <span className="font-bold">-{pointsDiscount} ج.م</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-800">
                <span>المبلغ المطلوب:</span>
                <span className="text-lg text-sky-600 dark:text-sky-400">{finalTotal} ج.م</span>
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
