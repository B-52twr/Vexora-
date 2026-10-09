import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db.ts';
import { paymentService } from '../paymentService.ts';

const router = Router();

// Configure Multer for secure bank receipt uploads
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads/receipts');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Max 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('صيغة الملف غير مدعومة. يرجى رفع صورة (JPG, PNG, WEBP) أو ملف PDF'));
    }
  }
});

// GET /api/config
router.get('/config', (_req: Request, res: Response) => {
  const settings = db.getSettings();
  const hasLiveTap = !!settings.tapSecretKey && !settings.tapSecretKey.includes('placeholder') && settings.tapSecretKey.trim().length > 0;
  
  res.json({
    success: true,
    storeName: settings.storeName || process.env.VITE_STORE_NAME || 'اسم المتجر',
    currency: settings.currency || process.env.VITE_CURRENCY || 'KWD',
    gatewayProvider: settings.gatewayProvider || 'tap',
    gatewayMode: settings.gatewayMode || 'production',
    isTapLive: hasLiveTap,
    outOfStockPlans: db.getOutOfStockPlans(),
    // Available payment methods in real production
    enabledPaymentBrands: hasLiveTap ? ['apple_pay', 'mastercard', 'visa', 'mada', 'knet'] : ['all'],
    merchantSettlement: {
      hasIban: !!settings.merchantIban,
      iban: settings.merchantIban || 'SA44800004820000192837465',
      bankName: settings.merchantBankName || 'مصرف الراجحي (Al Rajhi Bank)',
      accountHolder: settings.merchantAccountHolder || 'مؤسسة فولت إكس للتجارة الرقمية',
      accountNumber: settings.merchantAccountNumber || '4820000192837465',
      swift: settings.merchantSwift || 'RJHISARI',
      payoutMethod: settings.merchantPayoutMethod || 'mastercard',
      cardBrand: settings.merchantCardBrand || 'Mastercard',
      cardLast4: settings.merchantCardLast4 || '8820',
      cardBank: settings.merchantCardBank || ''
    }
  });
});

// GET /api/products
router.get('/products', (_req: Request, res: Response) => {
  const products = db.getProducts();
  const inventory = db.getInventory();
  const outOfStockMap = db.getOutOfStockPlans();

  // Attach live stock count and out-of-stock status per plan
  const productsWithStock = products.map((prod) => {
    const isServiceOut = !!outOfStockMap[`${prod.id}_all`];
    return {
      ...prod,
      isOutOfStock: isServiceOut,
      plans: prod.plans.map((plan) => {
        const availableStock = inventory.filter(
          (i) => i.serviceId === prod.id && i.duration === plan.duration && !i.isUsed
        ).length;
        const isPlanOut = isServiceOut || !!outOfStockMap[`${prod.id}_${plan.duration}`];
        return {
          ...plan,
          availableStock,
          isOutOfStock: isPlanOut
        };
      })
    };
  });

  res.json({ success: true, products: productsWithStock, outOfStockPlans: outOfStockMap });
});

// POST /api/checkout/create-session
router.post('/checkout/create-session', async (req: Request, res: Response) => {
  try {
    const { serviceId, duration, customerName, customerEmail, customerPhone, paymentMethod, paymentBrand } = req.body;

    if (!serviceId || !duration || !customerName || !customerEmail || !customerPhone || !paymentMethod) {
      res.status(400).json({ success: false, message: 'يرجى تزويد كافة البيانات المطلوبة لإتمام الطلب' });
      return;
    }

    const outOfStockMap = db.getOutOfStockPlans();
    if (outOfStockMap[`${serviceId}_all`] || outOfStockMap[`${serviceId}_${duration}`]) {
      res.status(400).json({ success: false, message: 'عذراً، نفذت كمية هذه الباقة حالياً، يرجى اختيار مدة اشتراك أخرى' });
      return;
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    const session = await paymentService.createCheckoutSession(
      {
        serviceId,
        duration,
        customerName,
        customerEmail,
        customerPhone,
        paymentMethod,
        paymentBrand,
        clientIp: req.ip || req.socket.remoteAddress
      },
      baseUrl
    );

    res.json({
      success: true,
      orderId: session.orderId,
      checkoutUrl: session.checkoutUrl,
      amount: session.amount,
      currency: session.currency,
      isHostedGateway: session.isHostedGateway
    });
  } catch (err: any) {
    console.error('Checkout creation error:', err);
    res.status(400).json({ success: false, message: err.message || 'فشل في إنشاء جلسة الدفع' });
  }
});

// POST /api/checkout/bank-receipt
router.post('/checkout/bank-receipt', upload.single('receipt'), (req: Request, res: Response) => {
  try {
    const { orderId, transferRef } = req.body;

    if (!orderId || !transferRef) {
      res.status(400).json({ success: false, message: 'رقم الطلب والرقم المرجعي للحوالة مطلوبان' });
      return;
    }

    const order = db.getOrder(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'إرفاق صورة إيصال التحويل البنكي إلزامي' });
      return;
    }

    // Update order with receipt file
    const receiptPath = `/uploads/receipts/${req.file.filename}`;
    db.updateOrder(orderId, {
      status: 'pending_review',
      transferRef: transferRef.trim(),
      receiptFilePath: receiptPath,
      receiptOriginalName: req.file.originalname
    });

    db.logAudit({
      actorEmail: order.customerEmail,
      action: 'BANK_RECEIPT_UPLOADED',
      category: 'order',
      details: `تم رفع إيصال حوالة بنكية للطلب ${orderId} برقم مرجعي: ${transferRef}`,
      ipAddress: req.ip || 'customer'
    });

    res.json({
      success: true,
      message: 'تم استلام الإيصال بنجاح. طلبك قيد المراجعة اليدوية من قبل إدارة المتجر.',
      orderId
    });
  } catch (err: any) {
    console.error('Bank receipt upload error:', err);
    res.status(500).json({ success: false, message: err.message || 'حدث خطأ أثناء رفع الإيصال' });
  }
});

// GET /api/checkout/verify/:orderId
router.get('/checkout/verify/:orderId', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = paymentService.verifyOrderForCustomer(orderId);

  if (!order) {
    res.status(404).json({ success: false, message: 'الطلب غير موجود في النظام' });
    return;
  }

  // If order is paid, securely return delivery details
  if (order.status === 'paid') {
    res.json({
      success: true,
      status: 'paid',
      orderId: order.orderId,
      serviceTitle: order.serviceTitle,
      planLabel: order.planLabel,
      planPrice: order.planPrice,
      currency: order.currency,
      customerName: order.customerName,
      deliveredCode: order.deliveredCode,
      deliveredPin: order.deliveredPin,
      deliveredInstructions: order.deliveredInstructions,
      paidAt: order.paidAt
    });
    return;
  }

  // Otherwise, return current status without leaking any codes
  res.json({
    success: false,
    status: order.status,
    orderId: order.orderId,
    serviceTitle: order.serviceTitle,
    planLabel: order.planLabel,
    planPrice: order.planPrice,
    currency: order.currency,
    failedReason: order.failedReason,
    transferRef: order.transferRef
  });
});

// GET /api/orders/track/:orderId
router.get('/orders/track/:orderId', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = db.getOrder(orderId);

  if (!order) {
    res.status(404).json({ success: false, message: 'لم يتم العثور على أي طلب بهذا الرقم' });
    return;
  }

  res.json({
    success: true,
    order: {
      orderId: order.orderId,
      serviceTitle: order.serviceTitle,
      planLabel: order.planLabel,
      planPrice: order.planPrice,
      currency: order.currency,
      customerName: order.customerName,
      status: order.status,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      deliveredCode: order.status === 'paid' ? order.deliveredCode : undefined,
      deliveredPin: order.status === 'paid' ? order.deliveredPin : undefined,
      deliveredInstructions: order.status === 'paid' ? order.deliveredInstructions : undefined,
      failedReason: order.failedReason,
      transferRef: order.transferRef
    }
  });
});

// POST /api/gateway/simulate-3ds (For Sandbox Testing)
router.post('/gateway/simulate-3ds', async (req: Request, res: Response) => {
  try {
    const { orderId, otp, action } = req.body;

    const order = db.getOrder(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      return;
    }

    if (action === 'cancel') {
      await paymentService.handleWebhook({
        order_id: orderId,
        status: 'CANCELLED',
        response: { message: 'تم إلغاء عملية الدفع من قبل المستخدم' }
      });
      res.json({ success: true, status: 'cancelled' });
      return;
    }

    // OTP validation in sandbox: reject if less than 4 digits or explicitly '0000'
    if (!otp || otp.length < 4 || otp === '000000') {
      await paymentService.handleWebhook({
        order_id: orderId,
        status: 'DECLINED',
        response: { message: 'كود التحقق المصرفي (OTP) غير صحيح أو انتهت صلاحيته' }
      });
      res.status(400).json({ success: false, message: 'رمز التحقق المصرفي غير صالح' });
      return;
    }

    // Trigger webhook callback internally
    const webhookResult = await paymentService.handleWebhook({
      order_id: orderId,
      status: 'CAPTURED',
      transaction_id: `tap_sim_${Date.now()}`,
      response: { code: '000', message: 'Approved' }
    });

    res.json({ success: true, result: webhookResult });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'خطأ في معالجة العملية' });
  }
});

export default router;
