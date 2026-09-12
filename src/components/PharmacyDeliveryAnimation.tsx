import React from 'react';
import { motion } from 'motion/react';

interface PharmacyDeliveryAnimationProps {
  isInteracting: boolean;
}

export const PharmacyDeliveryAnimation: React.FC<PharmacyDeliveryAnimationProps> = ({ isInteracting }) => {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-sky-100 via-sky-50 to-slate-100 dark:from-slate-900 dark:via-slate-850 dark:to-slate-950 border border-sky-200 dark:border-slate-800 shadow-lg select-none mb-4">
      {/* Sky & Clouds */}
      <div className="absolute top-2 left-4 flex gap-4 opacity-70">
        <div className="w-8 h-3 bg-white dark:bg-slate-700/50 rounded-full blur-[1px]" />
        <div className="w-12 h-3.5 bg-white dark:bg-slate-700/50 rounded-full blur-[1px]" />
      </div>

      {/* Main Scene Container */}
      <div className="relative h-44 sm:h-52 w-full flex flex-col justify-end overflow-hidden pt-2">
        
        {/* Pharmacy Building */}
        <div className="relative mx-auto w-11/12 max-w-md">
          {/* Pharmacy Signboard with Neon Glowing Cross */}
          <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-cyan-600 text-white px-3 py-1.5 rounded-t-2xl shadow-md flex items-center justify-between border-b-2 border-amber-400">
            <div className="flex items-center gap-1.5">
              {/* Pulsing Neon Green Cross */}
              <div className="relative flex items-center justify-center">
                <div className="w-5 h-5 bg-emerald-500 rounded-sm flex items-center justify-center shadow-lg shadow-emerald-400/50 animate-pulse">
                  <span className="text-white text-xs font-black">✚</span>
                </div>
                <div className="absolute w-7 h-7 bg-emerald-400/30 rounded-full animate-ping pointer-events-none" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black tracking-wide block leading-tight">صيدلية الديب</span>
                <span className="text-[9px] font-semibold text-sky-200 block tracking-widest leading-none font-mono">EL DEEB PHARMACY</span>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>خدمة 24/7 دليفري</span>
            </div>
          </div>

          {/* Striped Canopy / Awning */}
          <div className="h-4 sm:h-5 w-full bg-[repeating-linear-gradient(90deg,#0284c7,#0284c7_18px,#ffffff_18px,#ffffff_36px)] dark:bg-[repeating-linear-gradient(90deg,#0369a1,#0369a1_18px,#334155_18px,#334155_36px)] shadow-md rounded-b-md border-b-2 border-sky-800/30" />

          {/* Storefront Windows & Glass Door */}
          <div className="bg-white/90 dark:bg-slate-900/90 border-x-2 border-slate-300 dark:border-slate-800 h-16 sm:h-20 flex px-3 items-end justify-between relative shadow-inner">
            {/* Left Window with medicine shelves */}
            <div className="w-24 sm:w-32 h-12 bg-sky-50 dark:bg-slate-800/80 rounded-t-lg border border-sky-200 dark:border-slate-700 p-1 flex flex-col justify-around">
              <div className="h-1 bg-amber-400/60 rounded-full" />
              <div className="flex justify-around items-end">
                <div className="w-2 h-4 bg-sky-500 rounded-xs" />
                <div className="w-2 h-6 bg-rose-500 rounded-xs" />
                <div className="w-3 h-5 bg-emerald-500 rounded-xs" />
                <div className="w-2 h-3 bg-purple-500 rounded-xs" />
              </div>
              <div className="h-1 bg-amber-400/60 rounded-full" />
            </div>

            {/* Glass Entrance Door */}
            <div className="w-16 sm:w-20 h-14 bg-sky-100/60 dark:bg-slate-800/50 border-t-2 border-x-2 border-slate-300 dark:border-slate-700 rounded-t-md flex items-center justify-center relative">
              <div className="w-0.5 h-full bg-slate-300 dark:bg-slate-700" />
              <div className="absolute top-4 right-1 w-1 h-3 bg-slate-400 rounded-full" />
              <div className="absolute top-4 left-1 w-1 h-3 bg-slate-400 rounded-full" />
            </div>

            {/* Right Window with cosmetics / vitamins */}
            <div className="w-24 sm:w-32 h-12 bg-sky-50 dark:bg-slate-800/80 rounded-t-lg border border-sky-200 dark:border-slate-700 p-1 flex flex-col justify-around">
              <div className="h-1 bg-amber-400/60 rounded-full" />
              <div className="flex justify-around items-end">
                <div className="w-2.5 h-5 bg-amber-500 rounded-xs" />
                <div className="w-2 h-4 bg-cyan-500 rounded-xs" />
                <div className="w-3 h-6 bg-indigo-500 rounded-xs" />
              </div>
              <div className="h-1 bg-amber-400/60 rounded-full" />
            </div>
          </div>
        </div>

        {/* Paved Sidewalk & Asphalt Road */}
        <div className="w-full bg-slate-300 dark:bg-slate-800 h-2 border-t border-slate-400 dark:border-slate-700" />
        <div className="relative w-full bg-slate-800 dark:bg-slate-950 h-10 sm:h-12 border-t-2 border-slate-700 dark:border-slate-900 flex items-center overflow-hidden">
          {/* Moving Road Dashes when interacting */}
          <div className="absolute inset-0 flex items-center justify-around">
            <div className={`w-8 h-1 bg-amber-300/80 rounded-full ${isInteracting ? 'animate-pulse' : ''}`} />
            <div className={`w-8 h-1 bg-amber-300/80 rounded-full ${isInteracting ? 'animate-pulse' : ''}`} />
            <div className={`w-8 h-1 bg-amber-300/80 rounded-full ${isInteracting ? 'animate-pulse' : ''}`} />
            <div className={`w-8 h-1 bg-amber-300/80 rounded-full ${isInteracting ? 'animate-pulse' : ''}`} />
            <div className={`w-8 h-1 bg-amber-300/80 rounded-full ${isInteracting ? 'animate-pulse' : ''}`} />
          </div>

          {/* Interactive Delivery Scooter / Motorcycle */}
          <motion.div
            className="absolute bottom-1 z-20"
            initial={{ left: '20%' }}
            animate={{
              left: isInteracting ? ['15%', '65%', '35%', '80%', '45%'] : '25%',
            }}
            transition={
              isInteracting
                ? {
                    duration: 4.5,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                  }
                : {
                    duration: 0.8,
                    ease: 'easeOut',
                  }
            }
          >
            {/* Scooter Vibration Wrapper */}
            <div className={`relative flex items-center ${isInteracting ? 'animate-scooter-vibrate' : ''}`}>
              
              {/* Speech Bubble Above Scooter */}
              <div className="absolute -top-11 -right-10 sm:-right-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-2.5 py-1 rounded-xl shadow-lg border border-sky-300 dark:border-sky-800 text-[10px] sm:text-xs font-bold whitespace-nowrap flex items-center gap-1 z-30">
                {isInteracting ? (
                  <>
                    <span className="text-emerald-500 animate-bounce">🛵</span>
                    <span>دليفري الديب جاهز للانطلاق لعنوانك فوراً! 💨</span>
                  </>
                ) : (
                  <>
                    <span className="text-sky-500">🛵</span>
                    <span>اكتب بياناتك وسننطلق إليك بأسرع وقت!</span>
                  </>
                )}
                {/* Bubble tail */}
                <div className="absolute -bottom-1 right-6 w-2 h-2 bg-white dark:bg-slate-800 border-r border-b border-sky-300 dark:border-sky-800 rotate-45" />
              </div>

              {/* Headlight Beam (turned on during interaction) */}
              {isInteracting && (
                <div className="absolute -right-16 top-1 w-20 h-6 bg-gradient-to-r from-amber-300/40 via-amber-200/20 to-transparent clip-path-polygon pointer-events-none rounded-full blur-[2px]" />
              )}

              {/* Exhaust Smoke (puffs when moving) */}
              {isInteracting && (
                <div className="absolute -left-3 bottom-2 w-2.5 h-2.5 bg-slate-300/70 dark:bg-slate-500/70 rounded-full animate-smoke-puff pointer-events-none" />
              )}

              {/* Scooter SVG Graphic */}
              <svg
                width="68"
                height="44"
                viewBox="0 0 68 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-md"
              >
                {/* Rear Delivery Box (with Medical Cross) */}
                <rect x="4" y="6" width="16" height="15" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
                <rect x="10.5" y="9" width="3" height="9" rx="0.5" fill="#ffffff" />
                <rect x="7.5" y="12" width="9" height="3" rx="0.5" fill="#ffffff" />

                {/* Scooter Frame & Body */}
                <path
                  d="M18 25H32L38 15H46L49 22H36L30 30H18"
                  fill="#0369a1"
                  stroke="#0284c7"
                  strokeWidth="1.5"
                />

                {/* Seat & Rider Cushion */}
                <path d="M20 20C20 18 24 18 31 20L33 22H20V20Z" fill="#1e293b" />

                {/* Rider (Delivery Pharmacist/Captain) */}
                {/* Helmet */}
                <circle cx="34" cy="9" r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
                {/* Visor */}
                <path d="M36 8H40C40 8 40 11 37 11H35L36 8Z" fill="#38bdf8" />
                {/* Jacket Body */}
                <path d="M30 15C30 14 33 13 36 14L41 20H32L30 15Z" fill="#0284c7" />
                {/* Arm reaching to handlebar */}
                <path d="M35 16L45 17" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

                {/* Handlebar & Windshield */}
                <path d="M43 14L46 17" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
                <path d="M46 17L49 10" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />

                {/* Headlight */}
                <circle cx="50" cy="21" r="2.5" fill={isInteracting ? '#fef08a' : '#cbd5e1'} stroke="#f59e0b" strokeWidth="0.8" />

                {/* Front Wheel */}
                <g className={isInteracting ? 'animate-spin origin-[50px_32px]' : ''}>
                  <circle cx="50" cy="32" r="9" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                  <circle cx="50" cy="32" r="5" fill="#94a3b8" />
                  <circle cx="50" cy="32" r="2" fill="#0f172a" />
                  <line x1="50" y1="27" x2="50" y2="37" stroke="#e2e8f0" strokeWidth="1" />
                  <line x1="45" y1="32" x2="55" y2="32" stroke="#e2e8f0" strokeWidth="1" />
                </g>

                {/* Rear Wheel */}
                <g className={isInteracting ? 'animate-spin origin-[15px_32px]' : ''}>
                  <circle cx="15" cy="32" r="9" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                  <circle cx="15" cy="32" r="5" fill="#94a3b8" />
                  <circle cx="15" cy="32" r="2" fill="#0f172a" />
                  <line x1="15" y1="27" x2="15" y2="37" stroke="#e2e8f0" strokeWidth="1" />
                  <line x1="10" y1="32" x2="20" y2="32" stroke="#e2e8f0" strokeWidth="1" />
                </g>

                {/* Kickstand (tucked when moving) */}
                {!isInteracting && (
                  <line x1="30" y1="31" x2="26" y2="39" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
                )}
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
