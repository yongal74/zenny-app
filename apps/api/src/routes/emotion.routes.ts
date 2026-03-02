import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const EXP_THRESHOLDS: Record<number, number> = {
    1: 0, 2: 100, 3: 250, 4: 500, 5: 800, 6: 1200, 7: 2000,
};

function calcLevel(exp: number): number {
    let level = 1;
    for (let lv = 7; lv >= 1; lv--) {
        if (exp >= EXP_THRESHOLDS[lv]) { level = lv; break; }
    }
    return level;
}

// ─── POST /api/emotion/checkin ────────────────────────────────
router.post('/checkin', async (req: Request, res: Response) => {
    const { userId } = req as any;
    const { emotion, text, intensity = 3 } = req.body as { emotion: string; text?: string; intensity?: number };

    if (!emotion) return res.status(400).json({ error: 'Emotion required' });

    const coinsGained = 15;
    const expGained = 30;

    // 체크인 저장 + 코인/EXP 지급
    const [checkin, user, character] = await Promise.all([
        prisma.emotionCheckin.create({ data: { userId, emotion, text, intensity, coinsGained, expGained } }),
        prisma.user.update({ where: { id: userId }, data: { zenCoins: { increment: coinsGained } } }),
        prisma.character.update({ where: { userId }, data: { exp: { increment: expGained } } }),
    ]);

    // 레벨업 체크
    const newLevel = calcLevel(character.exp + expGained);
    let isLevelUp = false;
    if (newLevel > character.level) {
        await prisma.character.update({ where: { userId }, data: { level: newLevel } });
        isLevelUp = true;
    }

    return res.status(201).json({
        checkinId: checkin.id, emotion,
        coinsGained, expGained,
        totalCoins: user.zenCoins + coinsGained,
        isLevelUp, newLevel,
    });
});

// ─── GET /api/emotion/history ─────────────────────────────────
router.get('/history', async (req: Request, res: Response) => {
    const { userId } = req as any;
    const checkins = await prisma.emotionCheckin.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
    });
    return res.json(checkins);
});

export { router as emotionRouter };
