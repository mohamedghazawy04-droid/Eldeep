import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, X, MessageSquareHeart, Award, RefreshCw, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getDeboDailyTip, getRandomDeboTip, DailyHealthTip } from '../data/deboTips';

interface MascotPetProps {
  onRewardPoints?: (points: number) => void;
  activeCategoryName?: string;
}

export const MascotPet: React.FC<MascotPetProps> = ({
  onRewardPoints,
  activeCategoryName,
}) => {
  const [mood, setMood] = useState<'idle' | 'jumping' | 'dancing' | 'winking' | 'celebrating'>('idle');
  const [currentTip, setCurrentTip] = useState<DailyHealthTip>(() => getDeboDailyTip(activeCategoryName));
  const [isDailySpecial, setIsDailySpecial] = useState<boolean>(true);
  const [speech, setSpeech] = useState<string>('');
  const [showSpeech, setShowSpeech] = useState<boolean>(true);
  const [clickCount, setClickCount] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);

  // Initialize with the daily verified tip on mount
  useEffect(() => {
    const tip = getDeboDailyTip(activeCategoryName);
    setCurrentTip(tip);
    setSpeech(`${tip.icon} ${tip.title}: ${tip.content}`);
    setIsDailySpecial(true);
  }, []);

  // Periodic category change hint
  useEffect(() => {
    if (activeCategoryName) {
      const tip = getDeboDailyTip(activeCategoryName);
      setCurrentTip(tip);
      setSpeech(`${tip.icon} ${tip.title}: ${tip.content}`);
      setIsDailySpecial(false);
      setShowSpeech(true);
    }
  }, [activeCategoryName]);

  // Handle requesting another tip
  const handleNextTip = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = getRandomDeboTip(currentTip.id);
    setCurrentTip(next);
    setSpeech(`${next.icon} ${next.title}: ${next.content}`);
    setIsDailySpecial(false);
    setShowSpeech(true);
  };

  // Click on mascot toggles fun animations and fresh verified medical tip
  const handleMascotClick = () => {
    const nextClicks = clickCount + 1;
    setClickCount(nextClicks);

    const moods: ('jumping' | 'dancing' | 'winking')[] = ['jumping', 'dancing', 'winking'];
    const selectedMood = moods[nextClicks % moods.length];
    setMood(selectedMood);

    // Provide a fresh medical tip from the verified database
    const next = getRandomDeboTip(currentTip.id);
    setCurrentTip(next);
    setSpeech(`${next.icon} ${next.title}: ${next.content}`);
    setIsDailySpecial(false);
    setShowSpeech(true);

    // Easter egg: friendly celebration every 5 clicks (points earned solely through purchases)
    if (nextClicks % 5 === 0 && !rewardClaimed) {
      setMood('celebrating');
      setSpeech('🎉 ياهو! نقرت عليا 5 مرات! صيدلية الديب تتمنى لك دوام الصحة والعافية!');
      setRewardClaimed(true);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {
        // ignore
      }
    }

    // Return to idle after animation
    setTimeout(() => {
      setMood('idle');
    }, 2800);
  };

  if (isMinimized) {
    return (
      <button
        id="mascot-restore-btn"
        onClick={() => {
          setIsMinimized(false);
          setShowSpeech(true);
        }}
        className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 bg-gradient-to-r from-sky-500 to-blue-600 text-white p-2.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform flex items-center gap-1.5 text-xs font-bold font-cairo border-2 border-white dark:border-slate-800"
        title="إظهار ديبو الصيدلي"
      >
        <span className="text-lg">🐺</span>
        <span className="hidden sm:inline">ديبو</span>
      </button>
    );
  }

  return (
    <div
      id="pharmacy-mascot-container"
      className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 pointer-events-none select-none"
    >
      <div className="relative pointer-events-auto flex flex-col items-start">
        {/* Speech Bubble */}
        <AnimatePresence>
          {showSpeech && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className="mb-2 max-w-[240px] sm:max-w-[280px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-md text-slate-800 dark:text-slate-100 text-xs p-3 rounded-2xl shadow-xl border border-sky-200 dark:border-sky-900/50 font-cairo leading-relaxed relative"
            >
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{currentTip.icon}</span>
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                    {isDailySpecial ? 'نصيحة اليوم المعتمدة' : 'معلومة صيدلانية'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleNextTip}
                    className="text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="نصيحة أخرى"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSpeech(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="إغلاق التلميح"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <h6 className="font-bold text-[11px] text-slate-900 dark:text-white mb-1">
                {currentTip.title}
              </h6>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                {currentTip.content}
              </p>

              <div className="mt-2 pt-1.5 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/40">
                <span className="flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5 text-sky-500" />
                  <span>تحديث يومي مستمر</span>
                </span>
                <button
                  onClick={handleNextTip}
                  className="font-bold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  معلومة ثانية &larr;
                </button>
              </div>

              {/* Little triangle pointing to mascot */}
              <div className="absolute -bottom-2 left-8 w-3 h-3 bg-white dark:bg-slate-800 rotate-45 border-r border-b border-sky-200 dark:border-sky-900/50" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mascot Avatar Card */}
        <motion.div
          id="mascot-avatar"
          onClick={handleMascotClick}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          animate={
            mood === 'jumping'
              ? { y: [0, -28, 0, -14, 0], rotate: [0, -8, 8, -4, 0] }
              : mood === 'dancing'
              ? { rotate: [-12, 12, -10, 10, 0], scale: [1, 1.1, 1, 1.05, 1] }
              : mood === 'winking'
              ? { scale: [1, 1.15, 0.95, 1], rotate: [0, 6, -6, 0] }
              : mood === 'celebrating'
              ? { y: [0, -32, 0, -20, 0], rotate: [0, 360], scale: [1, 1.25, 1] }
              : { y: [0, -5, 0] }
          }
          transition={
            mood === 'idle'
              ? { repeat: Infinity, duration: 3.2, ease: 'easeInOut' }
              : { duration: 1.2 }
          }
          className="cursor-pointer group relative flex items-center justify-center filter drop-shadow-xl"
          title="اضغط على ديبو ليغير حركته ويعطيك نصائح ونقاط!"
        >
          {/* Cartoon Character Body (Friendly Wolf-Pup Pharmacist with Doctor Coat & Stethoscope) */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 p-1 rounded-full shadow-lg ring-4 ring-white/90 dark:ring-slate-900/90 flex items-center justify-center relative overflow-visible">
            
            {/* Little Doctor Cap / Stethoscope Badge */}
            <div className="absolute -top-3 right-1 bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow flex items-center gap-0.5 border border-amber-200">
              <Sparkles className="w-2.5 h-2.5 text-amber-700" />
              <span>ديبو</span>
            </div>

            {/* Custom SVG Cartoon Wolf-Pup in Medical Coat */}
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Ears */}
              <polygon points="18,12 36,36 12,38" fill="#0284c7" />
              <polygon points="20,18 32,34 16,35" fill="#bae6fd" />

              <polygon points="82,12 64,36 88,38" fill="#0284c7" />
              <polygon points="80,18 68,34 84,35" fill="#bae6fd" />

              {/* Head */}
              <circle cx="50" cy="50" r="34" fill="#38bdf8" />
              <ellipse cx="50" cy="56" rx="26" ry="22" fill="#ffffff" />

              {/* Eyes */}
              {mood === 'winking' ? (
                <>
                  {/* Right Eye open */}
                  <circle cx="38" cy="46" r="4.5" fill="#0f172a" />
                  <circle cx="36.5" cy="44" r="1.5" fill="#ffffff" />
                  {/* Left Eye winking */}
                  <path d="M58,47 Q64,41 70,47" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />
                </>
              ) : (
                <>
                  <circle cx="38" cy="46" r="4.5" fill="#0f172a" />
                  <circle cx="36.5" cy="44" r="1.5" fill="#ffffff" />

                  <circle cx="62" cy="46" r="4.5" fill="#0f172a" />
                  <circle cx="60.5" cy="44" r="1.5" fill="#ffffff" />
                </>
              )}

              {/* Cute Blushing Cheeks */}
              <circle cx="28" cy="54" r="4" fill="#f43f5e" opacity="0.45" />
              <circle cx="72" cy="54" r="4" fill="#f43f5e" opacity="0.45" />

              {/* Snout & Cute Nose */}
              <ellipse cx="50" cy="58" rx="8" ry="6" fill="#0284c7" />
              <polygon points="50,56 46,53 54,53" fill="#0f172a" />

              {/* Smile */}
              <path
                d="M45,60 Q50,65 55,60"
                stroke="#0f172a"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />

              {/* White Doctor Coat Collar */}
              <path d="M26,76 L44,88 L50,74 L56,88 L74,76 L66,94 L34,94 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
              {/* Stethoscope around neck */}
              <path
                d="M34,74 C34,88 66,88 66,74"
                stroke="#0284c7"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx="50" cy="85" r="3" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
            </svg>

            {/* Click me hint badge */}
            <div className="absolute -bottom-2 bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-sky-200 dark:border-sky-800">
              {clickCount === 0 ? 'المسني!' : '🐾 تفاعل!'}
            </div>
          </div>

          {/* Minimize button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            className="absolute -top-1 -left-1 bg-slate-200 dark:bg-slate-700 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 rounded-full p-1 shadow-sm transition-colors text-[9px]"
            title="تصغير ديبو"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};
