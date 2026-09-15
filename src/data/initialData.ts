import { Product, ProductCategory } from '../types';

export interface CategoryInfo {
  id: ProductCategory;
  nameAr: string;
  nameEn: string;
  iconName: string;
  description: string;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'medicines',
    nameAr: 'أدوية وعلاجات',
    nameEn: 'Medicines & Treatments',
    iconName: 'Pill',
    description: 'مسكنات، مضادات حيوية، أدوية الضغط، السكر، الحساسية والمعدة',
    color: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'vitamins',
    nameAr: 'فيتامينات ومكملات',
    nameEn: 'Vitamins & Supplements',
    iconName: 'Sparkles',
    description: 'فيتامين سي، أوميجا 3، كالسيوم، حديد، وزن ومناعة',
    color: 'from-emerald-600 to-teal-600',
  },
  {
    id: 'skincare',
    nameAr: 'العناية بالبشرة والشعر',
    nameEn: 'Dermocosmetics & Hair',
    iconName: 'HeartHandshake',
    description: 'واقيات شمس، غسول، مرطبات، سيروم، وعلاج تساقط الشعر',
    color: 'from-pink-600 to-rose-600',
  },
  {
    id: 'baby',
    nameAr: 'صحة الطفل والأم',
    nameEn: 'Mother & Baby Care',
    iconName: 'Baby',
    description: 'حليب أطفال، حفاضات، شامبو أطفال، وكريمات التسلخات',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'devices',
    nameAr: 'الأجهزة والمستلزمات الطبية',
    nameEn: 'Medical Devices',
    iconName: 'Activity',
    description: 'أجهزة قياس الضغط والسكر، موازين حرارة، ونيبولايزر',
    color: 'from-violet-600 to-purple-600',
  },
  {
    id: 'firstaid',
    nameAr: 'الإسعافات الأولية والتضميد',
    nameEn: 'First Aid & Wound Care',
    iconName: 'Cross',
    description: 'شاش معقم، بيتادين، بلاستر طبي، قطن، ومطهرات جروح',
    color: 'from-red-600 to-rose-600',
  },
  {
    id: 'personal',
    nameAr: 'العناية الشخصية والنظافة',
    nameEn: 'Personal Hygiene',
    iconName: 'ShieldCheck',
    description: 'معجون أسنان، غسول فم، معقمات أيدي، ومزيلات عرق',
    color: 'from-cyan-600 to-blue-600',
  },
];

// Empty by default for custom pharmacist uploads
export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: '🎉 مرحباً بك في صيدلية الديب!',
    message: 'سجل حسابك الآن واجمع نقاط ولاء مع كل طلب واستبدلها بخصومات فورية بالسلة.',
    date: 'منذ قليل',
    read: false,
    type: 'loyalty' as const,
  },
  {
    id: 'notif-2',
    title: '🚚 توصيل سريع وصيدلي مباشر',
    message: 'يمكنك إرسال أي روشتة طبية أو استشارة فورية على الواتساب 01009097378 ونصلك في أسرع وقت.',
    date: 'أمس',
    read: true,
    type: 'offer' as const,
  },
];
