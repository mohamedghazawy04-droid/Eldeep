// Comprehensive, rich database of verified pharmaceutical & health tips for "Debo"
// Categorized by day-of-year, time-of-day, and health domains to ensure daily freshness and novelty.

export interface DailyHealthTip {
  id: string;
  category: 'daily' | 'seasonal' | 'medication' | 'lifestyle' | 'pediatric' | 'senior' | 'firstaid';
  title: string;
  content: string;
  icon: string;
}

export const DEBO_HEALTH_TIPS: DailyHealthTip[] = [
  {
    id: 'tip-1',
    category: 'daily',
    title: 'شرب الماء وأدوية الكلى',
    content: 'اشرب كوبين مياه على الأقل عند الاستيقاظ لتنشيط الدورة الدموية ومساعدة الكلى على طرد السموم بكفاءة.',
    icon: '💧',
  },
  {
    id: 'tip-2',
    category: 'medication',
    title: 'فصل المسكنات عن أدوية الضغط',
    content: 'احذر الإفراط في المسكنات مثل الإيبوبروفين والبروفين مع مرضى الضغط لأنها قد ترفع ضغط الدم وتقلل مفعول العلاج.',
    icon: '💊',
  },
  {
    id: 'tip-3',
    category: 'daily',
    title: 'فيتامين د وأشعة الصباح',
    content: 'أفضل وقت لامتصاص فيتامين D من الشمس هو في الصباح الباكر أو قبل الغروب لتجنب الأشعة فوق البنفسجية الضارة.',
    icon: '☀️',
  },
  {
    id: 'tip-4',
    category: 'medication',
    title: 'المضادات الحيوية والمعدة',
    content: 'لا توقف كورس المضاد الحيوي بمجرد تحسن الأعراض! إكماله للنهاية يمنع حدوث بكتيريا مقاومة للعلاج.',
    icon: '🛡️',
  },
  {
    id: 'tip-5',
    category: 'lifestyle',
    title: 'فيتامين C مع أقراص الحديد',
    content: 'تناول كوب من عصير البرتقال أو الليمون مع مكملات الحديد يضاعف امتصاص الحديد 3 أضعاف في الأمعاء.',
    icon: '🍊',
  },
  {
    id: 'tip-6',
    category: 'pediatric',
    title: 'حرارة الأطفال وخافضات الحرارة',
    content: 'الكمادات بالماء الفاتر وليس البارد أو الثلج! الماء البارد يسبب انقباض الأوعية ويحبس الحرارة بالداخل.',
    icon: '👶',
  },
  {
    id: 'tip-7',
    category: 'lifestyle',
    title: 'تنظيم مواعيد النوم والمناعة',
    content: 'النوم العميق 7 إلى 8 ساعات يومياً يعزز إنتاج خلايا المناعة T-cells ويكافح الفيروسات والأمراض الموسمية.',
    icon: '🌙',
  },
  {
    id: 'tip-8',
    category: 'medication',
    title: 'أدوية الغدة الدرقية (ثيروكسين)',
    content: 'تؤخذ حبة الثيروكسين على معدة فارغة تماماً قبل الإفطار بساعة مع كوب ماء كامل وبدون شاي أو كافيين.',
    icon: '⏱️',
  },
  {
    id: 'tip-9',
    category: 'firstaid',
    title: 'حروق المطبخ البسيطة',
    content: 'لا تضع معجون الأسنان أو الزبدة على الحروق إطلاقاً! اغسل الحرق بماء الصنبور الجاري المعتدل لمدة 10 دقائق ثم ضع كريم ميبو.',
    icon: '🩹',
  },
  {
    id: 'tip-10',
    category: 'medication',
    title: 'أدوية السيولة والمشروبات',
    content: 'مشروبات الزنجبيل والشاي الأخضر بكميات كبيرة قد تزيد من مفعول أدوية السيولة؛ استشر صيدلي صيدلية الديب أولاً.',
    icon: '🍵',
  },
  {
    id: 'tip-11',
    category: 'lifestyle',
    title: 'سكر الدم وفحص القدمين',
    content: 'نصيحة لمرضى السكري: افحص قدميك يومياً بين الأصابع ورطبهما جيداً لتجنب التشققات وجروح القدم السكرية.',
    icon: '🩺',
  },
  {
    id: 'tip-12',
    category: 'pediatric',
    title: 'الجرعات بالسرنجة وليس ملعقة الطعام',
    content: 'أدوية شرب الأطفال تُقاس بالملليتر (ml) بواسطة سرنجة القياس، ملاعق الطعام غير دقيقة وتسبب تفاوت في الجرعة.',
    icon: '🥄',
  },
  {
    id: 'tip-13',
    category: 'medication',
    title: 'قطرات العين وبخاخات الأنف',
    content: 'صلاحية قطرة العين بعد الفتح لا تتعدى 28 يوماً حتى لو كان التاريخ المكتوب على العلبة سارياً!',
    icon: '👁️',
  },
  {
    id: 'tip-14',
    category: 'lifestyle',
    title: 'صحة المفاصل والعظام',
    content: 'ممارسة المشي 20 دقيقة يومياً تزيد من ليونة الغضاريف وتدفق السائل الزلالي داخل الركبتين.',
    icon: '🚶',
  },
  {
    id: 'tip-15',
    category: 'medication',
    title: 'أدوية الكوليسترول (الستاتين)',
    content: 'أفضل وقت لتناول أدوية الكوليسترول هو مساءً قبل النوم، لأن الكبد يُصنّع معظم الكوليسترول أثناء ساعات الليل.',
    icon: '🌙',
  },
  {
    id: 'tip-16',
    category: 'daily',
    title: 'الألياف الطبيعية والجهاز الهضمي',
    content: 'إضافة الشوفان والسلطة الخضراء لطعامك يومياً يحسن صحة القولون ويمنع الإمساك بدون الحاجة لملينات كيميائية.',
    icon: '🥗',
  },
  {
    id: 'tip-17',
    category: 'medication',
    title: 'المسكنات وقرحة المعدة',
    content: 'تجنب تناول أقراص الأسبرين أو المسكنات على معدة خاوية لحماية جدار المعدة من الالتهابات والقرحة.',
    icon: '🥣',
  },
  {
    id: 'tip-18',
    category: 'firstaid',
    title: 'الرعاف ونزيف الأنف الفجائي',
    content: 'لا تُمِل رأسك للخلف عند الرعاف! انحنِ للأمام قليلاً واضغط على الجزء اللحمي من الأنف 5 دقائق لمنع بلع الدم.',
    icon: '👃',
  },
  {
    id: 'tip-19',
    category: 'pediatric',
    title: 'فيتامين د للرضع وحديثي الولادة',
    content: 'الأكاديمية الطبية توصي بإعطاء 400 وحدة دولية (4 قطرات فيدروب يومياً) لجميع الرضع من أول يوم ولادة.',
    icon: '🍼',
  },
  {
    id: 'tip-20',
    category: 'lifestyle',
    title: 'إجهاد العين والشاشات',
    content: 'قاعدة 20-20-20: كل 20 دقيقة من النظر للهاتف أو الكمبيوتر، انظر لشيء يبعد 20 قدماً لمدة 20 ثانية لإراحة عينيك.',
    icon: '📱',
  },
  {
    id: 'tip-21',
    category: 'medication',
    title: 'الكالسيوم والحديد: لا تجمع بينهما',
    content: 'الكالسيوم يمنع امتصاص الحديد! افصل بين حبوب الحديد أو مشتقات الألبان وحبوب الكالسيوم بساعتين على الأقل.',
    icon: '🥛',
  },
  {
    id: 'tip-22',
    category: 'lifestyle',
    title: 'الملح الخفي وضغط الدم',
    content: '70% من الملح المسبب لارتفاع الضغط يأتي من المعلبات والمخللات والوجبات السريعة وليس من ملح طعام المطبخ!',
    icon: '🧂',
  },
  {
    id: 'tip-23',
    category: 'medication',
    title: 'شراب الكحة والنعاس',
    content: 'أدوية الحساسية والكحة التي تحتوي على مضادات الهيستامين قد تسبب النعاس؛ تجنب القيادة بعد تناولها.',
    icon: '🚗',
  },
  {
    id: 'tip-24',
    category: 'daily',
    title: 'صحة الفم واللثة',
    content: 'تغيير فرشاة الأسنان كل 3 أشهر واستخدام الخيط الطبي يومياً يقلل خطر التهابات اللثة بنسبة تتجاوز 80%.',
    icon: '🪥',
  },
];

// Returns the designated tip of the day using date hashing, plus category context
export function getDeboDailyTip(categoryName?: string): DailyHealthTip {
  const now = new Date();
  // Calculate day of the year (0 to 365)
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  if (categoryName) {
    // If inside a specific category, find matching tip if possible
    const matched = DEBO_HEALTH_TIPS.filter(
      (t) =>
        (categoryName.includes('أطفال') && t.category === 'pediatric') ||
        (categoryName.includes('عناية') && t.category === 'lifestyle') ||
        (categoryName.includes('أدوية') && t.category === 'medication')
    );
    if (matched.length > 0) {
      return matched[dayOfYear % matched.length];
    }
  }

  // Purely deterministic tip of the day
  return DEBO_HEALTH_TIPS[dayOfYear % DEBO_HEALTH_TIPS.length];
}

// Get another tip on user request/click
export function getRandomDeboTip(excludeId?: string): DailyHealthTip {
  const candidates = excludeId
    ? DEBO_HEALTH_TIPS.filter((t) => t.id !== excludeId)
    : DEBO_HEALTH_TIPS;
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx];
}
