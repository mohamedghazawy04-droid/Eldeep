import React, { useState, useEffect } from 'react';
import { getStoredLogo } from '../services/storage';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  const [logoSrc, setLogoSrc] = useState<string>(() => {
    return getStoredLogo() || '/eldeeb_logo.jpg';
  });
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const handleLogoUpdated = () => {
      const stored = getStoredLogo();
      setLogoSrc(stored || '/eldeeb_logo.jpg');
      setImageError(false);
    };

    window.addEventListener('eldeeb_logo_updated', handleLogoUpdated);
    return () => {
      window.removeEventListener('eldeeb_logo_updated', handleLogoUpdated);
    };
  }, []);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-13 h-13 sm:w-14 sm:h-14',
    lg: 'w-20 h-20',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`} id="eldeeb-logo-container">
      {/* Visual Logo Emblem */}
      <div className={`relative ${sizeClasses[size]} shrink-0 rounded-2xl overflow-hidden p-0.5 shadow-md bg-gradient-to-tr from-sky-600 via-cyan-500 to-blue-700 transition-transform hover:scale-105 duration-300`}>
        {!imageError ? (
          <img
            src={logoSrc}
            alt="شعار صيدلية الديب"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover rounded-[14px] bg-white dark:bg-slate-900"
          />
        ) : (
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full rounded-[14px] bg-white dark:bg-slate-900 drop-shadow-sm"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="blueGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </linearGradient>
              <linearGradient id="cyanAccent" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="38bdf8" />
              </linearGradient>
            </defs>
            <path
              d="M102,40 C95,58 75,80 62,98 C55,108 55,124 64,134 C76,146 95,152 108,138 C122,123 118,98 108,82 C104,75 106,62 114,54 C124,44 142,65 145,80 C149,102 136,126 122,142 C115,150 102,156 88,154 C72,152 58,138 54,120 C50,102 60,82 72,66 C82,53 96,44 102,40 Z"
              fill="url(#blueGlow)"
            />
            <path
              d="M106,58 C115,70 128,88 126,104 C124,116 114,128 100,132 C108,124 114,112 112,100 C110,86 98,72 106,58 Z"
              fill="url(#cyanAccent)"
            />
            <rect x="68" y="118" width="9" height="9" transform="rotate(45 68 118)" fill="#0284c7" />
            <rect x="82" y="126" width="9" height="9" transform="rotate(45 82 126)" fill="#0284c7" />
          </svg>
        )}
      </div>

      {/* Typography block */}
      <div className="flex flex-col text-right">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-l from-blue-700 via-sky-600 to-cyan-500 dark:from-sky-400 dark:to-cyan-200 tracking-tight text-xl sm:text-2xl font-cairo">
            صيدليات الديب
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="متاح 24/7" />
        </div>
        {showSubtitle && (
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
            <span className="font-mono text-cyan-600 dark:text-cyan-400">EL DEEB PHARMACY</span>
            <span className="text-[10px] bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 px-1.5 py-0.2 rounded-sm">24/7</span>
          </div>
        )}
      </div>
    </div>
  );
};

