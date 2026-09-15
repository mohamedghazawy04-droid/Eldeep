import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Clock, ShieldCheck } from 'lucide-react';

interface DeliveryCaptainAnimationProps {
  isFocused?: boolean;
}

export const DeliveryCaptainAnimation: React.FC<DeliveryCaptainAnimationProps> = ({
  isFocused = false,
}) => {
  // Animation Phase: 'racing' (superbike zoom + dust) -> 'pharmacy' (storefront reveal)
  const [phase, setPhase] = useState<'racing' | 'pharmacy'>('racing');
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (phase === 'racing') {
      // Slower, cinematic pacing so the customer can clearly see the bike, racer, cargo box "الديب", and dust
      timer = setTimeout(() => {
        setPhase('pharmacy');
      }, 4800);
    } else {
      // Pharmacy storefront stays proudly visible for ~5.5 seconds
      // Then the sportbike returns and repeats the action!
      timer = setTimeout(() => {
        setPhase('racing');
        setCycleCount((prev) => prev + 1);
      }, 5500);
    }

    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <div
      id="sportbike-racing-stage"
      className="relative w-full h-56 sm:h-64 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden border border-cyan-500/30 shadow-2xl flex flex-col justify-between select-none"
    >
      {/* Night Sky Background / Stars / Cyber-Pharmacy Neon Horizon */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-36 bg-cyan-900/15 blur-3xl rounded-full" />
        <div className="absolute bottom-10 right-10 w-60 h-32 bg-emerald-900/20 blur-3xl rounded-full" />

        {/* Twinkling stars */}
        <div className="absolute top-3 left-8 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <div className="absolute top-7 left-1/4 w-1 h-1 rounded-full bg-cyan-300 animate-ping" />
        <div className="absolute top-4 right-1/4 w-1 h-1 rounded-full bg-amber-300 animate-pulse" />
        <div className="absolute top-10 right-12 w-1.5 h-1.5 rounded-full bg-white/80" />
        <div className="absolute top-12 left-1/2 w-1 h-1 rounded-full bg-cyan-200" />

        {/* Distant city silhouette */}
        <div className="absolute bottom-12 inset-x-0 h-16 flex items-end justify-between opacity-15 px-4 pointer-events-none">
          <div className="w-12 h-14 bg-slate-700 rounded-t-sm" />
          <div className="w-8 h-8 bg-slate-700 rounded-t-sm" />
          <div className="w-16 h-12 bg-slate-700 rounded-t-sm" />
          <div className="w-10 h-16 bg-slate-700 rounded-t-sm" />
          <div className="w-14 h-10 bg-slate-700 rounded-t-sm" />
          <div className="w-20 h-15 bg-slate-700 rounded-t-sm" />
        </div>
      </div>

      {/* Mode Indicator & Phase Switch Pill (Top Right) */}
      <div className="relative z-30 p-2.5 sm:p-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-cyan-500/30 text-[10.5px] font-bold text-cyan-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{phase === 'racing' ? 'صاروخ التوصيل السريع 🏍️⚡' : 'صيدلية الديب في خدمتك 🏥✨'}</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-700 text-[10px] text-slate-300 font-mono">
          <Clock className="w-3 h-3 text-emerald-400" />
          <span>24/7 دليفري طيارة</span>
        </div>
      </div>

      {/* ================= STAGE A: THE GRAND PHARMACY STOREFRONT ================= */}
      {/* Appears when the bike finishes zooming past, disappears when bike roars back */}
      <AnimatePresence>
        {phase === 'pharmacy' && (
          <motion.div
            key="pharmacy-storefront"
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -10 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex flex-col items-center justify-center pt-2 pb-11 z-10 px-4 pointer-events-none"
          >
            {/* Grand Pharmacy Facade Structure */}
            <div className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-cyan-400/50 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.25)] p-3 flex flex-col items-center overflow-hidden">
              {/* Glowing Marquee Header with 3D Sign */}
              <div className="w-full bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-500 py-1.5 px-3 rounded-xl flex items-center justify-between shadow-lg relative overflow-hidden">
                {/* Header shine animation */}
                <motion.div
                  animate={{ x: [-200, 300] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  className="absolute inset-y-0 w-24 bg-white/20 skew-x-12 blur-xs pointer-events-none"
                />

                {/* Left Mini Cross */}
                <div className="w-5 h-5 bg-white rounded flex items-center justify-center shadow-sm">
                  <div className="w-1.5 h-3.5 bg-emerald-600 rounded-xs absolute" />
                  <div className="w-3.5 h-1.5 bg-emerald-600 rounded-xs absolute" />
                </div>

                {/* Main Pharmacy Text */}
                <div className="text-center flex-1">
                  <h1 className="text-base sm:text-lg font-black text-white tracking-wide drop-shadow-md">
                    صيدلية الديب
                  </h1>
                  <span className="block text-[8px] font-mono text-cyan-100 font-bold tracking-widest -mt-0.5">
                    EL DEEB PHARMACY
                  </span>
                </div>

                {/* Right Mini Cross */}
                <div className="w-5 h-5 bg-white rounded flex items-center justify-center shadow-sm">
                  <div className="w-1.5 h-3.5 bg-emerald-600 rounded-xs absolute" />
                  <div className="w-3.5 h-1.5 bg-emerald-600 rounded-xs absolute" />
                </div>
              </div>

              {/* Pharmacy Glass Storefront & Interior Showcase */}
              <div className="w-full mt-2 grid grid-cols-3 gap-2 bg-slate-950/70 border border-slate-700/80 rounded-xl p-2.5 relative">
                {/* Left Window: Medicine shelves & vitamins */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between h-16 shadow-inner">
                  <div className="flex gap-1">
                    <div className="w-3 h-4 bg-red-400 rounded-xs" />
                    <div className="w-2.5 h-4 bg-cyan-400 rounded-xs" />
                    <div className="w-3 h-4 bg-amber-400 rounded-xs" />
                  </div>
                  <div className="flex gap-1 border-t border-slate-800 pt-1">
                    <div className="w-2 h-4 bg-emerald-400 rounded-xs" />
                    <div className="w-4 h-4 bg-indigo-400 rounded-xs" />
                    <div className="w-2 h-4 bg-pink-400 rounded-xs" />
                  </div>
                  <div className="text-[7.5px] text-cyan-400 font-bold text-center">أدوية ومستحضرات</div>
                </div>

                {/* Center: Glowing 3D Neon Pharmacy Cross + Automatic Doors */}
                <div className="flex flex-col items-center justify-center relative">
                  {/* Giant Pulsing Neon Cross */}
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        '0 0 15px rgba(16,185,129,0.5)',
                        '0 0 30px rgba(16,185,129,0.95)',
                        '0 0 15px rgba(16,185,129,0.5)',
                      ],
                    }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                    className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-500 rounded-lg flex items-center justify-center relative shadow-lg"
                  >
                    <div className="w-2.5 h-6 sm:h-7 bg-white rounded-xs absolute shadow-sm" />
                    <div className="w-6 sm:w-7 h-2.5 bg-white rounded-xs absolute shadow-sm" />
                  </motion.div>

                  {/* Glass Doorway */}
                  <div className="w-14 h-5 border-x-2 border-t-2 border-cyan-400/60 bg-cyan-500/10 rounded-t-sm mt-1.5 flex items-center justify-center">
                    <span className="text-[7px] font-bold text-cyan-300">أهلاً بكم 🚪</span>
                  </div>
                </div>

                {/* Right Window: 24/7 Delivery & Fast Service Badge */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between h-16 shadow-inner text-right">
                  <div className="flex items-center gap-1 justify-end text-emerald-400">
                    <span className="text-[9px] font-bold">24 ساعة</span>
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="text-[8px] text-slate-300 font-medium leading-tight">
                    أسرع توصيل للمنازل
                  </div>
                  <div className="flex items-center gap-1 justify-end text-amber-400 text-[8px] font-bold">
                    <Zap className="w-2.5 h-2.5 fill-amber-400" />
                    <span>جاهزون لطلبك</span>
                  </div>
                </div>
              </div>

              {/* Floating Bottom Reassurance Tag */}
              <div className="mt-2 text-[10px] text-cyan-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                <span>صيدلية الديب ترعاكم دائماً — دليفري أسرع من الريح</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= STAGE B: RACING SPORTBIKE ZOOM & DUST EXPLOSION ================= */}
      {/* High-speed racing sport motorcycle roaring across with cargo box 'الديب' and kicking up dust clouds */}
      <AnimatePresence>
        {phase === 'racing' && (
          <div key={`racing-track-${cycleCount}`} className="absolute inset-0 pointer-events-none z-20">
            {/* Speed Wind Streaks (Slicing horizontally across stage) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.4, 0] }}
              transition={{ duration: 1.8, times: [0, 0.2, 0.8, 1] }}
              className="absolute inset-0 pointer-events-none"
            >
              <div className="absolute top-20 right-0 w-48 h-0.5 bg-cyan-400/80 blur-2xs" />
              <div className="absolute top-28 right-12 w-64 h-0.5 bg-white/90 blur-2xs" />
              <div className="absolute top-36 right-4 w-52 h-1 bg-amber-400/70 blur-2xs" />
              <div className="absolute top-44 right-20 w-72 h-0.5 bg-cyan-300/80 blur-2xs" />
            </motion.div>

            {/* Comic Speed Announcement */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, x: 50 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1.05, 1, 0.9], x: [30, 0, -15, -40] }}
              transition={{ duration: 3.2, times: [0, 0.15, 0.8, 1] }}
              className="absolute top-8 left-6 sm:left-12 bg-amber-500 text-slate-950 font-black px-3 py-1.5 rounded-xl shadow-2xl border-2 border-white text-xs sm:text-sm flex items-center gap-1.5 rotate-[-3deg]"
            >
              <Zap className="w-4 h-4 fill-slate-950 text-slate-950 animate-bounce" />
              <span>دليفري الديب النفاث طار بالروشتة! 🚀⚡</span>
            </motion.div>

            {/* The Racing Sportbike & Rider Motion Wrapper */}
            {/* Starts from right (RTL), cruises smoothly across center stage so the customer can clearly observe every detail, then accelerates off with a dust cloud */}
            <motion.div
              initial={{ x: 380, y: 0, rotate: 4 }}
              animate={{
                x: [380, 140, 20, -140, -520],
                y: [0, -2, 1, -2, 0],
                rotate: [3, 5, 4, 6, 4],
              }}
              transition={{
                x: { duration: 3.8, ease: 'easeInOut', times: [0, 0.28, 0.55, 0.78, 1] },
                y: { repeat: Infinity, duration: 0.3, ease: 'easeInOut' },
                rotate: { repeat: Infinity, duration: 0.4, ease: 'easeInOut' },
              }}
              className="absolute bottom-5 right-0 z-20"
            >
              {/* Detailed SVG Illustration: Racing Sportbike + 'الديب' Cargo Box + Racer */}
              <svg
                width="260"
                height="140"
                viewBox="0 0 240 130"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] overflow-visible"
              >
                <defs>
                  {/* Sportbike Metallic Paint Gradient */}
                  <linearGradient id="sportFairingGrad" x1="60" y1="40" x2="180" y2="90" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="40%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>

                  {/* Bright Neon Cyan Highlight */}
                  <linearGradient id="neonCyanStripe" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#67e8f9" />
                  </linearGradient>

                  {/* Red/Gold Accent Gradient */}
                  <linearGradient id="racingDecalGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>

                  {/* Racing Carbon Fiber */}
                  <linearGradient id="carbonGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="50%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>

                  {/* Headlight Twin LED Laser Beam */}
                  <linearGradient id="racingHeadlightBeam" x1="50" y1="65" x2="-60" y2="75" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.9" />
                    <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                  </linearGradient>

                  {/* Exhaust Flame Fire Gradient */}
                  <linearGradient id="nitroFireGrad" x1="190" y1="85" x2="245" y2="85" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="25%" stopColor="#38bdf8" />
                    <stop offset="60%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Nitrous / Exhaust Flame Jet bursting from rear pipe */}
                <g className="exhaust-flame">
                  <motion.polygon
                    points="192,85 240,78 225,85 245,88 220,91"
                    fill="url(#nitroFireGrad)"
                    animate={{
                      scaleX: [1, 1.4, 0.9, 1.3, 1],
                      opacity: [0.85, 1, 0.7, 1, 0.85],
                    }}
                    transition={{ repeat: Infinity, duration: 0.12 }}
                    style={{ transformOrigin: '192px 85px' }}
                  />
                  <circle cx="210" cy="85" r="3" fill="#67e8f9" className="animate-ping" />
                </g>

                {/* Twin Racing Headlight Laser Beams (Facing Forward to the Left) */}
                <polygon
                  points="50,65 -40,40 -60,95 50,75"
                  fill="url(#racingHeadlightBeam)"
                  opacity="0.75"
                />

                {/* ================= REAR SUSPENSION & SPORT SWINGARM ================= */}
                {/* Aluminum Swingarm */}
                <path
                  d="M115 88 L170 95 L175 90 L120 82 Z"
                  fill="url(#carbonGrad)"
                  stroke="#475569"
                  strokeWidth="1.5"
                />
                {/* Rear Racing Monoshock with Yellow Spring */}
                <line x1="125" y1="82" x2="135" y2="70" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                <line x1="125" y1="82" x2="135" y2="70" stroke="#000" strokeWidth="1" strokeDasharray="1.5,1.5" />

                {/* High-Performance Up-swept Racing Exhaust Pipe (Titanium Muffler) */}
                <path
                  d="M130 92 L165 92 L192 84"
                  stroke="#64748b"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                <path
                  d="M165 91 L192 84"
                  stroke="#38bdf8"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                {/* Carbon end-cap */}
                <circle cx="192" cy="84" r="3.5" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />

                {/* ================= REAR WHEEL (WIDE RACING SLICK TIRE) ================= */}
                <g className="rear-racing-wheel">
                  {/* Outer Wide Slick Tire */}
                  <circle cx="170" cy="95" r="22" fill="#0f172a" stroke="#1e293b" strokeWidth="5" />
                  {/* Wheel Rim (Matte Black with Neon Cyan Rim Tape) */}
                  <circle cx="170" cy="95" r="16" fill="#020617" stroke="#06b6d4" strokeWidth="2.5" />
                  {/* Drilled Brake Disc */}
                  <circle cx="170" cy="95" r="10" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                  <circle cx="170" cy="95" r="4" fill="#0f172a" />
                  {/* Red Brembo Racing Brake Caliper */}
                  <rect x="156" y="86" width="6" height="10" rx="1.5" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
                  {/* Spinning Rim Spokes */}
                  <motion.g
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 0.35, ease: 'linear' }}
                    style={{ transformOrigin: '170px 95px' }}
                  >
                    <line x1="170" y1="79" x2="170" y2="111" stroke="#06b6d4" strokeWidth="2" />
                    <line x1="154" y1="95" x2="186" y2="95" stroke="#06b6d4" strokeWidth="2" />
                    <line x1="159" y1="84" x2="181" y2="106" stroke="#ffffff" strokeWidth="1.5" />
                    <line x1="159" y1="106" x2="181" y2="84" stroke="#ffffff" strokeWidth="1.5" />
                  </motion.g>
                </g>

                {/* ================= FRONT SUSPENSION & SPORT FORK ================= */}
                {/* Inverted Golden Telescopic Forks (Öhlins Gold Style) */}
                <line x1="68" y1="65" x2="52" y2="95" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                <line x1="70" y1="63" x2="54" y2="93" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" />

                {/* ================= FRONT WHEEL (RACING SLICK TIRE) ================= */}
                <g className="front-racing-wheel">
                  {/* Outer Wide Slick Tire */}
                  <circle cx="52" cy="95" r="22" fill="#0f172a" stroke="#1e293b" strokeWidth="5" />
                  {/* Wheel Rim with Neon Cyan Rim Tape */}
                  <circle cx="52" cy="95" r="16" fill="#020617" stroke="#06b6d4" strokeWidth="2.5" />
                  {/* Front Dual Drilled Brake Disc */}
                  <circle cx="52" cy="95" r="11" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                  <circle cx="52" cy="95" r="4" fill="#0f172a" />
                  {/* Red Brembo Racing Front Caliper */}
                  <rect x="56" y="86" width="6" height="11" rx="1.5" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
                  {/* Spinning Rim Spokes */}
                  <motion.g
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 0.35, ease: 'linear' }}
                    style={{ transformOrigin: '52px 95px' }}
                  >
                    <line x1="52" y1="79" x2="52" y2="111" stroke="#06b6d4" strokeWidth="2" />
                    <line x1="36" y1="95" x2="68" y2="95" stroke="#06b6d4" strokeWidth="2" />
                    <line x1="41" y1="84" x2="63" y2="106" stroke="#ffffff" strokeWidth="1.5" />
                    <line x1="41" y1="106" x2="63" y2="84" stroke="#ffffff" strokeWidth="1.5" />
                  </motion.g>
                </g>

                {/* ================= SPORTBIKE FAIRING & CHASSIS BODY ================= */}
                {/* Lower Engine Belly Pan Fairing */}
                <path
                  d="M65 92 L130 92 L138 84 L95 78 L65 85 Z"
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                />

                {/* Main Aggressive Sportbike Aerodynamic Fairing */}
                <path
                  d="M45 68 L60 52 L85 54 L115 62 L120 75 L75 80 L52 76 Z"
                  fill="url(#sportFairingGrad)"
                  stroke="#0891b2"
                  strokeWidth="1.6"
                />

                {/* Neon Cyan & Gold Racing Speed Decal Stripes */}
                <path d="M55 64 L100 68" stroke="url(#neonCyanStripe)" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M60 70 L95 73" stroke="url(#racingDecalGrad)" strokeWidth="1.8" strokeLinecap="round" />

                {/* Front Aerodynamic Windscreen (Bubble Visor) */}
                <path
                  d="M52 54 C55 42, 68 40, 76 45 L62 55 Z"
                  fill="#0284c7"
                  fillOpacity="0.8"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                />

                {/* Twin LED Aggressive Projector Headlights */}
                <polygon points="46,65 54,63 52,69 45,68" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
                <circle cx="48" cy="66" r="1.5" fill="#ffffff" />

                {/* Fuel Tank (Humped Racing Ergonomics) */}
                <path
                  d="M80 54 C82 43, 98 42, 108 47 L114 58 L85 56 Z"
                  fill="url(#sportFairingGrad)"
                  stroke="#38bdf8"
                  strokeWidth="1.4"
                />
                {/* Fuel Cap */}
                <ellipse cx="94" cy="46" rx="3" ry="1.5" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />

                {/* Clip-On Racing Handlebars & Lever Guard */}
                <line x1="70" y1="52" x2="62" y2="52" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                <circle cx="60" cy="52" r="2.5" fill="#0f172a" />
                {/* Racing Brake Lever */}
                <path d="M60 54 Q56 56 53 54" stroke="#38bdf8" strokeWidth="1.5" fill="none" />

                {/* Racing Seat Pad */}
                <path
                  d="M108 55 C114 55, 122 55, 132 58 L128 63 L110 60 Z"
                  fill="#1e293b"
                  stroke="#0f172a"
                  strokeWidth="1"
                />

                {/* ================= RACER RIDER (AERODYNAMIC RACING TUCK) ================= */}
                {/* Racer Torso in Low-Drag Racing Crouch */}
                <path
                  d="M92 46 C94 36, 114 34, 126 42 L132 55 L106 54 Z"
                  fill="#0284c7"
                  stroke="#38bdf8"
                  strokeWidth="1.4"
                />
                {/* Aerodynamic Speed Hump on back of Racing Suit */}
                <path
                  d="M120 37 C128 35, 134 39, 136 44 L126 43 Z"
                  fill="#0369a1"
                  stroke="#38bdf8"
                  strokeWidth="1"
                />

                {/* Racer Arms stretched forward in racing posture */}
                <path
                  d="M104 43 L76 48 L62 52"
                  stroke="#0284c7"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M104 43 L76 48 L62 52"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Racing Glove */}
                <circle cx="62" cy="52" r="3.2" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.8" />

                {/* Racer Legs tucked tightly onto racing rearsets */}
                <path
                  d="M112 56 L124 66 L118 78"
                  stroke="#0f172a"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M112 56 L124 66 L118 78"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Knee Slider Puck */}
                <rect x="123" y="64" width="4" height="6" rx="1" fill="#f59e0b" />
                {/* Racing Boot */}
                <polygon points="115,78 122,78 126,82 114,82" fill="#0f172a" />

                {/* Racer Full-Face Aerodynamic Racing Helmet */}
                <g className="racer-helmet">
                  {/* Helmet Shell */}
                  <ellipse cx="88" cy="32" rx="11" ry="10" fill="#06b6d4" stroke="#0891b2" strokeWidth="1.4" />
                  {/* White / Gold Racing Helmet Decal */}
                  <path d="M80 27 Q88 23 97 29" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" />
                  {/* Aggressive Dark Tinted Iridium Racing Visor */}
                  <path
                    d="M78 30 C76 34, 78 38, 85 38 L88 33 Z"
                    fill="#0f172a"
                    stroke="#f59e0b"
                    strokeWidth="1.2"
                  />
                  {/* Visor Glare / Reflection */}
                  <line x1="80" y1="32" x2="84" y2="35" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" />
                </g>

                {/* ================= THE DELIVERY CARGO BOX: 'الديب' ================= */}
                {/* Aerodynamic sport delivery trunk mounted over rear tail */}
                <g className="eldeeb-racing-cargo-box">
                  {/* Mounting Heavy-Duty Carbon Bracket */}
                  <path d="M136 60 L146 52 L172 52 L178 68" stroke="#475569" strokeWidth="2.5" fill="none" strokeLinecap="round" />

                  {/* Main Cargo Box Shell with Aerodynamic Chamfers */}
                  <path
                    d="M142 32 L185 32 L192 40 L188 64 L142 64 Z"
                    fill="#0284c7"
                    stroke="#38bdf8"
                    strokeWidth="2.2"
                  />

                  {/* Top Carbon Trim Lid */}
                  <path
                    d="M140 32 L187 32 L192 40 L145 40 Z"
                    fill="#0f172a"
                    stroke="#22d3ee"
                    strokeWidth="1.4"
                  />

                  {/* High-Contrast Luminous Badge for 'الديب' */}
                  <rect x="140" y="38" width="48" height="23" rx="4" fill="#020617" stroke="#f59e0b" strokeWidth="2" />

                  {/* THE INSCRIBED NAME: 'الديب' (EL DEEB) - Bold, Ultra-Clear Arabic */}
                  <text
                    x="164"
                    y="54.5"
                    fill="#ffffff"
                    fontSize="13"
                    fontWeight="900"
                    textAnchor="middle"
                    fontFamily="Cairo, sans-serif"
                    className="select-none tracking-tight font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                  >
                    الديب
                  </text>

                  {/* Glowing Medical Cross on Delivery Box */}
                  <circle cx="180" cy="50" r="4.5" fill="#10b981" />
                  <rect x="178.8" y="47" width="2.4" height="6" rx="0.6" fill="#ffffff" />
                  <rect x="177" y="48.8" width="6" height="2.4" rx="0.6" fill="#ffffff" />

                  {/* Emergency Warning Flash Strobes on Box Corner */}
                  <motion.circle
                    cx="145"
                    cy="35"
                    r="2.5"
                    fill="#ef4444"
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.3 }}
                  />
                  <motion.circle
                    cx="188"
                    cy="35"
                    r="2.5"
                    fill="#38bdf8"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ repeat: Infinity, duration: 0.3 }}
                  />
                </g>
              </svg>
            </motion.div>

            {/* ================= MASSIVE DUST & TIRE SMOKE PARTICLES ================= */}
            {/* Swirling plumes of dust and tire smoke bursting in the wake of the racing bike */}
            <div className="absolute bottom-5 inset-x-0 h-24 overflow-visible pointer-events-none z-10">
              {/* Expanding primary dust puff 1 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.2, x: 260, y: 10 }}
                animate={{
                  opacity: [0, 0.85, 0.7, 0],
                  scale: [0.3, 1.8, 2.6, 3.2],
                  x: [260, 200, 160, 120],
                  y: [10, -8, -18, -25],
                }}
                transition={{ duration: 2.2, ease: 'easeOut', delay: 1.2 }}
                className="absolute right-0 w-16 h-16 rounded-full bg-gradient-to-tr from-amber-700/60 via-amber-600/40 to-slate-500/30 blur-sm pointer-events-none"
              />

              {/* Expanding secondary dust puff 2 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.2, x: 230, y: 15 }}
                animate={{
                  opacity: [0, 0.9, 0.65, 0],
                  scale: [0.2, 1.6, 2.8, 3.5],
                  x: [230, 160, 110, 60],
                  y: [15, -5, -15, -22],
                }}
                transition={{ duration: 2.3, ease: 'easeOut', delay: 1.8 }}
                className="absolute right-0 w-20 h-20 rounded-full bg-gradient-to-tr from-amber-800/70 via-amber-700/50 to-slate-600/30 blur-md pointer-events-none"
              />

              {/* Expanding tertiary dust puff 3 (Thick brown-golden dust storm) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.2, x: 190, y: 12 }}
                animate={{
                  opacity: [0, 0.8, 0.5, 0],
                  scale: [0.3, 1.9, 2.9, 3.8],
                  x: [190, 120, 70, 10],
                  y: [12, -10, -20, -28],
                }}
                transition={{ duration: 2.4, ease: 'easeOut', delay: 2.3 }}
                className="absolute right-0 w-24 h-24 rounded-full bg-gradient-to-tr from-amber-900/60 via-amber-600/35 to-slate-400/20 blur-lg pointer-events-none"
              />

              {/* High-speed ground gravel & asphalt dust scatter */}
              {Array.from({ length: 9 }).map((_, idx) => (
                <motion.div
                  key={`pebble-${idx}`}
                  initial={{ opacity: 0, x: 240, y: 20 }}
                  animate={{
                    opacity: [0, 1, 0],
                    x: [240 - idx * 25, 200 - idx * 35 - Math.random() * 40],
                    y: [20, 10 - Math.random() * 20],
                    scale: [0.5, 1.2, 0.2],
                  }}
                  transition={{ duration: 1.4, ease: 'easeOut', delay: 1.6 + idx * 0.12 }}
                  className="absolute right-0 w-2.5 h-2 rounded-full bg-amber-500/80 shadow-xs"
                />
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= ROAD & MOVING ASPHALT DASHES ================= */}
      <div className="relative w-full h-11 bg-slate-950 border-t-2 border-slate-700/80 overflow-hidden flex items-center z-10 shadow-inner">
        {/* Asphalt texture tone */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:8px_8px] opacity-25" />

        {/* Moving Yellow Centerline Road Dashes */}
        <motion.div
          animate={{
            x: phase === 'racing' ? [0, -180] : [0, -40],
          }}
          transition={{
            repeat: Infinity,
            duration: phase === 'racing' ? 0.6 : 1.2,
            ease: 'linear',
          }}
          className="flex gap-8 w-[250%] absolute"
        >
          {Array.from({ length: 22 }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full shadow-xs ${
                phase === 'racing' ? 'w-14 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'w-8 bg-amber-400/70'
              }`}
            />
          ))}
        </motion.div>

        {/* Road Curb Edge reflection */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-white to-red-600 opacity-60" />
      </div>
    </div>
  );
};
