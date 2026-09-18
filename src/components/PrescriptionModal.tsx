import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Camera, FileText, Send, CheckCircle2, Phone, User, MapPin, Share2, Download, ExternalLink, Copy } from 'lucide-react';
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
  const [submittedRx, setSubmittedRx] = useState<PrescriptionOrder | null>(null);
  const [submittedWaUrl, setSubmittedWaUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  const [isCapturingLive, setIsCapturingLive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [errors, setErrors] = useState<{ name?: string; phone?: string; content?: string }>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  if (!isOpen) return null;

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturingLive(false);
  };

  const handleStartLiveCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        // Fallback to file input with capture attribute
        cameraInputRef.current?.click();
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCapturingLive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err: any) {
      console.warn('Camera stream error or permission denied:', err);
      // If live stream permission is denied or unsupported, fallback to native camera file input
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else {
        setCameraError('لم يتم منح إذن الكاميرا. يمكنك اختيار صورة الروشتة من جهازك أو الألبوم.');
      }
    }
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImagePreview(dataUrl);
        setErrors((prev) => ({ ...prev, content: undefined }));
      }
    } catch (err) {
      console.error('Failed to capture snapshot', err);
    } finally {
      stopCameraStream();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setErrors((prev) => ({ ...prev, content: undefined }));
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
        setErrors((prev) => ({ ...prev, content: undefined }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; phone?: string; content?: string } = {};

    if (!patientName.trim()) {
      newErrors.name = 'يرجى كتابة اسم المريض بالكامل';
    }

    const cleanPhone = patientPhone.replace(/\s+/g, '');
    if (!cleanPhone) {
      newErrors.phone = 'يرجى كتابة رقم الهاتف للتواصل';
    } else if (cleanPhone.length < 10) {
      newErrors.phone = 'يرجى كتابة رقم هاتف صحيح (11 رقم)';
    }

    if (!imagePreview && !notes.trim()) {
      newErrors.content = 'يرجى إرفاق صورة الروشتة أو كتابة أسماء الأدوية المطلوبة في الملاحظات';
    }

    setErrors(newErrors);
    setHasAttemptedSubmit(true);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.name) {
        document.getElementById('rx-patient-name')?.focus();
      } else if (newErrors.phone) {
        document.getElementById('rx-patient-phone')?.focus();
      }
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

    // Launch WhatsApp directly to pharmacy phone with image preview link
    const rxViewUrl = `${window.location.origin}/?rx=${newPrescription.id}`;
    const waUrl = createPrescriptionWhatsAppUrl(
      patientName,
      patientPhone,
      patientAddress,
      notes,
      Boolean(imagePreview),
      rxViewUrl
    );

    setSubmittedRx(newPrescription);
    setSubmittedWaUrl(waUrl);

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

  const handleShareImageFile = async () => {
    if (!submittedRx?.imageUrl) return;
    try {
      const res = await fetch(submittedRx.imageUrl);
      const blob = await res.blob();
      const file = new File([blob], 'prescription.jpg', { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'روشتة طبية - صيدلية الديب',
          text: `روشتة طبية للمريض: ${submittedRx.customerName}`,
        });
        return;
      }
    } catch (err) {
      console.warn('Web share not supported or failed:', err);
    }
    // Fallback: open full image in new tab
    window.open(submittedRx.imageUrl, '_blank');
  };

  const handleDownloadImage = () => {
    if (!submittedRx?.imageUrl) return;
    const a = document.createElement('a');
    a.href = submittedRx.imageUrl;
    a.download = `prescription-${submittedRx.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const resetForm = () => {
    setImagePreview(null);
    setNotes('');
    setIsSuccess(false);
    setSubmittedRx(null);
    setSubmittedWaUrl('');
    setIsCopied(false);
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
              <p className="text-xs text-sky-100">تصل فوراً لصيدلي صيدلية الديب على الواتساب</p>
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
            <div className="py-4 text-center flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  تم تجهيز الروشتة وإرسالها للصيدلية بنجاح!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                  تم إرسال كافة تفاصيل الروشتة مع رابط المعاينة الكامل إلى رقم واتساب صيدلية الديب (+201009097378).
                </p>
              </div>

              {/* Attached Image Preview & Direct Share Controls */}
              {submittedRx?.imageUrl && (
                <div className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 space-y-3 text-right">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Camera className="w-4 h-4" />
                      <span>صورة الروشتة الأصلية المحفوظة بالطلب:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => window.open(submittedRx.imageUrl, '_blank')}
                      className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>تكبير بالحجم الكامل</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 max-h-56 flex items-center justify-center group">
                    <img
                      src={submittedRx.imageUrl}
                      alt="الروشتة"
                      className="w-full h-auto max-h-56 object-contain"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleShareImageFile}
                      className="py-2.5 px-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>مشاركة الصورة لواتساب</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadImage}
                      className="py-2.5 px-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>حفظ الصورة بجهازك</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-normal">
                    💡 يتضمن نص رسالة الواتساب رابطاً مباشراً يفتح للصيدلي الصورة كاملة وبأعلى دقة، كما يمكنك إرسال الصورة المحفوظة في المحادثة مباشرة.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-2 pt-2">
                {submittedWaUrl && (
                  <a
                    href={submittedWaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>فتح محادثة الواتساب وتأكيد الطلب الآن</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  id="done-prescription-btn"
                  onClick={resetForm}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs transition-colors"
                >
                  تم، إغلاق النافذة
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Top Alert Banner if validation failed */}
              {hasAttemptedSubmit && Object.keys(errors).length > 0 && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-500/80 rounded-2xl flex items-start gap-2.5 text-rose-800 dark:text-rose-200 animate-in fade-in duration-200">
                  <span className="text-base leading-none mt-0.5">⚠️</span>
                  <div className="text-xs">
                    <strong className="block font-bold mb-0.5">تنبيه: بيانات ناقصة لإرسال الروشتة</strong>
                    يرجى ملء الحقول المحددة باللون الأحمر أدناه حتى يتمكن الصيدلي من تجهيز الدواء والتواصل معك.
                  </div>
                </div>
              )}

              {/* Prescription Image Upload Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>صورة الروشتة أو علبة الدواء</span>
                  <span className="text-[10px] text-slate-400 font-normal">اختياري أو تصوير مباشر</span>
                </label>

                {cameraError && (
                  <div className="mb-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                    {cameraError}
                  </div>
                )}

                {/* Live Camera View (Only active when user clicks camera) */}
                {isCapturingLive ? (
                  <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-sky-500 flex flex-col items-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="w-full max-h-64 object-cover"
                    />
                    <div className="w-full p-3 bg-slate-900/90 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleCaptureSnapshot}
                        className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                      >
                        <Camera className="w-4 h-4" />
                        <span>التقاط الصورة الآن</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCameraStream}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold active:scale-95 transition-all"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : imagePreview ? (
                  /* Image Preview with change buttons */
                  <div className="p-3 border-2 border-sky-500/50 bg-sky-50/50 dark:bg-sky-950/20 rounded-2xl flex flex-col items-center gap-3">
                    <div className="relative max-h-52 w-full flex items-center justify-center overflow-hidden rounded-xl bg-black/5">
                      <img
                        src={imagePreview}
                        alt="Prescription Preview"
                        className="max-h-48 object-contain rounded-lg shadow-sm"
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                      <button
                        type="button"
                        onClick={handleStartLiveCamera}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>إعادة التصوير بالكاميرا</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>اختيار صورة أخرى</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImagePreview(null)}
                        className="px-3 py-1.5 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-200 rounded-xl text-xs font-bold active:scale-95 transition-all"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Option Selection: No camera access until button clicked */
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-5 text-center transition-colors bg-slate-50/50 dark:bg-slate-800/30"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          التقط صورة للروشتة أو اخترها من جهازك
                        </p>
                        <p className="text-[11px] text-slate-400">
                          (لن يتم فتح الكاميرا إلا عند طلبك ذلك عبر الزر أدناه)
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={handleStartLiveCamera}
                          className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all"
                        >
                          <Camera className="w-4 h-4" />
                          <span>فتح الكاميرا للتصوير</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-bold flex items-center gap-2 active:scale-95 transition-all"
                        >
                          <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          <span>رفع من جهازك</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hidden file inputs for manual upload & camera capture */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <span>اسم المريض / العميل</span>
                    <span className="text-[11px] text-rose-500 font-bold">* مطلوب</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      id="rx-patient-name"
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => {
                        setPatientName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      placeholder="مثال: محمد السيد"
                      className={`w-full pr-9 pl-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium outline-none transition-colors ${
                        errors.name
                          ? 'border-2 border-rose-500 bg-rose-50/80 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900'
                      }`}
                    />
                    {errors.name && (
                      <span className="absolute left-3 top-2.5 text-rose-500 font-bold text-xs">
                        ⚠️
                      </span>
                    )}
                  </div>
                  {errors.name && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <span>رقم الهاتف للتواصل</span>
                    <span className="text-[11px] text-rose-500 font-bold">* مطلوب</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      id="rx-patient-phone"
                      type="tel"
                      required
                      value={patientPhone}
                      onChange={(e) => {
                        setPatientPhone(e.target.value);
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      placeholder="010XXXXXXXX"
                      className={`w-full pr-9 pl-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium outline-none transition-colors ${
                        errors.phone
                          ? 'border-2 border-rose-500 bg-rose-50/80 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900'
                      }`}
                    />
                    {errors.phone && (
                      <span className="absolute left-3 top-2.5 text-rose-500 font-bold text-xs">
                        ⚠️
                      </span>
                    )}
                  </div>
                  {errors.phone && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              {errors.content && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-bold">
                  ⚠️ {errors.content}
                </div>
              )}

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
