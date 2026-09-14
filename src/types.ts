export type ProductCategory =
  | 'medicines'
  | 'vitamins'
  | 'skincare'
  | 'baby'
  | 'devices'
  | 'firstaid'
  | 'personal';

export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  category: ProductCategory;
  price: number;
  oldPrice?: number;
  dosageForm: string; // e.g. أقراص، شراب، كريم، فوار، أمبول
  activeIngredient: string; // المادة الفعالة
  description: string;
  usage: string;
  requiresPrescription: boolean;
  inStock: boolean;
  points: number; // نقاط الولاء المكتسبة
  image: string;
  tags?: string[];
  isNew?: boolean;
  stockQuantity?: number; // كمية المخزون المتبقية
  isLowStock?: boolean; // أوشك على النفاذ
  isComingSoon?: boolean; // قريباً في الصيدلية
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  points: number;
  tier: LoyaltyTier;
  totalOrders: number;
  joinedDate: string;
}

export interface PrescriptionOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  imageUrl: string;
  notes: string;
  status: 'pending' | 'reviewed' | 'preparing' | 'delivered';
  timestamp: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'new_product' | 'loyalty' | 'offer';
  productId?: string;
}

export type PaymentMethod = 'cash' | 'instapay' | 'visa';

export interface OrderRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  items: { productName: string; quantity: number; price: number }[];
  totalPrice: number;
  discount: number;
  pointsUsed: number;
  pointsEarned: number;
  paymentMethod?: PaymentMethod;
  date: string;
  status: 'sent_whatsapp' | 'confirmed' | 'delivered';
  notes?: string;
}
