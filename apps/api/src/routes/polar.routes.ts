import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const POLAR_API = 'https://api.polar.sh/v1';
const POLAR_TOKEN = process.env.POLAR_ACCESS_TOKEN || '';

async function polarFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${POLAR_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${POLAR_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('[Polar] API error:', res.status, err);
    throw new Error(`Polar API error: ${res.status}`);
  }
  return res.json();
}

router.post('/checkout', async (req: Request, res: Response) => {
  const { userId } = req as any;
  const { productKey, coins } = req.body as { productKey: string; coins: number };

  if (!POLAR_TOKEN) {
    return res.status(503).json({ error: 'Payment not configured' });
  }

  try {
    const productsRes = await polarFetch('/products?limit=50');
    const products = productsRes.items || productsRes.result?.items || [];

    let product = products.find((p: any) =>
      p.name?.toLowerCase().includes(productKey.toLowerCase()) ||
      p.name?.includes(String(coins))
    );

    if (!product) {
      const createRes = await polarFetch('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: `${coins} Zen Coins`,
          description: `Purchase ${coins} Zen Coins for Zenny app`,
          prices: [{
            type: 'one_time',
            amount_type: 'fixed',
            price_amount: coins <= 100 ? 99 : coins <= 500 ? 399 : coins <= 1200 ? 799 : 1499,
            price_currency: 'usd',
          }],
        }),
      });
      product = createRes;
    }

    if (!product?.id) {
      return res.status(500).json({ error: 'Could not find or create product' });
    }

    const successUrl = `${req.protocol}://${req.get('host')}/api/polar/success?userId=${userId}&coins=${coins}&session_id={CHECKOUT_SESSION_ID}`;
    const checkout = await polarFetch('/checkouts/custom', {
      method: 'POST',
      body: JSON.stringify({
        product_id: product.id,
        success_url: successUrl,
        metadata: {
          userId,
          coins: String(coins),
          productKey,
        },
      }),
    });

    return res.json({ checkoutUrl: checkout.url });
  } catch (e: any) {
    console.error('[Polar] checkout error:', e.message);
    return res.status(500).json({ error: 'Payment service error', details: e.message });
  }
});

router.get('/success', async (req: Request, res: Response) => {
  const { userId, coins } = req.query as { userId: string; coins: string };

  if (!userId || !coins) {
    return res.redirect('/?payment=error');
  }

  try {
    const coinAmount = parseInt(coins, 10);
    if (isNaN(coinAmount) || coinAmount <= 0) {
      return res.redirect('/?payment=error');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { zenCoins: { increment: coinAmount } },
    });

    return res.redirect(`/?payment=success&coins=${coinAmount}`);
  } catch (e) {
    console.error('[Polar] success callback error:', e);
    return res.redirect('/?payment=error');
  }
});

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const event = req.body;
    if (event.type === 'checkout.completed' || event.type === 'order.created') {
      const metadata = event.data?.metadata || {};
      const userId = metadata.userId;
      const coins = parseInt(metadata.coins || '0', 10);

      if (userId && coins > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: { zenCoins: { increment: coins } },
        });
        console.log(`[Polar] Webhook: Added ${coins} coins to user ${userId}`);
      }
    }
    return res.json({ received: true });
  } catch (e) {
    console.error('[Polar] webhook error:', e);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.get('/products', async (_req: Request, res: Response) => {
  if (!POLAR_TOKEN) {
    return res.status(503).json({ error: 'Payment not configured' });
  }
  try {
    const data = await polarFetch('/products?limit=50');
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export { router as polarRouter };
