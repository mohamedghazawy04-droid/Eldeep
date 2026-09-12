import React from 'react';
import { motion } from 'motion/react';

interface DeliveryCaptainAnimationProps {
  isFocused?: boolean;
}

export const DeliveryCaptainAnimation: React.FC<DeliveryCaptainAnimationProps> = ({
  isFocused = false,
}) => {
  return (
    <div
      id="vespa-delivery-stage"
      className="relative w-full h-52 sm:h-60 bg-gradient-to-b from-sky-950 via-slate-900 to-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden border border-cyan-500/20 shadow-inner flex flex-col justify-end select-none"
    >
      {/* Night Atmosphere / Stars & Golden Vintage Crescent Moon */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-3 right-6 w-12 h-12 rounded-full bg-amber-200/20 blur-md" />
        <div className="absolute top-4 right-7 w-9 h-9 rounded-full bg-gradient-to-tr from-amber-200 to-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.6)] flex items-center justify-center">
          {/* Subtle crater details */}
          <div className="w-2 h-2 rounded-full bg-amber-300/60 absolute top-2 left-2" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-300/50 absolute bottom-2 right-3" />
        </div>

        {/* Twinkling stars */}
        <div className="absolute top-5 left-12 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <div className="absolute top-10 left-28 w-1 h-1 rounded-full bg-cyan-300 animate-ping" />
        <div className="absolute top-4 left-1/2 w-1 h-1 rounded-full bg-amber-200 animate-pulse" />
        <div className="absolute top-8 right-24 w-1.5 h-1.5 rounded-full bg-white/70" />

        {/* Night clouds drifting peacefully */}
        <motion.div
          animate={{ x: [-40, 340] }}
          transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
          className="absolute top-6 left-0 w-28 h-5 bg-white/5 rounded-full blur-xs pointer-events-none"
        />
        <motion.div
          animate={{ x: [-60, 340] }}
          transition={{ repeat: Infinity, duration: 32, ease: 'linear', delay: 3 }}
          className="absolute top-14 left-0 w-36 h-6 bg-white/5 rounded-full blur-xs pointer-events-none"
        />
      </div>

      {/* Background Pharmacy Storefront with Glowing Green Neon Cross */}
      <div className="absolute bottom-10 right-3 sm:right-8 flex flex-col items-center opacity-85 pointer-events-none z-0">
        <div className="w-32 sm:w-40 h-3 bg-gradient-to-r from-teal-600 via-sky-600 to-emerald-600 rounded-t-lg shadow-sm" />
        <div className="w-28 sm:w-36 h-16 bg-slate-800/90 border border-slate-700/80 rounded-b-xl flex flex-col items-center justify-between p-2 shadow-xl backdrop-blur-xs">
          <div className="text-[9px] font-black text-cyan-300 tracking-wider font-mono">
            صيدلية د/ أحمد الديب
          </div>
          {/* Pulsing Neon Green Medical Cross */}
          <motion.div
            animate={{
              boxShadow: [
                '0 0 10px rgba(16,185,129,0.4)',
                '0 0 25px rgba(16,185,129,0.95)',
                '0 0 10px rgba(16,185,129,0.4)',
              ],
              scale: [1, 1.06, 1],
            }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="w-7 h-7 relative bg-emerald-500 rounded-xs flex items-center justify-center"
          >
            <div className="absolute w-2 h-5.5 bg-white rounded-xs" />
            <div className="absolute w-5.5 h-2 bg-white rounded-xs" />
          </motion.div>
          <div className="text-[7.5px] text-emerald-300/90 font-bold">توصيل فيزبا سريع 24/7</div>
        </div>
      </div>

      {/* Retro Street Lamp */}
      <div className="absolute bottom-10 left-4 sm:left-12 pointer-events-none z-0">
        <div className="w-1.5 h-24 bg-slate-700 mx-auto" />
        <div className="w-6 h-2 bg-slate-600 rounded-t-full mx-auto" />
        <div className="w-4 h-4 bg-amber-300 rounded-full mx-auto shadow-[0_0_20px_rgba(252,211,77,0.9)]" />
        {/* Streetlight glow cone */}
        <div className="w-24 h-24 bg-gradient-to-b from-amber-300/25 to-transparent -translate-x-10 pointer-events-none" />
      </div>

      {/* Road with Moving Asphalt Dashes */}
      <div className="relative w-full h-11 bg-slate-950 border-t-2 border-slate-700/90 overflow-hidden flex items-center z-10">
        <motion.div
          animate={{ x: isFocused ? [0, -100] : [0, -50] }}
          transition={{ repeat: Infinity, duration: isFocused ? 0.45 : 0.9, ease: 'linear' }}
          className="flex gap-8 w-[220%] absolute"
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-9 h-1.5 bg-amber-400/80 rounded-full shadow-xs" />
          ))}
        </motion.div>
      </div>

      {/* Funny Vespa Scooter & Captain Motion Container */}
      <motion.div
        animate={{
          x: isFocused ? [30, 130, 80, 150] : [40, 95, 65, 100],
          y: isFocused ? [0, -4, 2, -5, 0] : [0, -3, 1, -2, 0],
          rotate: isFocused ? [0, -2, 3, -1, 0] : [0, -1, 1.5, 0],
        }}
        transition={{
          x: { repeat: Infinity, repeatType: 'reverse', duration: isFocused ? 2.6 : 4.5, ease: 'easeInOut' },
          y: { repeat: Infinity, duration: isFocused ? 0.35 : 0.6, ease: 'easeInOut' },
          rotate: { repeat: Infinity, duration: isFocused ? 0.4 : 0.7, ease: 'easeInOut' },
        }}
        className="absolute bottom-5 left-1/4 sm:left-1/3 z-20"
      >
        {/* Humorous Comic Speech Bubble */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute -top-12 -right-4 sm:right-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-1 rounded-2xl shadow-xl border-2 border-cyan-400 text-[10.5px] font-black whitespace-nowrap flex items-center gap-1.5 z-30"
        >
          <span className="text-base leading-none">🛵</span>
          <span className="text-cyan-600 dark:text-cyan-400">
            {isFocused
              ? 'فيزبا الديب طلقة.. جاري تجهيز عنوانك يا باشا!'
              : 'فيزبا صيدلية الديب 24/7.. بوب بوب بوب! 🩺'}
          </span>
          <div className="absolute -bottom-2 right-8 w-0 h-0 border-l-6 border-l-transparent border-r-6 border-r-transparent border-t-6 border-t-cyan-400" />
        </motion.div>

        {/* Detailed, Realistic & Funny Vespa SVG Illustration */}
        <svg
          width="160"
          height="105"
          viewBox="0 0 160 105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-2xl overflow-visible"
        >
          <defs>
            {/* Realistic paint gradients */}
            <linearGradient id="vespaBodyGradient" x1="20" y1="40" x2="110" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#155e75" />
            </linearGradient>

            <linearGradient id="vespaBulgeGradient" x1="25" y1="50" x2="55" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="60%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#164e63" />
            </linearGradient>

            <linearGradient id="chromeGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            <linearGradient id="vespaSeatGradient" x1="45" y1="36" x2="75" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="50%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#1c1917" />
            </linearGradient>

            <linearGradient id="headlightBeam" x1="130" y1="52" x2="185" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Funny 2-Stroke Smoke Rings & Comic "Pop-Pop" Particles */}
          <g className="smoke-effects">
            <motion.circle
              cx="10"
              cy="76"
              r="4"
              fill="#cbd5e1"
              stroke="#94a3b8"
              strokeWidth="0.8"
              animate={{
                cx: [10, -16],
                cy: [76, 70],
                opacity: [0.8, 0],
                r: [4, 11],
              }}
              transition={{ repeat: Infinity, duration: isFocused ? 0.45 : 0.8, ease: 'easeOut' }}
            />
            <motion.circle
              cx="6"
              cy="78"
              r="3"
              fill="#e2e8f0"
              stroke="#cbd5e1"
              strokeWidth="0.8"
              animate={{
                cx: [6, -26],
                cy: [78, 74],
                opacity: [0.75, 0],
                r: [3, 9],
              }}
              transition={{ repeat: Infinity, duration: isFocused ? 0.55 : 0.95, ease: 'easeOut', delay: 0.15 }}
            />
            {/* Comic sound burst label */}
            <motion.text
              x="-2"
              y="70"
              fill="#f59e0b"
              fontSize="6"
              fontWeight="900"
              animate={{ opacity: [0, 1, 0], y: [72, 64], scale: [0.8, 1.2] }}
              transition={{ repeat: Infinity, duration: isFocused ? 0.5 : 1, ease: 'easeOut' }}
            >
              POP!
            </motion.text>
          </g>

          {/* Headlight Powerful Beam */}
          <polygon
            points="126,52 185,38 185,76 126,60"
            fill="url(#headlightBeam)"
            opacity={isFocused ? 0.85 : 0.65}
          />

          {/* Rear Chrome Luggage Rack */}
          <path
            d="M18 45 L32 45 L36 54"
            stroke="url(#chromeGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M22 45 L22 55"
            stroke="url(#chromeGradient)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Rear Delivery Medical Box (Mounted on the luggage rack) */}
          <rect
            x="12"
            y="26"
            width="24"
            height="22"
            rx="4"
            fill="#0284c7"
            stroke="#38bdf8"
            strokeWidth="1.8"
          />
          {/* Medical Red / White Cross on Delivery Box */}
          <circle cx="24" cy="37" r="7" fill="#ffffff" />
          <rect x="22.5" y="32" width="3" height="10" rx="0.8" fill="#dc2626" />
          <rect x="19" y="35.5" width="10" height="3" rx="0.8" fill="#dc2626" />
          {/* Funny mini pharmacy flag fluttering on the box */}
          <motion.path
            d="M12 26 L12 14 L2 18 L12 22"
            fill="#10b981"
            stroke="#059669"
            strokeWidth="0.8"
            animate={{ d: ['M12 26 L12 14 L2 18 L12 22', 'M12 26 L12 14 L3 16 L12 20', 'M12 26 L12 14 L2 18 L12 22'] }}
            transition={{ repeat: Infinity, duration: 0.4, ease: 'easeInOut' }}
          />

          {/* Iconic Vespa Bulging Teardrop Rear Engine Cowl (الكلاكل المنفوخة الشهيرة) */}
          <path
            d="M24 74 C20 62, 28 50, 42 49 C55 48, 62 55, 60 74 C58 80, 26 80, 24 74 Z"
            fill="url(#vespaBulgeGradient)"
            stroke="#0891b2"
            strokeWidth="1.8"
          />
          {/* Engine Cooling Louvers / Vents (فتحات تبريد محرك الفيزبا) */}
          <path d="M30 60 L38 60" stroke="#083344" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M29 64 L39 64" stroke="#083344" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M31 68 L37 68" stroke="#083344" strokeWidth="1.6" strokeLinecap="round" />
          {/* Chrome Trim Bead on Cowl */}
          <path d="M24 74 C26 56, 38 50, 52 50" stroke="url(#chromeGradient)" strokeWidth="1.2" fill="none" />

          {/* Vespa Floorboard & Central Tunnel */}
          <path
            d="M56 73 L92 73 L96 70 L98 64 L90 64 L60 67 Z"
            fill="#0e7490"
            stroke="#155e75"
            strokeWidth="1.2"
          />
          {/* Floorboard Rubber Grip Strips */}
          <line x1="64" y1="72" x2="88" y2="72" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
          {/* Classic Foot Brake Pedal */}
          <circle cx="86" cy="67" r="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />

          {/* Vespa Classic Curved Front Legshield Apron (الصاجة الأمامية المنحنية) */}
          <path
            d="M92 73 C102 72, 108 62, 114 46 C116 42, 110 40, 106 43 C101 56, 96 66, 88 71 Z"
            fill="url(#vespaBodyGradient)"
            stroke="#0891b2"
            strokeWidth="1.6"
          />
          {/* Front Chrome Beading around Legshield */}
          <path
            d="M92 73 C103 72, 110 61, 115 45"
            stroke="url(#chromeGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Front Horn Grille & Classic Vespa Badge */}
          <ellipse cx="109" cy="53" rx="2.5" ry="4" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
          <text x="109" y="55" fontSize="3" fill="#0f172a" fontWeight="bold" textAnchor="middle">
            ~
          </text>
          <text x="105" y="47" fontSize="3" fill="#ffffff" fontWeight="bold" fontStyle="italic">
            Vespa
          </text>

          {/* Front Mudguard with Chrome Crest (رفرف العجلة الأمامية مع الزعنفة الكروم) */}
          <path
            d="M106 66 C115 62, 126 66, 128 78 C124 79, 114 77, 108 73 Z"
            fill="#0891b2"
            stroke="#0e7490"
            strokeWidth="1.4"
          />
          {/* Chrome fin on mudguard */}
          <path d="M116 63 L122 65" stroke="url(#chromeGradient)" strokeWidth="2" strokeLinecap="round" />

          {/* Classic Vespa Dual Seat (المقعد الجلدي الكلاسيكي المنحني) */}
          <path
            d="M44 45 C44 40, 50 38, 64 39 C74 40, 78 43, 76 47 C66 48, 50 48, 44 45 Z"
            fill="url(#vespaSeatGradient)"
            stroke="#78350f"
            strokeWidth="1.2"
          />
          <path d="M46 44 Q60 41 74 43" stroke="#d97706" strokeWidth="1" fill="none" strokeDasharray="1,1" />

          {/* Rider Body - Egyptian Pharmacy Captain with funny happy posture */}
          {/* Coat fluttering in the back */}
          <motion.path
            d="M46 36 Q38 38 34 44 Q44 42 48 38 Z"
            fill="#0369a1"
            stroke="#38bdf8"
            strokeWidth="1"
            animate={{ d: ['M46 36 Q38 38 34 44 Q44 42 48 38 Z', 'M46 36 Q36 34 32 40 Q44 40 48 38 Z', 'M46 36 Q38 38 34 44 Q44 42 48 38 Z'] }}
            transition={{ repeat: Infinity, duration: 0.35, ease: 'easeInOut' }}
          />

          {/* Main Torso */}
          <path
            d="M52 32 C50 24, 66 22, 74 28 L78 44 C70 48, 58 48, 52 42 Z"
            fill="#0284c7"
            stroke="#38bdf8"
            strokeWidth="1.4"
          />
          {/* Pharmacy White Collar */}
          <polygon points="62,28 66,35 60,34" fill="#ffffff" />
          <polygon points="66,28 62,35 68,34" fill="#ffffff" />

          {/* Rider Arms holding Handlebar */}
          <path
            d="M66 32 L96 42"
            stroke="#0284c7"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          <path
            d="M66 32 L96 42"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Black Riding Gloves */}
          <circle cx="97" cy="42.5" r="3" fill="#0f172a" />

          {/* Funny Rider Head & Face */}
          {/* Cheerful neck & head */}
          <circle cx="68" cy="18" r="9" fill="#fed7aa" stroke="#ea580c" strokeWidth="0.8" />

          {/* Big Funny Classic Mustache (شنب كلاسيكي مضحك ومميز) */}
          <path
            d="M66 22 Q72 20 76 21 Q73 24 70 23 Q67 24 66 22 Z"
            fill="#1e293b"
            stroke="#0f172a"
            strokeWidth="0.6"
          />

          {/* Joyful Animated Eyes (Blinking) */}
          <motion.circle
            cx="72"
            cy="17"
            r="1.8"
            fill="#0f172a"
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ repeat: Infinity, duration: 2.8, times: [0, 0.45, 0.5, 0.55, 1] }}
          />
          <circle cx="72.6" cy="16.4" r="0.6" fill="#ffffff" />

          {/* Retro Open-Face Vespa Helmet with Visor */}
          <path
            d="M58 18 C58 9, 78 8, 79 17 C79 19, 74 19, 68 19 C62 19, 58 20, 58 18 Z"
            fill="#0891b2"
            stroke="#155e75"
            strokeWidth="1.4"
          />
          {/* Helmet Racing White Stripe */}
          <path d="M60 14 Q68 10 76 14" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />

          {/* Funny Retro Aviator Goggles pushed onto helmet */}
          <rect x="67" y="11" width="6" height="4" rx="2" fill="#67e8f9" stroke="#f59e0b" strokeWidth="1.2" />
          <rect x="73" y="11" width="6" height="4" rx="2" fill="#67e8f9" stroke="#f59e0b" strokeWidth="1.2" />
          <line x1="61" y1="13" x2="67" y2="13" stroke="#f59e0b" strokeWidth="1.2" />

          {/* Handlebar & Chrome Headset */}
          <path
            d="M102 46 L108 42 L116 42"
            stroke="url(#chromeGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Handlebar Grip */}
          <line x1="94" y1="43" x2="103" y2="43" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />

          {/* Iconic Big Round Chrome Vespa Headlight (فانوس فيزبا مدور كبير) */}
          <circle cx="118" cy="42" r="7" fill="url(#chromeGradient)" stroke="#475569" strokeWidth="1.5" />
          <circle cx="119" cy="42" r="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
          <circle cx="120" cy="40.5" r="1.5" fill="#ffffff" />

          {/* Two Funny High Round Chrome Rearview Mirrors (sticking up funny!) */}
          {/* Left Mirror */}
          <line x1="104" y1="41" x2="100" y2="28" stroke="url(#chromeGradient)" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="100" cy="27" r="3.2" fill="url(#chromeGradient)" stroke="#475569" strokeWidth="0.8" />
          <circle cx="99.5" cy="26.5" r="1.8" fill="#e0f2fe" />
          {/* Right Mirror */}
          <line x1="108" y1="41" x2="108" y2="26" stroke="url(#chromeGradient)" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="108" cy="25" r="3.2" fill="url(#chromeGradient)" stroke="#475569" strokeWidth="0.8" />
          <circle cx="107.5" cy="24.5" r="1.8" fill="#e0f2fe" />

          {/* Classic Single-Sided Trailing Link Front Suspension (مساعد فيزبا الكلاسيكي) */}
          <line x1="112" y1="62" x2="116" y2="82" stroke="url(#chromeGradient)" strokeWidth="3" strokeLinecap="round" />
          {/* Coil Spring */}
          <line x1="113" y1="68" x2="120" y2="76" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1.5,1.5" />

          {/* Classic Chrome Fish-Tail Exhaust Pipe */}
          <path d="M40 76 L18 80 L12 80" stroke="url(#chromeGradient)" strokeWidth="3" strokeLinecap="round" />
          <polygon points="12,78 8,76 8,84 12,82" fill="url(#chromeGradient)" />

          {/* Rear Wheel (Authentic Whitewall Vespa Tire) */}
          <g className="rear-wheel">
            {/* Outer Tire */}
            <circle cx="36" cy="80" r="15" fill="#1e293b" stroke="#334155" strokeWidth="3.5" />
            {/* Vintage Whitewall Ring */}
            <circle cx="36" cy="80" r="11" fill="none" stroke="#f8fafc" strokeWidth="3" />
            {/* Steel Split Rim */}
            <circle cx="36" cy="80" r="8" fill="#0891b2" stroke="url(#chromeGradient)" strokeWidth="1.5" />
            {/* Center Chrome Hub & Wheel Nuts */}
            <circle cx="36" cy="80" r="4" fill="url(#chromeGradient)" />
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: isFocused ? 0.35 : 0.75, ease: 'linear' }}
              style={{ transformOrigin: '36px 80px' }}
            >
              <circle cx="36" cy="74" r="1" fill="#0f172a" />
              <circle cx="42" cy="80" r="1" fill="#0f172a" />
              <circle cx="36" cy="86" r="1" fill="#0f172a" />
              <circle cx="30" cy="80" r="1" fill="#0f172a" />
            </motion.g>
          </g>

          {/* Front Wheel (Authentic Whitewall Vespa Tire) */}
          <g className="front-wheel">
            {/* Outer Tire */}
            <circle cx="120" cy="80" r="15" fill="#1e293b" stroke="#334155" strokeWidth="3.5" />
            {/* Vintage Whitewall Ring */}
            <circle cx="120" cy="80" r="11" fill="none" stroke="#f8fafc" strokeWidth="3" />
            {/* Steel Split Rim */}
            <circle cx="120" cy="80" r="8" fill="#0891b2" stroke="url(#chromeGradient)" strokeWidth="1.5" />
            {/* Center Chrome Hub & Wheel Nuts */}
            <circle cx="120" cy="80" r="4" fill="url(#chromeGradient)" />
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: isFocused ? 0.35 : 0.75, ease: 'linear' }}
              style={{ transformOrigin: '120px 80px' }}
            >
              <circle cx="120" cy="74" r="1" fill="#0f172a" />
              <circle cx="126" cy="80" r="1" fill="#0f172a" />
              <circle cx="120" cy="86" r="1" fill="#0f172a" />
              <circle cx="114" cy="80" r="1" fill="#0f172a" />
            </motion.g>
          </g>
        </svg>
      </motion.div>
    </div>
  );
};
