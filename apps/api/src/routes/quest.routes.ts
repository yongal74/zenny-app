import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ─── GET /api/quests — 오늘의 퀘스트 목록 ────────────────────
router.get('/', async (req: Request, res: Response) => {
    const { userId } = req as any;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    // 오늘 퀘스트가 없으면 자동 생성
    let quests = await prisma.userQuest.findMany({
        where: { userId, date: { gte: today, lt: tomorrow } },
        include: { quest: true },
    });

    if (quests.length === 0) {
        const defs = await prisma.questDefinition.findMany({ where: { type: 'daily' } });
        await prisma.userQuest.createMany({
            data: defs.map((q) => ({ userId, questId: q.id, date: today })),
        });
        quests = await prisma.userQuest.findMany({
            where: { userId, date: { gte: today, lt: tomorrow } },
            include: { quest: true },
        });
    }

    return res.json(quests.map((q) => ({
        id: q.id,
        questId: q.questId,
        title: q.quest.title,
        titleKo: q.quest.titleKo,
        description: q.quest.description,
        coinsReward: q.quest.coinsReward,
        expReward: q.quest.expReward,
        progress: q.progress,
        target: q.quest.target,
        completedAt: q.completedAt,
    })));
});

// ─── POST /api/quests/:questId/complete — 퀘스트 완료 ────────
router.post('/:questId/complete', async (req: Request, res: Response) => {
    const { userId } = req as any;
    const { questId } = req.params;
    console.warn(`[Zenny:Quest] complete attempt — userId=${userId} questId=${questId}`);

    const userQuest = await prisma.userQuest.findFirst({
        where: { id: questId, userId, completedAt: null },
        include: { quest: true },
    });
    if (!userQuest) {
        console.warn(`[Zenny:Quest] 404 — quest not found or already completed questId=${questId}`);
        return res.status(404).json({ error: 'Quest not found or already completed' });
    }

    const { coinsReward, expReward } = userQuest.quest;

    // Mood bonus: hunger >= 70이면 +20% coins ("Happy Bonus")
    const char = await prisma.character.findUnique({ where: { userId } });
    const hoursSinceFed = char ? (Date.now() - char.lastFedAt.getTime()) / (1000 * 60 * 60) : 24;
    const currentHunger = char ? Math.max(0, char.hunger - Math.floor(hoursSinceFed / 12) * 30) : 0;
    const moodBonus = currentHunger >= 70;
    const finalCoins = moodBonus ? Math.round(coinsReward * 1.2) : coinsReward;

    const [, user, character] = await Promise.all([
        prisma.userQuest.update({ where: { id: questId }, data: { completedAt: new Date(), progress: userQuest.quest.target } }),
        prisma.user.update({ where: { id: userId }, data: { zenCoins: { increment: finalCoins } } }),
        prisma.character.update({ where: { userId }, data: { exp: { increment: expReward } } }),
    ]);

    // 레벨업 체크 (character.exp, user.zenCoins는 Prisma가 이미 증가된 값 반환)
    const EXP_THRESHOLDS: Record<number, number> = { 1: 0, 2: 100, 3: 250, 4: 500, 5: 800, 6: 1200, 7: 2000 };
    let newLevel = character.level;
    for (let lv = 7; lv >= 1; lv--) {
        if (character.exp >= EXP_THRESHOLDS[lv]) { newLevel = lv; break; }
    }
    let isLevelUp = false;
    if (newLevel > character.level) {
        await prisma.character.update({ where: { userId }, data: { level: newLevel } });
        isLevelUp = true;
    }

    console.warn(`[Zenny:Quest] complete OK — userId=${userId} questId=${questId} exp+${expReward} coins+${finalCoins} moodBonus=${moodBonus} isLevelUp=${isLevelUp} newLevel=${newLevel}`);
    return res.json({ coinsGained: finalCoins, expGained: expReward, totalCoins: user.zenCoins, moodBonus, isLevelUp, newLevel });
});

export { router as questRouter };
