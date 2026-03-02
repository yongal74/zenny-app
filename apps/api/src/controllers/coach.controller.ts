import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

/**
 * POST /api/coach/session/start
 * Start a new coach session
 */
export const startSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { lang = 'en' } = req.body;

    // Create new session
    const session = await prisma.coachSession.create({
      data: {
        userId,
        lang,
        messages: [],
        turnCount: 0,
      },
    });

    const greeting = lang === 'ko'
      ? '안녕하세요! 오늘 기분이 어떠신가요?'
      : "Hi! How are you feeling today?";

    const quickReplies = lang === 'ko'
      ? ['행복해요', '슬퍼요', '불안해요', '화나요', '평온해요', '스트레스 받아요']
      : ['Happy', 'Sad', 'Anxious', 'Angry', 'Calm', 'Stressed'];

    res.status(200).json({
      sessionId: session.id,
      greeting,
      quickReplies,
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
};

/**
 * POST /api/coach/chat
 * Send message to AI coach (placeholder - will integrate with OpenAI in Zone 3)
 */
export const chat = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { message, lang = 'en', sessionId } = req.body;

    if (!message) {
      throw new AppError('message is required', 400);
    }

    // For now, return a placeholder response
    // Zone 3 will implement actual OpenAI integration
    const response = lang === 'ko'
      ? '감사합니다. 명상이나 호흡 운동을 시도해보시는 건 어떨까요?'
      : "Thank you for sharing. Would you like to try a meditation or breathing exercise?";

    const quickReplies = lang === 'ko'
      ? ['명상하기', '호흡 운동', '더 이야기하기']
      : ['Start meditation', 'Breathing exercise', 'Talk more'];

    // Update session if provided
    if (sessionId) {
      await prisma.coachSession.update({
        where: { id: sessionId },
        data: {
          turnCount: { increment: 1 },
        },
      });
    }

    res.status(200).json({
      response,
      quickReplies,
      suggestedAction: 'meditation',
      coinsGained: 0,
      expGained: 0,
      sessionId: sessionId || 'temp-session',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Coach chat error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
};

/**
 * GET /api/coach/sessions
 * Get user's past coach sessions
 */
export const getSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 10;

    const sessions = await prisma.coachSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        summary: true,
      },
    });

    res.status(200).json({
      sessions: sessions.map((s) => ({
        id: s.id,
        timestamp: s.createdAt.toISOString(),
        summary: s.summary || 'Conversation session',
      })),
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};
