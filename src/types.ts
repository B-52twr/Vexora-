export type ServiceId = 'netflix' | 'shahid' | 'discord' | 'osn';

export type PlanDuration = 
  | '1_month' 
  | '3_months' 
  | '6_months' 
  | '1_year' 
  | '1_year_premium';

export interface Plan {
  duration: PlanDuration;
  label: string;
  subLabel?: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  badgeColor?: 'red' | 'cyan' | 'gold' | 'emerald';
  features: string[];
  isFeatured?: boolean;
  savePercent?: string;
}

export interface SubscriptionService {
  id: ServiceId;
  title: string;
  titleEn: string;
  subtitle: string;
  description: string;
  brandColor: string;
  glowColor: string;
  bannerImage: string;
  badgeText: string;
  footerFeatures: string[];
  plans: Plan[];
}

export interface InventoryCode {
  id: string;
  serviceId: ServiceId;
  duration: PlanDuration;
  code: string;
  pin?: string;
  extraInfo?: string;
  isUsed: boolean;
  usedAt?: string;
  usedInOrderId?: string;
  addedAt: string;
}

export type PaymentMethod = 'electronic_gateway' | 'bank_transfer';
export type ElectronicBrand = 'apple_pay' | 'mada' | 'visa' | 'mastercard' | 'knet';

export type OrderStatus = 'pending_verification' | 'completed' | 'rejected';

export interface Order {
  orderId: string;
  serviceId: ServiceId;
  serviceTitle: string;
  duration: PlanDuration;
  planLabel: string;
  planPrice: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  electronicBrand?: ElectronicBrand;
  status: OrderStatus;
  
  // Bank Transfer Fields
  receiptImageData?: string;
  receiptFileName?: string;
  transferRef?: string;
  
  // Electronic Gateway Fields (Hosted Checkout simulation with 3DS OTP & Webhook)
  gatewayReference?: string;
  otpVerified?: boolean;
  
  // Subscription delivery fields (Allocated only on verified completion)
  deliveredCode?: string;
  deliveredPin?: string;
  deliveredInstructions?: string;
  
  createdAt: string;
  updatedAt?: string;
  reviewedBy?: string;
  adminNote?: string;
}

export interface BankAccountDetails {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  iban: string;
}

export interface OwnerSecurityConfig {
  isConfigured: boolean;
  pinHash: string; // SHA-256 or secure client-hash of the owner PIN
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  ownerEmail?: string;
  lastLogin?: string;
}

export interface TransactionLog {
  id: string;
  orderId: string;
  timestamp: string;
  amount: number;
  currency: string;
  serviceTitle: string;
  planLabel: string;
  customerName: string;
  customerMaskedEmail: string;
  paymentMethod: PaymentMethod;
  electronicBrand?: ElectronicBrand;
  gatewayTxnId: string;
  authCode: string;
  responseStatus: 'SETTLED' | 'CAPTURED' | 'VERIFIED_3DS';
  signatureHash: string;
  auditIp: string;
}

export interface TransactionApiResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  endpoint: string;
  tlsVersion: string;
  totalVolume: number;
  currency: string;
  logs: TransactionLog[];
}

