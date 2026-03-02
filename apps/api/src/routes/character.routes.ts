import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ─── GET /api/character — 내 캐릭터 조회 ─────────────────────
router.get('/', async (req: Request, res: Response) => {
    const { userId } = req as any;
    const character = await prisma.character.findUnique({ where: { userId } });
    if (!character) return res.status(404).json({ error: 'Character not found' });
    return res.json(character);
});

// ─── POST /api/character/equip — 아이템 장착 ─────────────────
router.post('/equip', async (req: Request, res: Response) => {
    const { userId } = req as any;
    const { itemId, slot } = req.body as { itemId: string; slot: string };

    const character = await prisma.character.findUnique({ where: { userId } });
    if (!character) return res.status(404).json({ error: 'Character not found' });

    // 보유 아이템인지 확인
    if (itemId !== 'remove' && !character.ownedItems.includes(itemId)) {
        return res.status(403).json({ error: 'Item not owned' });
    }

    const equippedItems = (character.equippedItems as Record<string, string | null>) ?? {};
    const newEquipped = { ...equippedItems, [slot]: itemId === 'remove' ? null : itemId };

    // 스킨 장착 시 배경 테마 자동 변경
    let bgTheme = character.bgTheme;
    if (slot === 'skin' && itemId !== 'remove') {
        const skinItem = await prisma.shopItem.findUnique({ where: { id: itemId } });
        if (skinItem?.bgTheme) bgTheme = skinItem.bgTheme;
    }

    const updated = await prisma.character.update({
        where: { userId },
        data: { equippedItems: newEquipped, bgTheme, equippedSkin: slot === 'skin' ? itemId : character.equippedSkin },
    });

    return res.json({ character: updated });
});

// ─── POST /api/character/feed — 먹이주기 (hunger 회복) ───────
router.post('/feed', async (req: Request, res: Response) => {
    const { userId } = req as any;
    const character = await prisma.character.findUnique({ where: { userId } });
    if (!character) return res.status(404).json({ error: 'Character not found' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.zenCoins < 5) return res.status(400).json({ error: 'Not enough Zen Coins (need 5)' });

    const newHunger = Math.min(character.hunger + 30, 100);
    await Promise.all([
        prisma.character.update({ where: { userId }, data: { hunger: newHunger, lastFedAt: new Date() } }),
        prisma.user.update({ where: { id: userId }, data: { zenCoins: { decrement: 5 } } }),
    ]);

    return res.json({ hunger: newHunger, coinsSpent: 5, remainingCoins: user.zenCoins - 5 });
});

// ─── GET /api/character/owned — 보유 아이템 목록 ─────────────
router.get('/owned', async (req: Request, res: Response) => {
    const { userId } = req as any;
    const character = await prisma.character.findUnique({ where: { userId } });
    if (!character) return res.status(404).json({ error: 'Character not found' });

    const items = await prisma.shopItem.findMany({
        where: { id: { in: character.ownedItems } },
    });
    return res.json({ items, equippedItems: character.equippedItems });
});

export { router as characterRouter };
