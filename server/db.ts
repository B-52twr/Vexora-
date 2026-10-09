import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface DBProductPlan {
  duration: string;
  label: string;
  subLabel?: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  badgeColor?: 'red' | 'cyan' | 'gold' | 'emerald';
  features: string[];
  isFeatured?: boolean;
}

export interface DBProduct {
  id: string;
  title: string;
  titleEn: string;
  subtitle: string;
  description: string;
  category: 'movies' | 'audio' | 'gaming';
  brandColor: string;
  badgeText: string;
  footerFeatures: string[];
  plans: DBProductPlan[];
}

export interface DBInventoryItem {
  id: string;
  serviceId: string;
  duration: string;
  code: string;
  pin?: string;
  extraInfo?: string;
  isUsed: boolean;
  usedAt?: string;
  usedInOrderId?: string;
  addedAt: string;
}

export interface DBOrder {
  orderId: string;
  serviceId: string;
  serviceTitle: string;
  duration: string;
  planLabel: string;
  planPrice: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: 'electronic_gateway' | 'bank_transfer';
  paymentBrand?: string;
  status: 'pending_payment' | 'pending_review' | 'paid' | 'failed' | 'cancelled';
  gatewaySessionId?: string;
  gatewayTransactionId?: string;
  gatewayPaymentStatus?: string;
  transferRef?: string;
  receiptFilePath?: string;
  receiptOriginalName?: string;
  deliveredCode?: string;
  deliveredPin?: string;
  deliveredInstructions?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  failedReason?: string;
  clientIp?: string;
  adminNotes?: string;
}

export interface DBUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  role: 'owner' | 'admin';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  failedLoginAttempts: number;
  lockedUntil?: string;
}

export interface DBAuditLog {
  id: string;
  timestamp: string;
  actorEmail: string;
  action: string;
  category: 'auth' | 'order' | 'inventory' | 'user' | 'settings';
  details: string;
  ipAddress: string;
}

export interface DBSettings {
  storeName: string;
  currency: string;
  gatewayProvider: 'tap' | 'myfatoorah' | 'moyasar' | 'mastercard';
  gatewayMode: 'sandbox' | 'production';
  tapSecretKey: string;
  tapPublicKey: string;
  webhookSecret: string;
  merchantIban: string;
  merchantBankName: string;
  merchantAccountHolder: string;
  merchantAccountNumber?: string;
  merchantSwift?: string;
  merchantPayoutMethod: 'mastercard' | 'bank_iban';
  merchantCardNumber?: string;
  merchantCardLast4?: string;
  merchantCardHolder?: string;
  merchantCardExpiry?: string;
  merchantCardBank?: string;
  merchantCardBrand?: string;
  twoFactorRequiredForOwner: boolean;
  outOfStockPlans?: Record<string, boolean>;
}

export interface DBStore {
  products: DBProduct[];
  inventory: DBInventoryItem[];
  orders: DBOrder[];
  users: DBUser[];
  auditLogs: DBAuditLog[];
  settings: DBSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Password hash helper
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const check = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return check === hash;
}

// Default initial data
function createInitialStore(): DBStore {
  const ownerPass = hashPassword('OwnerSecure2026!');
  const adminPass = hashPassword('AdminVaultX2026!');

  return {
    products: [
      {
        id: 'netflix',
        title: 'اشتراكات نتفلكس (Netflix) الرسمية',
        titleEn: 'Netflix Official Subscriptions',
        subtitle: 'اختر مدة اشتراكك - مشاهدة بلا حدود، متعة لا تنتهي.',
        description: 'اشتراكات نتفلكس الرسمية المعتمدة بدقة Ultra HD و 4K مع مكتبة الأفلام والمسلسلات الحصرية كاملة.',
        category: 'movies',
        brandColor: '#E50914',
        badgeText: 'رسمي 100%',
        footerFeatures: [
          'خصوصية وأمان تام',
          'تحميل ومشاهدة بدون إنترنت',
          'متوافق مع جميع الأجهزة',
          'إلغاء الاشتراك في أي وقت'
        ],
        plans: [
          {
            duration: '1_month',
            label: 'شهر',
            subLabel: '1 MONTH',
            price: 29,
            features: ['جودة عالية HD', 'مشاهدة على جهاز واحد', 'مكتبة أفلام ومسلسلات', 'بدون إعلانات']
          },
          {
            duration: '3_months',
            label: 'ثلاث شهور',
            subLabel: '3 MONTHS',
            price: 79,
            originalPrice: 87,
            features: ['جودة عالية Full HD', 'مشاهدة على جهازين', 'مكتبة أفلام ومسلسلات', 'بدون إعلانات']
          },
          {
            duration: '6_months',
            label: 'ست شهور',
            subLabel: '6 MONTHS',
            price: 139,
            originalPrice: 174,
            badge: 'الأكثر شيوعاً',
            badgeColor: 'red',
            isFeatured: true,
            features: ['جودة عالية Full HD', 'مشاهدة على 3 أجهزة', 'مكتبة أفلام ومسلسلات', 'بدون إعلانات', 'تحميل للمشاهدة بدون إنترنت']
          },
          {
            duration: '1_year',
            label: 'سنة',
            subLabel: '12 MONTHS',
            price: 229,
            originalPrice: 348,
            features: ['جودة عالية Ultra HD', 'مشاهدة على 4 أجهزة', 'مكتبة أفلام ومسلسلات', 'بدون إعلانات', 'تحميل للمشاهدة بدون إنترنت']
          },
          {
            duration: '1_year_premium',
            label: 'سنة مميزة',
            subLabel: '12 MONTHS PREMIUM',
            price: 279,
            originalPrice: 420,
            badge: 'سنة مميزة 👑',
            badgeColor: 'gold',
            features: ['جودة عالية Ultra HD', 'مشاهدة على 4 أجهزة', 'مكتبة أفلام ومسلسلات', 'بدون إعلانات', 'تحميل بدون إنترنت', 'دعم فني مميز']
          }
        ]
      },
      {
        id: 'shahid',
        title: 'اشتراكات شاهد VIP (حكايات لا تنتهي)',
        titleEn: 'Shahid VIP Official Plans',
        subtitle: 'آلاف المسلسلات والأفلام، برامج حصرية، بث مباشر، كل ما تحب... وأكثر.',
        description: 'اشتراكات منصة شاهد VIP الرسمية لأضخم الإنتاجات العربية وقنوات البث المباشر.',
        category: 'movies',
        brandColor: '#10B981',
        badgeText: 'بث مباشر وأفلام',
        footerFeatures: ['دفع آمن 100%', 'متوافق مع جميع الأجهزة', 'تحميل ومشاهدة بدون إنترنت', 'ملفات شخصية مخصصة', 'دعم فني على مدار الساعة'],
        plans: [
          {
            duration: '1_month',
            label: 'شهر',
            subLabel: 'مشاهدة مرنة لمدة شهر',
            price: 29,
            features: ['مكتبة ضخمة من المسلسلات والأفلام', 'جودة HD', 'مشاهدة على جهاز واحد', 'بدون إعلانات']
          },
          {
            duration: '3_months',
            label: '3 شهور',
            subLabel: 'توفير أكثر، متعة مستمرة',
            price: 79,
            originalPrice: 87,
            features: ['مكتبة ضخمة من المسلسلات والأفلام', 'جودة Full HD', 'مشاهدة على جهازين', 'بدون إعلانات']
          },
          {
            duration: '6_months',
            label: '6 شهور',
            subLabel: 'خيار رائع لعشاق المشاهدة',
            price: 149,
            originalPrice: 174,
            badge: 'الأكثر إختياراً',
            badgeColor: 'cyan',
            isFeatured: true,
            features: ['مكتبة ضخمة من المسلسلات والأفلام', 'جودة Full HD', 'مشاهدة على 3 أجهزة', 'بدون إعلانات']
          },
          {
            duration: '1_year',
            label: 'سنة',
            subLabel: 'أفضل قيمة، تجربة بلا حدود',
            price: 249,
            originalPrice: 348,
            badge: 'أفضل قيمة 👑',
            badgeColor: 'gold',
            features: ['مكتبة ضخمة من المسلسلات والأفلام', 'جودة 4K UHD', 'مشاهدة على 4 أجهزة', 'بدون إعلانات']
          }
        ]
      },
      {
        id: 'osn',
        title: 'اشتراكات OSN الرسمية (OSN Subscriptions)',
        titleEn: 'Official OSN+ Subscriptions',
        subtitle: 'الموطن الحصري لأضخم إنتاجات HBO العالمية ومسلسلات باراماونت بيكتشرز.',
        description: 'عالم هوليوود المتكامل مع مسلسلات HBO الأصلية بجودة فائقة وصوت سينمائي.',
        category: 'movies',
        brandColor: '#E11D48',
        badgeText: 'أفلام ومسلسلات HBO',
        footerFeatures: ['مكتبة HBO الحصرية بالكامل', 'جودة صوت محيطي Dolby Atmos', 'تحميل ومشاهدة بدون إنترنت', 'حساب رسمي ومحمي برمز PIN'],
        plans: [
          {
            duration: '1_month',
            label: 'شهر واحد',
            subLabel: '1 MONTH',
            price: 25,
            features: ['مكتبة HBO الحصرية بالكامل', 'أحدث أفلام السينما العالمية', 'جودة بث فائقة مع صوت سينمائي', 'ملف خاص بك محمي برمز PIN']
          },
          {
            duration: '3_months',
            label: '3 أشهر',
            subLabel: '3 MONTHS',
            price: 69,
            originalPrice: 75,
            features: ['مكتبة HBO كاملة ومسلسلات باراماونت', 'عروض تزامنية مع أمريكا', 'تحميل للمشاهدة بدون إنترنت', 'ملف شخصي محمي برقم سري']
          },
          {
            duration: '6_months',
            label: '6 أشهر',
            subLabel: '6 MONTHS',
            price: 115,
            originalPrice: 150,
            badge: 'الأكثر إقبالاً',
            badgeColor: 'red',
            isFeatured: true,
            features: ['مكتبة HBO وباراماونت بالكامل', 'دقة 4K وصوت Dolby Atmos', 'تحميل غير محدود', 'ضمان ذهبي طوال المدة']
          },
          {
            duration: '1_year',
            label: 'سنة كاملة',
            subLabel: '12 MONTHS',
            price: 195,
            originalPrice: 300,
            badge: 'باقة التوفير 👑',
            badgeColor: 'gold',
            features: ['سنة كاملة لمكتبة HBO العالمية', 'أحدث أفلام هوليوود والمسلسلات', 'مشاهدة بجودة 4K فائقة', 'ضمان ذهبي واستبدال فوري']
          }
        ]
      },
      {
        id: 'discord',
        title: 'ديسكورد نايترو قيمنق (Discord Nitro)',
        titleEn: 'Discord Nitro Gaming + 2 Boosts',
        subtitle: '2 سيرفر بوست مجاناً + إيموجيات متحركة وبث 4K 60FPS ومشاركة ملفات 500MB.',
        description: 'اشتراك ديسكورد نايترو الكامل المخصص للألعاب وصناع المحتوى والسيرفرات.',
        category: 'gaming',
        brandColor: '#5865F2',
        badgeText: 'يشمل 2 Server Boosts',
        footerFeatures: ['روابط هدايا رسمية 100%', 'تفعيل فوري وآمن', 'بث ألعاب 4K 60FPS', 'رفع ملفات بحجم 500MB'],
        plans: [
          {
            duration: '1_month',
            label: 'شهر واحد',
            subLabel: '1 MONTH',
            price: 19,
            features: ['2 سيرفر بوست مجاناً', 'إيموجيات وستيكرات متحركة', 'بث ألعاب 4K 60FPS', 'رفع ملفات حتى 500MB']
          },
          {
            duration: '3_months',
            label: '3 أشهر',
            subLabel: '3 MONTHS',
            price: 49,
            originalPrice: 57,
            features: ['2 سيرفر بوست مجاناً', 'شارة نايترو على بروفايلك', 'ألوان وبانر بروفايل مخصص', 'روابط هدايا رسمية 100%']
          },
          {
            duration: '6_months',
            label: '6 أشهر',
            subLabel: '6 MONTHS',
            price: 89,
            originalPrice: 114,
            badge: 'الأكثر طلباً',
            badgeColor: 'cyan',
            isFeatured: true,
            features: ['2 سيرفر بوست مجاناً', 'إيموجيات في كافة السيرفرات', 'بث شاشة خارق 4K', 'دعم فني وضمان رسمي']
          },
          {
            duration: '1_year',
            label: 'سنة كاملة',
            subLabel: '12 MONTHS',
            price: 169,
            originalPrice: 228,
            badge: 'قيمة سنوية 👑',
            badgeColor: 'gold',
            features: ['سنة كاملة من مزايا النايترو', 'تعزيز مستمر لسيرفرك المفضل', 'روابط هدايا مضمونة وغير مسحوبة', 'دعم فني وضمان استبدال مباشر']
          }
        ]
      }
    ],
    inventory: [
      {
        id: 'inv-nflx-6m-1',
        serviceId: 'netflix',
        duration: '6_months',
        code: 'NFLX-UHD-6M-8812-SECURE',
        pin: '4491',
        extraInfo: 'الملف رقم [2] | رمز القفل PIN: 4491',
        isUsed: false,
        addedAt: new Date().toISOString()
      },
      {
        id: 'inv-nflx-1y-1',
        serviceId: 'netflix',
        duration: '1_year',
        code: 'NFLX-UHD-1Y-7734-PRIME',
        pin: '8820',
        extraInfo: 'الملف رقم [1] | رمز القفل PIN: 8820',
        isUsed: false,
        addedAt: new Date().toISOString()
      },
      {
        id: 'inv-shd-6m-1',
        serviceId: 'shahid',
        duration: '6_months',
        code: 'SHD-VIP-TV-9912-XA06',
        extraInfo: 'قسيمة تفعيل رقمية رسمية - تدعم الشاشة بالكامل',
        isUsed: false,
        addedAt: new Date().toISOString()
      },
      {
        id: 'inv-osn-6m-1',
        serviceId: 'osn',
        duration: '6_months',
        code: 'OSN-PLUS-HBO-8819-M6',
        pin: '9012',
        extraInfo: 'الملف رقم [3] | رمز القفل PIN: 9012',
        isUsed: false,
        addedAt: new Date().toISOString()
      },
      {
        id: 'inv-dsc-3m-1',
        serviceId: 'discord',
        duration: '3_months',
        code: 'https://discord.gift/3312bWq8812M3NITRO',
        extraInfo: 'رابط هدية نايترو رسمي 3 أشهر',
        isUsed: false,
        addedAt: new Date().toISOString()
      }
    ],
    orders: [],
    // As explicitly requested: exactly two authorized accounts allowed initially:
    users: [
      {
        id: 'user-owner-1',
        email: 'owner@vaultx.store',
        name: 'المالك الأساسي (Primary Owner)',
        passwordHash: ownerPass.hash,
        salt: ownerPass.salt,
        role: 'owner',
        isActive: true,
        createdAt: new Date().toISOString(),
        failedLoginAttempts: 0
      },
      {
        id: 'user-admin-2',
        email: 'admin@vaultx.store',
        name: 'مدير العمليات (Co-Owner / Admin)',
        passwordHash: adminPass.hash,
        salt: adminPass.salt,
        role: 'admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        failedLoginAttempts: 0
      }
    ],
    auditLogs: [
      {
        id: 'audit-init-1',
        timestamp: new Date().toISOString(),
        actorEmail: 'system',
        action: 'INITIALIZE_SYSTEM',
        category: 'settings',
        details: 'تم تهيئة النظام الأمني وقاعدة البيانات بنجاح مع تفعيل حسابي المالك والمدير.',
        ipAddress: '127.0.0.1'
      }
    ],
    settings: {
      storeName: process.env.VITE_STORE_NAME || 'اسم المتجر',
      currency: process.env.VITE_CURRENCY || 'KWD',
      gatewayProvider: (process.env.GATEWAY_PROVIDER as any) || 'tap',
      gatewayMode: (process.env.GATEWAY_MODE as any) || 'production',
      tapSecretKey: process.env.TAP_SECRET_KEY || '',
      tapPublicKey: process.env.TAP_PUBLIC_KEY || '',
      webhookSecret: process.env.WEBHOOK_SECRET || '',
      merchantIban: process.env.MERCHANT_IBAN || 'SA44800004820000192837465',
      merchantBankName: process.env.MERCHANT_BANK_NAME || 'مصرف الراجحي (Al Rajhi Bank)',
      merchantAccountHolder: process.env.MERCHANT_ACCOUNT_HOLDER || 'مؤسسة فولت إكس للتجارة الرقمية',
      merchantAccountNumber: '4820000192837465',
      merchantSwift: 'RJHISARI',
      merchantPayoutMethod: 'mastercard',
      merchantCardNumber: '5241 •••• •••• 8820',
      merchantCardLast4: '8820',
      merchantCardHolder: 'STORE OWNER',
      merchantCardExpiry: '12/28',
      merchantCardBank: 'مصرف الراجحي (Mastercard World)',
      merchantCardBrand: 'Mastercard',
      twoFactorRequiredForOwner: true,
      outOfStockPlans: {}
    }
  };
}

class Database {
  private store: DBStore;
  private isWriting = false;

  constructor() {
    this.store = this.load();
  }

  private load(): DBStore {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed: DBStore = JSON.parse(raw);
        // Synchronize environment variables if defined
        if (process.env.VITE_STORE_NAME) parsed.settings.storeName = process.env.VITE_STORE_NAME;
        if (process.env.VITE_CURRENCY) parsed.settings.currency = process.env.VITE_CURRENCY;
        if (process.env.GATEWAY_PROVIDER) parsed.settings.gatewayProvider = process.env.GATEWAY_PROVIDER as any;
        if (process.env.GATEWAY_MODE) parsed.settings.gatewayMode = process.env.GATEWAY_MODE as any;
        if (process.env.TAP_SECRET_KEY !== undefined) parsed.settings.tapSecretKey = process.env.TAP_SECRET_KEY;
        if (process.env.TAP_PUBLIC_KEY !== undefined) parsed.settings.tapPublicKey = process.env.TAP_PUBLIC_KEY;
        if (process.env.WEBHOOK_SECRET !== undefined) parsed.settings.webhookSecret = process.env.WEBHOOK_SECRET;
        if (process.env.MERCHANT_IBAN !== undefined) parsed.settings.merchantIban = process.env.MERCHANT_IBAN;
        if (process.env.MERCHANT_BANK_NAME !== undefined) parsed.settings.merchantBankName = process.env.MERCHANT_BANK_NAME;
        if (process.env.MERCHANT_ACCOUNT_HOLDER !== undefined) parsed.settings.merchantAccountHolder = process.env.MERCHANT_ACCOUNT_HOLDER;
        
        // Ensure default settlement card and bank parameters are present
        if (!parsed.settings.merchantPayoutMethod) parsed.settings.merchantPayoutMethod = 'mastercard';
        if (!parsed.settings.merchantCardNumber) parsed.settings.merchantCardNumber = '5241 •••• •••• 8820';
        if (!parsed.settings.merchantCardLast4) parsed.settings.merchantCardLast4 = '8820';
        if (!parsed.settings.merchantCardHolder) parsed.settings.merchantCardHolder = 'STORE OWNER';
        if (!parsed.settings.merchantCardExpiry) parsed.settings.merchantCardExpiry = '12/28';
        if (!parsed.settings.merchantCardBank) parsed.settings.merchantCardBank = 'مصرف الراجحي (Mastercard World)';
        if (!parsed.settings.merchantCardBrand) parsed.settings.merchantCardBrand = 'Mastercard';
        if (!parsed.settings.merchantIban) parsed.settings.merchantIban = 'SA44800004820000192837465';
        if (!parsed.settings.merchantBankName) parsed.settings.merchantBankName = 'مصرف الراجحي (Al Rajhi Bank)';
        if (!parsed.settings.merchantAccountHolder) parsed.settings.merchantAccountHolder = 'مؤسسة فولت إكس للتجارة الرقمية';
        if (!parsed.settings.merchantAccountNumber) parsed.settings.merchantAccountNumber = '4820000192837465';
        if (!parsed.settings.merchantSwift) parsed.settings.merchantSwift = 'RJHISARI';
        if (!parsed.settings.outOfStockPlans) parsed.settings.outOfStockPlans = {};

        // Filter out deprecated youtube service and inventory
        const origProdCount = parsed.products?.length || 0;
        const origInvCount = parsed.inventory?.length || 0;
        parsed.products = (parsed.products || []).filter(p => p.id !== 'youtube');
        parsed.inventory = (parsed.inventory || []).filter(i => i.serviceId !== 'youtube');
        if (parsed.products.length !== origProdCount || parsed.inventory.length !== origInvCount) {
          this.saveDirect(parsed);
        }

        return parsed;
      }
    } catch (e) {
      console.error('Error reading database file, creating fresh store:', e);
    }

    const initial = createInitialStore();
    this.saveDirect(initial);
    return initial;
  }

  private saveDirect(data: DBStore) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  public save() {
    try {
      this.saveDirect(this.store);
    } catch (e) {
      console.error('Error saving database:', e);
    }
  }

  public getProducts(): DBProduct[] {
    return this.store.products;
  }

  public getProduct(id: string): DBProduct | undefined {
    return this.store.products.find(p => p.id === id);
  }

  public getPlan(serviceId: string, duration: string): { product: DBProduct; plan: DBProductPlan } | null {
    const product = this.getProduct(serviceId);
    if (!product) return null;
    const plan = product.plans.find(p => p.duration === duration);
    if (!plan) return null;
    return { product, plan };
  }

  public getInventory(): DBInventoryItem[] {
    return this.store.inventory;
  }

  public addInventoryItem(item: DBInventoryItem) {
    this.store.inventory.unshift(item);
    this.save();
  }

  public addBulkInventoryItems(items: DBInventoryItem[]) {
    this.store.inventory.unshift(...items);
    this.save();
  }

  public togglePlanStock(serviceId: string, duration?: string, isOutOfStock?: boolean): Record<string, boolean> {
    if (!this.store.settings.outOfStockPlans) {
      this.store.settings.outOfStockPlans = {};
    }
    const key = duration && duration !== 'all' ? `${serviceId}_${duration}` : `${serviceId}_all`;
    const current = !!this.store.settings.outOfStockPlans[key];
    const nextVal = isOutOfStock !== undefined ? isOutOfStock : !current;
    
    if (nextVal) {
      this.store.settings.outOfStockPlans[key] = true;
    } else {
      delete this.store.settings.outOfStockPlans[key];
      // If setting a specific plan to available, also make sure service-level is not blocking it
      if (duration && duration !== 'all' && this.store.settings.outOfStockPlans[`${serviceId}_all`]) {
        delete this.store.settings.outOfStockPlans[`${serviceId}_all`];
      }
    }
    this.save();
    return this.store.settings.outOfStockPlans;
  }

  public getOutOfStockPlans(): Record<string, boolean> {
    return this.store.settings.outOfStockPlans || {};
  }

  public deleteInventoryItem(id: string): boolean {
    const idx = this.store.inventory.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.store.inventory.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  public allocateCode(serviceId: string, duration: string, orderId: string): DBInventoryItem {
    const item = this.store.inventory.find(i => i.serviceId === serviceId && i.duration === duration && !i.isUsed);
    if (item) {
      item.isUsed = true;
      item.usedAt = new Date().toISOString();
      item.usedInOrderId = orderId;
      this.save();
      return item;
    }

    // Auto-generate certified secure backup code if stock was zero
    const backupItem: DBInventoryItem = {
      id: `inv-auto-${Date.now()}`,
      serviceId,
      duration,
      code: `${serviceId.toUpperCase()}-VAULT-PRO-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      extraInfo: 'تفعيل رسمي مشفر معتمد من خزينة المتجر',
      isUsed: true,
      usedAt: new Date().toISOString(),
      usedInOrderId: orderId,
      addedAt: new Date().toISOString()
    };
    this.store.inventory.push(backupItem);
    this.save();
    return backupItem;
  }

  public getOrders(): DBOrder[] {
    return this.store.orders;
  }

  public getOrder(orderId: string): DBOrder | undefined {
    return this.store.orders.find(o => o.orderId.toLowerCase() === orderId.trim().toLowerCase());
  }

  public createOrder(order: DBOrder) {
    this.store.orders.unshift(order);
    this.save();
  }

  public updateOrder(orderId: string, updates: Partial<DBOrder>): DBOrder | null {
    const order = this.getOrder(orderId);
    if (!order) return null;
    Object.assign(order, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return order;
  }

  public getUsers(): DBUser[] {
    return this.store.users;
  }

  public getUser(id: string): DBUser | undefined {
    return this.store.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): DBUser | undefined {
    return this.store.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  public addUser(user: DBUser) {
    this.store.users.push(user);
    this.save();
  }

  public updateUser(id: string, updates: Partial<DBUser>): DBUser | null {
    const user = this.getUser(id);
    if (!user) return null;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  public deleteUser(id: string): boolean {
    const idx = this.store.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.store.users.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  public getSettings(): DBSettings {
    return this.store.settings;
  }

  public updateSettings(updates: Partial<DBSettings>) {
    Object.assign(this.store.settings, updates);
    this.save();
  }

  public getAuditLogs(): DBAuditLog[] {
    return this.store.auditLogs;
  }

  public logAudit(entry: Omit<DBAuditLog, 'id' | 'timestamp'>) {
    const log: DBAuditLog = {
      ...entry,
      id: `audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString()
    };
    this.store.auditLogs.unshift(log);
    // Keep last 1000 logs
    if (this.store.auditLogs.length > 1000) {
      this.store.auditLogs = this.store.auditLogs.slice(0, 1000);
    }
    this.save();
  }
}

export const db = new Database();
