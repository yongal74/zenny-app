import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

const COIN_REWARDS = {
  emotionCheckin: 15,
};

const EXP_REWARDS = {
  emotionCheckin: 30,
};

/**
 * POST /api/emotion/checkin
 * Creates an emotion check-in for the user
 */
export const createCheckin = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { emotion, text, intensity } = req.body;

    // Validate input
    if (!emotion || !intensity || intensity < 1 || intensity > 5) {
      throw new AppError('Invalid checkin data', 400);
    }

    // Check if user already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingCheckin = await prisma.emotionCheckin.findFirst({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingCheckin) {
      throw new AppError('Already checked in today', 400);
    }

    // Get user's current streak
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if checked in yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayCheckin = await prisma.emotionCheckin.findFirst({
      where: {
        userId,
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });

    const newStreak = yesterdayCheckin ? user.streak + 1 : 1;

    // Create checkin and update user/character in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create emotion checkin
      const checkin = await tx.emotionCheckin.create({
        data: {
          userId,
          emotion,
          text: text || null,
          intensity,
          expGained: EXP_REWARDS.emotionCheckin,
          coinsGained: COIN_REWARDS.emotionCheckin,
        },
      });

      // Update user coins and streak
      await tx.user.update({
        where: { id: userId },
        data: {
          zenCoins: { increment: COIN_REWARDS.emotionCheckin },
          streak: newStreak,
        },
      });

      // Update character EXP
      await tx.character.update({
        where: { userId },
        data: {
          exp: { increment: EXP_REWARDS.emotionCheckin },
        },
      });

      return { checkin, streak: newStreak };
    });

    res.status(200).json({
      checkinId: result.checkin.id,
      expGained: EXP_REWARDS.emotionCheckin,
      coinsGained: COIN_REWARDS.emotionCheckin,
      streak: result.streak,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Checkin error:', error);
    res.status(500).json({ error: 'Failed to create checkin' });
  }
};

/**
 * GET /api/emotion/history
 * Get user's emotion check-in history
 */
export const getCheckinHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const days = parseInt(req.query.days as string) || 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const checkins = await prisma.emotionCheckin.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        emotion: true,
        text: true,
        intensity: true,
      },
    });

    res.status(200).json({
      checkins: checkins.map((c) => ({
        date: c.createdAt.toISOString(),
        emotion: c.emotion,
        text: c.text,
        intensity: c.intensity,
      })),
    });
  } catch (error) {
    console.error('Get checkin history error:', error);
    res.status(500).json({ error: 'Failed to fetch checkin history' });
  }
};
