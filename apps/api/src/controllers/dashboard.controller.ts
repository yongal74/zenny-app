import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

/**
 * GET /api/dashboard
 * Get dashboard data: character, quests, coins, streak, checkin status
 */
export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        zenCoins: true,
        streak: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get character data
    const character = await prisma.character.findUnique({
      where: { userId },
      select: {
        level: true,
        exp: true,
        hunger: true,
        mood: true,
        characterType: true,
        equippedSkin: true,
        bgTheme: true,
      },
    });

    if (!character) {
      throw new AppError('Character not found', 404);
    }

    // Get today's quests
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const quests = await prisma.quest.findMany({
      where: {
        userId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { type: 'asc' },
    });

    // Check if checked in today
    const todayCheckin = await prisma.emotionCheckin.findFirst({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    res.status(200).json({
      character,
      quests,
      coins: user.zenCoins,
      streak: user.streak,
      todayCheckin: !!todayCheckin,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};
