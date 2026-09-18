import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Camera, Phone, User, MapPin, Download, Share2, ExternalLink, Calendar, CheckCircle } from 'lucide-react';
import { PrescriptionOrder } from '../types';
import { getStoredPrescriptions } from '../services/storage';
import { fetchPrescriptionFromFirestore } from '../services/firestoreSync';

interface PrescriptionViewModalProps {
  rxId: string;
  onClose: () => void;
}

export const PrescriptionViewModal: React.FC<PrescriptionViewModalProps> = ({ rxId, onClose }) => {
  const [prescription, setPrescription] = useState<PrescriptionOrder | null>(() => {
    const list = getStoredPrescriptions();
    return list.find((item) => item.id === rxId) || null;
  });
  const [loading, setLoading] = useState(!prescription);

  useEffect(() => {
    if (prescription) return;
    let isMounted = true;
    const fetchRx = async () => {
      try {
        setLoading(true);
        const data = await fetchPrescriptionFromFirestore(rxId);
        if (data && isMounted) {
          setPrescription(data);
        }
      } catch (err) {
        console.warn('Error fetching prescription from firestore:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchRx();
    return () => {
      isMounted = false;
    };
  }, [rxId, prescription]);

  const handleDownloadImage = () => {
    if (!prescription?.imageUrl) return;
    const a = document.createElement('a');
    a.href = prescription.imageUrl;
    a.download = `prescription-${prescription.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (!prescription?.imageUrl) return;
    try {
      const res = await fetch(prescription.imageUrl);
      const blob = await res.blob();
      const file = new File([blob], 'prescription.jpg', { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `روشتة طبية - ${prescription.customerName}`,
          text: `روشتة طبية للمريض: ${prescription.customerName} - هاتف: ${prescription.customerPhone}`,
        });
        return;
      }
    } catch {
      // ignore
    }
    window.open(prescription.imageUrl, '_blank');
  };

  return (
    <div
      id="rx-lightbox-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-cairo"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl border border-sky-100 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">معاينة صورة الروشتة الطبية</h3>
              <p className="text-[11px] text-sky-100">رقم الطلب: {rxId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-right">
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold">جاري تحميل صورة الروشتة وتفاصيلها...</p>
            </div>
          ) : prescription ? (
            <>
              {/* Prescription Image */}
              {prescription.imageUrl ? (
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-700 flex items-center justify-center group max-h-80">
                    <img
                      src={prescription.imageUrl}
                      alt="صورة الروشتة"
                      className="w-full h-auto max-h-80 object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={handleDownloadImage}
                      className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>حفظ الصورة</span>
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex-1 py-2 px-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>مشاركة الصورة</span>
                    </button>
                    <a
                      href={prescription.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors"
                      title="فتح بالحجم الأصلي الكامل"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 rounded-xl text-xs text-amber-800 dark:text-amber-200 text-center">
                  لا توجد صورة مرفقة مع هذا الطلب (تم إرسال أسماء الأدوية والملاحظات نصياً).
                </div>
              )}

              {/* Patient Details Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-500" />
                    <span>اسم المريض:</span>
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {prescription.customerName}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>رقم الهاتف:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white dir-ltr">
                      {prescription.customerPhone}
                    </span>
                    <a
                      href={`tel:${prescription.customerPhone}`}
                      className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded font-bold text-[10px]"
                    >
                      اتصال
                    </a>
                  </div>
                </div>

                {prescription.customerAddress && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/60">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>عنوان التوصيل:</span>
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {prescription.customerAddress}
                    </span>
                  </div>
                )}

                {prescription.notes && (
                  <div className="pt-1">
                    <span className="text-slate-500 block mb-1">ملاحظات العميل:</span>
                    <p className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                      {prescription.notes}
                    </p>
                  </div>
                )}

                {prescription.timestamp && (
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>تاريخ الإرسال:</span>
                    </span>
                    <span>{prescription.timestamp}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-slate-500 space-y-2">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">لم يتم العثور على الروشتة</p>
              <p className="text-xs text-slate-400">قد يكون الرابط غير مكتمل أو تم حذف الطلب من الأرشيف.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs transition-colors"
          >
            إغلاق المعاينة
          </button>
        </div>
      </motion.div>
    </div>
  );
};
