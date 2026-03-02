import { Router } from 'express';
import prisma from '../config/prisma';
import { createEmotionCheckin, getEmotionCheckins } from '../controllers/checkin.controller';
import { getCharacter, equipItem, feedCharacter } from '../controllers/character.controller';
import { getTodayQuests, completeQuest } from '../controllers/quest.controller';

const router = Router();

// User & Dashboard
router.get('/user', async (req, res) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        character: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        character: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
    });

    // Get recent check-ins
    const recentCheckins = await prisma.emotionCheckin.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 7,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        zenCoins: user.zenCoins,
        streak: user.streak,
        lang: user.lang,
      },
      character: user.character,
      quests: {
        daily: quests.filter(q => q.type === 'daily'),
        weekly: quests.filter(q => q.type === 'weekly'),
      },
      recentCheckins,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// Emotion check-ins
router.post('/emotion/checkin', createEmotionCheckin);
router.get('/emotion/checkins', getEmotionCheckins);

// Character
router.get('/character', getCharacter);
router.post('/character/equip', equipItem);
router.post('/character/feed', feedCharacter);

// Quests
router.get('/quests/today', getTodayQuests);
router.post('/quests/:questId/complete', completeQuest);

export { router as dashboardRouter };
