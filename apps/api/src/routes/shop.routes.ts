import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ─── GET /api/shop/items — 아이템 목록 ───────────────────────
router.get('/items', async (req: Request, res: Response) => {
    const { userId } = req as any;
    const { type, category } = req.query as { type?: string; category?: string };

    const where: any = {};
    if (type) where.type = type;
    if (category) where.category = category;

    const [items, character] = await Promise.all([
        prisma.shopItem.findMany({ where, orderBy: [{ rarity: 'asc' }, { price: 'asc' }] }),
        prisma.character.findUnique({ where: { userId } }),
    ]);

    // 보유 여부 + 장착 여부 표시
    const ownedIds = character?.ownedItems ?? [];
    const equippedItems = (character?.equippedItems as Record<string, string>) ?? {};

    const itemsWithStatus = items.map((item) => ({
        ...item,
        owned: item.price === 0 || ownedIds.includes(item.id),
        equipped: Object.values(equippedItems).includes(item.id),
        canBuy: (character?.level ?? 1) >= item.levelRequired,
    }));

    return res.json(itemsWithStatus);
});

// ─── POST /api/shop/purchase — 아이템 구매 ───────────────────
router.post('/purchase', async (req: Request, res: Response) => {
    const { userId } = req as any;
    const { itemId } = req.body as { itemId: string };

    const [item, user, character] = await Promise.all([
        prisma.shopItem.findUnique({ where: { id: itemId } }),
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.character.findUnique({ where: { userId } }),
    ]);

    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (!user || !character) return res.status(404).json({ error: 'User/character not found' });
    if (character.ownedItems.includes(itemId)) return res.status(409).json({ error: 'Already owned' });
    if (user.zenCoins < item.price) return res.status(400).json({ error: 'Not enough Zen Coins', need: item.price, have: user.zenCoins });
    if (character.level < item.levelRequired) return res.status(400).json({ error: `Need level ${item.levelRequired}` });

    await Promise.all([
        prisma.user.update({ where: { id: userId }, data: { zenCoins: { decrement: item.price } } }),
        prisma.character.update({ where: { userId }, data: { ownedItems: { push: itemId } } }),
        prisma.purchase.create({ data: { userId, itemId, price: item.price } }),
    ]);

    return res.json({ success: true, item: { id: item.id, name: item.name, type: item.type }, remainingCoins: user.zenCoins - item.price });
});

export { router as shopRouter };
