/**
 * Smart Delivery Fee Calculator for El-Deeb Pharmacy
 * Calculates distance in kilometers based on customer address input
 * Fee strictly bounded between 10 EGP (minimum) and 50 EGP (maximum)
 */

export interface DeliveryCalculationResult {
  distanceKm: number;
  deliveryFee: number; // 10 EGP minimum to 50 EGP maximum
  estimatedMinutes: string;
  zoneDescription: string;
  isDetected: boolean;
}

// Landmark and neighborhood distance map from El-Deeb Pharmacy (Ashmoun, Menoufia)
const KNOWN_ZONES: { keywords: string[]; distanceKm: number; description: string }[] = [
  // Very Close / Immediate Downtown / Same Street / Walking zone (1.0 - 2.5 km -> 10 EGP)
  {
    keywords: ['نفس الشارع', 'بجوار الصيدلية', 'قريب', 'وسط البلد', 'المحطة', 'ميدان', 'سعد زغلول', 'بورسعيد', 'الجمهورية', 'الروضة', 'مجلس المدينة', 'حي غرب', 'حي شرق', 'المستشفى العام', 'أشمون'],
    distanceKm: 1.8,
    description: 'داخل مدينة أشمون (وسط المدينة والمناطق المجاورة)',
  },
  // Ashmoun Local Suburbs & Peripheral Quarters (3 - 4.5 km -> 12 - 15 EGP)
  {
    keywords: ['كفر منصور', 'منيل عروس', 'عزبة سليم', 'الحصوة', 'طريق كفر السيد', 'أبو رقبة'],
    distanceKm: 3.5,
    description: 'ضواحي وأطراف أشمون القريبة',
  },
  // Nearby Local Villages (5 - 8 km -> 15 - 22 EGP)
  {
    keywords: ['سمادون', 'سنتريس', 'شنشور', 'شما', 'سبك الضحاك', 'رملة الإنجب', 'شعشاع', 'قورص', 'محلة سبك'],
    distanceKm: 6.5,
    description: 'القرى المحلية المجاورة (قطاع أ)',
  },
  // Secondary Villages (8.5 - 12 km -> 22 - 30 EGP)
  {
    keywords: ['طاليا', 'طهواي', 'دروة', 'كفر الحما', 'مجيريا', 'ساقية أبو شعرة', 'شوشاي', 'النعناعية', 'لبيشة', 'جريس', 'البرانية', 'كفر الغريب'],
    distanceKm: 9.5,
    description: 'القرى المحيطة والمراكز الريفية (قطاع ب)',
  },
  // Neighboring Centers / Border Areas (13 - 18 km -> 32 - 42 EGP)
  {
    keywords: ['منوف', 'الباجور', 'سرس الليان', 'الخطاطبة', 'القناطر الخيرية', 'وردان', 'أتريس', 'أوسيم', 'منشأة القناطر'],
    distanceKm: 15.0,
    description: 'المراكز والمدن المجاورة',
  },
  // Distant Cities & Governorates (20+ km -> 50 EGP Max)
  {
    keywords: [
      'شبين الكوم', 'قويسنا', 'بركة السبع', 'تلا', 'الشهداء', 'السادات',
      'بنها', 'طنطا', 'القليوبية', 'الغربية', 'المنوفية',
      'القاهرة', 'الجيزة', 'مدينة نصر', 'المعادي', 'التجمع', 'الهرم', 'فيصل', 'الدقي', 'المهندسين',
      'أكتوبر', 'زايد', 'شبرا', 'حلوان', 'عين شمس', 'مصر الجديدة',
      'الإسكندرية', 'البحيرة', 'الشرقية', 'المنصورة'
    ],
    distanceKm: 28.0,
    description: 'المحافظات والمدن البعيدة',
  },
];

/**
 * Intelligently estimate distance and delivery fee from address string
 */
export function calculateDeliveryFeeFromAddress(address: string): DeliveryCalculationResult {
  const clean = (address || '').trim().toLowerCase();

  // If address is empty or not yet filled
  if (!clean || clean.length < 2) {
    return {
      distanceKm: 1.5,
      deliveryFee: 10,
      estimatedMinutes: '15 - 25 دقيقة',
      zoneDescription: 'التوصيل القياسي داخل المدينة',
      isDetected: false,
    };
  }

  // 1. Check if the user explicitly provided a kilometer number (e.g. "5 كم", "10 km", "على بعد 4 كيلومتر")
  const explicitKmMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:كم|كيلو|km|kilometer)/i);
  if (explicitKmMatch) {
    const rawKm = parseFloat(explicitKmMatch[1]);
    if (!isNaN(rawKm) && rawKm > 0) {
      return buildResult(rawKm, `مسافة محددة يدوياً (${rawKm} كم)`);
    }
  }

  // 2. Match with known zones
  for (const zone of KNOWN_ZONES) {
    const matched = zone.keywords.some((kw) => clean.includes(kw.toLowerCase()));
    if (matched) {
      return buildResult(zone.distanceKm, zone.description);
    }
  }

  // 3. Fallback heuristic based on generic Arabic address tokens
  if (clean.includes('محافظة') || clean.includes('مدينة') || clean.includes('مركز')) {
    return buildResult(14.0, 'مركز أو مدينة مجاورة (تقديري)');
  }

  if (clean.includes('قرية') || clean.includes('كفر') || clean.includes('عزبة') || clean.includes('نجع')) {
    return buildResult(7.5, 'قرية ريفية محيطة (تقديري)');
  }

  if (clean.includes('شارع') || clean.includes('عمارة') || clean.includes('شقة') || clean.includes('ميدان') || clean.includes('بجوار') || clean.includes('خلف') || clean.includes('أمام')) {
    return buildResult(2.5, 'عنوان محلي تفصيلي (تقديري)');
  }

  // Generic reasonable distance fallback: ~3.0 km
  return buildResult(3.0, 'عنوان محلي معتمد (تقديري)');
}

/**
 * Calculates delivery fee based on kilometers:
 * Minimum: 10 EGP
 * Maximum: 50 EGP
 * Formula: Base 10 EGP for up to 2.5 km, then ~2 EGP per additional km, capped at 50 EGP
 */
function buildResult(distanceKm: number, zoneDescription: string): DeliveryCalculationResult {
  const MIN_FEE = 10;
  const MAX_FEE = 50;

  let fee = MIN_FEE;
  if (distanceKm > 2.5) {
    const extraKm = distanceKm - 2.5;
    fee = MIN_FEE + extraKm * 2.0;
  }

  // Enforce strict boundaries [10, 50]
  const finalFee = Math.min(MAX_FEE, Math.max(MIN_FEE, Math.round(fee)));

  // Estimated delivery time
  let estimatedMinutes = '15 - 25 دقيقة';
  if (distanceKm > 18) {
    estimatedMinutes = '60 - 90 دقيقة';
  } else if (distanceKm > 10) {
    estimatedMinutes = '40 - 60 دقيقة';
  } else if (distanceKm > 4) {
    estimatedMinutes = '25 - 40 دقيقة';
  }

  return {
    distanceKm: Number(distanceKm.toFixed(1)),
    deliveryFee: finalFee,
    estimatedMinutes,
    zoneDescription,
    isDetected: true,
  };
}
