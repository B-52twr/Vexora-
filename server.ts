import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import apiRoutes from './server/routes/api.ts';
import adminRoutes from './server/routes/admin.ts';
import webhookRoutes from './server/routes/webhooks.ts';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Basic security & parsing
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting for public API & Checkout
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'تجاوزت الحد المسموح من الطلبات. يرجى المحاولة بعد قليل.' },
  standardHeaders: true,
  legacyHeaders: false
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'تجاوزت محاولات تسجيل الدخول المسموحة. يرجى الانتظار 15 دقيقة.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Serve uploaded bank receipts securely
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// Mount Routes
app.use('/api/admin/login', adminLoginLimiter);
app.use('/api/checkout', checkoutLimiter);

app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function startServer() {
  if (!isProd) {
    // Development mode: Mount Vite dev server middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.use((_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'حدث خطأ غير متوقع في الخادم'
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 VAULT-X Production Server running on port ${PORT} [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
