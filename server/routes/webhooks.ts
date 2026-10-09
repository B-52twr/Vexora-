import { Router, type Request, type Response } from 'express';
import { paymentService } from '../paymentService.ts';

const router = Router();

// POST /api/webhooks/payment
router.post('/payment', async (req: Request, res: Response) => {
  try {
    const signature = (req.headers['x-tap-signature'] || req.headers['x-webhook-signature']) as string | undefined;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    const result = await paymentService.handleWebhook(req.body, signature, rawBody);
    res.json({ received: true, ...result });
  } catch (err: any) {
    console.error('Webhook error:', err);
    res.status(400).json({ received: false, error: err.message || 'فشل في معالجة الـ Webhook' });
  }
});

export default router;
