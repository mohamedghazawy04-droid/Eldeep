import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { CloudRain, Sparkles } from 'lucide-react';

interface PharmacyDeliveryAnimationProps {
  isInteracting?: boolean;
}

/**
 * Serene Calm Rain & Motion Animation for Customer Registration & Loyalty
 * Autumn foliage/references removed per user request.
 * Pure, peaceful raindrops and soft atmospheric mist.
 */
export const PharmacyDeliveryAnimation: React.FC<PharmacyDeliveryAnimationProps> = ({ isInteracting }) => {
  const rainDrops = useMemo(() => {
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: `${(i * 4.5 + Math.random() * 2).toFixed(1)}%`,
      delay: (Math.random() * 4.8).toFixed(2),
      duration: (5.4 + Math.random() * 1.8).toFixed(2),
      opacity: Math.min(0.08, Number((0.035 + Math.random() * 0.045).toFixed(3))),
      height: 16 + (i % 3) * 6,
    }));
  }, []);

  return (
    <div className="relative w-full h-32 rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-850 to-slate-950 border border-sky-500/20 shadow-md select-none mb-4">
      {/* Background Mist */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-6 left-1/3 w-64 h-24 bg-sky-500/10 blur-2xl rounded-full animate-rain-mist-slow" />
        <div className="absolute -bottom-6 right-1/4 w-64 h-24 bg-blue-500/10 blur-2xl rounded-full animate-rain-mist-slow" />
      </div>

      {/* Gentle Rain Streaks */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {rainDrops.map((drop) => (
          <motion.div
            key={drop.id}
            initial={{ y: -20, opacity: 0 }}
            animate={{
              y: [-15, 160],
              opacity: [0, drop.opacity, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: parseFloat(drop.duration),
              delay: parseFloat(drop.delay),
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              left: drop.left,
              width: '1.2px',
              height: `${drop.height}px`,
              background: 'linear-gradient(to bottom, rgba(186, 230, 253, 0), rgba(186, 230, 253, 0.25))',
              transform: 'rotate(8deg)',
              transitionDelay: `${drop.delay}s`,
              animationDelay: `${drop.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Atmospheric peaceful message */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          animate={isInteracting ? { scale: 1.02 } : { scale: 1 }}
          transition={{ duration: 0.25 }}
          className="space-y-1"
        >
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-200 bg-sky-950/60 backdrop-blur-sm px-3 py-1 rounded-full border border-sky-400/20 mb-1">
            <CloudRain className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>تساقط أمطار هادئ وانسيابي</span>
          </div>
          <p className="text-[11px] text-slate-300 max-w-sm">
            بياناتك محفوظة بشكل تلقائي ودائم لاستخدامها في كل زيارة قادمة
          </p>
        </motion.div>
      </div>

      {/* Ground mist */}
      <div className="absolute bottom-0 inset-x-0 h-2 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
    </div>
  );
};
