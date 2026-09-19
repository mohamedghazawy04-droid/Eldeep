import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  X,
  Eye,
  Check,
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { CATEGORIES } from '../data/initialData';
import { resolveProductImage } from '../utils/productImageResolver';

interface ExcelProductImporterProps {
  currentProducts?: Product[];
  existingProducts?: Product[];
  isOpen?: boolean;
  onImportComplete: (
    importedProducts: Product[],
    mode: 'merge' | 'replace'
  ) => Promise<void> | void;
  onClose: () => void;
}

export const ExcelProductImporter: React.FC<ExcelProductImporterProps> = ({
  currentProducts = [],
  existingProducts = [],
  isOpen = true,
  onImportComplete,
  onClose,
}) => {
  if (!isOpen) return null;

  const catalogProducts = (existingProducts && existingProducts.length > 0)
    ? existingProducts
    : (currentProducts || []);
  const [fileName, setFileName] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<Product[]>([]);
  const [, setPreviewRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize column name
  const normalizeKey = (key: string): string => {
    return (key || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[\s_\-/\\]+/g, '');
  };

  // Find value from row with multiple possible column names
  const findValue = (row: any, possibleKeys: string[]): any => {
    const rowKeys = Object.keys(row);
    for (const pKey of possibleKeys) {
      const normalizedPKey = normalizeKey(pKey);
      const foundKey = rowKeys.find((k) => normalizeKey(k) === normalizedPKey);
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
        return row[foundKey];
      }
    }
    for (const pKey of possibleKeys) {
      const normalizedPKey = normalizeKey(pKey);
      const foundKey = rowKeys.find((k) => {
        const n = normalizeKey(k);
        return n.includes(normalizedPKey) || normalizedPKey.includes(n);
      });
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
        return row[foundKey];
      }
    }
    return '';
  };

  // Map Arabic/English category text to valid ProductCategory ID
  const mapCategory = (rawCat: string): ProductCategory => {
    if (!rawCat) return 'medicines';
    const clean = rawCat.trim().toLowerCase();
    for (const cat of CATEGORIES) {
      if (
        clean.includes(cat.id.toLowerCase()) ||
        clean.includes(cat.nameAr.toLowerCase()) ||
        cat.nameAr.toLowerCase().includes(clean)
      ) {
        return cat.id;
      }
    }
    if (clean.includes('علاج') || clean.includes('دواء') || clean.includes('ادوية') || clean.includes('med')) {
      return 'medicines';
    }
    if (clean.includes('جلد') || clean.includes('بشرة') || clean.includes('شعر') || clean.includes('skin')) {
      return 'skincare';
    }
    if (clean.includes('فيتامين') || clean.includes('مكمل') || clean.includes('vitamin')) {
      return 'vitamins';
    }
    if (clean.includes('طفل') || clean.includes('اطفال') || clean.includes('رضع') || clean.includes('baby')) {
      return 'baby';
    }
    if (clean.includes('اسنان') || clean.includes('فم') || clean.includes('شامبو') || clean.includes('personal')) {
      return 'personal';
    }
    if (clean.includes('جهاز') || clean.includes('ضغط') || clean.includes('سكر') || clean.includes('device')) {
      return 'devices';
    }
    if (clean.includes('اسعاف') || clean.includes('شاش') || clean.includes('بلاستر') || clean.includes('aid')) {
      return 'firstaid';
    }
    return 'medicines';
  };

  // Handle file selection and parsing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setErrorMsg('');
    setSuccessMsg('');
    setFileName(selectedFile.name);
    setIsLoading(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!jsonData || jsonData.length === 0) {
        setErrorMsg('الملف فارغ أو لا يحتوي على صفوف بيانات.');
        setIsLoading(false);
        return;
      }

      setPreviewRows(jsonData.slice(0, 5));

      const now = Date.now();
      const productsList: Product[] = [];

      jsonData.forEach((row, index) => {
        // Look for Name
        const nameArVal = String(
          findValue(row, [
            'اسمالدواء',
            'اسمالصنف',
            'الاسم',
            'اسم',
            'name',
            'productname',
            'itemname',
            'arabicname',
            'description',
            'البيان',
            'الصنف',
          ]) || ''
        ).trim();

        if (!nameArVal) return; // Skip empty rows

        const nameEnVal = String(
          findValue(row, [
            'الاسمالانجليزي',
            'الاسمالإنجليزي',
            'nameen',
            'englishname',
            'tradename',
            'itemnameen',
          ]) || ''
        ).trim();

        // Price
        const rawPrice = findValue(row, [
          'السعر',
          'سعر',
          'سعرالجمهور',
          'سعرالبيع',
          'price',
          'sellprice',
          'publicprice',
          'cost',
        ]);
        let priceVal = parseFloat(String(rawPrice).replace(/[^\d.]/g, ''));
        if (isNaN(priceVal) || priceVal <= 0) priceVal = 25;

        // Category
        const rawCat = String(
          findValue(row, ['القسم', 'قسم', 'التصنيف', 'المجموعة', 'category', 'group', 'department']) || ''
        );
        const categoryVal = mapCategory(rawCat);

        // Active Ingredient
        const activeIngredientVal = String(
          findValue(row, ['المادةالفعالة', 'مادةفعالة', 'activeingredient', 'generic', 'composition']) || ''
        ).trim();

        // Dosage Form
        const dosageFormVal = String(
          findValue(row, ['الشكالدوائي', 'الشكل', 'form', 'dosageform', 'unit', 'الوحدة']) || 'أقراص'
        ).trim();

        // Stock / Quantity
        const rawStock = findValue(row, ['الكمية', 'كمية', 'المخزون', 'رصيد', 'stock', 'quantity', 'qty']);
        let stockVal = parseInt(String(rawStock).replace(/[^\d]/g, ''), 10);
        if (isNaN(stockVal)) stockVal = 20;

        // Description
        const descVal = String(
          findValue(row, ['الوصف', 'وصف', 'description', 'استخدام', 'طريقةالاستخدام', 'usage']) || ''
        ).trim();

        // Image
        const imageVal = String(
          findValue(row, ['الصورة', 'صورة', 'image', 'picture', 'photo', 'img']) || '/eldeeb_logo.jpg'
        ).trim();

        // Loyalty Points (10 points per 1 EGP)
        const pointsVal = Math.round(priceVal * 10);

        // ID: Barcode or clean ID
        const barcodeVal = String(
          findValue(row, ['باركود', 'الباركود', 'كود', 'الكود', 'barcode', 'code', 'id', 'itemcode']) || ''
        ).trim();

        const id = barcodeVal ? `med_${barcodeVal}` : `prod_${now}_${index}_${Math.random().toString(36).slice(2, 6)}`;

        productsList.push({
          id,
          nameAr: nameArVal,
          nameEn: nameEnVal || nameArVal,
          category: categoryVal,
          price: priceVal,
          points: pointsVal,
          image: (imageVal.startsWith('http') || imageVal.startsWith('data:') || (imageVal.startsWith('/') && !imageVal.includes('eldeeb_logo'))) 
            ? imageVal 
            : resolveProductImage({ nameAr: nameArVal, nameEn: nameEnVal, category: categoryVal, dosageForm: dosageFormVal, activeIngredient: activeIngredientVal }),
          inStock: stockVal > 0,
          dosageForm: dosageFormVal || 'أقراص',
          activeIngredient: activeIngredientVal || 'وفق التركيبة الطبية',
          description: descVal || 'منتج طبي معتمد في صيدلية الديب.',
          usage: 'وفق استشارة الصيدلي أو الطبيب المعالج.',
          requiresPrescription: false,
          stockQuantity: stockVal,
          isLowStock: stockVal > 0 && stockVal <= 5,
          isComingSoon: false,
          isNew: true,
          createdAt: now,
        });
      });

      if (productsList.length === 0) {
        setErrorMsg('لم يتم العثور على أي أسماء أصناف صالحة في الملف. يرجى التأكد من تسمية عمود الصنف "اسم الدواء" أو "اسم الصنف".');
        setIsLoading(false);
        return;
      }

      setParsedItems(productsList);
      setIsLoading(false);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMsg(`حدث خطأ أثناء قراءة ملف الإكسل: ${err?.message || 'تنسيق غير مدعوم'}`);
      setIsLoading(false);
    }
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        'اسم الدواء': 'بنادول إكسترا 500 مجم (Panadol Extra)',
        'الاسم بالإنجليزي': 'Panadol Extra 500mg',
        'السعر (ج.م)': 45,
        'القسم': 'أدوية وعلاجات',
        'المادة الفعالة': 'Paracetamol + Caffeine',
        'الشكل الدوائي': 'أقراص',
        'الباركود': '6221234567890',
        'الكمية بالمخزن': 100,
        'الوصف وطريقة الاستخدام': 'مسكن فعال وخافض للحرارة للصداع والألم الشديد',
      },
      {
        'اسم الدواء': 'كونجستال 20 قرص (Congestal)',
        'الاسم بالإنجليزي': 'Congestal 20 Tablets',
        'السعر (ج.م)': 35,
        'القسم': 'أدوية وعلاجات',
        'المادة الفعالة': 'Paracetamol + Pseudoephedrine + Chlorpheniramine',
        'الشكل الدوائي': 'أقراص',
        'الباركود': '6221234567891',
        'الكمية بالمخزن': 80,
        'الوصف وطريقة الاستخدام': 'علاج أعراض نزلات البرد والرشح والإنفلونزا',
      },
      {
        'اسم الدواء': 'أوجمنتين 1 جم 14 قرص (Augmentin 1g)',
        'الاسم بالإنجليزي': 'Augmentin 1g 14 Tab',
        'السعر (ج.م)': 131,
        'القسم': 'أدوية وعلاجات',
        'المادة الفعالة': 'Amoxicillin + Clavulanic Acid',
        'الشكل الدوائي': 'أقراص',
        'الباركود': '6221234567892',
        'الكمية بالمخزن': 45,
        'الوصف وطريقة الاستخدام': 'مضاد حيوي واسع المجال لعلاج العدوى البكتيرية',
      },
      {
        'اسم الدواء': 'فيتامين سي 1000 مجم فوار (Sansovit C)',
        'الاسم بالإنجليزي': 'Sansovit Vitamin C 1000mg',
        'السعر (ج.م)': 55,
        'القسم': 'فيتامينات ومكملات',
        'المادة الفعالة': 'Ascorbic Acid (Vitamin C)',
        'الشكل الدوائي': 'أقراص فوارة',
        'الباركود': '6221234567893',
        'الكمية بالمخزن': 60,
        'الوصف وطريقة الاستخدام': 'قرص فوار يومياً في نصف كوب ماء لتقوية المناعة',
      },
      {
        'اسم الدواء': 'كريم بيبانثين المرطب 30 جم',
        'الاسم بالإنجليزي': 'Bepanthen Moisturizing Cream 30g',
        'السعر (ج.م)': 120,
        'القسم': 'العناية بالبشرة والشعر',
        'المادة الفعالة': 'Dexpanthenol 5%',
        'الشكل الدوائي': 'كريم موضعي',
        'الباركود': '6221234567894',
        'الكمية بالمخزن': 30,
        'الوصف وطريقة الاستخدام': 'ترطيب عميق وتجديد خلايا البشرة الجافة',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'نموذج_أصناف_الأدوية');
    XLSX.writeFile(wb, 'نموذج_أدوية_صيدلية_الذيب_Excel.xlsx');
  };

  // Export current entire catalog to Excel
  const handleExportCurrentCatalog = () => {
    if (catalogProducts.length === 0) {
      alert('لا توجد أصناف حالية لتصديرها.');
      return;
    }

    const exportRows = catalogProducts.map((p) => ({
      'كود الصنف': p.id,
      'اسم الدواء بالعربية': p.nameAr,
      'الاسم بالإنجليزي': p.nameEn || '',
      'القسم': CATEGORIES.find((c) => c.id === p.category)?.nameAr || p.category,
      'السعر (ج.م)': p.price,
      'نقاط الولاء': p.points,
      'المادة الفعالة': p.activeIngredient || '',
      'الشكل الدوائي': p.dosageForm || '',
      'الكمية المتاحة': p.stockQuantity ?? (p.inStock ? 20 : 0),
      'الحالة': p.inStock ? 'متوفر' : 'غير متوفر',
      'الوصف وطريقة الاستخدام': p.description || p.usage || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'مخزون_الأدوية');
    XLSX.writeFile(wb, `مخزون_صيدلية_الذيب_الكامل_${catalogProducts.length}_صنف.xlsx`);
  };

  // Execute Import
  const handleStartImport = async () => {
    if (parsedItems.length === 0) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: parsedItems.length });
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await onImportComplete(parsedItems, importMode);
      setSuccessMsg(
        `تم استيراد وحفظ (${parsedItems.length}) صنفاً دوائياً بنجاح تام إلى المخزون وسحابة Supabase!`
      );
      setIsProcessing(false);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMsg(`حدث خطأ أثناء حفظ الأصناف: ${err?.message || 'يرجى المحاولة مجدداً'}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-6 animate-fadeIn my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>استيراد مخزون الأدوية الشامل (Excel / CSV)</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  يدعم حتى 25,000+ صنف
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ارفع شيت أدوية الصيدلية أو كشف الشركات والموزعين (إبن سينا، المتحدة، أوفرسيز، برامج الصيدليات) بضغطة زر واحدة.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar: Download template & Export current */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/80 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold transition-all border border-cyan-500/30 hover:border-cyan-400"
          >
            <Download className="w-4 h-4" />
            <span>تحميل نموذج إكسل جاهز لملء الأدوية (Template)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCurrentCatalog}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/80 hover:bg-slate-700 text-emerald-300 rounded-xl text-xs font-bold transition-all border border-emerald-500/30 hover:border-emerald-400"
          >
            <FileText className="w-4 h-4" />
            <span>تصدير المخزون الحالي كملف Excel ({catalogProducts.length} صنف)</span>
          </button>
        </div>

        {/* Dropzone Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
            fileName
              ? 'border-emerald-500/60 bg-emerald-950/20'
              : 'border-slate-700 hover:border-cyan-500/60 bg-slate-800/30 hover:bg-slate-800/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.json"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Upload className="w-8 h-8" />
            </div>

            {fileName ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>تم اختيار الملف: {fileName}</span>
                </p>
                <p className="text-xs text-slate-400">انقر هنا إذا أردت اختيار ملف آخر</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">
                  اضغط هنا لاختيار ملف الإكسل (Excel .xlsx أو .csv) أو اسحبه إلى هنا
                </p>
                <p className="text-xs text-slate-400">
                  يقوم النظام تلقائياً بقراءة أسماء الأدوية، الأسعار، المواد الفعالة، والباركود والأقسام
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Feedback / Loading States */}
        {isLoading && (
          <div className="p-4 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl flex items-center gap-3 text-cyan-300 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
            <span>جارٍ فحص وتحليل صفوف ملف الإكسل وحساب الأصناف...</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-950/60 border border-rose-500/50 rounded-2xl flex items-center gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-950/70 border border-emerald-500/60 rounded-2xl flex items-center gap-3 text-emerald-200 text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Parsed Items Summary & Mode Selection */}
        {parsedItems.length > 0 && !successMsg && (
          <div className="space-y-5 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
              <div>
                <span className="text-xs text-slate-400 block">إجمالي الأصناف المكتشفة في الملف</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400">
                  {parsedItems.length.toLocaleString('ar-EG')} صنف دوائي جاهز للاستيراد
                </span>
              </div>

              {/* Import Mode: Merge vs Replace */}
              <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    importMode === 'merge'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  دمج وتحديث المخزون
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    importMode === 'replace'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  استبدال المخزون بالكامل
                </button>
              </div>
            </div>

            {/* Quick Preview Table of First 5 Items */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-300">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>معاينة لأول عينات من الأدوية التي تم التعرف عليها من الملف:</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-700">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900/80 text-slate-300 font-bold border-b border-slate-700">
                    <tr>
                      <th className="p-2.5">اسم الصنف (عربي)</th>
                      <th className="p-2.5">الاسم بالإنجليزي</th>
                      <th className="p-2.5">السعر</th>
                      <th className="p-2.5">القسم</th>
                      <th className="p-2.5">المادة الفعالة</th>
                      <th className="p-2.5">الشكل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {parsedItems.slice(0, 5).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold text-white">{item.nameAr}</td>
                        <td className="p-2.5 font-mono text-slate-400">{item.nameEn || '—'}</td>
                        <td className="p-2.5 font-bold text-emerald-400">{item.price} ج.م</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 bg-slate-800 text-cyan-300 rounded text-[11px]">
                            {CATEGORIES.find((c) => c.id === item.category)?.nameAr || item.category}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-400">{item.activeIngredient || '—'}</td>
                        <td className="p-2.5 text-slate-400">{item.dosageForm || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Processing Progress Bar */}
            {isProcessing && (
              <div className="space-y-2 p-4 bg-slate-900/90 rounded-2xl border border-cyan-500/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyan-300 font-bold flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    جارٍ رفع وحفظ الأصناف في السحابة على دفعات سريعة...
                  </span>
                  <span className="text-slate-400 font-mono">
                    {progress.current} / {progress.total}
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
                    style={{
                      width: `${progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Confirm Import Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleStartImport}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جارٍ الاستيراد الآن...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>تأكيد استيراد ({parsedItems.length}) صنفاً إلى الكتالوج</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
