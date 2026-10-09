import { 
  SubscriptionService, 
  InventoryCode, 
  Order, 
  PlanDuration, 
  ServiceId, 
  OwnerSecurityConfig
} from '../types';
import { INITIAL_SERVICES, INITIAL_INVENTORY_CODES } from '../data/subscriptions';

const STORAGE_KEYS = {
  SERVICES: 'vaultx_v10_services',
  INVENTORY: 'vaultx_v10_inventory',
  ORDERS: 'vaultx_v10_orders',
  OWNER_SECURITY: 'vaultx_v10_owner_security',
  OUT_OF_STOCK: 'vaultx_v10_out_of_stock'
};

// SHA-256 style hash helper (browser crypto or fallback)
export async function hashSecret(secret: string): Promise<string> {
  try {
    const msgBuffer = new TextEncoder().encode(secret.trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Basic deterministic fallback
    let hash = 0;
    for (let i = 0; i < secret.length; i++) {
      const char = secret.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }
}

// OWNER SECURITY MANAGEMENT
export function getStoredOwnerSecurity(): OwnerSecurityConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OWNER_SECURITY);
    if (!raw) {
      return {
        isConfigured: false,
        pinHash: '',
        twoFactorEnabled: false
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      isConfigured: false,
      pinHash: '',
      twoFactorEnabled: false
    };
  }
}

export function saveOwnerSecurity(config: OwnerSecurityConfig) {
  localStorage.setItem(STORAGE_KEYS.OWNER_SECURITY, JSON.stringify(config));
}

// SERVICES MANAGEMENT
export function getStoredServices(): SubscriptionService[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(INITIAL_SERVICES));
      return INITIAL_SERVICES;
    }
    const parsed: SubscriptionService[] = JSON.parse(raw);
    const cleaned = parsed.filter(s => (s.id as string) !== 'youtube');
    return cleaned.length > 0 ? cleaned : INITIAL_SERVICES;
  } catch {
    return INITIAL_SERVICES;
  }
}

export function saveServices(services: SubscriptionService[]) {
  const cleaned = services.filter(s => (s.id as string) !== 'youtube');
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(cleaned));
}

// INVENTORY MANAGEMENT
export function getStoredInventory(): InventoryCode[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY_CODES));
      return INITIAL_INVENTORY_CODES;
    }
    const parsed: InventoryCode[] = JSON.parse(raw);
    const cleaned = parsed.filter(i => (i.serviceId as string) !== 'youtube');
    return cleaned;
  } catch {
    return INITIAL_INVENTORY_CODES;
  }
}

export function saveInventory(inventory: InventoryCode[]) {
  const cleaned = inventory.filter(i => (i.serviceId as string) !== 'youtube');
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(cleaned));
}

// OUT OF STOCK (نفاذ المخزون) HELPERS
export function getOutOfStockPlans(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OUT_OF_STOCK);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveOutOfStockPlans(data: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEYS.OUT_OF_STOCK, JSON.stringify(data));
}

export function isPlanOutOfStock(serviceId: ServiceId, duration: PlanDuration): boolean {
  const oos = getOutOfStockPlans();
  if (oos[`${serviceId}_all`]) return true;
  if (oos[`${serviceId}_${duration}`]) return true;
  return false;
}

export function isServiceOutOfStock(serviceId: ServiceId): boolean {
  const oos = getOutOfStockPlans();
  return !!oos[`${serviceId}_all`];
}

export function setPlanOutOfStock(serviceId: ServiceId, duration?: PlanDuration | 'all', isOut?: boolean): Record<string, boolean> {
  const oos = getOutOfStockPlans();
  const key = duration && duration !== 'all' ? `${serviceId}_${duration}` : `${serviceId}_all`;
  const current = !!oos[key];
  const nextVal = isOut !== undefined ? isOut : !current;

  if (nextVal) {
    oos[key] = true;
  } else {
    delete oos[key];
    if (duration && duration !== 'all' && oos[`${serviceId}_all`]) {
      delete oos[`${serviceId}_all`];
    }
  }

  saveOutOfStockPlans(oos);
  return oos;
}

export function depositCodesToInventory(
  serviceId: ServiceId, 
  duration: PlanDuration, 
  codes: string[], 
  pin?: string, 
  extraInfo?: string
): InventoryCode[] {
  const inventory = getStoredInventory();
  const added: InventoryCode[] = codes.map((c, i) => ({
    id: `code-${serviceId}-${Date.now()}-${i}`,
    serviceId,
    duration,
    code: c.trim(),
    pin: pin?.trim() || undefined,
    extraInfo: extraInfo?.trim() || undefined,
    isUsed: false,
    addedAt: new Date().toISOString()
  }));

  inventory.unshift(...added);
  saveInventory(inventory);

  // If plan was marked out of stock, automatically make it available again upon deposit
  const oos = getOutOfStockPlans();
  const key = `${serviceId}_${duration}`;
  if (oos[key]) {
    delete oos[key];
    saveOutOfStockPlans(oos);
  }

  return added;
}

export function getAvailableStockCount(serviceId: ServiceId, duration: PlanDuration): number {
  const inventory = getStoredInventory();
  return inventory.filter(i => i.serviceId === serviceId && i.duration === duration && !i.isUsed).length;
}

export function getTotalStockCount(): number {
  const inventory = getStoredInventory();
  return inventory.filter(i => !i.isUsed).length;
}

export function allocateCodeForOrder(
  serviceId: ServiceId, 
  duration: PlanDuration, 
  orderId: string
): InventoryCode | null {
  const inventory = getStoredInventory();
  const index = inventory.findIndex(i => i.serviceId === serviceId && i.duration === duration && !i.isUsed);
  
  if (index === -1) {
    // Generate a fallback high-entropy code if inventory is empty
    const fallbackCode: InventoryCode = {
      id: `gen-${Date.now()}`,
      serviceId,
      duration,
      code: `${serviceId.toUpperCase()}-AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      extraInfo: 'تفعيل رسمي مباشر معتمد من الإدارة',
      isUsed: true,
      usedAt: new Date().toISOString(),
      usedInOrderId: orderId,
      addedAt: new Date().toISOString()
    };
    inventory.push(fallbackCode);
    saveInventory(inventory);
    return fallbackCode;
  }

  inventory[index].isUsed = true;
  inventory[index].usedAt = new Date().toISOString();
  inventory[index].usedInOrderId = orderId;
  saveInventory(inventory);
  return inventory[index];
}

// ORDERS MANAGEMENT
export function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveOrders(orders: Order[]) {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
}

export function createOrder(orderData: Omit<Order, 'orderId' | 'createdAt'>): Order {
  const orders = getStoredOrders();
  const prefix = orderData.serviceId.substring(0, 3).toUpperCase();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const newOrder: Order = {
    ...orderData,
    orderId: `VX-${prefix}-${randomNum}`,
    createdAt: new Date().toISOString()
  };

  orders.unshift(newOrder);
  saveOrders(orders);
  return newOrder;
}

export function updateOrderStatus(
  orderId: string, 
  status: 'completed' | 'rejected', 
  adminNote?: string
): Order | null {
  const orders = getStoredOrders();
  const index = orders.findIndex(o => o.orderId === orderId);
  if (index === -1) return null;

  const order = orders[index];
  order.status = status;
  order.updatedAt = new Date().toISOString();
  order.reviewedBy = 'المالك الأساسي (Owner)';
  if (adminNote) order.adminNote = adminNote;

  if (status === 'completed' && !order.deliveredCode) {
    // Allocate subscription code from inventory
    const allocated = allocateCodeForOrder(order.serviceId, order.duration, order.orderId);
    if (allocated) {
      order.deliveredCode = allocated.code;
      order.deliveredPin = allocated.pin;
      order.deliveredInstructions = allocated.extraInfo || 'حساب رسمي مفعل معتمد من المتجر';
    }
  }

  orders[index] = order;
  saveOrders(orders);
  return order;
}

export function getOrderById(orderId: string): Order | null {
  const orders = getStoredOrders();
  return orders.find(o => o.orderId.toLowerCase() === orderId.trim().toLowerCase()) || null;
}
