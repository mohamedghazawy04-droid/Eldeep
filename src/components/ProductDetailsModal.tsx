import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  ShoppingCart,
  MessageCircle,
  AlertTriangle,
  Check,
  Sparkles,
  Pill,
  ShieldCheck,
  Tag,
  Calculator,
  ChevronDown,
  ChevronUp,
  Maximize2,
} from 'lucide-react';
import { Product } from '../types';
import { isProductNew } from '../utils/productUtils';
import { createProductInquiryWhatsAppUrl, openWhatsApp } from '../services/whatsapp';
import { DosageCalculator } from './DosageCalculator';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, event?: React.MouseEvent) => void;
  onZoomImage?: (product: Product) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onZoomImage,
}) => {
  const [showCalculator, setShowCalculator] = useState(true);

  useEffect(() => {
    if (product) {
      const isMedicine =
        product.category === 'medicines' ||
        product.category === 'baby' ||
        Boolean(product.dosageForm && (product.dosageForm.includes('شراب') || product.dosageForm.includes('نقط') || product.dosageForm.includes('أقراص')));
      setShowCalculator(isMedicine);
    }
  }, [product]);

  if (!product) return null;

  const handleInquiry = () => {
    const url = createProductInquiryWhatsAppUrl(product);
    openWhatsApp(url);
  };

  return (
    <div
      id="product-details-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-sky-100 dark:border-slate-800 overflow-hidden font-cairo my-auto max-h-[90vh] flex flex-col"
      >
        {/* Header with image - click anywhere to zoom */}
        <div
          className="relative h-64 sm:h-72 w-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-3 cursor-zoom-in group select-none border-b border-slate-200 dark:border-slate-800 overflow-hidden"
          onClick={() => onZoomImage && onZoomImage(product)}
          title="انقر لتكبير صورة العلبة للشاشة كاملة"
        >
          <img
            src={product.image}
            alt={product.nameAr}
            className="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

          {/* Floating Action: Click to Zoom Banner */}
          <div className="absolute top-3 left-14 bg-slate-900/80 hover:bg-sky-600 text-white px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md transition-all shadow-lg flex items-center gap-1.5 border border-white/15">
            <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
            <span>تكبير الصورة 🔍</span>
          </div>

          {/* Close button */}
          <button
            id="close-product-details-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors backdrop-blur-sm shadow z-10 cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Points badge */}
          <div className="absolute top-3 right-3 bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 z-10">
            <Sparkles className="w-3.5 h-3.5 fill-amber-700 text-amber-700" />
            <span>+{product.points} نقطة ولاء (100 ج.م = 1 نقطة)</span>
          </div>

          {/* Title on Image */}
          <div className="absolute bottom-3 right-3 left-3 text-white text-right">
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              {product.requiresPrescription && (
                <span className="inline-block bg-rose-600/90 text-white text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                  يلزم روشتة طبية
                </span>
              )}
              {isProductNew(product) && (
                <span className="inline-block bg-sky-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm shadow-sm">
                  صنف جديد
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-lg sm:text-xl leading-snug drop-shadow-md">
              {product.nameAr}
            </h3>
            <p className="text-xs text-sky-200 font-medium tracking-wide">
              {product.nameEn}
            </p>
          </div>
        </div>

        {/* Details Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-right">
          {/* Price & Stock */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
                {product.price} <span className="text-sm font-bold">ج.م</span>
              </span>
              {product.oldPrice && (
                <span className="text-sm text-slate-400 line-through">
                  {product.oldPrice} ج.م
                </span>
              )}
            </div>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                product.isComingSoon
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300'
                  : product.isLowStock
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                  : product.inStock
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
              }`}
            >
              <Check className="w-3 h-3" />
              <span>
                {product.isComingSoon
                  ? '⏳ قريباً بالصيدلية'
                  : product.isLowStock
                  ? '⚠️ أوشك على النفاذ (كمية محدودة)'
                  : product.inStock
                  ? 'متوفر بالصيدلية'
                  : 'غير متوفر حالياً'}
              </span>
            </span>
          </div>

          {/* Active Ingredient */}
          <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-100 dark:border-sky-900/50">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900 dark:text-sky-300 mb-1">
              <Pill className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>المادة الفعالة والشكل الصيدلي:</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">
              {product.activeIngredient} • <span className="font-bold">{product.dosageForm}</span>
            </p>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              دواعي الاستعمال:
            </h4>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {product.description}
            </p>
          </div>

          {/* Usage & Warnings */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block mb-0.5">طريقة الاستخدام والجرعة:</strong>
              <p>{product.usage}</p>
            </div>
          </div>

          {/* Dosage Calculator Tool */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              id="toggle-dosage-calc-btn"
              onClick={() => setShowCalculator((prev) => !prev)}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 border border-sky-200 dark:border-sky-800/60 flex items-center justify-between text-xs font-bold text-sky-900 dark:text-sky-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>حاسبة الجرعات الدوائية حسب الوزن</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-sky-200/90 dark:bg-sky-900 text-sky-900 dark:text-sky-100 px-2.5 py-0.5 rounded-full font-bold">
                  {showCalculator ? 'إخفاء الحاسبة' : 'احسب الجرعة الآن'}
                </span>
                {showCalculator ? <ChevronUp className="w-4 h-4 text-sky-600" /> : <ChevronDown className="w-4 h-4 text-sky-600" />}
              </div>
            </button>

            {showCalculator && <DosageCalculator product={product} />}
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {product.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-lg flex items-center gap-1"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              id="add-to-cart-from-modal-btn"
              onClick={(e) => {
                onAddToCart(product, e);
                onClose();
              }}
              disabled={!product.inStock || product.isComingSoon}
              className={`py-3.5 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                product.isComingSoon
                  ? 'bg-purple-600/80 text-white cursor-not-allowed'
                  : !product.inStock
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{product.isComingSoon ? 'سيتوفر قريباً بالصيدلية' : 'إضافة إلى السلة'}</span>
            </button>

            <button
              id="inquire-whatsapp-btn"
              onClick={handleInquiry}
              className="py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>استفسار صيدلي واتساب</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
