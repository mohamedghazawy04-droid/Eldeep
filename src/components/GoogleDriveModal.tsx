import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  HardDrive,
  CloudUpload,
  RefreshCw,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Database,
  Lock,
  LogOut,
  Upload,
} from 'lucide-react';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  listDriveFiles,
  deleteDriveFile,
  backupPharmacyDataToDrive,
  uploadFileToDrive,
  DriveFileItem,
} from '../services/googleDrive';
import { Customer, OrderRecord, PrescriptionOrder, Product } from '../types';
import { User } from 'firebase/auth';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders: OrderRecord[];
  customers: Customer[];
  prescriptions: PrescriptionOrder[];
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  products,
  orders,
  customers,
  prescriptions,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Destructive Action Confirmation Dialog state (per Workspace guidelines)
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload custom file state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingCustom, setIsUploadingCustom] = useState(false);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, accessToken) => {
        setUser(authedUser);
        setToken(accessToken);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fetch files when user is authenticated
  useEffect(() => {
    if (token && isOpen) {
      loadFiles();
    }
  }, [token, isOpen]);

  const loadFiles = async () => {
    setIsLoadingFiles(true);
    setErrorMessage(null);
    try {
      const driveFiles = await listDriveFiles();
      setFiles(driveFiles);
    } catch (err: any) {
      console.error('Error loading files:', err);
      setErrorMessage(err.message || 'تعذر جلب ملفات Google Drive');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setNeedsAuth(false);
        setSuccessMessage('تم الاتصال بنجاح مع حساب Google Drive!');
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setErrorMessage(err.message || 'فشل تسجيل الدخول بواسطة Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
    setFiles([]);
  };

  const handleBackupNow = async () => {
    if (!token) {
      setErrorMessage('يرجى تسجيل الدخول بحساب Google أولاً');
      return;
    }
    setIsBackingUp(true);
    setErrorMessage(null);
    try {
      const uploaded = await backupPharmacyDataToDrive({
        products,
        orders,
        customers,
        prescriptions,
      });
      setSuccessMessage(`تم إنشاء وحفظ النسخة الاحتياطية بنجاح على Google Drive (${uploaded.name})`);
      setTimeout(() => setSuccessMessage(null), 5000);
      await loadFiles();
    } catch (err: any) {
      console.error('Backup error:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ النسخة الاحتياطية');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleCustomFileUpload = async () => {
    if (!selectedFile || !token) return;
    setIsUploadingCustom(true);
    setErrorMessage(null);
    try {
      await uploadFileToDrive({
        name: `eldeeb_${Date.now()}_${selectedFile.name}`,
        mimeType: selectedFile.type || 'application/octet-stream',
        content: selectedFile,
        description: `ملف مرفوع لصيدلية الديب: ${selectedFile.name}`,
      });
      setSelectedFile(null);
      setSuccessMessage('تم رفع الملف وحفظه بأمان على Google Drive');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadFiles();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل رفع الملف إلى Google Drive');
    } finally {
      setIsUploadingCustom(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      const ok = await deleteDriveFile(fileToDelete.id);
      if (ok) {
        setSuccessMessage(`تم حذف الملف "${fileToDelete.name}" من Google Drive`);
        setFileToDelete(null);
        await loadFiles();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage('تعذر حذف الملف، يرجى المحاولة لاحقاً');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء حذف الملف');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="google-drive-modal-backdrop"
        className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-cairo text-right select-none overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-sky-100 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-l from-sky-600 to-blue-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <HardDrive className="w-5 h-5 text-sky-200" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg flex items-center gap-2">
                  <span>المزامنة السحابية مع Google Drive</span>
                </h3>
                <p className="text-xs text-sky-100/90 font-medium">
                  حفظ النسخ الاحتياطية للكتالوج، الطلبات، الروشتات، وملفات الصيدلية
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback messages */}
          {successMessage && (
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-3 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-500/10 border-b border-rose-500/20 p-3 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Main Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
            {/* Account connection bar */}
            {needsAuth || !user ? (
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center mx-auto text-sky-600 dark:text-sky-400">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                    تسجيل الدخول إلى Google Drive
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    اربط حساب Google الخاص بصيدليتك للنسخ الاحتياطي السحابي التلقائي والوصول السريع لملفات المرضى والروشتات.
                  </p>
                </div>

                {/* Standard Google Sign-in button */}
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={handleSignIn}
                    disabled={isLoggingIn}
                    className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-sm shadow-md border border-slate-300 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                    <span>{isLoggingIn ? 'جاري الاتصال بـ Google...' : 'تسجيل الدخول بواسطة Google'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-sky-50/70 dark:bg-sky-950/40 rounded-2xl p-4 border border-sky-200/80 dark:border-sky-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google User'}
                      className="w-10 h-10 rounded-full border border-sky-300"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-sm">
                      {user.email?.slice(0, 2).toUpperCase() || 'G'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">
                        {user.displayName || 'مستخدم Google'}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-extrabold">
                        متصل بـ Drive ✓
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {user.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadFiles}
                    disabled={isLoadingFiles}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-600 border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-all"
                    title="تحديث الملفات"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>خروج</span>
                  </button>
                </div>
              </div>
            )}

            {/* Action cards when connected */}
            {!needsAuth && user && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Backup Card */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                        <Database className="w-5 h-5" />
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                          نسخ قاعدة البيانات بالكامل
                        </h4>
                      </div>
                      <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold px-2 py-0.5 rounded-full">
                        {products.length} دواء
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      يتم تصدير وحفظ جميع الأدوية، والطلبات ({orders.length})، وسجل العملاء ({customers.length}) والروشتات في ملف JSON آمن على Google Drive.
                    </p>
                    <button
                      type="button"
                      onClick={handleBackupNow}
                      disabled={isBackingUp}
                      className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isBackingUp ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري الرفع إلى Google Drive...</span>
                        </>
                      ) : (
                        <>
                          <CloudUpload className="w-4 h-4" />
                          <span>حفظ نسخة احتياطية الآن</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Manual file upload */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <Upload className="w-5 h-5" />
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                        رفع ملف أو روشتة يدوياً
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      اختر صورة روشتة أو تقرير طبي أو ملف فواتير لرفعه وتخزينه في مجلد Google Drive الخاص بالصيدلية.
                    </p>

                    <div className="space-y-2">
                      <input
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 dark:file:bg-indigo-950 file:text-indigo-600 dark:file:text-indigo-400 hover:file:bg-indigo-100 cursor-pointer"
                      />
                      {selectedFile && (
                        <button
                          type="button"
                          onClick={handleCustomFileUpload}
                          disabled={isUploadingCustom}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isUploadingCustom ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>جاري الرفع...</span>
                            </>
                          ) : (
                            <>
                              <CloudUpload className="w-4 h-4" />
                              <span>تأكيد الرفع على Drive</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Drive Files List */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-sky-500" />
                      <span>الملفات المحفوظة على Google Drive ({files.length})</span>
                    </h4>
                    <button
                      type="button"
                      onClick={loadFiles}
                      className="text-[11px] text-sky-600 dark:text-sky-400 font-bold hover:underline"
                    >
                      إعادة الفحص
                    </button>
                  </div>

                  {isLoadingFiles ? (
                    <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-sky-500" />
                      <span>جاري فحص الملفات من السحابة...</span>
                    </div>
                  ) : files.length === 0 ? (
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                      <HardDrive className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        لا توجد ملفات احتياطية مرفوعة بعد
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        اضغط على "حفظ نسخة احتياطية الآن" لإنشاء أول نسخة مشفرة على حسابك.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/60 max-h-56 overflow-y-auto">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {file.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                {file.createdTime && (
                                  <span>{new Date(file.createdTime).toLocaleDateString('ar-EG')}</span>
                                )}
                                {file.size && <span>• {Math.round(parseInt(file.size, 10) / 1024)} KB</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                                title="فتح في Google Drive"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => setFileToDelete(file)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="حذف الملف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-sky-500" />
              <span>Google Drive API v3 • صيدلية الديب الرقمية</span>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </motion.div>

        {/* Explicit Confirmation Dialog for Delete (MANDATORY per Workspace Skill) */}
        {fileToDelete && (
          <div
            className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setFileToDelete(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-md w-full shadow-2xl border border-rose-200 dark:border-rose-900 text-right space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    تأكيد حذف الملف من Google Drive
                  </h4>
                  <p className="text-xs text-slate-500">هذا الإجراء نهائي ولا يمكن التراجع عنه.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
                {fileToDelete.name}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFileToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الحذف...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>تأكيد الحذف النهائي</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
