import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ─── GET /api/character — 내 캐릭터 조회 (hunger decay + mood 계산) ──
router.get('/', async (req: Request, res: Response) => {
    const { userId } = req as any;
    const character = await prisma.character.findUnique({ where: { userId } });
    if (!character) return res.status(404).json({ error: 'Character not found' });

    // Hunger decay: 12시간마다 -30 (하루 2회 feeding 기준)
    const hoursSinceFed = (Date.now() - character.lastFedAt.getTime()) / (1000 * 60 * 60);
    const decaySteps = Math.floor(hoursSinceFed / 12);
    const currentHunger = Math.max(0, character.hunger - decaySteps * 30);

    // Mood: hunger 기반 자동 계산 (hunger >= 70 → Happy, >= 40 → Neutral, < 40 → Sad)
    const currentMood = currentHunger >= 70 ? 100 : currentHunger >= 40 ? 65 : 30;

    console.warn(`[Zenny:Character] get — userId=${userId} hunger=${currentHunger} mood=${currentMood} hoursSinceFed=${hoursSinceFed.toFixed(1)}`);

    return res.json({ ...character, hunger: currentHunger, mood: currentMood });
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
    const newMood = newHunger >= 70 ? 100 : newHunger >= 40 ? 65 : 30;

    await Promise.all([
        prisma.character.update({ where: { userId }, data: { hunger: newHunger, lastFedAt: new Date() } }),
        prisma.user.update({ where: { id: userId }, data: { zenCoins: { decrement: 5 } } }),
    ]);

    console.warn(`[Zenny:Character] feed OK — userId=${userId} hunger=${newHunger} mood=${newMood}`);
    return res.json({ hunger: newHunger, mood: newMood, coinsSpent: 5, remainingCoins: user.zenCoins - 5 });
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
