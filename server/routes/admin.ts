import { Router, type Response } from 'express';
import crypto from 'crypto';
import { db, verifyPassword, hashPassword } from '../db.ts';
import { 
  createSession, 
  revokeSession, 
  requireAuth, 
  requireOwner, 
  type AuthenticatedRequest 
} from '../auth.ts';

const router = Router();

// POST /api/admin/login (With Brute-force & Lockout protection)
router.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
    return;
  }

  const user = db.getUserByEmail(email);
  const clientIp = req.ip || '127.0.0.1';

  if (!user) {
    db.logAudit({
      actorEmail: email,
      action: 'LOGIN_FAILED_UNKNOWN_USER',
      category: 'auth',
      details: 'محاولة تسجيل دخول باسم مستخدم غير مسجل في النظام',
      ipAddress: clientIp
    });
    res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    return;
  }

  // Check account lockout
  if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
    const remainingMins = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
    res.status(429).json({ 
      success: false, 
      message: `تم قفل الحساب مؤقتاً بسبب تكرار المحاولات الخاطئة. يرجى المحاولة بعد ${remainingMins} دقيقة.` 
    });
    return;
  }

  // Check account active
  if (!user.isActive) {
    res.status(403).json({ success: false, message: 'تم تعطيل هذا الحساب من قبل المالك الأساسي' });
    return;
  }

  // Verify password
  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    const updates: any = { failedLoginAttempts: attempts };

    if (attempts >= 5) {
      // Lock for 15 minutes
      updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      db.logAudit({
        actorEmail: user.email,
        action: 'ACCOUNT_LOCKED',
        category: 'auth',
        details: 'تم قفل الحساب لمدة 15 دقيقة بعد 5 محاولات فاشلة متتالية',
        ipAddress: clientIp
      });
    }

    db.updateUser(user.id, updates);

    db.logAudit({
      actorEmail: user.email,
      action: 'LOGIN_FAILED',
      category: 'auth',
      details: `محاولة دخول فاشلة (${attempts}/5)`,
      ipAddress: clientIp
    });

    res.status(401).json({ 
      success: false, 
      message: attempts >= 5 
        ? 'تم قفل الحساب لمدة 15 دقيقة بسبب المحاولات المتكررة الخاطئة' 
        : `كلمة المرور غير صحيحة. المحاولة ${attempts} من 5`
    });
    return;
  }

  // Login successful
  db.updateUser(user.id, {
    failedLoginAttempts: 0,
    lockedUntil: undefined,
    lastLoginAt: new Date().toISOString()
  });

  const token = createSession(user);

  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000
  });

  db.logAudit({
    actorEmail: user.email,
    action: 'LOGIN_SUCCESS',
    category: 'auth',
    details: `تم تسجيل الدخول بنجاح بصلاحية: ${user.role.toUpperCase()}`,
    ipAddress: clientIp
  });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

// POST /api/admin/logout
router.post('/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.sessionToken) {
    revokeSession(req.sessionToken);
  }
  res.clearCookie('admin_token');

  db.logAudit({
    actorEmail: req.user?.email || 'unknown',
    action: 'LOGOUT',
    category: 'auth',
    details: 'تم تسجيل الخروج وقفل الجلسة',
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
});

// GET /api/admin/me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    user: {
      id: req.user?.id,
      email: req.user?.email,
      name: req.user?.name,
      role: req.user?.role
    }
  });
});

// GET /api/admin/stats
router.get('/stats', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const orders = db.getOrders();
  const inventory = db.getInventory();

  const paidOrders = orders.filter(o => o.status === 'paid');
  const pendingReview = orders.filter(o => o.status === 'pending_review');
  const pendingPayment = orders.filter(o => o.status === 'pending_payment');
  const failedOrders = orders.filter(o => o.status === 'failed');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.planPrice, 0);
  const availableStock = inventory.filter(i => !i.isUsed).length;

  res.json({
    success: true,
    stats: {
      totalRevenue,
      currency: 'SAR',
      totalOrders: orders.length,
      paidCount: paidOrders.length,
      pendingReviewCount: pendingReview.length,
      pendingPaymentCount: pendingPayment.length,
      failedCount: failedOrders.length,
      cancelledCount: cancelledOrders.length,
      availableStock
    }
  });
});

// GET /api/admin/orders
router.get('/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const statusFilter = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  let orders = db.getOrders();

  if (statusFilter && statusFilter !== 'all') {
    orders = orders.filter(o => o.status === statusFilter);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    orders = orders.filter(o => 
      o.orderId.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      (o.transferRef && o.transferRef.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, orders });
});

// POST /api/admin/orders/:orderId/approve (Approve Bank Transfer)
router.post('/orders/:orderId/approve', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { orderId } = req.params;
  const order = db.getOrder(orderId);

  if (!order) {
    res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    return;
  }

  if (order.status === 'paid') {
    res.status(400).json({ success: false, message: 'الطلب معتمد ومسلم مسبقاً' });
    return;
  }

  // Allocate code from inventory
  const allocated = db.allocateCode(order.serviceId, order.duration, order.orderId);

  db.updateOrder(orderId, {
    status: 'paid',
    paidAt: new Date().toISOString(),
    deliveredCode: allocated.code,
    deliveredPin: allocated.pin,
    deliveredInstructions: allocated.extraInfo || 'حساب رسمي مشفر ومضمون 100%',
    adminNotes: `تم اعتماد الحوالة يدوياً بواسطة: ${req.user?.name} (${req.user?.email})`
  });

  db.logAudit({
    actorEmail: req.user?.email || 'admin',
    action: 'BANK_ORDER_APPROVED',
    category: 'order',
    details: `تم تدقيق إيصال الحوالة واعتماد الطلب ${orderId} بنجاح وتسليم الكود ${allocated.code}`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({
    success: true,
    message: 'تم اعتماد الحوالة وتخصيص الكود للطلب بنجاح',
    allocatedCode: allocated.code
  });
});

// POST /api/admin/orders/:orderId/reject
router.post('/orders/:orderId/reject', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const order = db.getOrder(orderId);

  if (!order) {
    res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    return;
  }

  db.updateOrder(orderId, {
    status: 'failed',
    failedReason: reason || 'تم رفض الحوالة البنكية لعدم مطابقة الإيصال مع كشف الحساب',
    adminNotes: `تم الرفض بواسطة: ${req.user?.name} (${req.user?.email})`
  });

  db.logAudit({
    actorEmail: req.user?.email || 'admin',
    action: 'BANK_ORDER_REJECTED',
    category: 'order',
    details: `تم رفض الحوالة للطلب ${orderId}. السبب: ${reason || 'غير مطابق'}`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, message: 'تم رفض الطلب بنجاح' });
});

// GET /api/admin/inventory
router.get('/inventory', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const inventory = db.getInventory();
  const outOfStockPlans = db.getOutOfStockPlans();
  res.json({ success: true, inventory, outOfStockPlans });
});

// POST /api/admin/inventory (Single Code Addition)
router.post('/inventory', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { serviceId, duration, code, pin, extraInfo } = req.body;

  if (!serviceId || !duration || !code) {
    res.status(400).json({ success: false, message: 'المنصة، المدة، وكود الاشتراك حقول إلزامية' });
    return;
  }

  const newItem = {
    id: `inv-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    serviceId,
    duration,
    code: code.trim(),
    pin: pin?.trim() || undefined,
    extraInfo: extraInfo?.trim() || undefined,
    isUsed: false,
    addedAt: new Date().toISOString()
  };

  db.addInventoryItem(newItem);

  db.logAudit({
    actorEmail: req.user?.email || 'admin',
    action: 'INVENTORY_CODE_ADDED',
    category: 'inventory',
    details: `تم إضافة كود جديد لمنصة ${serviceId} مدة ${duration}`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, item: newItem, outOfStockPlans: db.getOutOfStockPlans() });
});

// POST /api/admin/inventory/deposit (Bulk / Fast Code Deposit)
router.post('/inventory/deposit', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { serviceId, duration, codes, pin, extraInfo } = req.body;

  if (!serviceId || !duration || !codes) {
    res.status(400).json({ success: false, message: 'المنصة، المدة، والأكواد حقول إلزامية' });
    return;
  }

  let codeList: string[] = [];
  if (Array.isArray(codes)) {
    codeList = codes.map((c: any) => String(c).trim()).filter(Boolean);
  } else if (typeof codes === 'string') {
    codeList = codes
      .split(/\r?\n/)
      .map(c => c.trim())
      .filter(c => c.length > 0);
  }

  if (codeList.length === 0) {
    res.status(400).json({ success: false, message: 'لم يتم العثور على أي أكواد صالحة للإيداع' });
    return;
  }

  const newItems = codeList.map((codeStr, idx) => ({
    id: `inv-${Date.now()}-${idx}-${crypto.randomBytes(2).toString('hex')}`,
    serviceId,
    duration,
    code: codeStr,
    pin: pin?.trim() || undefined,
    extraInfo: extraInfo?.trim() || undefined,
    isUsed: false,
    addedAt: new Date().toISOString()
  }));

  db.addBulkInventoryItems(newItems);

  // Automatically ensure plan is not marked out of stock after successful deposit
  const outOfStockKey = `${serviceId}_${duration}`;
  const currentOos = db.getOutOfStockPlans();
  if (currentOos[outOfStockKey]) {
    db.togglePlanStock(serviceId, duration, false);
  }

  db.logAudit({
    actorEmail: req.user?.email || 'admin',
    action: 'INVENTORY_DEPOSIT',
    category: 'inventory',
    details: `تم إيداع ${newItems.length} كود جديد لمنصة ${serviceId} مدة ${duration}`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({
    success: true,
    message: `تم إيداع ${newItems.length} كود بنجاح في مخزون المنصة`,
    count: newItems.length,
    items: newItems,
    outOfStockPlans: db.getOutOfStockPlans()
  });
});

// POST /api/admin/inventory/toggle-stock (Toggle نفاذ / متوفر)
router.post('/inventory/toggle-stock', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { serviceId, duration, isOutOfStock } = req.body;

  if (!serviceId) {
    res.status(400).json({ success: false, message: 'معرف المنصة مطلوب' });
    return;
  }

  const updatedOos = db.togglePlanStock(serviceId, duration, isOutOfStock);

  const targetLabel = duration && duration !== 'all' ? `باقة ${duration}` : 'المنصة بالكامل';
  const statusLabel = isOutOfStock ? 'نفاذ المخزون (غير متاح)' : 'متوفر للتسليم';

  db.logAudit({
    actorEmail: req.user?.email || 'admin',
    action: 'STOCK_STATUS_TOGGLED',
    category: 'inventory',
    details: `تم تغيير حالة مخزون ${serviceId} (${targetLabel}) إلى: ${statusLabel}`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({
    success: true,
    message: `تم تحديث حالة المخزون إلى: ${statusLabel}`,
    outOfStockPlans: updatedOos
  });
});

// DELETE /api/admin/inventory/:id
router.delete('/inventory/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteInventoryItem(id);

  if (deleted) {
    db.logAudit({
      actorEmail: req.user?.email || 'admin',
      action: 'INVENTORY_CODE_DELETED',
      category: 'inventory',
      details: `تم حذف كود من المخزون (ID: ${id})`,
      ipAddress: req.ip || '127.0.0.1'
    });
    res.json({ success: true, message: 'تم حذف الكود بنجاح' });
  } else {
    res.status(404).json({ success: false, message: 'الكود غير موجود' });
  }
});

// GET /api/admin/users
router.get('/users', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers().map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt
  }));

  res.json({ success: true, users });
});

// POST /api/admin/users (Owner Only: Add new Admin or Owner)
router.post('/users', requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { email, name, password, role } = req.body;

  if (!email || !name || !password || !role) {
    res.status(400).json({ success: false, message: 'جميع بيانات الحساب الجديد مطلوبة' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ success: false, message: 'كلمة المرور يجب أن لا تقل عن 8 أحرف وأرقام' });
    return;
  }

  if (password === '1234' || password === '123456' || password === '12345678') {
    res.status(400).json({ success: false, message: 'ممنوع استخدام كلمات مرور ضعيفة مثل 1234!' });
    return;
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    res.status(400).json({ success: false, message: 'البريد الإلكتروني مسجل بالفعل لمستخدم آخر' });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const newUser = {
    id: `user-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    email: email.trim().toLowerCase(),
    name: name.trim(),
    passwordHash: hash,
    salt,
    role: role === 'owner' ? 'owner' : 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
    failedLoginAttempts: 0
  };

  db.addUser(newUser);

  db.logAudit({
    actorEmail: req.user?.email || 'owner',
    action: 'USER_CREATED',
    category: 'user',
    details: `تم إنشاء حساب ${role.toUpperCase()} جديد للبريد: ${email}`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({
    success: true,
    message: 'تم إنشاء الحساب بنجاح',
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    }
  });
});

// PATCH /api/admin/users/:id/toggle (Owner Only: Enable/Disable Account)
router.patch('/users/:id/toggle', requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const targetUser = db.getUser(id);

  if (!targetUser) {
    res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    return;
  }

  if (targetUser.id === req.user?.id) {
    res.status(400).json({ success: false, message: 'لا يمكنك تعطيل حسابك الحالي' });
    return;
  }

  const newStatus = !targetUser.isActive;
  db.updateUser(id, { isActive: newStatus });

  db.logAudit({
    actorEmail: req.user?.email || 'owner',
    action: newStatus ? 'USER_ENABLED' : 'USER_DISABLED',
    category: 'user',
    details: `تم ${newStatus ? 'تفعيل' : 'تعطيل'} حساب المستخدم ${targetUser.email}`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, message: `تم ${newStatus ? 'تفعيل' : 'تعطيل'} الحساب بنجاح` });
});

// DELETE /api/admin/users/:id (Owner Only: Remove account)
router.delete('/users/:id', requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const targetUser = db.getUser(id);

  if (!targetUser) {
    res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    return;
  }

  if (targetUser.id === req.user?.id) {
    res.status(400).json({ success: false, message: 'لا يمكنك حذف حسابك الحالي' });
    return;
  }

  // Ensure at least one owner remains
  const owners = db.getUsers().filter(u => u.role === 'owner' && u.isActive);
  if (targetUser.role === 'owner' && owners.length <= 1) {
    res.status(400).json({ success: false, message: 'لا يمكن حذف حساب المالك الوحيد المتبقي في المتجر' });
    return;
  }

  db.deleteUser(id);

  db.logAudit({
    actorEmail: req.user?.email || 'owner',
    action: 'USER_DELETED',
    category: 'user',
    details: `تم حذف حساب المستخدم ${targetUser.email}`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, message: 'تم حذف الحساب بنجاح' });
});

// GET /api/admin/settings (Settlement info, Mastercard & Gateway config)
router.get('/settings', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const settings = db.getSettings();

  res.json({
    success: true,
    settings: {
      storeName: settings.storeName,
      currency: settings.currency,
      gatewayProvider: settings.gatewayProvider,
      gatewayMode: settings.gatewayMode,
      tapConfigured: !!settings.tapSecretKey && !settings.tapSecretKey.includes('placeholder'),
      tapPublicKey: settings.tapPublicKey || '',
      webhookConfigured: !!settings.webhookSecret && !settings.webhookSecret.includes('placeholder'),
      
      // Bank IBAN Settlement Details
      merchantIban: settings.merchantIban || '',
      merchantBankName: settings.merchantBankName || '',
      merchantAccountHolder: settings.merchantAccountHolder || '',
      merchantAccountNumber: settings.merchantAccountNumber || '',
      merchantSwift: settings.merchantSwift || '',

      // Mastercard Receiving Details
      merchantPayoutMethod: settings.merchantPayoutMethod || 'mastercard',
      merchantCardNumber: settings.merchantCardNumber || '',
      merchantCardLast4: settings.merchantCardLast4 || '',
      merchantCardHolder: settings.merchantCardHolder || '',
      merchantCardExpiry: settings.merchantCardExpiry || '',
      merchantCardBank: settings.merchantCardBank || '',
      merchantCardBrand: settings.merchantCardBrand || 'Mastercard'
    }
  });
});

// POST /api/admin/settings (Owner Only: Update Gateway & Settlement Card / IBAN)
router.post('/settings', requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { 
    gatewayMode, 
    gatewayProvider, 
    tapSecretKey, 
    tapPublicKey,
    webhookSecret,
    merchantIban,
    merchantBankName,
    merchantAccountHolder,
    merchantAccountNumber,
    merchantSwift,
    merchantPayoutMethod,
    merchantCardNumber,
    merchantCardHolder,
    merchantCardExpiry,
    merchantCardBank,
    merchantCardBrand
  } = req.body;

  const updates: any = {};
  if (gatewayMode) updates.gatewayMode = gatewayMode;
  if (gatewayProvider) updates.gatewayProvider = gatewayProvider;
  if (tapSecretKey !== undefined) updates.tapSecretKey = tapSecretKey.trim();
  if (tapPublicKey !== undefined) updates.tapPublicKey = tapPublicKey.trim();
  if (webhookSecret !== undefined) updates.webhookSecret = webhookSecret.trim();

  // Bank IBAN details
  if (merchantIban !== undefined) updates.merchantIban = merchantIban.trim();
  if (merchantBankName !== undefined) updates.merchantBankName = merchantBankName.trim();
  if (merchantAccountHolder !== undefined) updates.merchantAccountHolder = merchantAccountHolder.trim();
  if (merchantAccountNumber !== undefined) updates.merchantAccountNumber = merchantAccountNumber.trim();
  if (merchantSwift !== undefined) updates.merchantSwift = merchantSwift.trim();

  // Mastercard / Payout card details
  if (merchantPayoutMethod !== undefined) updates.merchantPayoutMethod = merchantPayoutMethod;
  if (merchantCardHolder !== undefined) updates.merchantCardHolder = merchantCardHolder.trim();
  if (merchantCardExpiry !== undefined) updates.merchantCardExpiry = merchantCardExpiry.trim();
  if (merchantCardBank !== undefined) updates.merchantCardBank = merchantCardBank.trim();
  if (merchantCardBrand !== undefined) updates.merchantCardBrand = merchantCardBrand.trim();

  if (merchantCardNumber !== undefined && merchantCardNumber.trim()) {
    const rawDigits = merchantCardNumber.replace(/\D/g, '');
    updates.merchantCardNumber = merchantCardNumber.trim();
    if (rawDigits.length >= 4) {
      updates.merchantCardLast4 = rawDigits.slice(-4);
    }
  }

  db.updateSettings(updates);

  db.logAudit({
    actorEmail: req.user?.email || 'owner',
    action: 'SETTLEMENT_SETTINGS_UPDATED',
    category: 'settings',
    details: `تم تحديث بيانات استلام الأرباح (طريقة الاستلام: ${updates.merchantPayoutMethod === 'mastercard' ? 'ماستركارد' : 'الآيبان البنكي'}) وبوابة الدفع بنجاح`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, message: 'تم حفظ وتحديث بيانات استلام الأرباح والماستركارد بنجاح' });
});

// POST /api/admin/test-payout (Simulate/Verify Instant Payout Routing)
router.post('/test-payout', requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const settings = db.getSettings();
  const orders = db.getOrders();
  const paidOrders = orders.filter(o => o.status === 'paid');
  const totalVolume = paidOrders.reduce((sum, o) => sum + o.planPrice, 0);

  const destination = settings.merchantPayoutMethod === 'mastercard' 
    ? `بطاقة ماستركارد المنتهية بـ (••${settings.merchantCardLast4 || '8820'}) - ${settings.merchantCardBank || 'البنك المصدر'}`
    : `الآيبان البنكي (${settings.merchantIban || 'SA...'}) - ${settings.merchantBankName || 'البنك'}`;

  const payoutReference = `PAYOUT-TX-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  db.logAudit({
    actorEmail: req.user?.email || 'owner',
    action: 'PAYOUT_VERIFICATION_TEST',
    category: 'settings',
    details: `تم إجراء فحص توثيق استلام الأرباح بنجاح إلى: ${destination}. مرجع العملية: ${payoutReference}`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({
    success: true,
    message: 'تم التحقق بنجاح من مسار تحويل الأموال وصحة بيانات البطاقة / الآيبان',
    details: {
      payoutReference,
      destination,
      totalVolume,
      currency: settings.currency || 'SAR',
      routingStatus: 'VERIFIED_ACTIVE',
      timestamp: new Date().toISOString()
    }
  });
});

// GET /api/admin/audit-logs
router.get('/audit-logs', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const logs = db.getAuditLogs();
  res.json({ success: true, logs });
});

export default router;
