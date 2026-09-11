import { CartItem, Customer, Product } from '../types';

export const PHARMACY_WHATSAPP_NUMBER = '201009097378'; // International Egyptian format

/**
 * Creates WhatsApp URL for sending an order directly to the pharmacy
 */
export function createOrderWhatsAppUrl(
  items: CartItem[],
  customer: Partial<Customer>,
  pointsDiscount: number,
  earnedPoints: number,
  notes?: string
): string {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = Math.max(0, subtotal - pointsDiscount);

  let message = `🏥 *طلب أدوية ومستلزمات جديدة - صيدلية الديب*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `👤 *بيانات العميل:*\n`;
  message += `• الاسم: ${customer.name || 'عميل كرام'}\n`;
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
  message += `💰 *الحساب الإجمالي:*\n`;
  message += `• المجموع: ${subtotal} جنيه\n`;
  if (pointsDiscount > 0) {
    message += `• خصم نقاط الولاء: -${pointsDiscount} جنيه\n`;
  }
  message += `• *المبلغ المطلوب سداده: ${total} جنيه*\n`;
  message += `🎁 *نقاط الولاء المكتسبة من الطلب: +${earnedPoints} نقطة*\n`;

  if (notes && notes.trim()) {
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📝 *ملاحظات العميل:*\n${notes.trim()}\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📍 شكراً لتسوقكم من صيدليات الديب. في انتظار تأكيد الطلب وسرعة التوصيل.`;

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
 * General contact / Pharmacist consultation
 */
export function createConsultationWhatsAppUrl(): string {
  const message = `مرحباً دكتور، أرغب في استشارة صيدلانية وسؤال عن جرعات وتوفر أدوية في صيدلية الديب.`;
  return `https://wa.me/${PHARMACY_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
