import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { CloudRain, Sparkles, ShieldCheck } from 'lucide-react';

interface CalmRainProps {
  isFocused?: boolean;
  mode?: 'banner' | 'backdrop';
}

/**
 * Calm, serene rain animation.
 * Autumn foliage/leaves and autumn references removed completely per user request.
 * Pure, gentle rain droplets and soft misty motion that gracefully drift behind inputs and content.
 */
export const DeliveryCaptainAnimation: React.FC<CalmRainProps> = ({
  isFocused = false,
  mode = 'banner',
}) => {
  // Generate fine background raindrops - Slow, peaceful, fluid drift with random transition-delays
  const fineRain = useMemo(() => {
    return Array.from({ length: 36 }, (_, i) => {
      const randDelay = (Math.random() * 5.8).toFixed(2);
      const randDur = (5.2 + Math.random() * 2.2).toFixed(2);
      const randOpacity = Math.min(0.08, Number((0.035 + Math.random() * 0.045).toFixed(3)));
      return {
        id: `fine-${i}`,
        left: `${(i * 2.75 + (i % 3) * 0.4).toFixed(1)}%`,
        delay: randDelay,
        duration: randDur,
        opacity: randOpacity,
        height: 18 + (i % 4) * 6,
      };
    });
  }, []);

  // Generate foreground luminous raindrops - Gentle, non-obtrusive, drifting slowly with random transition-delays
  const foregroundRain = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const randDelay = (Math.random() * 5.2).toFixed(2);
      const randDur = (5.8 + Math.random() * 2.0).toFixed(2);
      const randOpacity = Math.min(0.08, Number((0.045 + Math.random() * 0.035).toFixed(3)));
      return {
        id: `fg-${i}`,
        left: `${(i * 6.8 + 3).toFixed(1)}%`,
        delay: randDelay,
        duration: randDur,
        opacity: randOpacity,
        height: 22 + (i % 3) * 6,
      };
    });
  }, []);

  // Soft gentle water ripples at the bottom - slow expanding waves
  const ripples = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: `rip-${i}`,
      left: `${14 + i * 15}%`,
      bottom: `${4 + (i % 3) * 3}%`,
      delay: (Math.random() * 4.2).toFixed(2),
      duration: (4.0 + (i % 2) * 0.8).toFixed(2),
      size: 18 + (i % 3) * 8,
    }));
  }, []);

  if (mode === 'backdrop') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {/* Deep calm ambient background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 opacity-95" />
        <div className="absolute -top-24 left-1/4 w-96 h-48 bg-sky-500/10 blur-3xl rounded-full animate-rain-mist-slow" />
        <div className="absolute top-1/2 -right-16 w-80 h-56 bg-blue-600/10 blur-3xl rounded-full animate-rain-mist-slow" />
        <div className="absolute -bottom-16 left-1/3 w-96 h-48 bg-teal-500/10 blur-3xl rounded-full animate-rain-mist-slow" />

        {/* Gentle background mist pulse */}
        <motion.div
          animate={{
            x: [-15, 15, -15],
            opacity: [0.04, 0.08, 0.04],
          }}
          transition={{
            repeat: Infinity,
            duration: 16,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-400/5 via-transparent to-transparent pointer-events-none"
        />

        {/* Fine Rain Streaks (Distant, Slow & Subtle <= 0.08 opacity) */}
        {fineRain.map((drop) => (
          <motion.div
            key={drop.id}
            initial={{ y: -40, opacity: 0 }}
            animate={{
              y: [-30, 780],
              opacity: [0, drop.opacity, drop.opacity, 0],
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
              width: '1px',
              height: `${drop.height}px`,
              background: 'linear-gradient(to bottom, rgba(186, 230, 253, 0), rgba(186, 230, 253, 0.22))',
              transform: 'rotate(8deg)',
              transitionDelay: `${drop.delay}s`,
              animationDelay: `${drop.delay}s`,
            }}
          />
        ))}

        {/* Foreground Luminous Raindrops (Slow & Fluid <= 0.08 opacity) */}
        {foregroundRain.map((drop) => (
          <motion.div
            key={drop.id}
            initial={{ y: -50, opacity: 0 }}
            animate={{
              y: [-40, 780],
              opacity: [0, drop.opacity, drop.opacity * 0.8, 0],
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
              width: '1.5px',
              height: `${drop.height}px`,
              background: 'linear-gradient(to bottom, rgba(224, 242, 254, 0), rgba(125, 211, 252, 0.25), rgba(56, 189, 248, 0.1))',
              transform: 'rotate(8deg)',
              boxShadow: '0 0 2px rgba(56, 189, 248, 0.08)',
              transitionDelay: `${drop.delay}s`,
              animationDelay: `${drop.delay}s`,
            }}
          />
        ))}

        {/* Soft water ripples at bottom (Gentle wave expansion) */}
        {ripples.map((rip) => (
          <motion.div
            key={rip.id}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{
              scale: [0.2, 1.3, 1.6],
              opacity: [0, 0.08, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: parseFloat(rip.duration),
              delay: parseFloat(rip.delay),
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              left: rip.left,
              bottom: rip.bottom,
              width: `${rip.size}px`,
              height: `${rip.size * 0.35}px`,
              borderRadius: '50%',
              border: '1px solid rgba(186, 230, 253, 0.15)',
              transitionDelay: `${rip.delay}s`,
              animationDelay: `${rip.delay}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Banner mode (compact peaceful display)
  return (
    <div
      id="calm-rain-stage"
      className="relative w-full h-32 sm:h-36 bg-gradient-to-b from-slate-900 via-slate-850 to-slate-950 rounded-2xl overflow-hidden border border-sky-500/20 shadow-xl flex flex-col justify-between select-none"
    >
      {/* Ambient Cool Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-8 left-1/4 w-72 h-32 bg-sky-500/10 blur-3xl rounded-full animate-rain-mist-slow" />
        <div className="absolute -bottom-8 right-1/4 w-72 h-32 bg-blue-500/10 blur-3xl rounded-full animate-rain-mist-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/15 via-transparent to-slate-950/80" />
      </div>

      {/* Gentle Falling Raindrops (Slow & Fluid) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {fineRain.slice(0, 20).map((drop) => (
          <motion.div
            key={drop.id}
            initial={{ y: -30, opacity: 0 }}
            animate={{
              y: [-20, 180],
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

        {foregroundRain.slice(0, 8).map((drop) => (
          <motion.div
            key={drop.id}
            initial={{ y: -30, opacity: 0 }}
            animate={{
              y: [-25, 180],
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
              width: '1.5px',
              height: `${drop.height + 4}px`,
              background: 'linear-gradient(to bottom, rgba(224, 242, 254, 0), rgba(56, 189, 248, 0.25))',
              transform: 'rotate(8deg)',
              transitionDelay: `${drop.delay}s`,
              animationDelay: `${drop.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Top Header Information Tag */}
      <div className="relative z-20 p-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-3 py-1 rounded-full border border-sky-500/30 text-[11px] font-bold text-sky-300 shadow-sm">
          <CloudRain className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span>أجواء ماطرة هادئة وانسيابية</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/60 text-[10px] text-slate-300">
          <Sparkles className="w-3 h-3 text-sky-400" />
          <span>صحتك وراحتك أولويتنا</span>
        </div>
      </div>

      {/* Center Calm Aesthetic Message */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-4">
        <motion.div
          animate={isFocused ? { scale: 1.02 } : { scale: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-1"
        >
          <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-sky-200 bg-sky-950/50 backdrop-blur-sm px-3.5 py-0.5 rounded-full border border-sky-400/25">
            <span>🌧️ أجواء ماطرة هادئة ومريحة 🌧️</span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-300 font-medium leading-relaxed drop-shadow">
            خدمتكم شرف ورعايتكم مسؤولية • بياناتك محفوظة ومحمية بأعلى معايير الخصوصية
          </p>
        </motion.div>
      </div>

      {/* Bottom Ground Mist Line */}
      <div className="relative z-20 h-2 bg-gradient-to-t from-slate-950 to-transparent" />
    </div>
  );
};
