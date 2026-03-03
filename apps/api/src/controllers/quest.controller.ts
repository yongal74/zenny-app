import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

const CHARACTER_EXP_THRESHOLDS = [
  0,    // Level 1
  100,  // Level 2
  250,  // Level 3
  500,  // Level 4
  800,  // Level 5
  1200, // Level 6
  2000, // Level 7
];

function calculateLevel(exp: number): number {
  for (let i = CHARACTER_EXP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (exp >= CHARACTER_EXP_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * GET /api/quests/today
 * Get today's daily and weekly quests
 */
export const getTodayQuests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's quests
    const quests = await prisma.quest.findMany({
      where: {
        userId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
    });

    const daily = quests.filter((q) => q.type === 'daily');
    const weekly = quests.filter((q) => q.type === 'weekly');

    res.status(200).json({
      daily,
      weekly,
    });
  } catch (error) {
    console.error('Get quests error:', error);
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
};

/**
 * POST /api/quests/:questId/complete
 * Complete a quest and give rewards
 */
export const completeQuest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { questId } = req.params;

    if (!questId) {
      throw new AppError('questId is required', 400);
    }

    // Get quest
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) {
      throw new AppError('Quest not found', 404);
    }

    // Verify quest belongs to user
    if (quest.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    // Check if already completed
    if (quest.completedAt) {
      throw new AppError('Quest already completed', 400);
    }

    // Get current character level
    const character = await prisma.character.findUnique({
      where: { userId },
      select: { exp: true, level: true },
    });

    if (!character) {
      throw new AppError('Character not found', 404);
    }

    const newExp = character.exp + quest.expReward;
    const newLevel = calculateLevel(newExp);
    const isLevelUp = newLevel > character.level;

    // Complete quest and give rewards in transaction
    await prisma.$transaction(async (tx) => {
      // Mark quest as completed
      await tx.quest.update({
        where: { id: questId },
        data: {
          completedAt: new Date(),
        },
      });

      // Give coins
      await tx.user.update({
        where: { id: userId },
        data: {
          zenCoins: { increment: quest.coinsReward },
        },
      });

      // Give exp and update level if needed
      await tx.character.update({
        where: { userId },
        data: {
          exp: { increment: quest.expReward },
          ...(isLevelUp && { level: newLevel }),
        },
      });
    });

    res.status(200).json({
      questId,
      coinsGained: quest.coinsReward,
      expGained: quest.expReward,
      isLevelUp,
      ...(isLevelUp && { newLevel }),
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Complete quest error:', error);
    res.status(500).json({ error: 'Failed to complete quest' });
  }
};
