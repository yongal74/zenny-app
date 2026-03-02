import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

const COIN_REWARDS = {
  meditationComplete: 20,
};

const EXP_REWARDS = {
  meditationComplete: 50,
};

/**
 * GET /api/meditation/tracks
 * Get meditation tracks, optionally filtered by emotion/type
 */
export const getMeditationTracks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { emotion, type, lang } = req.query;

    const where: any = {};
    if (emotion) where.emotion = emotion as string;
    if (type) where.type = type as string;
    if (lang) where.lang = lang as string;

    const tracks = await prisma.meditationTrack.findMany({
      where,
      orderBy: { title: 'asc' },
    });

    res.status(200).json({
      tracks,
    });
  } catch (error) {
    console.error('Get meditation tracks error:', error);
    res.status(500).json({ error: 'Failed to fetch meditation tracks' });
  }
};

/**
 * GET /api/meditation/track/:id/play
 * Get meditation track play URL
 */
export const getTrackPlayUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const track = await prisma.meditationTrack.findUnique({
      where: { id },
    });

    if (!track) {
      throw new AppError('Track not found', 404);
    }

    res.status(200).json({
      audioUrl: track.audioUrl,
      musicUrl: track.musicUrl,
      coinsOnComplete: COIN_REWARDS.meditationComplete,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Get track play URL error:', error);
    res.status(500).json({ error: 'Failed to get track' });
  }
};

/**
 * POST /api/meditation/track/complete
 * Mark meditation track as completed
 */
export const completeTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { trackId } = req.body;

    if (!trackId) {
      throw new AppError('trackId is required', 400);
    }

    // Give rewards in transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          zenCoins: { increment: COIN_REWARDS.meditationComplete },
        },
      });

      await tx.character.update({
        where: { userId },
        data: {
          exp: { increment: EXP_REWARDS.meditationComplete },
        },
      });
    });

    res.status(200).json({
      coinsGained: COIN_REWARDS.meditationComplete,
      expGained: EXP_REWARDS.meditationComplete,
      questUpdated: false, // TODO: Check if meditation quest exists and update
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Complete track error:', error);
    res.status(500).json({ error: 'Failed to complete meditation' });
  }
};
