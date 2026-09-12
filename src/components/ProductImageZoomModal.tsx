import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, RotateCcw, ShoppingBag, Sparkles, Check } from 'lucide-react';
import { Product } from '../types';

interface ProductImageZoomModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product, event: React.MouseEvent) => void;
}

export const ProductImageZoomModal: React.FC<ProductImageZoomModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [addedAnimation, setAddedAnimation] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !product) return null;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 3.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDoubleTap = () => {
    if (scale > 1) {
      handleReset();
    } else {
      setScale(2);
    }
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    if (onAddToCart) {
      onAddToCart(product, e);
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div
        id="product-image-zoom-backdrop"
        className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between font-cairo text-right select-none overflow-hidden"
        onClick={onClose}
      >
        {/* Top bar */}
        <div
          className="p-4 sm:p-5 flex items-center justify-between text-white z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <button
              id="close-image-zoom-btn"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all border border-white/10 shadow-lg"
              title="إغلاق المعاينة"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs text-slate-400">معاينة تفصيلية لعلبة الدواء</span>
              <h4 className="text-sm font-bold text-white truncate max-w-xs">{product.nameAr}</h4>
            </div>
          </div>

          {/* Floating Zoom Controls */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-xl">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="p-2 text-slate-300 hover:text-white disabled:opacity-30 active:scale-90 transition-all rounded-full hover:bg-white/10"
              title="تصغير"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2 text-sky-400 font-bold">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 3.5}
              className="p-2 text-slate-300 hover:text-white disabled:opacity-30 active:scale-90 transition-all rounded-full hover:bg-white/10"
              title="تكبير"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {scale > 1 && (
              <button
                onClick={handleReset}
                className="p-2 text-amber-400 hover:text-amber-300 active:scale-90 transition-all rounded-full hover:bg-white/10 text-xs flex items-center gap-1"
                title="إعادة ضبط الحجم"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Center Image Container with gesture / drag */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center p-3 overflow-hidden relative cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={handleDoubleTap}
        >
          <motion.div
            drag={scale > 1}
            dragConstraints={containerRef}
            dragElastic={0.1}
            animate={{ scale, x: position.x, y: position.y }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full h-full flex items-center justify-center max-w-lg sm:max-w-2xl max-h-[70vh]"
          >
            <img
              src={product.image}
              alt={product.nameAr}
              className="max-h-[68vh] max-w-[92vw] sm:max-w-full object-contain rounded-2xl shadow-2xl drop-shadow-2xl pointer-events-auto"
              draggable={false}
              referrerPolicy="no-referrer"
            />
          </motion.div>

          {/* Hint for mobile gestures */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-slate-300 text-[11px] px-3 py-1 rounded-full pointer-events-none opacity-70">
            انقر مرتين للتكبير، أو اسحب للتحريك
          </div>
        </div>

        {/* Bottom Bar: Product summary & Quick Cart Action */}
        <div
          className="p-4 sm:p-5 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent text-white z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-lg p-3.5 sm:p-4 rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {product.dosageForm || 'علاج'}
                </span>
                {product.activeIngredient && (
                  <span className="text-[11px] text-slate-400 truncate max-w-[160px]">
                    {product.activeIngredient}
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">{product.nameAr}</h3>
              <p className="text-[11px] text-slate-400 font-mono">{product.nameEn}</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
              <div className="text-right">
                <span className="text-lg sm:text-xl font-black text-sky-400">
                  {product.price.toFixed(2)} ج.م
                </span>
                <div className="flex items-center gap-1 text-[10px] text-amber-400">
                  <Sparkles className="w-3 h-3" />
                  <span>+{product.points} نقطة ولاء</span>
                </div>
              </div>

              {onAddToCart && product.inStock && (
                <button
                  type="button"
                  onClick={handleAddToCartClick}
                  className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 text-white rounded-xl font-bold text-xs shadow-lg flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  {addedAnimation ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>أضيف للسلة!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>إضافة للسلة</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
