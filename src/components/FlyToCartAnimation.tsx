import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';

export interface FlyingProductItem {
  id: string;
  image: string;
  nameAr: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
}

interface FlyToCartAnimationProps {
  flyingItems: FlyingProductItem[];
  onComplete: (id: string) => void;
}

export const FlyToCartAnimation: React.FC<FlyToCartAnimationProps> = ({
  flyingItems,
  onComplete,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {flyingItems.map((item) => {
          const deltaX = item.targetX - item.startX;
          const deltaY = item.targetY - item.startY;

          return (
            <motion.div
              key={item.id}
              initial={{
                x: item.startX - 28,
                y: item.startY - 28,
                scale: 1,
                opacity: 1,
                rotate: 0,
              }}
              animate={{
                // Parabolic trajectory towards header cart
                x: [
                  item.startX - 28,
                  item.startX + deltaX * 0.4 - 28,
                  item.targetX - 20,
                ],
                y: [
                  item.startY - 28,
                  Math.min(item.startY, item.targetY) - 50,
                  item.targetY - 20,
                ],
                scale: [1, 1.15, 0.25],
                opacity: [1, 1, 0.4],
                rotate: [0, -15, 20],
              }}
              transition={{
                duration: 0.75,
                ease: [0.22, 1, 0.36, 1], // snappy cubic bezier
                times: [0, 0.45, 1],
              }}
              onAnimationComplete={() => {
                // Dispatch event so Navbar cart button wiggles/pops
                window.dispatchEvent(new CustomEvent('cart_item_landed'));
                onComplete(item.id);
              }}
              className="absolute w-14 h-14 rounded-2xl p-1 bg-white dark:bg-slate-900 border-2 border-sky-500 shadow-2xl flex items-center justify-center pointer-events-none"
            >
              <img
                src={item.image}
                alt={item.nameAr}
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-md">
                +1
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
