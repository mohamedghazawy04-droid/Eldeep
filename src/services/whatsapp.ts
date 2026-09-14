import { CartItem, Customer, Product, PaymentMethod } from '../types';

export const PHARMACY_WHATSAPP_NUMBER = '201009097378'; // International Egyptian format

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '💵 نقدي عند الاستلام (Cash on Delivery)',
  instapay: '⚡ انستاباي (InstaPay)',
  visa: '💳 فيزا / بطاقة بنكية (Visa / Card)',
};

export interface WhatsAppOrderDetails {
  items: CartItem[];
  customer: Partial<Customer>;
  pointsDiscount: number;
  earnedPoints: number;
  pointsUsed?: number;
  remainingPoints?: number;
  previousPoints?: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

/**
 * Creates WhatsApp URL for sending an order directly to the pharmacy
 */
export function createOrderWhatsAppUrl(
  itemsOrDetails: CartItem[] | WhatsAppOrderDetails,
  customerOrDiscount?: Partial<Customer> | number,
  pointsDiscountOrEarned?: number,
  earnedPoints?: number,
  paymentMethod: PaymentMethod = 'cash',
  notes?: string,
  extraPointsInfo?: { pointsUsed?: number; remainingPoints?: number; previousPoints?: number }
): string {
  let items: CartItem[];
  let customer: Partial<Customer>;
  let pointsDiscount = 0;
  let pointsEarned = 0;
  let method: PaymentMethod = 'cash';
  let orderNotes = '';
  let pointsUsed = 0;
  let remainingPoints: number | undefined;
  let previousPoints: number | undefined;

  // Support both object signature and positional signature
  if (Array.isArray(itemsOrDetails)) {
    items = itemsOrDetails;
    customer = (customerOrDiscount as Partial<Customer>) || {};
    pointsDiscount = pointsDiscountOrEarned || 0;
    pointsEarned = earnedPoints || 0;
    method = paymentMethod;
    orderNotes = notes || '';
    if (extraPointsInfo) {
      pointsUsed = extraPointsInfo.pointsUsed || 0;
      remainingPoints = extraPointsInfo.remainingPoints;
      previousPoints = extraPointsInfo.previousPoints;
    }
  } else {
    const d = itemsOrDetails;
    items = d.items;
    customer = d.customer;
    pointsDiscount = d.pointsDiscount || 0;
    pointsEarned = d.earnedPoints || 0;
    pointsUsed = d.pointsUsed || 0;
    remainingPoints = d.remainingPoints;
    previousPoints = d.previousPoints;
    method = d.paymentMethod || 'cash';
    orderNotes = d.notes || '';
  }

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = Math.max(0, subtotal - pointsDiscount);

  let message = `🏥 *طلب أدوية ومستلزمات جديدة - صيدلية الديب*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `👤 *بيانات العميل والتوصيل:*\n`;
  message += `• الاسم: ${customer.name || 'عميل كريم'}\n`;
  message += `• رقم الهاتف: ${customer.phone || 'غير مسجل'}\n`;
  if (customer.address) {
    message += `• عنوان التوصيل: ${customer.address}\n`;
  }
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🛒 *محتويات الطلب:*\n`;

  items.forEach((item, index) => {
    message += `${index + 1}. *${item.product.nameAr}*\n`;
    message += `   - الكمية: ${item.quantity} | السعر: ${item.product.price} ج.م | الإجمالي: ${item.product.price * item.quantity} ج.م\n`;
  });

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💳 *طريقة الدفع المختارة:*\n`;
  message += `• ${PAYMENT_METHOD_LABELS[method] || method}\n`;

  // Loyalty points section
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  if (pointsDiscount > 0 || pointsUsed > 0) {
    message += `🌟 *نظام نقاط الولاء والمكافآت (تم تطبيق الخصم):*\n`;
    if (previousPoints !== undefined) {
      message += `• رصيد النقاط قبل الطلب: ${previousPoints} نقطة\n`;
    }
    message += `• النقاط المخصومة من الحساب: -${pointsUsed || pointsDiscount} نقطة\n`;
    message += `• قيمة الخصم المباشر: -${pointsDiscount} جنيه مصري\n`;
    if (remainingPoints !== undefined) {
      message += `• رصيد النقاط المتبقي بحسابك: ${remainingPoints} نقطة\n`;
    }
    message += `• نقاط إضافية مكتسبة من الطلب: +${pointsEarned} نقطة\n`;
  } else {
    message += `🎁 *نقاط الولاء المكتسبة من هذا الطلب: +${pointsEarned} نقطة*\n`;
    if (previousPoints !== undefined) {
      message += `• رصيد نقاطك الحالي المحفوظ: ${previousPoints} نقطة\n`;
    }
  }

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💰 *الحساب الإجمالي للفاتورة:*\n`;
  message += `• إجمالي المنتجات: ${subtotal} جنيه\n`;
  if (pointsDiscount > 0) {
    message += `• خصم نقاط الولاء: -${pointsDiscount} جنيه\n`;
  }
  message += `• *المبلغ النهائي المطلوب للدفع: ${total} جنيه*\n`;

  if (orderNotes && orderNotes.trim()) {
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📝 *ملاحظات العميل للصيدلي:*\n${orderNotes.trim()}\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📍 شكراً لتسوقكم من صيدلية الديب. في انتظار تأكيد وتجهيز الطلب للتوصيل الفوري.`;

  return `https://wa.me/${PHARMACY_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Creates WhatsApp URL for sending a prescription
 */
export function createPrescriptionWhatsAppUrl(
  customerName: string,
  customerPhone: string,
  customerAddress: string,
  notes: string,
  hasImageAttachment: boolean
): string {
  let message = `🩺 *روشتة طبية جديدة مرسلة من الموقع - صيدلية الديب*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `👤 *بيانات المريض / العميل:*\n`;
  message += `• الاسم: ${customerName}\n`;
  message += `• الهاتف: ${customerPhone}\n`;
  message += `• العنوان: ${customerAddress || 'سيتم التوضيح مع الصيدلي'}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  if (notes && notes.trim()) {
    message += `📋 *ملاحظات المريض أو الأعراض:*\n${notes.trim()}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  }
  if (hasImageAttachment) {
    message += `📸 *مرفق صورة الروشتة في هذه المحادثة (يرجى مراجعة الصورة وتأكيد توفر الأدوية والبدائل والجرعات)*\n`;
  } else {
    message += `💊 يرجى تجهيز الأدوية المطلوبة حسب الملاحظات الموضحة أعلاه.\n`;
  }
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `برجاء إفادتي بالسعر الإجمالي وميعاد التوصيل. شكراً لكم!`;

  return `https://wa.me/${PHARMACY_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Quick product inquiry
 */
export function createProductInquiryWhatsAppUrl(product: Product): string {
  const message = `مرحباً صيدلية الديب، أستفسر عن توفر دواء: *${product.nameAr}* (${product.nameEn}) بسعر ${product.price} ج.م. هل هو متاح للتوصيل الفوري؟`;
  return `https://wa.me/${PHARMACY_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Dosage inquiry via WhatsApp
 */
export function createDosageInquiryWhatsAppUrl(
  product: Product,
  weightKg: number,
  calculatedDose: string,
  ageStage: string
): string {
  let message = `🏥 *استفسار عن جرعة دواء - صيدلية الديب*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💊 *الدواء:* ${product.nameAr} (${product.nameEn})\n`;
  message += `🧪 *الشكل الصيدلي:* ${product.dosageForm}\n`;
  message += `⚖️ *وزن المريض:* ${weightKg} كجم (${ageStage})\n`;
  message += `📊 *الجرعة التقديرية بالحاسبة:* ${calculatedDose}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `دكتور صيدلي الديب، أرجو تأكيد صحة هذه الجرعة وتكرارها اليومي وطريقة تناولها المثلى. شكراً جزيلاً!`;

  return `https://wa.me/${PHARMACY_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * General contact / Pharmacist consultation
 */
export function createConsultationWhatsAppUrl(): string {
  const message = `مرحباً دكتور، أرغب في استشارة صيدلانية وسؤال عن جرعات وتوفر أدوية في صيدلية الديب.`;
  return `https://wa.me/${PHARMACY_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
