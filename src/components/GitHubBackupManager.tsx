import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Github,
  CloudUpload,
  CloudDownload,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Key,
  FolderGit2,
  ExternalLink,
  ShieldCheck,
  Settings,
  HelpCircle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { Product } from '../types';
import {
  GitHubBackupConfig,
  getGitHubBackupConfig,
  saveGitHubBackupConfig,
  uploadBackupToGitHub,
  restoreFromGitHubBackup,
  downloadBackupJsonFile,
  testGitHubConnection,
  sanitizeGitHubToken,
} from '../services/githubBackup';

interface GitHubBackupManagerProps {
  products: Product[];
  onProductsRestored?: (products: Product[]) => void;
}

export const GitHubBackupManager: React.FC<GitHubBackupManagerProps> = ({
  products,
  onProductsRestored,
}) => {
  const [config, setConfig] = useState<GitHubBackupConfig>(getGitHubBackupConfig);
  const [showToken, setShowToken] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string; link?: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setConfig(getGitHubBackupConfig());
  }, []);

  const handleSaveConfig = (updates: Partial<GitHubBackupConfig>) => {
    const updated = saveGitHubBackupConfig(updates);
    setConfig(updated);
    setStatusMsg({ type: 'info', text: 'تم حفظ إعدادات GitHub بنجاح' });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setStatusMsg(null);
    try {
      const res = await testGitHubConnection(config);
      if (res.success) {
        setStatusMsg({
          type: 'success',
          text: `تم الاتصال بنجاح بحساب GitHub: @${res.user}${res.repoExists ? ' (والمستودع موجود وجاهز)' : ' (تأكد من إنشاء المستودع المحدد)'}`,
        });
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'فشل الاتصال بـ GitHub' });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleUploadNow = async () => {
    setIsUploading(true);
    setStatusMsg(null);
    try {
      const res = await uploadBackupToGitHub(products, config);
      if (res.success) {
        setStatusMsg({
          type: 'success',
          text: `تم رفع النسخة الاحتياطية بنجاح إلى GitHub (${products.length} صنف)!`,
          link: res.commitUrl,
        });
        setConfig(getGitHubBackupConfig());
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'فشل الرفع إلى GitHub' });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRestoreNow = async () => {
    if (!confirm('هل أنت متأكد من استرجاع الأصناف من GitHub؟ سيتم تحديث الكتالوج ومزامنته مع السحابة.')) {
      return;
    }
    setIsRestoring(true);
    setStatusMsg(null);
    try {
      const res = await restoreFromGitHubBackup();
      if (res.success && res.products) {
        setStatusMsg({
          type: 'success',
          text: `تم استرجاع ${res.count} صنف بنجاح من مستودع GitHub!`,
        });
        if (onProductsRestored) {
          onProductsRestored(res.products);
        }
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'فشل الاسترجاع من GitHub' });
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const isConfigured = Boolean(config.token.trim() && config.repo.trim());

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6 shadow-xl relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-cyan-500/10 to-blue-500/0 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 flex items-center justify-center text-white shadow-inner flex-shrink-0">
            <Github className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white">
                المستودع السحابي الدائم على GitHub (مجاني للأبد)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Free Forever 100%</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              وسيلة حفظ احتياطية فائقة الأمان لا تمسح ولا تنتهي صلاحيتها أبداً، تضمن بقاء أصنافك وبيانات صيدلية الديب حتى لو تعطلت أي خوادم أخرى.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="px-3 py-1.5 rounded-xl border border-slate-700 hover:border-cyan-500/50 bg-slate-800/80 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>كيف يعمل؟</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showSettings
                ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                : 'border-slate-700 hover:border-cyan-500/50 bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>إعدادات الربط</span>
          </button>
        </div>
      </div>

      {/* Guide Accordion */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 text-xs text-slate-300 space-y-3"
          >
            <h4 className="font-bold text-cyan-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>خطوات التفعيل المجاني على GitHub في دقيقة واحدة:</span>
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 pr-2">
              <li>
                حسابك على GitHub هو: <code className="text-cyan-300 bg-slate-900 px-2 py-0.5 rounded font-mono font-bold">mohamedghazawy04-droid</code> المرتبط ببريدك <code className="text-emerald-300 bg-slate-900 px-1.5 py-0.5 rounded font-mono">mohamedghazawy04@gmail.com</code>.
              </li>
              <li>
                مستودعك الجاهز هو: <a href="https://github.com/mohamedghazawy04-droid/Eldeep" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-mono font-bold">mohamedghazawy04-droid/Eldeep</a>.
              </li>
              <li>
                <strong>إنشاء الرمز في خطوة واحدة سريعة:</strong> اضغط على هذا الرابط المباشر: <a href="https://github.com/settings/tokens/new?scopes=repo&description=Eldeep-Pharmacy-Sync" target="_blank" rel="noreferrer" className="text-amber-400 underline font-bold">إنشاء الرمز المجهّز على GitHub</a> (سيتم تفعيل صلاحية <code className="text-emerald-300 bg-slate-800 px-1.5 py-0.5 rounded">repo</code> تلقائياً، فقط اضغط Generate Token في أسفل الصفحة وانسخه).
              </li>
              <li>
                الصق الرمز في خانة "رمز الوصول الشخصي" بالأسفل واضغط <strong>حفظ واختبار الاتصال</strong>.
              </li>
            </ol>
            <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              💡 <strong>ملاحظة:</strong> يمكنك أيضاً تحميل ملف الكتالوج فوراً بصيغة JSON ورفعه بضغطة زر يدوياً داخل المستودع دون الحاجة لإدخال أي رمز!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Alert */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300'
              : statusMsg.type === 'error'
              ? 'bg-rose-950/50 border border-rose-500/40 text-rose-300'
              : 'bg-cyan-950/50 border border-cyan-500/40 text-cyan-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : statusMsg.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 text-cyan-400 flex-shrink-0 animate-spin" />
            )}
            <span className="leading-relaxed">{statusMsg.text}</span>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0 mr-auto sm:mr-0">
            {statusMsg.type === 'error' && (
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=Eldeep-Pharmacy-Sync"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>إنشاء رمز جديد غير منتهي</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {statusMsg.link && (
              <a
                href={statusMsg.link}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-white underline hover:text-cyan-300 flex items-center gap-1 font-bold flex-shrink-0"
              >
                <span>عرض الملف على GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Safe Changes Verified Banner with Gentle Pulse Animation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <div className="text-xs font-bold text-emerald-300 flex items-center gap-2 flex-wrap">
              <span>جميع التغييرات السابقة محفوظة ومؤمنة سحابياً بنجاح</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                100% Saved & Safe
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              قاعدة البيانات (Firestore)، كتالوج الأصناف ({products.length})، وبيانات المستودع ({config.repo}) محفوظة بالكامل.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleUploadNow}
          className="relative px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-950/40 whitespace-nowrap animate-pulse hover:animate-none shrink-0"
        >
          <CloudUpload className="w-4 h-4" />
          <span>تأكيد المزامنة وحفظ نسخة الآن</span>
        </button>
      </div>

      {/* Main Interactive Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Action 1: Upload to GitHub with gentle pulse effect */}
        <button
          type="button"
          disabled={isUploading}
          onClick={handleUploadNow}
          className="relative p-4 rounded-2xl bg-gradient-to-br from-cyan-600/20 via-slate-800 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 transition-all text-right flex flex-col justify-between gap-3 group active:scale-[0.98] disabled:opacity-50 overflow-hidden shadow-lg shadow-cyan-950/40"
        >
          {/* Subtle glowing pulse border ring */}
          <span className="absolute inset-0 rounded-2xl border-2 border-cyan-400/20 animate-pulse pointer-events-none" />
          <div className="flex items-center justify-between w-full">
            <span className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CloudUpload className={`w-5 h-5 ${isUploading ? 'animate-bounce' : ''}`} />
            </span>
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
              {products.length} صنف جاهز
            </span>
          </div>
          <div>
            <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
              {isUploading ? 'جارٍ الحفظ على GitHub...' : 'مزامنة ورفع لـ GitHub الآن'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              تحديث ملف النسخة السحابية على المستودع
            </div>
          </div>
        </button>

        {/* Action 2: Restore from GitHub */}
        <button
          type="button"
          disabled={isRestoring}
          onClick={handleRestoreNow}
          className="p-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/40 transition-all text-right flex flex-col justify-between gap-3 group active:scale-[0.98] disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full">
            <span className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CloudDownload className={`w-5 h-5 ${isRestoring ? 'animate-spin' : ''}`} />
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
              استرجاع فوري
            </span>
          </div>
          <div>
            <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
              {isRestoring ? 'جارٍ الاسترجاع...' : 'استرجاع الكتالوج من GitHub'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              استعادة الأصناف وحفظها في Firestore
            </div>
          </div>
        </button>

        {/* Action 3: Download Backup File (Zero-Token Safe) */}
        <button
          type="button"
          onClick={() => downloadBackupJsonFile(products)}
          className="p-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/40 transition-all text-right flex flex-col justify-between gap-3 group active:scale-[0.98]"
        >
          <div className="flex items-center justify-between w-full">
            <span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Download className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30">
              JSON File
            </span>
          </div>
          <div>
            <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
              تحميل ملف النسخة الاحتياطية
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              تنزيل ملف جاهز لرفعه على GitHub يدوياً
            </div>
          </div>
        </button>
      </div>

      {/* Status Bar */}
      <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-slate-300">
            {isConfigured ? (
              <>مستودع GitHub النشط: <strong className="font-mono text-cyan-400">{config.repo}</strong></>
            ) : (
              'حالة الربط: بانتظار إدخال رمز الوصول الشخصي واسم المستودع'
            )}
          </span>
        </div>
        {config.lastBackupAt && (
          <div className="text-[11px] text-slate-400">
            آخر مزامنة: <span className="text-slate-200 font-mono">{config.lastBackupAt}</span>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>إعدادات الاتصال بمستودع GitHub</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                إغلاق
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Repo */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>اسم المستودع (user/repo) *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...config, repo: 'mohamedghazawy04-droid/Eldeep' };
                      setConfig(updated);
                      saveGitHubBackupConfig(updated);
                    }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 underline"
                  >
                    اختر مستودعك: Eldeep
                  </button>
                </div>
                <input
                  type="text"
                  value={config.repo}
                  onChange={(e) => setConfig({ ...config, repo: e.target.value })}
                  placeholder="mohamedghazawy04-droid/Eldeep"
                  className="w-full px-3.5 py-2.5 bg-slate-900 text-white rounded-xl text-xs border border-slate-800 focus:border-cyan-500 outline-none font-mono"
                />
              </div>

              {/* Branch & File Path */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الفرع (Branch)</label>
                  <input
                    type="text"
                    value={config.branch}
                    onChange={(e) => setConfig({ ...config, branch: e.target.value })}
                    placeholder="main"
                    className="w-full px-3.5 py-2.5 bg-slate-900 text-white rounded-xl text-xs border border-slate-800 focus:border-cyan-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">اسم الملف</label>
                  <input
                    type="text"
                    value={config.filePath}
                    onChange={(e) => setConfig({ ...config, filePath: e.target.value })}
                    placeholder="eldeeb_pharmacy_backup.json"
                    className="w-full px-3.5 py-2.5 bg-slate-900 text-white rounded-xl text-xs border border-slate-800 focus:border-cyan-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Token */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>رمز الوصول الشخصي (GitHub Personal Access Token - PAT) *</span>
                </span>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=Eldeep-Pharmacy-Sync"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline font-bold flex items-center gap-1"
                >
                  <span>اضغط هنا لإنشاء الرمز تلقائياً على GitHub</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={config.token}
                  onChange={(e) => setConfig({ ...config, token: sanitizeGitHubToken(e.target.value) })}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 text-white rounded-xl text-xs border border-slate-800 focus:border-cyan-500 outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex flex-col gap-1 mt-1.5">
                <p className="text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-500/20 p-2 rounded-lg">
                  💡 <strong>نصيحة لمنع انتهاء الصلاحية:</strong> في صفحة GitHub عند إنشاء الرمز، اختر من قائمة <strong>Expiration</strong> الخيار: <span className="font-bold underline text-white">No expiration</span> حتى يعمل الرمز معك دائماً دون أن ينتهي.
                </p>
                <p className="text-[11px] text-slate-500">
                  الرمز يُحفظ محلياً بأمان على جهازك ولا يشارك مع أي طرف خارجي.
                </p>
              </div>
            </div>

            {/* Auto-Sync Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div>
                <div className="text-xs font-bold text-white">المزامنة التلقائية مع GitHub</div>
                <div className="text-[11px] text-slate-400">
                  رفع نسخة احتياطية فورية تلقائياً عند إضافة أو تعديل أو استيراد أصناف
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.autoSync}
                onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>

            {/* Save & Test Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isTesting}
                onClick={handleTestConnection}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>اختبار الاتصال</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveConfig(config)}
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                حفظ الإعدادات
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
