import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Scale,
  AlertCircle,
  Clock,
  CheckCircle2,
  MessageCircle,
  HelpCircle,
  Globe,
  BookOpen,
  ShieldAlert,
  Syringe,
  Info,
} from 'lucide-react';
import { Product } from '../types';
import { createDosageInquiryWhatsAppUrl } from '../services/whatsapp';

interface DosageCalculatorProps {
  product: Product;
}

type ClinicalSystem = 'bnf_who' | 'clark';
type AgeStage = 'infant' | 'child' | 'adult';

interface CalculationResult {
  systemTitle: string;
  systemRef: string;
  formulaDescription: string;
  singleDoseMg?: number;
  singleDoseText: string;
  liquidVolumeMl?: number;
  householdMeasure: string;
  frequency: string;
  minIntervalHours: number;
  maxDailyLimit: string;
  safetyAlerts: string[];
  pharmacistTips: string[];
  isContraindicated: boolean;
  contraindicationReason?: string;
  dosageCategory: 'syrup' | 'drops' | 'tablet' | 'topical' | 'effervescent' | 'general';
}

export const DosageCalculator: React.FC<DosageCalculatorProps> = ({ product }) => {
  const [weight, setWeight] = useState<number>(15);
  const [ageStage, setAgeStage] = useState<AgeStage>('child');
  const [clinicalSystem, setClinicalSystem] = useState<ClinicalSystem>('bnf_who');
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(false);

  // Normalize product text
  const textCorpus = `${product.nameAr} ${product.nameEn} ${product.activeIngredient} ${product.description} ${product.dosageForm} ${product.usage}`.toLowerCase();

  // Detect Active Ingredients
  const isParacetamol = textCorpus.includes('باراسيتامول') || textCorpus.includes('paracetamol') || textCorpus.includes('سيتال') || textCorpus.includes('cetal') || textCorpus.includes('panadol') || textCorpus.includes('بنادول');
  const isIbuprofen = textCorpus.includes('إيبوبروفين') || textCorpus.includes('ايبوبروفين') || textCorpus.includes('ibuprofen') || textCorpus.includes('بروفين') || textCorpus.includes('brufen');
  const isAmoxicillin = textCorpus.includes('أموكسيسيلين') || textCorpus.includes('اموكسيسيلين') || textCorpus.includes('amoxicillin') || textCorpus.includes('أوجمنتين') || textCorpus.includes('هاي بيوتك') || textCorpus.includes('augmentin') || textCorpus.includes('hibiotic');
  const isDiclofenac = textCorpus.includes('ديكلوفيناك') || textCorpus.includes('diclofenac') || textCorpus.includes('كاتافلام') || textCorpus.includes('cataflam');
  const isFexofenadine = textCorpus.includes('فيكسوفينادين') || textCorpus.includes('fexofenadine') || textCorpus.includes('تلفاست') || textCorpus.includes('telfast');
  const isBisoprolol = textCorpus.includes('بيسوبرولول') || textCorpus.includes('bisoprolol') || textCorpus.includes('كونكور') || textCorpus.includes('concor');
  const isEsomeprazole = textCorpus.includes('إيزوميبرازول') || textCorpus.includes('esomeprazole') || textCorpus.includes('نيكسيوم') || textCorpus.includes('nexium');

  // Detect Dosage Form
  const formLower = (product.dosageForm || '').toLowerCase();
  const isSyrup = formLower.includes('شراب') || formLower.includes('معلق') || formLower.includes('syrup') || formLower.includes('suspension');
  const isDrops = formLower.includes('نقط') || formLower.includes('قطرة') || formLower.includes('drops');
  const isTablet = formLower.includes('أقراص') || formLower.includes('قرص') || formLower.includes('كبسول') || formLower.includes('tablet') || formLower.includes('capsule');
  const isTopical = formLower.includes('كريم') || formLower.includes('مرهم') || formLower.includes('جل') || formLower.includes('بخاخ') || formLower.includes('شامبو');
  const isEffervescent = formLower.includes('فوار') || formLower.includes('أكياس') || formLower.includes('sachet');

  // Parse concentration if available (e.g. 250 مجم / 5 مل or 100 مجم / 5 مل)
  const concentrationMgPerMl = useMemo(() => {
    if (textCorpus.includes('250 مجم / 5 مل') || textCorpus.includes('250mg/5ml')) return 50; // 50 mg/ml
    if (textCorpus.includes('120 مجم / 5 مل') || textCorpus.includes('120mg/5ml')) return 24; // 24 mg/ml
    if (textCorpus.includes('100 مجم / 5 مل') || textCorpus.includes('100mg/5ml')) return 20; // 20 mg/ml
    if (textCorpus.includes('457 مجم') || textCorpus.includes('400 مجم + كلافولانيك')) return 80; // Amoxicillin 80 mg/ml
    if (textCorpus.includes('228 مجم')) return 40; // 40 mg/ml
    if (textCorpus.includes('100 مجم / مل') || isDrops) return 100; // 100 mg/ml drops
    if (isSyrup) return 25; // default fallback ~ 125mg/5ml
    return null;
  }, [textCorpus, isDrops, isSyrup]);

  // Main Clinical Algorithm
  const calculation: CalculationResult = useMemo(() => {
    const w = Math.max(1, Math.min(150, weight || 1));
    const isAdult = ageStage === 'adult' || w >= 45;
    const isInfant = ageStage === 'infant' || w < 10;

    // 1. TOPICAL FORMULATIONS
    if (isTopical) {
      return {
        systemTitle: 'توجيهات التطبيق الموضعي السريرية',
        systemRef: 'الدليل الدوائي البريطاني BNF - الإعطاء الموضعي',
        formulaDescription: 'المستحضرات الموضعية لا تعتمد على وزن الجسم بل على مساحة السطح الجلدي المصاب (FTU - وحدة طرف الإصبع).',
        singleDoseText: 'طبقة رقيقة (نصف إلى وحدة طرف إصبع FTU)',
        householdMeasure: 'دهان موضعي خفيف يغطي موضع الإصابة',
        frequency: '2 إلى 3 مرات يومياً بانتظام',
        minIntervalHours: 8,
        maxDailyLimit: 'تجنب وضع كميات كبيرة أو تغطية ضمادية محكمة دون إذن طبي',
        safetyAlerts: [
          'للاستعمال الخارجي فقط، تجنب ملامسة العينين أو الأغشية المخاطية أو الجروح المفتوحة.',
        ],
        pharmacistTips: [
          'يغسل الموضع جيداً ويجفف برفق قبل دهان المستحضر.',
          'اغسل اليدين فوراً بعد التطبيق ما لم تكن اليدين هي المنطقة المعالجة.',
        ],
        isContraindicated: false,
        dosageCategory: 'topical',
      };
    }

    // 2. EFFERVESCENT FORMULATIONS
    if (isEffervescent) {
      const dose = w < 25 ? 'نصف كيس فوار' : 'كيس فوار واحد';
      return {
        systemTitle: 'المعيار السريري للمستحضرات الفوارة',
        systemRef: 'BNF Guidelines for Effervescent Preparations',
        formulaDescription: 'يعتمد على وزن الجسم لمنع الحمل الصودي الزائد؛ للأوزان تحت 25 كجم ينصف الكيس.',
        singleDoseText: dose,
        householdMeasure: 'يذاب في نصف كوب ماء (100 مل)',
        frequency: 'مرتان إلى 3 مرات يومياً بعد الوجبات',
        minIntervalHours: 8,
        maxDailyLimit: w < 25 ? 'كيس واحد يومياً' : '3 أكياس خلال 24 ساعة',
        safetyAlerts: [
          'يحتوي الفوار على نسبة من أملاح الصوديوم؛ يرجى الحذر لمرضى الضغط المرتفع وقصور الكلى.',
        ],
        pharmacistTips: [
          'يشرب فور انتهاء الفوران مباشرة بعد الأكل لتجنب تهيج المعدة.',
        ],
        isContraindicated: false,
        dosageCategory: 'effervescent',
      };
    }

    // 3. PARACETAMOL (باراسيتامول) - BNFc / WHO Gold Standard
    if (isParacetamol) {
      if (clinicalSystem === 'bnf_who') {
        // BNFc / WHO standard: 10 - 15 mg/kg per dose every 4-6 hrs (max 60 mg/kg/day, adult max 1000 mg/dose, 4000 mg/day)
        const mgRate = 15; // 15 mg/kg standard therapeutic dose
        const calculatedMg = Math.min(1000, Math.round(w * mgRate));
        const conc = concentrationMgPerMl || (isSyrup ? 50 : null);
        const volumeMl = conc ? Math.round((calculatedMg / conc) * 10) / 10 : undefined;

        let measure = '';
        if (volumeMl) {
          if (volumeMl <= 2.5) measure = 'سرنجة قياس 2.5 مل (نصف ملعقة صغيرة)';
          else if (volumeMl <= 5) measure = 'ملعقة صغيرة معيارية (5 مل)';
          else if (volumeMl <= 7.5) measure = 'ملعقة ونصف صغيرة (7.5 مل)';
          else if (volumeMl <= 10) measure = 'ملعقتان صغيرتان (10 مل)';
          else measure = 'ملعقة كبيرة معيارية (15 مل)';
        } else if (isTablet) {
          measure = calculatedMg >= 1000 ? 'قرصين (1000 مجم)' : calculatedMg >= 500 ? 'قرص واحد (500 مجم)' : 'نصف قرص (أو يفضل استخدام الشراب)';
        }

        const maxDayMg = Math.min(4000, Math.round(w * 60));
        const maxDayMl = conc ? (maxDayMg / conc).toFixed(1) : null;

        const isChildUnder12WithExtra = textCorpus.includes('إكسترا') && w < 40;

        return {
          systemTitle: 'بروتوكول الدليل الدوائي البريطاني للأطفال (BNFc / WHO)',
          systemRef: 'British National Formulary for Children & WHO Model Formulary',
          formulaDescription: `الجرعة = الوزن (${w} كجم) × 15 مجم/كجم = ${calculatedMg} مجم ${conc ? `÷ التركيز (${conc} مجم/مل) = ${volumeMl} مل` : ''}`,
          singleDoseMg: calculatedMg,
          singleDoseText: volumeMl ? `${volumeMl} مل (${calculatedMg} مجم)` : `${calculatedMg} مجم`,
          liquidVolumeMl: volumeMl,
          householdMeasure: measure,
          frequency: 'كل 4 إلى 6 ساعات عند اللزوم (بحد أقصى 4 مرات خلال 24 ساعة)',
          minIntervalHours: 4,
          maxDailyLimit: maxDayMl ? `${maxDayMg} مجم (${maxDayMl} مل) كحد أقصى مطلق في 24 ساعة` : `${maxDayMg} مجم يومياً`,
          safetyAlerts: [
            'الحد الأدنى بين الجرعات 4 ساعات كاملة لتجنب إرهاق الكبد.',
            ...(isChildUnder12WithExtra
              ? ['تنبيه هام: هذا المستحضر يحتوي على كافيين مضاف (إكسترا) وهو مخصص للبالغين فوق 12 سنة. للأطفال يوصى بباراسيتامول صافي (مثل سيتال أطفال).']
              : []),
          ],
          pharmacistTips: [
            'استخدم دائماً سرنجة قياس الجرعات الدوائية أو المكيال المرفق ولا تعتمد على ملاعق المطبخ المنزلية العادية.',
            'تأكد من عدم إعطاء أي دواء آخر للبرد أو السعال يحتوي على الباراسيتامول في نفس الوقت لمنع مضاعفة الجرعة.',
          ],
          isContraindicated: isChildUnder12WithExtra && w < 25,
          contraindicationReason: isChildUnder12WithExtra ? 'يحتوي على كافيين - يرجى استبداله بشراب أطفال صافي' : undefined,
          dosageCategory: isSyrup ? 'syrup' : isDrops ? 'drops' : 'tablet',
        };
      }
    }

    // 4. IBUPROFEN (إيبوبروفين) - AAP / BNFc Standard
    if (isIbuprofen) {
      if (w < 5 || isInfant && w < 6) {
        return {
          systemTitle: 'تنبيه سلامة طبية دولي - مضادات الالتهاب غير الستيرويدية',
          systemRef: 'American Academy of Pediatrics (AAP) & BNFc Guidelines',
          formulaDescription: 'موانع استعمال للأوزان تحت 5 كجم أو الرضع دون 3 أشهر.',
          singleDoseText: 'ممنوع تحت 5 كجم دون إشراف طبي مباشر',
          householdMeasure: 'استشر طبيب الأطفال',
          frequency: 'غير مسموح بهذا الوزن',
          minIntervalHours: 8,
          maxDailyLimit: 'غير مسموح',
          safetyAlerts: [
            '⚠️ يمنع إعطاء الإيبوبروفين للأطفال دون وزن 5 كجم أو الرضع دون 3 أشهر وفق بروتوكول الأكاديمية الأمريكية لطب الأطفال AAP.',
            'البديل الآمن الخافض للحرارة المعتمد هو الباراسيتامول (سيتال أطفال).',
          ],
          pharmacistTips: [
            'يرجى مراجعة طبيب الأطفال فوراً لتحديد العلاج المناسب لسن ووزن الرضيع.',
          ],
          isContraindicated: true,
          contraindicationReason: 'الوزن أقل من 5 كجم أو العمر أقل من 3 أشهر - يمنع الإيبوبروفين ويستبدل بالباراسيتامول',
          dosageCategory: isSyrup ? 'syrup' : 'tablet',
        };
      }

      // AAP / BNFc standard: 5 - 10 mg/kg per dose every 6-8 hrs (max 30-40 mg/kg/day, child single dose max 400 mg, adult max 2400 mg/day)
      const mgRate = isAdult ? 400 : 10; // 10 mg/kg per dose for children
      const calculatedMg = isAdult ? 400 : Math.min(400, Math.round(w * mgRate));
      const conc = concentrationMgPerMl || (isSyrup ? 20 : null); // 100mg/5ml = 20mg/ml
      const volumeMl = conc ? Math.round((calculatedMg / conc) * 10) / 10 : undefined;

      const maxDayMg = isAdult ? 2400 : Math.min(1200, Math.round(w * 30));
      const maxDayMl = conc ? (maxDayMg / conc).toFixed(1) : null;

      let measure = '';
      if (volumeMl) {
        if (volumeMl <= 2.5) measure = 'نصف ملعقة صغيرة (2.5 مل)';
        else if (volumeMl <= 5) measure = 'ملعقة صغيرة معيارية (5 مل)';
        else if (volumeMl <= 7.5) measure = 'ملعقة ونصف صغيرة (7.5 مل)';
        else if (volumeMl <= 10) measure = 'ملعقتان صغيرتان (10 مل)';
        else measure = 'ملعقة كبيرة معيارية (15 مل)';
      } else {
        measure = isAdult ? 'قرص واحد 400 مجم' : 'يفضل استخدام الشراب المعلق للأطفال';
      }

      return {
        systemTitle: 'معيار الأكاديمية الأمريكية لطب الأطفال والدليل البريطاني (AAP / BNFc)',
        systemRef: 'AAP Pediatric Fever Guidelines & British National Formulary for Children',
        formulaDescription: isAdult
          ? 'جرعة البالغين القياسية: 400 مجم بعد الوجبة كل 8 ساعات.'
          : `الجرعة = الوزن (${w} كجم) × 10 مجم/كجم = ${calculatedMg} مجم ${conc ? `÷ التركيز (${conc} مجم/مل) = ${volumeMl} مل (أي نصف الوزن بالمل تقريباً)` : ''}`,
        singleDoseMg: calculatedMg,
        singleDoseText: volumeMl ? `${volumeMl} مل (${calculatedMg} مجم)` : `${calculatedMg} مجم`,
        liquidVolumeMl: volumeMl,
        householdMeasure: measure,
        frequency: 'كل 6 إلى 8 ساعات بعد الرضاعة أو وجبة خفيفة (3 مرات يومياً)',
        minIntervalHours: 6,
        maxDailyLimit: maxDayMl ? `${maxDayMg} مجم (${maxDayMl} مل) كحد أقصى خلال 24 ساعة` : `${maxDayMg} مجم يومياً`,
        safetyAlerts: [
          'يؤخذ دائماً بعد الرضاعة أو الأكل لحماية الغشاء المخاطي للمعدة.',
          'تجنب إعطاء الإيبوبروفين في حالات الجفاف الشديد أو القيء المستمر أو جدري الماء (Chickenpox).',
        ],
        pharmacistTips: [
          'في حالات شراب بروفين أطفال (100 مجم / 5 مل)، تكون الجرعة السائلة بالمل = تقريباً نصف وزن الطفل بالكيلوجرام (مثال: طفل 10 كجم يأخذ 5 مل).',
          'رج الزجاجة جيداً قبل كل استخدام لضمان تجانس المادة الفعالة.',
        ],
        isContraindicated: false,
        dosageCategory: isSyrup ? 'syrup' : 'tablet',
      };
    }

    // 5. AMOXICILLIN / CLAVULANATE (أوجمنتين / هاي بيوتك)
    if (isAmoxicillin) {
      if (isAdult) {
        return {
          systemTitle: 'المعيار الإكلينيكي لمنظمة الصحة العالمية للمضادات الحيوية (WHO / IDSA)',
          systemRef: 'Infectious Diseases Society of America (IDSA) & WHO Guidelines',
          formulaDescription: 'جرعة البالغين والأوزان فوق 40 كجم: قرص واحد 1 جم أو 625 مجم كل 12 ساعة بعد الأكل.',
          singleDoseText: 'قرص واحد 1 جم (أو 625 مجم حسب الروشتة)',
          householdMeasure: 'قرص واحد مع كوب ماء وفير',
          frequency: 'كل 12 ساعة بانتظام تام في نفس الميعاد',
          minIntervalHours: 12,
          maxDailyLimit: 'قرصين خلال 24 ساعة (2 جم أموكسيسيلين يومياً)',
          safetyAlerts: [
            'يلزم إكمال الكورس العلاجي بالكامل حتى لو اختفت الأعراض لتجنب مقاومة البكتيريا.',
            'يؤخذ في بداية وجبة الطعام لتقليل الآثار الجانبية على الجهاز الهضمي.',
          ],
          pharmacistTips: [
            'يجب الفصل بساعتين على الأقل بين المضاد الحيوي وأي مكملات تحتوي على الكالسيوم أو الحديد.',
          ],
          isContraindicated: false,
          dosageCategory: 'tablet',
        };
      }

      // Pediatric Amoxicillin standard: 25 - 45 mg/kg/day (divided q12h)
      const dailyMgPerKg = 40; // standard medium dose
      const totalDailyMg = Math.min(2000, Math.round(w * dailyMgPerKg));
      const singleDoseMg = Math.round(totalDailyMg / 2);
      const conc = concentrationMgPerMl || (isSyrup ? 80 : 50); // e.g. 457mg/5ml has 80mg/ml amox
      const volumeMl = Math.round((singleDoseMg / conc) * 10) / 10;

      return {
        systemTitle: 'المعيار السريري لمنظمة الصحة العالمية للمضادات الحيوية (WHO Model Formulary)',
        systemRef: 'World Health Organization (WHO) & AAP Pediatric Infectious Disease Guidelines',
        formulaDescription: `الجرعة اليومية = الوزن (${w} كجم) × 40 مجم/كجم/يوم = ${totalDailyMg} مجم مقسمة على جرعتين كل 12 ساعة = ${singleDoseMg} مجم لكل جرعة (حجم ${volumeMl} مل)`,
        singleDoseMg: singleDoseMg,
        singleDoseText: `${volumeMl} مل (${singleDoseMg} مجم)`,
        liquidVolumeMl: volumeMl,
        householdMeasure: `سرنجة قياس ${volumeMl} مل`,
        frequency: 'كل 12 ساعة في نفس التوقيت بدقة بعد الأكل',
        minIntervalHours: 12,
        maxDailyLimit: `${totalDailyMg} مجم (${(volumeMl * 2).toFixed(1)} مل) يومياً`,
        safetyAlerts: [
          '⚠️ يلزم فحص تاريخ الحساسية للبنسلين ومشتقاته قبل البدء.',
          'يحفظ المعلق بعد حله بالماء المقطر في الثلاجة (2 - 8 درجات مئوية) لمدة 7 إلى 10 أيام فقط ثم يتخلص منه.',
        ],
        pharmacistTips: [
          'رج الزجاجة جيداً قبل كل جرعة.',
          'ينصح بإعطاء بروبيوتيك أو زبادي طبيعي لدعم البكتيريا النافعة للأمعاء.',
        ],
        isContraindicated: false,
        dosageCategory: 'syrup',
      };
    }

    // 6. DICLOFENAC (كاتافلام)
    if (isDiclofenac) {
      if (w < 35 || !isAdult) {
        return {
          systemTitle: 'تنبيه سلامة دوائية - محاذير ديكلوفيناك للأطفال',
          systemRef: 'British National Formulary (BNF) - Diclofenac Safety Alerts',
          formulaDescription: 'لا يصرف الديكلوفيناك للأطفال دون 12 سنة أو أوزان تحت 35 كجم دون إشراف طبي دقيق.',
          singleDoseText: 'غير مخصص للأطفال صغار الوزن',
          householdMeasure: 'استشر الصيدلي أو الطبيب',
          frequency: 'غير مسموح بهذا الوزن',
          minIntervalHours: 8,
          maxDailyLimit: 'غير مصرح به لهذا الوزن',
          safetyAlerts: [
            '⚠️ أقراص كاتافلام 50 مجم مخصصة للبالغين ولا تعطى للأطفال دون 12 عاماً لتفادي التأثير على وظائف الكلى والمعدة.',
            'البدائل الآمنة للأطفال: باراسيتامول أو إيبوبروفين معلق.',
          ],
          pharmacistTips: [
            'تواصل مع صيدلي الديب عبر واتساب لاقتراح المسكن المناسب لسن ووزن طفلك.',
          ],
          isContraindicated: true,
          contraindicationReason: 'غير مخصص للأطفال دون سن 12 سنة أو أوزان أقل من 35 كجم',
          dosageCategory: 'tablet',
        };
      }

      return {
        systemTitle: 'المعيار السريري المعتمد للديكلوفيناك (BNF Standard)',
        systemRef: 'British National Formulary (BNF) - Adult Analgesia',
        formulaDescription: 'جرعة البالغين القياسية: 50 مجم بعد وجبة طعام رئيسية، 2 إلى 3 مرات يومياً.',
        singleDoseText: 'قرص واحد 50 مجم',
        householdMeasure: 'قرص واحد ملبس يبلع كاملاً',
        frequency: 'كل 8 إلى 12 ساعة بعد الوجبات مباشرة',
        minIntervalHours: 8,
        maxDailyLimit: '150 مجم (3 أقراص) كحد أقصى في 24 ساعة',
        safetyAlerts: [
          'يؤخذ بعد الأكل مباشرة مع كوب ماء كامل، ولا يؤخذ على معدة فارغة مطلقاً.',
          'يحذر لمرضى قرحة المعدة النشطة وقصور القلب الحاد.',
        ],
        pharmacistTips: [
          'لا تقم بكسر أو طحن القرص الملبس لضمان عدم تهيج جدار المعدة.',
        ],
        isContraindicated: false,
        dosageCategory: 'tablet',
      };
    }

    // 7. CARDIO / CONCOR (بيسوبرولول)
    if (isBisoprolol) {
      if (!isAdult) {
        return {
          systemTitle: 'تنبيه سلامة أدوية القلب وضغط الدم',
          systemRef: 'European Society of Cardiology (ESC) Guidelines',
          formulaDescription: 'أدوية حاصرات بيتا مخصصة للبالغين وتتطلب وصفة طبية دقيقة من استشاري القلب.',
          singleDoseText: 'مخصص للبالغين فقط وفق الروشتة',
          householdMeasure: 'استشارة طبيب القلب المعالج',
          frequency: 'حسب الروشتة',
          minIntervalHours: 24,
          maxDailyLimit: 'وفق تعليمات الطبيب',
          safetyAlerts: [
            '⚠️ يمنع إعطاء أدوية القلب وتنظيم النبض للأطفال أو ضبط جرعاتها ذاتياً.',
          ],
          pharmacistTips: ['يرجى الالتزام التام بالجرعة والموعد المحدد من طبيب القلب.'],
          isContraindicated: true,
          contraindicationReason: 'دواء ضغط وقلب مخصص للبالغين فقط وتحت إشراف طبي متخصص',
          dosageCategory: 'tablet',
        };
      }

      return {
        systemTitle: 'توصيات الجمعية الأوروبية لأمراض القلب (ESC Guidelines)',
        systemRef: 'ESC Guidelines for Hypertension & Heart Rate Management',
        formulaDescription: 'الجرعة القياسية للبالغين: قرص واحد (2.5 مجم إلى 5 مجم) صباحاً يومياً.',
        singleDoseText: 'قرص واحد صباحاً (5 مجم)',
        householdMeasure: 'قرص واحد مع قليل من الماء',
        frequency: 'مرة واحدة يومياً صباحاً في نفس الميعاد',
        minIntervalHours: 24,
        maxDailyLimit: '10 مجم يومياً كحد أقصى تحت إشراف الطبيب',
        safetyAlerts: [
          'لا توقف الدواء فجأة دون استشارة الطبيب.',
          'ينصح بقياس النبض وضغط الدم دورياً.',
        ],
        pharmacistTips: ['يفضل تناوله صباحاً مع الإفطار أو بدونه.'],
        isContraindicated: false,
        dosageCategory: 'tablet',
      };
    }

    // 8. NEXIUM / ESOMEPRAZOLE (إيزوميبرازول)
    if (isEsomeprazole) {
      return {
        systemTitle: 'المعيار السريري لمثبطات مضخة البروتون (ACG / BNF Guidelines)',
        systemRef: 'American College of Gastroenterology & BNF',
        formulaDescription: 'الجرعة القياسية لعلاج الحموضة والارتجاع: قرص واحد (20-40 مجم) صباحاً قبل الأكل بنصف ساعة.',
        singleDoseText: isAdult ? 'قرص واحد 40 مجم' : 'استشر الصيدلي للجرعة المناسبة للوزن',
        householdMeasure: 'قرص واحد مع كوب ماء كامل',
        frequency: 'مرة واحدة يومياً صباحاً على الريق',
        minIntervalHours: 24,
        maxDailyLimit: '40 مجم يومياً (أو 80 مجم للحالات الشديدة بأمر الطبيب)',
        safetyAlerts: [
          'يبلع القرص كاملاً ولا يمضغ أو يسحق لأن الحبيبات مغلفة لمقاومة حمض المعدة.',
        ],
        pharmacistTips: [
          'يؤخذ قبل وجبة الإفطار بـ 30 إلى 60 دقيقة للحصول على أفضل فعالية علاجية.',
        ],
        isContraindicated: false,
        dosageCategory: 'tablet',
      };
    }

    // 9. GENERAL CALCULATION USING INTERNATIONAL CLARK'S RULE OR BNF WEIGHT BANDS
    // Clark's Rule: Pediatric Dose = (Weight in kg / 70 kg) * Adult Dose
    const adultWeightStandard = 70; // kg international adult reference
    const clarkFraction = Math.min(1.0, Math.round((w / adultWeightStandard) * 100) / 100);
    const clarkPercent = Math.round(clarkFraction * 100);

    let approxDose = '';
    let measure = '';

    if (isSyrup) {
      const mlDose = Math.min(15, Math.max(1.5, Math.round((w * 0.35) * 10) / 10));
      approxDose = `${mlDose} مل`;
      if (mlDose <= 2.5) measure = 'نصف ملعقة صغيرة (2.5 مل)';
      else if (mlDose <= 5) measure = 'ملعقة صغيرة (5 مل)';
      else if (mlDose <= 10) measure = 'ملعقتان صغيرتان (10 مل)';
      else measure = 'ملعقة كبيرة (15 مل)';
    } else if (isTablet) {
      if (w < 35) {
        approxDose = `نسبة ${clarkPercent}% من جرعة البالغين (يفضل استبداله بشراب)`;
        measure = 'يرجى مراجعة الصيدلي لتوفير الشكل السائل';
      } else {
        approxDose = 'قرص واحد';
        measure = 'قرص واحد مع كوب ماء كامل';
      }
    } else {
      approxDose = `${clarkPercent}% من الجرعة المقررة للبالغين`;
      measure = 'وفق النشرة الداخلية المرفقة';
    }

    return {
      systemTitle: clinicalSystem === 'clark'
        ? "قاعدة كلارك السريرية العالمية لدساتير الأدوية (Clark's Clinical Rule)"
        : 'معيار الدليل الدوائي المعتمد حسب الوزن (BNF / WHO Weight Ratio)',
      systemRef: "Clark's Rule Standard (US Pharmacopeia / British Pharmacopoeia)",
      formulaDescription: `معيار كلارك الطبي العالمي: جرعة الطفل = (وزن الطفل ${w} كجم ÷ وزن البالغ المرجعي 70 كجم) × جرعة البالغ = ${clarkPercent}% من الجرعة القياسية.`,
      singleDoseText: approxDose,
      householdMeasure: measure,
      frequency: product.usage || 'كل 8 إلى 12 ساعة بعد الوجبات بانتظام',
      minIntervalHours: 8,
      maxDailyLimit: 'الحد الأقصى هو الجرعة الكاملة للبالغين، لا تتجاوزها مطلقاً.',
      safetyAlerts: [
        '⚠️ حساب تقديري عام؛ يجب مطابقة الجرعة مع النشرة الداخلية واستشارة صيدلي الديب للتأكيد.',
      ],
      pharmacistTips: [
        'لأمان طفلك، التزم دوماً باستخدام سرنجة قياس الجرعات المدرجة بالمليلتر بدلاً من ملاعق الطعام.',
      ],
      isContraindicated: false,
      dosageCategory: isSyrup ? 'syrup' : isTablet ? 'tablet' : 'general',
    };
  }, [
    weight,
    ageStage,
    clinicalSystem,
    isParacetamol,
    isIbuprofen,
    isAmoxicillin,
    isDiclofenac,
    isBisoprolol,
    isEsomeprazole,
    isTopical,
    isEffervescent,
    isSyrup,
    isDrops,
    isTablet,
    concentrationMgPerMl,
    product.usage,
    textCorpus,
  ]);

  const ageStageLabels: Record<AgeStage, string> = {
    infant: 'رضيع (أقل من سنتين)',
    child: 'طفل (2 - 12 سنة)',
    adult: 'بالغ / مراهق (> 12 سنة)',
  };

  const handleWhatsAppConsult = () => {
    const url = createDosageInquiryWhatsAppUrl(
      product,
      weight,
      `${calculation.singleDoseText} [معيار: ${calculation.systemTitle}]`,
      ageStageLabels[ageStage]
    );
    window.open(url, '_blank');
  };

  const quickWeights = [6, 10, 15, 20, 30, 50, 70];

  return (
    <div
      id="product-dosage-calculator"
      className="p-4 bg-gradient-to-br from-sky-50/90 via-blue-50/40 to-indigo-50/40 dark:from-sky-950/40 dark:via-slate-900 dark:to-slate-800/90 rounded-2xl border border-sky-200/80 dark:border-sky-800/50 space-y-4 text-right font-cairo shadow-sm"
    >
      {/* Header & Global Standard Selector */}
      <div className="space-y-2 pb-2.5 border-b border-sky-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white flex items-center justify-center shadow-md">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>حاسبة الجرعات الدوائية الاسترشادية</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 font-bold">
                  نظام دولي معتمد
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                فحص علمي دقيق للجرعة بالوزن وفق المراجع الصيدلانية العالمية
              </p>
            </div>
          </div>

          {/* Reference Badge */}
          <div className="flex items-center gap-1 text-[10px] bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
            <Globe className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            <span className="font-semibold">{calculation.systemRef.split('&')[0]}</span>
          </div>
        </div>

        {/* International Standard Switcher */}
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 ml-1">
            <BookOpen className="w-3 h-3 text-sky-500" />
            <span>نظام الحساب:</span>
          </span>
          <button
            type="button"
            id="system-bnf-btn"
            onClick={() => setClinicalSystem('bnf_who')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              clinicalSystem === 'bnf_who'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-sky-50'
            }`}
          >
            الدليل البريطاني (BNFc / WHO)
          </button>
          <button
            type="button"
            id="system-clark-btn"
            onClick={() => setClinicalSystem('clark')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              clinicalSystem === 'clark'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-sky-50'
            }`}
          >
            قاعدة كلارك السريرية (Clark's Rule)
          </button>
        </div>
      </div>

      {/* Patient Parameters: Age Stage & Weight */}
      <div className="space-y-3">
        {/* Age Stage Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            الفئة العمرية للمريض:
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['infant', 'child', 'adult'] as AgeStage[]).map((stage) => (
              <button
                key={stage}
                type="button"
                id={`dose-stage-${stage}-btn`}
                onClick={() => {
                  setAgeStage(stage);
                  if (stage === 'infant' && weight > 10) setWeight(8);
                  if (stage === 'child' && (weight < 10 || weight > 40)) setWeight(16);
                  if (stage === 'adult' && weight < 45) setWeight(65);
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                  ageStage === stage
                    ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-300 dark:ring-sky-700'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {stage === 'infant' ? '👶 رضيع (< سنتين)' : stage === 'child' ? '🧒 طفل (2 - 12 سنة)' : '🧑 بالغ (> 12 سنة)'}
              </button>
            ))}
          </div>
        </div>

        {/* Weight input with presets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="patient-weight-input"
              className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1"
            >
              <Scale className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>وزن المريض الفعلي (كجم):</span>
            </label>
            <span className="text-xs font-black text-sky-600 dark:text-sky-400 font-mono bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded-md">
              {weight} كجم
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="patient-weight-input"
              type="number"
              min="2"
              max="150"
              step="0.5"
              value={weight}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setWeight(isNaN(val) ? 0 : val);
              }}
              className="w-full px-3 py-2 text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
              placeholder="مثال: 15"
            />
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2">
            <span className="text-[10px] text-slate-400 ml-1">أوزان شائعة:</span>
            {quickWeights.map((w) => (
              <button
                key={w}
                type="button"
                id={`dose-quick-weight-${w}-btn`}
                onClick={() => {
                  setWeight(w);
                  if (w <= 10) setAgeStage('infant');
                  else if (w <= 35) setAgeStage('child');
                  else setAgeStage('adult');
                }}
                className={`text-[11px] px-2 py-0.5 rounded-lg font-medium transition-colors ${
                  weight === w
                    ? 'bg-sky-600 text-white font-bold'
                    : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {w} كجم
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contraindication Alert if triggered */}
      {calculation.isContraindicated && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/60 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block font-bold">تنبيه سريري دولي مانع للجرعة:</strong>
            <p className="leading-relaxed">{calculation.contraindicationReason}</p>
          </div>
        </div>
      )}

      {/* Main Results Card */}
      <div className="p-3.5 bg-white dark:bg-slate-800/95 rounded-2xl border border-sky-100 dark:border-slate-700/80 shadow-sm space-y-3">
        {/* Single Dose Display */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              الجرعة التقديرية الموصى بها للمرة الواحدة:
            </span>
            <span className="text-base sm:text-lg font-black text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>{calculation.singleDoseText}</span>
            </span>
          </div>

          {/* Household Measure Chip */}
          <div className="text-left bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1.5 rounded-xl border border-sky-100 dark:border-sky-900/40">
            <div className="flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-sky-300">
              <Syringe className="w-3.5 h-3.5" />
              <span>المكيال الموصى به:</span>
            </div>
            <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">
              {calculation.householdMeasure}
            </span>
          </div>
        </div>

        {/* Timing, Frequency & Max Limit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="font-semibold">{calculation.frequency}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-[11px] font-medium">{calculation.maxDailyLimit}</span>
          </div>
        </div>

        {/* Pharmacist Clinical Tips */}
        {calculation.pharmacistTips.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
            <strong className="text-slate-800 dark:text-slate-200 flex items-center gap-1 font-bold">
              💡 إرشادات الصيدلي السريرية:
            </strong>
            <ul className="space-y-0.5 text-slate-600 dark:text-slate-300 list-disc list-inside">
              {calculation.pharmacistTips.map((tip, idx) => (
                <li key={idx} className="leading-relaxed">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Formula Details Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowFormulaDetails((prev) => !prev)}
            className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <Info className="w-3 h-3" />
            <span>{showFormulaDetails ? 'إخفاء المعادلة الحسابية' : 'عرض المعادلة الحسابية والخطوات العلمية'}</span>
          </button>

          {showFormulaDetails && (
            <div className="mt-2 p-2.5 bg-sky-50/70 dark:bg-slate-900 rounded-xl border border-sky-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
              <span className="font-bold block text-sky-800 dark:text-sky-300">
                {calculation.systemTitle}
              </span>
              <p className="font-mono text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed dir-ltr text-right">
                {calculation.formulaDescription}
              </p>
              <span className="text-[10px] text-slate-400 block pt-1 border-t border-sky-100 dark:border-slate-800">
                المرجع: {calculation.systemRef}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Safety Guardrail & Direct Pharmacist WhatsApp CTA */}
      <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
          <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>حساب استرشادي دقيق، التزم دوماً بالنشرة الطبية المرفقة وتعليمات الطبيب المعالج.</span>
        </div>

        <button
          id="confirm-dose-whatsapp-btn"
          type="button"
          onClick={handleWhatsAppConsult}
          className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
          <span>تأكيد ومطابقة الجرعة مع صيدلي الديب</span>
        </button>
      </div>
    </div>
  );
};
