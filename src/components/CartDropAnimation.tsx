import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Check, Sparkles } from 'lucide-react';
import { Product } from '../types';

export interface CartDropPayload {
  product: Product;
  quantity?: number;
}

interface CartDropAnimationProps {
  payload: CartDropPayload | null;
  onAnimationComplete: () => void;
}

export const CartDropAnimation: React.FC<CartDropAnimationProps> = ({
  payload,
  onAnimationComplete,
}) => {
  if (!payload) return null;

  return (
    <AnimatePresence>
      <div
        id="cart-drop-overlay"
        className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ x: 120, opacity: 0, scale: 0.8 }}
          animate={{
            x: [120, 0, 0, -140],
            opacity: [0, 1, 1, 0],
            scale: [0.8, 1, 1, 0.7],
          }}
          transition={{
            duration: 1.8,
            times: [0, 0.25, 0.75, 1],
            ease: 'easeInOut',
          }}
          onAnimationComplete={onAnimationComplete}
          className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-5 shadow-2xl border-2 border-sky-400 dark:border-sky-500/50 flex flex-col items-center min-w-[220px] max-w-[280px]"
        >
          {/* Sparkles on top */}
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: [0, 1.2, 1], rotate: [0, 90, 180] }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="absolute -top-3 -right-2 text-amber-400"
          >
            <Sparkles className="w-6 h-6 fill-amber-300 drop-shadow" />
          </motion.div>

          {/* Dropping Item Thumbnail */}
          <div className="h-16 w-full relative flex items-center justify-center">
            <motion.div
              initial={{ y: -65, scale: 0.4, rotate: -25, opacity: 0 }}
              animate={{
                y: [-65, 0, -8, 0],
                scale: [0.4, 1.1, 0.95, 1],
                rotate: [-25, 10, -5, 0],
                opacity: [0, 1, 1, 1],
              }}
              transition={{
                delay: 0.35,
                duration: 0.65,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className="w-12 h-12 rounded-xl overflow-hidden shadow-md border-2 border-sky-300 dark:border-sky-700 bg-white z-10"
            >
              <img
                src={payload.product.image}
                alt={payload.product.nameAr}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>

          {/* Mini Shopping Cart Basket */}
          <motion.div
            animate={{
              scale: [1, 1.08, 0.95, 1],
              rotate: [0, -3, 3, 0],
            }}
            transition={{
              delay: 0.7,
              duration: 0.45,
            }}
            className="w-16 h-14 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg relative -mt-3"
          >
            <ShoppingCart className="w-8 h-8 drop-shadow" />
            
            {/* Added badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.8, duration: 0.3 }}
              className="absolute -top-1 -left-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow"
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </motion.div>
          </motion.div>

          {/* Item Name & Feedback */}
          <div className="text-center mt-3 font-cairo">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
              {payload.product.nameAr}
            </p>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              تمت الإضافة للسلة بنجاح ✨
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
