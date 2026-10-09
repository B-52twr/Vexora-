// Frontend API Client connecting directly to server endpoints

const API_BASE = '/api';

export interface ApiProductPlan {
  duration: string;
  label: string;
  subLabel?: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  badgeColor?: 'red' | 'cyan' | 'gold' | 'emerald';
  features: string[];
  isFeatured?: boolean;
  availableStock: number;
  isOutOfStock?: boolean;
}

export interface ApiProduct {
  id: string;
  title: string;
  titleEn: string;
  subtitle: string;
  description: string;
  category: 'movies' | 'audio' | 'gaming';
  brandColor: string;
  badgeText: string;
  footerFeatures: string[];
  plans: ApiProductPlan[];
  isOutOfStock?: boolean;
}

export interface OrderVerificationResult {
  success: boolean;
  status: 'paid' | 'pending_review' | 'pending_payment' | 'failed' | 'cancelled';
  orderId: string;
  serviceTitle: string;
  planLabel: string;
  planPrice: number;
  currency: string;
  customerName?: string;
  deliveredCode?: string;
  deliveredPin?: string;
  deliveredInstructions?: string;
  paidAt?: string;
  failedReason?: string;
  transferRef?: string;
}

export interface ApiConfig {
  success: boolean;
  storeName: string;
  currency: string;
  gatewayProvider: string;
  gatewayMode: string;
  isTapLive: boolean;
  enabledPaymentBrands: string[];
  merchantSettlement: {
    hasIban: boolean;
    iban: string;
    bankName: string;
    accountHolder: string;
    accountNumber?: string;
    swift?: string;
    payoutMethod: 'mastercard' | 'bank_iban';
    cardBrand: string;
    cardLast4: string;
    cardBank?: string;
  };
}

export const apiClient = {
  // Public Store Configuration (Currency & Gateway)
  async getConfig(): Promise<ApiConfig> {
    const res = await fetch(`${API_BASE}/config`);
    const data = await res.json();
    return data;
  },

  // Public Products
  async getProducts(): Promise<ApiProduct[]> {
    const res = await fetch(`${API_BASE}/products`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch products');
    return data.products;
  },

  // Create Checkout Session (Strictly verified on server)
  async createCheckoutSession(payload: {
    serviceId: string;
    duration: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    paymentMethod: 'electronic_gateway' | 'bank_transfer';
    paymentBrand?: string;
  }) {
    const res = await fetch(`${API_BASE}/checkout/create-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل في إنشاء جلسة الدفع');
    return data;
  },

  // Upload Bank Transfer Receipt
  async uploadBankReceipt(formData: FormData) {
    const res = await fetch(`${API_BASE}/checkout/bank-receipt`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل في رفع إيصال التحويل');
    return data;
  },

  // Verify Order Payment directly with server
  async verifyOrder(orderId: string): Promise<OrderVerificationResult> {
    const res = await fetch(`${API_BASE}/checkout/verify/${orderId}`);
    const data = await res.json();
    return data;
  },

  // Track Order
  async trackOrder(orderId: string) {
    const res = await fetch(`${API_BASE}/orders/track/${orderId}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'الطلب غير موجود');
    return data.order;
  },

  // Gateway Simulation (3DS Challenge in Sandbox)
  async simulate3DS(orderId: string, otp: string, action?: 'cancel' | 'verify') {
    const res = await fetch(`${API_BASE}/gateway/simulate-3ds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, otp, action })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشلت معالجة رمز التحقق المصرفي');
    return data;
  },

  // Admin APIs
  async adminLogin(email: string, password: string) {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل تسجيل الدخول');
    return data;
  },

  async adminLogout(token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/admin/logout`, {
      method: 'POST',
      headers
    });
    return res.json();
  },

  async getAdminMe(token: string) {
    const res = await fetch(`${API_BASE}/admin/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'غير مصرح');
    return data.user;
  },

  async getAdminStats(token: string) {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل جلب الإحصائيات');
    return data.stats;
  },

  async getAdminOrders(token: string, status?: string, search?: string) {
    let url = `${API_BASE}/admin/orders?`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    if (search) url += `search=${encodeURIComponent(search)}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل جلب الطلبات');
    return data.orders;
  },

  async approveOrder(token: string, orderId: string) {
    const res = await fetch(`${API_BASE}/admin/orders/${orderId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل اعتماد الطلب');
    return data;
  },

  async rejectOrder(token: string, orderId: string, reason?: string) {
    const res = await fetch(`${API_BASE}/admin/orders/${orderId}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل رفض الطلب');
    return data;
  },

  async getAdminInventory(token: string) {
    const res = await fetch(`${API_BASE}/admin/inventory`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل جلب المخزون');
    return data.inventory;
  },

  async addInventoryCode(token: string, item: {
    serviceId: string;
    duration: string;
    code: string;
    pin?: string;
    extraInfo?: string;
  }) {
    const res = await fetch(`${API_BASE}/admin/inventory`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(item)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل إضافة الكود');
    return data;
  },

  async deleteInventoryCode(token: string, id: string) {
    const res = await fetch(`${API_BASE}/admin/inventory/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل حذف الكود');
    return data;
  },

  async depositInventoryCodes(token: string, payload: {
    serviceId: string;
    duration: string;
    codes: string[] | string;
    pin?: string;
    extraInfo?: string;
  }) {
    const res = await fetch(`${API_BASE}/admin/inventory/deposit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل إيداع الأكواد');
    return data;
  },

  async toggleStockStatus(token: string, payload: {
    serviceId: string;
    duration?: string;
    isOutOfStock: boolean;
  }) {
    const res = await fetch(`${API_BASE}/admin/inventory/toggle-stock`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل تحديث حالة المخزون');
    return data;
  },

  async getAdminUsers(token: string) {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل جلب المستخدمين');
    return data.users;
  },

  async addAdminUser(token: string, user: {
    email: string;
    name: string;
    password: string;
    role: 'owner' | 'admin';
  }) {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل إضافة المستخدم');
    return data;
  },

  async toggleAdminUser(token: string, id: string) {
    const res = await fetch(`${API_BASE}/admin/users/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل تعديل حالة الحساب');
    return data;
  },

  async deleteAdminUser(token: string, id: string) {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل حذف الحساب');
    return data;
  },

  async getAdminSettings(token: string) {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل جلب الإعدادات');
    return data.settings;
  },

  async updateAdminSettings(token: string, updates: any) {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل تحديث الإعدادات');
    return data;
  },

  async triggerAdminPayoutTest(token: string) {
    const res = await fetch(`${API_BASE}/admin/test-payout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل فحص تحويل الأرباح');
    return data;
  },

  async getAuditLogs(token: string) {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'فشل جلب سجل العمليات');
    return data.logs;
  }
};
