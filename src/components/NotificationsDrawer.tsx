import React from 'react';
import { motion } from 'motion/react';
import { X, Bell, Sparkles, Package, Download, Check, ExternalLink } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onSelectProduct?: (productId: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  const handleInstallApp = () => {
    alert('لتثبيت تطبيق صيدلية الديب على جهازك:\n1. من متصفح الهاتف اضغط على قائمة الخيارات (⋮ أو Share)\n2. اختر "إضافة إلى الشاشة الرئيسية" (Add to Home screen)\nوسيتم تثبيت البرنامج مباشرة لتصلك أحدث المنتجات!');
  };

  return (
    <div
      id="notifications-drawer-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-start"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col font-cairo text-right border-r border-slate-200 dark:border-slate-800"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">مركز الإشعارات</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                أحدث الأدوية والعروض الحصرية
              </p>
            </div>
          </div>

          <button
            id="close-notifications-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PWA Install Banner */}
        <div className="p-4 bg-gradient-to-r from-sky-600 to-blue-700 text-white m-3 rounded-2xl shadow-md">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-xs mb-1">حمّل تطبيق صيدلية الديب!</h4>
              <p className="text-[11px] text-sky-100 leading-relaxed mb-2.5">
                ثبّت البرنامج على هاتفك ليصلك إشعار فوري عند إضافة أي أدوية ومستلزمات جديدة وتحديث أسعارها.
              </p>
              <button
                onClick={handleInstallApp}
                className="px-3 py-1.5 bg-white text-sky-700 rounded-xl font-bold text-xs shadow-sm hover:bg-sky-50 transition-colors"
              >
                تثبيت التطبيق الآن 📱
              </button>
            </div>
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1 px-1">
            <span>التنبيهات السابقة ({notifications.length})</span>
            <button
              onClick={onMarkAllRead}
              className="text-sky-600 dark:text-sky-400 hover:underline font-bold"
            >
              تعليم الكل كمقروء
            </button>
          </div>

          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3.5 rounded-2xl border transition-colors ${
                notif.read
                  ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  : 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/60 text-slate-800 dark:text-slate-100'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.type === 'new_product'
                      ? 'bg-sky-100 dark:bg-sky-900 text-sky-600'
                      : notif.type === 'loyalty'
                      ? 'bg-amber-100 dark:bg-amber-900 text-amber-600'
                      : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600'
                  }`}
                >
                  {notif.type === 'new_product' ? (
                    <Package className="w-3.5 h-3.5" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                      {notif.title}
                    </h5>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {notif.date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.productId && onSelectProduct && (
                    <button
                      onClick={() => {
                        onSelectProduct(notif.productId!);
                        onClose();
                      }}
                      className="mt-2 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <span>عرض المنتج المضاف</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
