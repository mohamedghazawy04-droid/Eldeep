import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  RefreshCw,
  Check,
  X,
  Sliders,
  Award,
  Sun,
  Contrast,
  Image as ImageIcon,
  SwitchCamera,
  Wand2,
} from 'lucide-react';

export type StudioPreset = 'commercial3d' | 'clinicalWhite' | 'goldenGlow' | 'original';

interface GeminiProductStudioProps {
  initialImage?: string;
  onImageEnhanced: (enhancedDataUrl: string) => void;
  onCancel: () => void;
  productName?: string;
}

export const GeminiProductStudio: React.FC<GeminiProductStudioProps> = ({
  initialImage = '',
  onImageEnhanced,
  onCancel,
  productName = 'صيدلية الديب',
}) => {
  const [sourceImage, setSourceImage] = useState<string>(initialImage);
  const [activePreset, setActivePreset] = useState<StudioPreset>('commercial3d');
  const [brightness, setBrightness] = useState<number>(108); // 100 is default
  const [contrast, setContrast] = useState<number>(112); // 100 is default
  const [addBadge, setAddBadge] = useState<boolean>(true);
  const [addShadow, setAddShadow] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Camera stream state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('تعذر فتح الكاميرا، يرجى التأكد من منح الإذن للمتصفح أو رفع صورة من الملفات.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setSourceImage(dataUrl);
    stopCamera();
    applyStudioEffects(dataUrl, activePreset, brightness, contrast, addBadge, addShadow);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setSourceImage(result);
        stopCamera();
        applyStudioEffects(result, activePreset, brightness, contrast, addBadge, addShadow);
      }
    };
    reader.readAsDataURL(file);
  };

  // Re-render studio canvas when presets or controls change
  useEffect(() => {
    if (sourceImage && !isCameraActive) {
      applyStudioEffects(sourceImage, activePreset, brightness, contrast, addBadge, addShadow);
    }
  }, [sourceImage, activePreset, brightness, contrast, addBadge, addShadow, isCameraActive]);

  const applyStudioEffects = (
    imgSrc: string,
    preset: StudioPreset,
    b: number,
    c: number,
    badge: boolean,
    shadow: boolean
  ) => {
    if (!imgSrc || !canvasRef.current) return;
    setIsProcessing(true);

    const img = new Image();
    if (!imgSrc.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onerror = () => {
      // Fallback: If image fails with crossOrigin or network error, use source image directly
      setIsProcessing(false);
    };
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Studio square format 800x800 for pristine promotional display
      const outW = 800;
      const outH = 800;
      canvas.width = outW;
      canvas.height = outH;

      ctx.save();
      ctx.clearRect(0, 0, outW, outH);

      // --- 1. Draw Professional Studio Background ---
      if (preset === 'commercial3d') {
        // Soft commercial gradient studio background with top spotlight
        const bgGrad = ctx.createRadialGradient(outW * 0.5, outH * 0.35, 80, outW * 0.5, outH * 0.5, outW * 0.7);
        bgGrad.addColorStop(0, '#f8fafc'); // clean off-white center
        bgGrad.addColorStop(0.5, '#e2e8f0'); // soft slate
        bgGrad.addColorStop(1, '#cbd5e1'); // deep edge
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, outW, outH);

        // Ground stage floor reflection hint
        const floorGrad = ctx.createLinearGradient(0, outH * 0.72, 0, outH);
        floorGrad.addColorStop(0, 'rgba(203, 213, 225, 0.4)');
        floorGrad.addColorStop(1, 'rgba(148, 163, 184, 0.7)');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, outH * 0.72, outW, outH * 0.28);
      } else if (preset === 'clinicalWhite') {
        // Pure high-end pharmaceutical white studio
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outW, outH);

        // Subtle soft vignette
        const whiteGrad = ctx.createRadialGradient(outW * 0.5, outH * 0.5, 200, outW * 0.5, outH * 0.5, outW * 0.65);
        whiteGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        whiteGrad.addColorStop(1, 'rgba(241, 245, 249, 0.8)');
        ctx.fillStyle = whiteGrad;
        ctx.fillRect(0, 0, outW, outH);
      } else if (preset === 'goldenGlow') {
        // Luxury promotional glow background
        const goldGrad = ctx.createRadialGradient(outW * 0.5, outH * 0.4, 100, outW * 0.5, outH * 0.5, outW * 0.75);
        goldGrad.addColorStop(0, '#fffdf7');
        goldGrad.addColorStop(0.6, '#fef3c7');
        goldGrad.addColorStop(1, '#fde68a');
        ctx.fillStyle = goldGrad;
        ctx.fillRect(0, 0, outW, outH);
      } else {
        // Original natural
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outW, outH);
      }

      // --- 2. Calculate aspect-fitted product position ---
      const padding = 70;
      const targetW = outW - padding * 2;
      const targetH = outH - padding * 2 - 30; // space for bottom ground

      const imgAspect = img.width / img.height;
      let drawW = targetW;
      let drawH = targetW / imgAspect;

      if (drawH > targetH) {
        drawH = targetH;
        drawW = targetH * imgAspect;
      }

      const drawX = (outW - drawW) / 2;
      const drawY = padding + (targetH - drawH) / 2;

      // --- 3. Cast Shadow for 3D realism ---
      if (shadow && preset !== 'original') {
        ctx.save();
        ctx.beginPath();
        const shadowY = drawY + drawH - 12;
        const shadowW = drawW * 0.82;
        const shadowH = Math.min(26, drawH * 0.08);
        ctx.ellipse(outW * 0.5, shadowY, shadowW * 0.5, shadowH, 0, 0, Math.PI * 2);
        const shadowGrad = ctx.createRadialGradient(
          outW * 0.5,
          shadowY,
          shadowW * 0.05,
          outW * 0.5,
          shadowY,
          shadowW * 0.5
        );
        shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0.38)');
        shadowGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.18)');
        shadowGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = shadowGrad;
        ctx.fill();
        ctx.restore();
      }

      // --- 4. Draw Product Image with Filters ---
      ctx.save();
      // Apply filters
      let filterString = `brightness(${b}%) contrast(${c}%)`;
      if (preset === 'commercial3d') {
        filterString += ' saturate(115%)';
      } else if (preset === 'goldenGlow') {
        filterString += ' saturate(125%)';
      }
      ctx.filter = filterString;

      // Draw the image cleanly centered
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();

      // --- 5. Commercial Promotional Badge ---
      if (badge && preset !== 'original') {
        ctx.save();
        // Top right promotional stamp
        const stampX = outW - 40;
        const stampY = 40;

        ctx.textAlign = 'right';
        ctx.direction = 'rtl';

        // Background pill
        const pillWidth = 230;
        const pillHeight = 38;
        const pillX = stampX - pillWidth;
        const pillY = stampY;

        ctx.fillStyle = preset === 'goldenGlow' ? 'rgba(180, 83, 9, 0.95)' : 'rgba(2, 132, 199, 0.92)';
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 19);
        ctx.fill();

        // White border
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px Cairo, sans-serif';
        ctx.fillText('⭐ صيدلية الديب • أصلي 100%', stampX - 16, stampY + 24);

        ctx.restore();
      }

      // Subtle outer frame line
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, outW, outH);

      ctx.restore();
      setIsProcessing(false);
    };

    img.src = imgSrc;
  };

  const handleConfirm = () => {
    try {
      if (canvasRef.current && canvasRef.current.width > 0 && canvasRef.current.height > 0) {
        const finalDataUrl = canvasRef.current.toDataURL('image/jpeg', 0.88);
        onImageEnhanced(finalDataUrl);
      } else if (sourceImage) {
        onImageEnhanced(sourceImage);
      }
    } catch {
      if (sourceImage) {
        onImageEnhanced(sourceImage);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-cairo text-right"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Wand2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">ستوديو تعديلات الكاميرا الإعلانية (Gemini AI Studio)</h3>
                <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  PRO STUDIO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                التقط صورة الدواء بالكاميرا أو ارفعها لتتحول تلقائياً إلى بوستر دعائي ثلاثي الأبعاد وإضاءة صيدلية نقية
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Studio Content Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Visual Stage (Canvas / Live Video) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div className="w-full aspect-square max-w-[420px] bg-slate-100 dark:bg-slate-950 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden relative shadow-inner flex items-center justify-center">
              {/* If Camera is active */}
              {isCameraActive ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />
                  {/* Camera overlay guide */}
                  <div className="absolute inset-8 border-2 border-white/60 rounded-2xl pointer-events-none flex items-center justify-center">
                    <span className="text-[11px] font-bold text-white/80 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      ضع عبوة الدواء داخل الإطار
                    </span>
                  </div>

                  {/* Camera control buttons */}
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="p-3 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-transform active:scale-95"
                      title="تبديل الكاميرا"
                    >
                      <SwitchCamera className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="p-4 bg-sky-500 hover:bg-sky-400 text-white rounded-full shadow-lg shadow-sky-500/40 border-4 border-white transition-transform active:scale-90"
                      title="التقاط وتطبيق المعالجة"
                    >
                      <Camera className="w-6 h-6" />
                    </button>

                    <button
                      type="button"
                      onClick={stopCamera}
                      className="p-3 bg-rose-600/80 hover:bg-rose-700 text-white rounded-full backdrop-blur-sm transition-transform active:scale-95"
                      title="إلغاء الكاميرا"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Canvas Output */}
                  <canvas
                    ref={canvasRef}
                    className={`w-full h-full object-contain rounded-2xl ${
                      sourceImage ? 'block' : 'hidden'
                    }`}
                  />

                  {/* Empty state if no source image */}
                  {!sourceImage && (
                    <div className="p-6 text-center flex flex-col items-center">
                      <div className="w-16 h-16 rounded-3xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
                        <Camera className="w-8 h-8" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
                        التقط أو اختر صورة الدواء
                      </h4>
                      <p className="text-xs text-slate-500 max-w-[240px] mb-4">
                        سيتم تصفية الصورة، إزالة الظلال الرمادية، وإضافة إضاءة ستوديو إعلانية فخمة
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => startCamera('environment')}
                          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                          <Camera className="w-4 h-4" />
                          <span>فتح الكاميرا الآن</span>
                        </button>
                        <label className="cursor-pointer px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95">
                          <Upload className="w-4 h-4" />
                          <span>رفع من الجهاز</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Processing Spinner Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-full text-xs font-bold shadow-lg">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                    <span>جاري المعالجة الإعلانية...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Camera / Upload Action Bar underneath canvas */}
            {sourceImage && !isCameraActive && (
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => startCamera('environment')}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-sky-600" />
                  <span>إعادة الالتقاط</span>
                </button>

                <label className="cursor-pointer px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95">
                  <Upload className="w-3.5 h-3.5 text-sky-600" />
                  <span>تغيير الصورة</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            )}

            {cameraError && (
              <div className="mt-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
                {cameraError}
              </div>
            )}
          </div>

          {/* Enhancement Controls Panel */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div>
              {/* Presets Title */}
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>أنماط الستوديو الدعائي المعتمدة:</span>
                </h4>
              </div>

              {/* Preset Cards */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {/* Commercial 3D */}
                <button
                  type="button"
                  onClick={() => setActivePreset('commercial3d')}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                    activePreset === 'commercial3d'
                      ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 shadow-sm ring-2 ring-sky-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">ستوديو إعلاني 3D</span>
                    {activePreset === 'commercial3d' && <Check className="w-3.5 h-3.5 text-sky-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500">إضاءة سبوتلايت وظل أرضي طبيعي</p>
                </button>

                {/* Clinical White */}
                <button
                  type="button"
                  onClick={() => setActivePreset('clinicalWhite')}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                    activePreset === 'clinicalWhite'
                      ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 shadow-sm ring-2 ring-sky-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">أبيض صيدلاني ناصع</span>
                    {activePreset === 'clinicalWhite' && <Check className="w-3.5 h-3.5 text-sky-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500">كتالوج طبي رسمي بدون ظلال</p>
                </button>

                {/* Golden Glow */}
                <button
                  type="button"
                  onClick={() => setActivePreset('goldenGlow')}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                    activePreset === 'goldenGlow'
                      ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">إشراق دعائي ذهبي</span>
                    {activePreset === 'goldenGlow' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500">وهج تسويقي جذاب للمنتجات الحصرية</p>
                </button>

                {/* Raw Original */}
                <button
                  type="button"
                  onClick={() => setActivePreset('original')}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                    activePreset === 'original'
                      ? 'border-slate-600 bg-slate-100 dark:bg-slate-800 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">الصورة الأصلية</span>
                    {activePreset === 'original' && <Check className="w-3.5 h-3.5 text-slate-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500">بدون إضافات أو معالجة ستوديو</p>
                </button>
              </div>

              {/* Adjustments: Brightness & Contrast */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 mb-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>إضاءة الستوديو (Brightness)</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="140"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-sky-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />

                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Contrast className="w-3.5 h-3.5 text-indigo-500" />
                    <span>وضوح وتباين الكتابة (Contrast)</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="90"
                  max="140"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-sky-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <label className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    شارة الجودة الدعائية (⭐ صيدلية الديب • أصلي 100%)
                  </span>
                  <input
                    type="checkbox"
                    checked={addBadge}
                    onChange={(e) => setAddBadge(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    الظل الأرضي ثلاثي الأبعاد الواقعي
                  </span>
                  <input
                    type="checkbox"
                    checked={addShadow}
                    onChange={(e) => setAddShadow(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                </label>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!sourceImage}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                  sourceImage
                    ? 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 text-white shadow-sky-600/30 active:scale-98'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>اعتماد الصورة الإعلانية للمنتج</span>
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
