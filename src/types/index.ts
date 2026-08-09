export type UserRole = 'PHOTOGRAPHER' | 'ADMIN';
export type PlanType = 'FREE' | 'PRO';

export interface User {
  id: string;
  name: string;
  companyName?: string;
  cpfCnpj?: string;
  email: string;
  phone?: string;
  role: UserRole;
  plan: PlanType;
  stripeAccountId?: string;
  stripeAccountStatus: 'NOT_CONNECTED' | 'PENDING' | 'VERIFIED';
  watermarkText?: string;
  pixKey?: string;
  createdAt: string;
}

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

export interface Event {
  id: string;
  photographerId: string;
  photographerName: string;
  photographerSlug: string;
  name: string;
  slug: string;
  description?: string;
  eventDate: string;
  location?: string;
  coverUrl?: string;
  defaultPrice: number;
  status: EventStatus;
  viewsCount: number;
  photosCount?: number;
  albumsCount?: number;
  createdAt: string;
}

export interface Album {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  coverUrl?: string;
  displayOrder: number;
  photosCount?: number;
  createdAt: string;
}

export interface Photo {
  id: string;
  eventId: string;
  albumId: string;
  photographerId: string;
  filename: string;
  originalPath: string;
  previewUrl: string;
  thumbnailUrl: string;
  price: number;
  photoNumber: string;
  width?: number;
  height?: number;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  orderId: string;
  photoId: string;
  photoNumber: string;
  price: number;
  previewUrl: string;
}

export interface Order {
  id: string;
  orderToken: string;
  photographerId: string;
  photographerName: string;
  eventId: string;
  eventName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  totalAmount: number;
  platformFeeAmount: number;
  photographerPayoutAmount: number;
  stripeFeeEstimate: number;
  paymentStatus: PaymentStatus;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
  items: OrderItem[];
  paidAt?: string;
  createdAt: string;
}

export interface PhotographerMetrics {
  salesThisMonth: number;
  totalRevenue: number;
  availableBalance: number;
  activeEventsCount: number;
  publishedPhotosCount: number;
  platformFeesPaid: number;
  recentOrders: Order[];
}

export interface AdminMetrics {
  totalPhotographers: number;
  totalEvents: number;
  totalPhotos: number;
  salesToday: number;
  salesThisMonth: number;
  platformRevenue: number;
  proSubscribersCount: number;
  freeUsersCount: number;
  recentOrders: Order[];
}

export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId?: string;
  plan: PlanType;
  status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'INCOMPLETE';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}
