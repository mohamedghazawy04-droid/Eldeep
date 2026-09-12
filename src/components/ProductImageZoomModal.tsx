import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, RotateCcw, ShoppingBag, Sparkles, Check, Move, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductImageZoomModalProps {
  product: Product | null;
  isOpen?: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product, event: React.MouseEvent) => void;
}

export const ProductImageZoomModal: React.FC<ProductImageZoomModalProps> = ({
  product,
  isOpen = true,
  onClose,
  onAddToCart,
}) => {
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [imgError, setImgError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom whenever product changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setImgError(false);
  }, [product?.id]);

  // Keyboard navigation: Escape closes, + zooms in, - zooms out, 0 resets
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setScale((prev) => Math.min(prev + 0.5, 4));
      } else if (e.key === '-') {
        setScale((prev) => {
          const next = Math.max(prev - 0.5, 1);
          if (next === 1) setPosition({ x: 0, y: 0 });
          return next;
        });
      } else if (e.key === '0') {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen || !product) return null;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
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

  // Toggle zoom on image click (1x -> 2x -> 3x -> 1x)
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale === 1) {
      setScale(2);
    } else if (scale < 3) {
      setScale(3);
    } else {
      handleReset();
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.25, 4));
    } else {
      setScale((prev) => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
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
        className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between font-cairo text-right select-none overflow-hidden"
        onClick={onClose}
        onWheel={handleWheel}
      >
        {/* Top bar controls */}
        <div
          className="p-3 sm:p-5 flex items-center justify-between text-white z-30 bg-gradient-to-b from-slate-950/90 to-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button & Product Title */}
          <div className="flex items-center gap-3">
            <button
              id="close-image-zoom-btn"
              onClick={onClose}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/15 hover:bg-rose-600 active:scale-95 text-white flex items-center justify-center transition-all border border-white/20 shadow-xl cursor-pointer"
              title="إغلاق المعاينة (Esc)"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-sky-400">معاينة وتكبير صورة العلبة</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/30">
                  {product.dosageForm || 'دواء'}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white truncate max-w-xs sm:max-w-md">
                {product.nameAr}
              </h3>
            </div>
          </div>

          {/* Floating Zoom Controls */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 rounded-full border border-white/20 shadow-2xl">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="p-1.5 sm:p-2 text-slate-300 hover:text-white disabled:opacity-30 active:scale-90 transition-all rounded-full hover:bg-white/10"
              title="تصغير (-)"
            >
              <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={() => {
                if (scale === 1) setScale(2);
                else handleReset();
              }}
              className="text-xs sm:text-sm font-mono px-2 text-sky-400 font-extrabold hover:underline"
              title="انقر لإعادة الضبط"
            >
              {Math.round(scale * 100)}%
            </button>

            <button
              onClick={handleZoomIn}
              disabled={scale >= 4}
              className="p-1.5 sm:p-2 text-slate-300 hover:text-white disabled:opacity-30 active:scale-90 transition-all rounded-full hover:bg-white/10"
              title="تكبير (+)"
            >
              <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {scale > 1 && (
              <button
                onClick={handleReset}
                className="p-1.5 sm:p-2 text-amber-400 hover:text-amber-300 active:scale-90 transition-all rounded-full hover:bg-white/10 text-xs flex items-center gap-1"
                title="إعادة ضبط الحجم (100%)"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline text-[11px] font-bold">100%</span>
              </button>
            )}
          </div>
        </div>

        {/* Center Canvas with Gesture / Drag & Zoom */}
        <div
          ref={containerRef}
          className={`flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden relative ${
            scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
          }`}
          onClick={handleImageClick}
        >
          {imgError ? (
            <div className="text-center p-6 bg-slate-900/80 rounded-3xl border border-white/10 text-slate-300 max-w-sm">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="font-bold text-sm text-white mb-1">{product.nameAr}</p>
              <p className="text-xs text-slate-400">صورة العلبة قيد التحديث في صيدلية الديب</p>
            </div>
          ) : (
            <motion.div
              drag={scale > 1}
              dragConstraints={containerRef}
              dragElastic={0.15}
              animate={{ scale, x: position.x, y: position.y }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="w-full h-full flex items-center justify-center max-w-4xl max-h-[75vh]"
            >
              <img
                src={product.image}
                alt={product.nameAr}
                onError={() => setImgError(true)}
                className="max-h-[72vh] max-w-[94vw] sm:max-w-full object-contain rounded-2xl shadow-2xl drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 bg-slate-900/50 p-2 pointer-events-auto select-none"
                draggable={false}
                referrerPolicy="no-referrer"
              />
            </motion.div>
          )}

          {/* Interactive Tooltip / Hint */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-white/15 text-slate-200 text-xs px-4 py-1.5 rounded-full pointer-events-none shadow-lg flex items-center gap-2">
            {scale > 1 ? (
              <>
                <Move className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                <span>اسحب للتحريك في جميع الاتجاهات • انقر لإعادة الضبط</span>
              </>
            ) : (
              <>
                <ZoomIn className="w-3.5 h-3.5 text-sky-400" />
                <span>انقر على الصورة للتكبير • أو استخدم بكرة الماوس / أزرار + و -</span>
              </>
            )}
          </div>
        </div>

        {/* Bottom Bar: Product summary & Quick Cart Action */}
        <div
          className="p-3 sm:p-5 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent text-white z-30"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/95 backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl border border-white/15 shadow-2xl">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {product.category}
                </span>
                {product.activeIngredient && (
                  <span className="text-[11px] text-slate-300 truncate max-w-[200px]">
                    المادة: {product.activeIngredient}
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">{product.nameAr}</h3>
              <p className="text-xs text-slate-400 font-mono">{product.nameEn}</p>
            </div>

            <div className="flex items-center gap-4 justify-between sm:justify-end border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black text-sky-400">
                  {product.price.toFixed(2)} ج.م
                </span>
                <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+{product.points} نقطة ولاء (100 ج.م = 1 نقطة)</span>
                </div>
              </div>

              {onAddToCart && product.inStock && (
                <button
                  type="button"
                  onClick={handleAddToCartClick}
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xl flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
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
