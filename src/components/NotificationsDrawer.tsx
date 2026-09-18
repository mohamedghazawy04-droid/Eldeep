import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Bell,
  Sparkles,
  Package,
  Download,
  Check,
  CheckCircle2,
  ExternalLink,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onDismissNotification?: (id: string) => void;
  onSelectProduct?: (productId: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onDismissNotification,
  onSelectProduct,
}) => {
  const [showArchived, setShowArchived] = useState(false);

  if (!isOpen) return null;

  const handleInstallApp = () => {
    alert(
      'لتثبيت تطبيق صيدلية الديب على جهازك:\n1. من متصفح الهاتف اضغط على قائمة الخيارات (⋮ أو Share)\n2. اختر "إضافة إلى الشاشة الرئيسية" (Add to Home screen)\nوسيتم تثبيت البرنامج مباشرة لتصلك أحدث المنتجات!'
    );
  };

  // Active unread notifications (these disappear when user marks all as read)
  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

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
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center relative">
              <Bell className="w-5 h-5" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                  {unreadNotifications.length}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">مركز الإشعارات</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                أحدث الأصناف المضافة والعروض الحصرية
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
        <div className="p-3.5 bg-gradient-to-r from-sky-600 to-blue-700 text-white m-3 rounded-2xl shadow-md">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-xs mb-0.5">حمّل تطبيق صيدلية الديب!</h4>
              <p className="text-[11px] text-sky-100 leading-relaxed mb-2">
                ثبّت البرنامج على هاتفك ليصلك إشعار فوري عند إضافة أي أدوية ومستلزمات جديدة.
              </p>
              <button
                onClick={handleInstallApp}
                className="px-2.5 py-1 bg-white text-sky-700 rounded-xl font-bold text-[11px] shadow-sm hover:bg-sky-50 transition-colors"
              >
                تثبيت التطبيق الآن 📱
              </button>
            </div>
          </div>
        </div>

        {/* Active Notifications list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              الإشعارات النشطة ({unreadNotifications.length})
            </span>
            {unreadNotifications.length > 0 && (
              <button
                id="mark-all-notifications-read-btn"
                onClick={onMarkAllRead}
                className="text-sky-600 dark:text-sky-400 hover:underline font-bold flex items-center gap-1 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-1 rounded-xl transition-all active:scale-95 border border-sky-200 dark:border-sky-800"
              >
                <Check className="w-3.5 h-3.5" />
                <span>تحديد قراءة الكل</span>
              </button>
            )}
          </div>

          {unreadNotifications.length === 0 ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-inner">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
                لا توجد أصناف جديدة غير مقروءة
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] leading-relaxed">
                تم الاطلاع على جميع التنبيهات. عند إضافة أي صنف جديد بالصيدلية سيظهر هنا تلقائياً.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {unreadNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3.5 rounded-2xl border transition-all bg-sky-50/80 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/60 shadow-sm hover:shadow"
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        notif.type === 'new_product'
                          ? 'bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-400'
                          : notif.type === 'loyalty'
                          ? 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400'
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
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {notif.date}
                          </span>
                          {onDismissNotification && (
                            <button
                              onClick={() => onDismissNotification(notif.id)}
                              title="إخفاء هذا الإشعار"
                              className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-sky-100 dark:border-sky-900/40 pt-2">
                        {notif.productId && onSelectProduct ? (
                          <button
                            onClick={() => {
                              onSelectProduct(notif.productId!);
                              if (onDismissNotification) {
                                onDismissNotification(notif.id);
                              }
                              onClose();
                            }}
                            className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                          >
                            <span>عرض المنتج المضاف</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : <div />}

                        {onDismissNotification && (
                          <button
                            onClick={() => onDismissNotification(notif.id)}
                            className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>تمت القراءة</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Archived / Previous Notifications Accordion */}
          {readNotifications.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 py-1.5 px-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <span>السجل السابق المقروء ({readNotifications.length})</span>
                {showArchived ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <AnimatePresence>
                {showArchived && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 mt-2"
                  >
                    {readNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                            {notif.title}
                          </span>
                          <span className="text-[10px] font-mono">{notif.date}</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                          {notif.message}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
