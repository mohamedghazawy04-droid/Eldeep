import { Product, ProductCategory } from '../types';

/**
 * High-definition, verified pharmaceutical stock images curated for Egyptian pharmacy categories.
 */
const CATEGORY_DEFAULT_IMAGES: Record<ProductCategory, string> = {
  medicines: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
  vitamins: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=600&auto=format&fit=crop&q=80',
  skincare: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80',
  baby: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&auto=format&fit=crop&q=80',
  devices: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80',
  firstaid: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop&q=80',
  personal: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&auto=format&fit=crop&q=80',
};

interface KeywordImageRule {
  keywords: string[];
  imageUrl: string;
}

const KEYWORD_IMAGE_RULES: KeywordImageRule[] = [
  // Syrups & Suspensions & Oral Liquids (شراب / معلق / كحة / oral.liquid)
  {
    keywords: ['شراب', 'معلق', 'سيرب', 'سعال', 'كحة', 'بلغم', 'syrup', 'suspension', 'oral.liquid', 'liquid', 'elixir'],
    imageUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&auto=format&fit=crop&q=80',
  },
  // Eye / Ear / Nose Drops & Sprays (قطرة / بخاخ أنف / ophthalmic / otic)
  {
    keywords: ['قطرة', 'عين', 'أذن', 'drops', 'نقط', 'بخاخ', 'أنف', 'nasal', 'spray', 'ophthalmic', 'otic', 'eye', 'ear'],
    imageUrl: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=600&auto=format&fit=crop&q=80',
  },
  // Creams, Ointments, and Gels (مرهم / كريم / جل / topical)
  {
    keywords: ['كريم', 'مرهم', 'جل', 'دهان', 'cream', 'ointment', 'gel', 'موضعي', 'topical'],
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
  },
  // Injections, Ampoules & Vials (حقن / أمبول / فيال)
  {
    keywords: ['حقن', 'أمبول', 'فيال', 'حقنة', 'injection', 'ampoule', 'vial', 'parenteral'],
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80',
  },
  // Antibiotics & Capsules (مضاد حيوي / كبسولات)
  {
    keywords: ['مضاد', 'أوجمنتين', 'كبسول', 'كبسولات', 'capsule', 'antibiotic', 'سيفكس', 'amoxicillin', 'clav'],
    imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80',
  },
  // Painkillers & Tablets (بانادول / مسكن / باراسيتامول / بروفين / أقراص / oral.solid)
  {
    keywords: ['بانادول', 'مسكن', 'باراسيتامول', 'بروفين', 'صداع', 'حرارة', 'أقراص', 'قرص', 'tablets', 'panadol', 'oral.solid', 'tab', 'f.c.tabs'],
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
  },
  // Inhalers & Asthma (صدر / ربو / فينتولين / استنشاق)
  {
    keywords: ['استنشاق', 'صدر', 'ربو', 'حساسية صدر', 'فينتولين', 'inhaler', 'nebulizer'],
    imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',
  },
  // Blood Pressure & Cardiology (ضغط / قلب / أوعية)
  {
    keywords: ['ضغط', 'قلب', 'كونكور', 'شرايين', 'كابوتن', 'cardio', 'blood pressure'],
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80',
  },
  // Diabetes & Blood Glucose (سكر / أنسولين / جلوكوفاج)
  {
    keywords: ['سكر', 'أنسولين', 'جلوكوفاج', 'diabetic', 'glucose'],
    imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80',
  },
  // Vitamins, Minerals & Immunity (فيتامين / أوميجا / حديد / زنك / كالسيوم)
  {
    keywords: ['فيتامين', 'أوميجا', 'حديد', 'زنك', 'كالسيوم', 'مناعة', 'ماغنسيوم', 'vitamin', 'omega', 'zinc'],
    imageUrl: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=600&auto=format&fit=crop&q=80',
  },
  // Hair Care (شعر / تساقط / شامبو / بلسم / لوشن)
  {
    keywords: ['شعر', 'تساقط', 'شامبو', 'بلسم', 'سيروم شعر', 'hair', 'shampoo'],
    imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80',
  },
  // Skincare & Sun protection (سيروم / غسول / واقي شمس / ترطيب / تقشير)
  {
    keywords: ['سيروم', 'غسول', 'واقي شمس', 'ترطيب', 'بشرة', 'نضارة', 'skincare', 'sunscreen', 'serum'],
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80',
  },
  // Baby Care & Diapers (بامبرز / حفاضات / حليب أطفال / رضع)
  {
    keywords: ['بامبرز', 'حفاضات', 'حليب أطفال', 'رضع', 'بيبرونة', 'طفل', 'baby', 'diaper'],
    imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&auto=format&fit=crop&q=80',
  },
  // Medical Devices & Monitors (جهاز ضغط / سكر / مقياس حرارة / نيبولايزر)
  {
    keywords: ['جهاز', 'مقياس', 'حرارة', 'ترمومتر', 'ضغط دم', 'جهاز سكر', 'nebulizer', 'device', 'monitor'],
    imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80',
  },
  // First Aid & Wound Dressing (شاش / بلاستر / قطن / بيتادين / مطهر)
  {
    keywords: ['شاش', 'بلاستر', 'قطن', 'جروح', 'مطهر', 'بيتادين', 'تضميد', 'bandage', 'gauze', 'first aid'],
    imageUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop&q=80',
  },
  // Oral Care & Hygiene (معجون أسنان / غسول فم / فرشاة / خيط)
  {
    keywords: ['معجون', 'أسنان', 'فرشاة', 'غسول فم', 'ليسترين', 'oral', 'toothpaste'],
    imageUrl: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&auto=format&fit=crop&q=80',
  },
  // Sanitizers & Antiseptics (معقم / كحول / مطهر أيدي)
  {
    keywords: ['معقم', 'كحول', 'مطهر', 'sanitizer', 'disinfectant'],
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80',
  },
];

/**
 * Returns a high-definition real pharmacy image for any product.
 * If the product already has a valid non-placeholder image, it keeps it.
 * Otherwise, it resolves an accurate photo based on keywords and medical category.
 */
export function resolveProductImage(product: Partial<Product>): string {
  if (
    product.image &&
    typeof product.image === 'string' &&
    product.image.trim() !== '' &&
    !product.image.includes('/eldeeb_logo.jpg') &&
    !product.image.includes('eldeeb_pharmacy_logo') &&
    (product.image.startsWith('http') || product.image.startsWith('data:') || product.image.startsWith('/assets/'))
  ) {
    return product.image;
  }

  const searchText = [
    product.nameAr || '',
    product.nameEn || '',
    product.dosageForm || '',
    product.activeIngredient || '',
    product.description || '',
    ...(product.tags || []),
  ]
    .join(' ')
    .toLowerCase();

  for (const rule of KEYWORD_IMAGE_RULES) {
    if (rule.keywords.some((kw) => searchText.includes(kw.toLowerCase()))) {
      return rule.imageUrl;
    }
  }

  const cat = (product.category as ProductCategory) || 'medicines';
  return CATEGORY_DEFAULT_IMAGES[cat] || CATEGORY_DEFAULT_IMAGES.medicines;
}

/**
 * Enriches a list of products by ensuring every product has an authentic, high-quality image.
 */
export function enrichProductsWithImages(products: Product[]): {
  updatedCount: number;
  enrichedProducts: Product[];
} {
  let updatedCount = 0;
  const enrichedProducts = products.map((prod) => {
    const isPlaceholder =
      !prod.image ||
      prod.image.trim() === '' ||
      prod.image.includes('/eldeeb_logo.jpg') ||
      prod.image.includes('eldeeb_pharmacy_logo');

    if (isPlaceholder) {
      updatedCount++;
      return {
        ...prod,
        image: resolveProductImage(prod),
      };
    }
    return prod;
  });

  return { updatedCount, enrichedProducts };
}
