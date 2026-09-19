import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Sparkles, Info, Pill, Plus, Maximize2 } from 'lucide-react';
import { Product } from '../types';
import { isProductNew } from '../utils/productUtils';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, event: React.MouseEvent) => void;
  onViewDetails: (product: Product) => void;
  onZoomImage?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  onAddToCart,
  onViewDetails,
  onZoomImage,
}) => {
  return (
    <motion.div
      id={`product-card-${product.id}`}
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-sky-300 dark:hover:border-sky-800/80 transition-all duration-300 flex flex-col overflow-hidden group font-cairo"
    >
      {/* Thumbnail Container */}
      <div
        className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer"
        onClick={() => onViewDetails(product)}
      >
        <img
          src={product.image}
          alt={product.nameAr}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/eldeeb_logo.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Badges */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end z-10">
          {product.isComingSoon && (
            <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
              ⏳ قريباً
            </span>
          )}
          {product.isLowStock && !product.isComingSoon && (
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <span>⚠️ أوشك على النفاذ</span>
            </span>
          )}
          {!product.inStock && !product.isComingSoon && (
            <span className="bg-slate-800/90 text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              غير متوفر
            </span>
          )}
          {isProductNew(product) && (
            <span className="bg-sky-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              جديد
            </span>
          )}
          {product.oldPrice && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              خصم {Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Points Reward Pill */}
        <div className="absolute bottom-2.5 right-2.5 bg-amber-400/95 backdrop-blur-sm text-slate-950 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full shadow flex items-center gap-1">
          <Sparkles className="w-3 h-3 fill-amber-700 text-amber-700" />
          <span>+{product.points} نقطة</span>
        </div>

        {/* Zoom image icon button for customer mobile */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onZoomImage) {
              onZoomImage(product);
            } else {
              onViewDetails(product);
            }
          }}
          className="absolute bottom-2.5 left-2.5 w-7 h-7 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-xs transition-all shadow-md z-10 active:scale-90"
          title="تكبير صورة الدواء للشاشة"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Requires Prescription Pill */}
        {product.requiresPrescription && (
          <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
            روشتة
          </div>
        )}
      </div>

      {/* Details body */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between text-right">
        <div>
          {/* Dosage & active ingredient hint */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-semibold text-sky-700 dark:text-sky-300">
              {product.dosageForm}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(product);
              }}
              className="hover:text-sky-600 dark:hover:text-sky-400 p-0.5"
              title="تفاصيل إضافية"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Product Name */}
          <h3
            onClick={() => onViewDetails(product)}
            className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 line-clamp-2 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-colors leading-snug"
          >
            {product.nameAr}
          </h3>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-mono">
            {product.nameEn}
          </p>
        </div>

        {/* Price & Add to Cart Footer */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {product.price}
              </span>
              <span className="text-[10px] font-bold text-slate-500">ج.م</span>
            </div>
            {product.oldPrice && (
              <span className="text-[10px] text-slate-400 line-through -mt-1">
                {product.oldPrice} ج.م
              </span>
            )}
          </div>

          <button
            id={`add-to-cart-${product.id}`}
            type="button"
            onClick={(e) => onAddToCart(product, e)}
            disabled={!product.inStock || product.isComingSoon}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl font-bold text-xs shadow-sm transition-all active:scale-90 flex items-center gap-1.5 ${
              product.isComingSoon
                ? 'bg-purple-600/80 text-white cursor-not-allowed'
                : !product.inStock
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white hover:shadow'
            }`}
            title={product.isComingSoon ? 'سيتوفر قريباً' : 'إضافة إلى السلة'}
          >
            {product.isComingSoon ? (
              <span>قريباً</span>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <ShoppingCart className="w-3.5 h-3.5 hidden sm:inline" />
                <span className="hidden sm:inline">أضف</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
});
