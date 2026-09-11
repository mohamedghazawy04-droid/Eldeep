import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Camera, FileText, Send, CheckCircle2, Phone, User, MapPin } from 'lucide-react';
import { Customer, PrescriptionOrder } from '../types';
import { createPrescriptionWhatsAppUrl } from '../services/whatsapp';
import { savePrescription } from '../services/storage';
import { syncSavePrescriptionToFirestore } from '../services/firestoreSync';
import confetti from 'canvas-confetti';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCustomer: Customer | null;
  onPrescriptionSubmitted?: (prescription: PrescriptionOrder) => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  activeCustomer,
  onPrescriptionSubmitted,
}) => {
  const [patientName, setPatientName] = useState(activeCustomer?.name || '');
  const [patientPhone, setPatientPhone] = useState(activeCustomer?.phone || '');
  const [patientAddress, setPatientAddress] = useState(activeCustomer?.address || '');
  const [notes, setNotes] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      alert('يرجى كتابة الاسم ورقم الهاتف للتواصل');
      return;
    }

    setIsSubmitting(true);

    const newPrescription: PrescriptionOrder = {
      id: 'rx-' + Date.now(),
      customerName: patientName.trim(),
      customerPhone: patientPhone.trim(),
      customerAddress: patientAddress.trim(),
      imageUrl: imagePreview || '',
      notes: notes.trim(),
      status: 'pending',
      timestamp: new Date().toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    savePrescription(newPrescription);
    syncSavePrescriptionToFirestore(newPrescription);
    if (onPrescriptionSubmitted) {
      onPrescriptionSubmitted(newPrescription);
    }

    // Launch WhatsApp directly to pharmacy phone
    const waUrl = createPrescriptionWhatsAppUrl(
      patientName,
      patientPhone,
      patientAddress,
      notes,
      Boolean(imagePreview)
    );

    setIsSubmitting(false);
    setIsSuccess(true);

    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    // Open WhatsApp after a short delay
    setTimeout(() => {
      window.open(waUrl, '_blank');
    }, 800);
  };

  const resetForm = () => {
    setImagePreview(null);
    setNotes('');
    setIsSuccess(false);
    onClose();
  };

  return (
    <div
      id="prescription-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-sky-100 dark:border-slate-800 overflow-hidden font-cairo my-auto max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">إرسال روشتة طبية للصيدلية</h3>
              <p className="text-xs text-sky-100">تصل فوراً لصيدلي صيدليات الديب على الواتساب</p>
            </div>
          </div>
          <button
            id="close-prescription-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {isSuccess ? (
            <div className="py-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                تم تجهيز الروشتة وإرسالها للصيدلية!
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-sm mb-6 leading-relaxed">
                تم تحويل تفاصيل الروشتة مباشرة إلى رقم هاتف صيدلية الديب (+201009097378) عبر الواتساب، وسيقوم الصيدلي بمراجعتها وتأكيد السعر وموعد التوصيل.
              </p>
              <button
                id="done-prescription-btn"
                onClick={resetForm}
                className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-md transition-colors"
              >
                تم، إغلاق النافذة
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Prescription Image Upload Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  صورة الروشتة أو علبة الدواء
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                    imagePreview
                      ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20'
                      : 'border-slate-300 dark:border-slate-700 hover:border-sky-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="relative group max-h-48 flex items-center justify-center overflow-hidden rounded-xl">
                      <img
                        src={imagePreview}
                        alt="Prescription Preview"
                        className="max-h-44 object-contain rounded-lg shadow"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                        <span>انقر لتغيير الصورة</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                      <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-semibold">
                        اسحب وأفلت صورة الروشتة هنا، أو <span className="text-sky-600 dark:text-sky-400 underline">اضغط للتصوير أو الاختيار</span>
                      </p>
                      <span className="text-[11px] text-slate-400">يدعم الصور من الكاميرا أو المعرض (JPG, PNG)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم المريض / العميل <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      id="rx-patient-name"
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="مثال: أحمد محمود"
                      className="w-full pr-9 pl-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs sm:text-sm font-medium border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف للتواصل <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      id="rx-patient-phone"
                      type="tel"
                      required
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="w-full pr-9 pl-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs sm:text-sm font-medium border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان التوصيل
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    id="rx-patient-address"
                    type="text"
                    value={patientAddress}
                    onChange={(e) => setPatientAddress(e.target.value)}
                    placeholder="المنطقة، اسم الشارع، رقم العمارة، الدور"
                    className="w-full pr-9 pl-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs sm:text-sm font-medium border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات إضافية (أعراض، بدائل مقبولة، عدد العلب)
                </label>
                <textarea
                  id="rx-patient-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: يرجى تجهيز بديل مصري إن وجد، أو إضافة خافض حرارة للأطفال..."
                  className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs sm:text-sm font-medium border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-colors resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                id="submit-prescription-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Send className="w-4 h-4 rotate-180" />
                <span>إرسال الروشتة مباشرة للواتساب (+201009097378)</span>
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
