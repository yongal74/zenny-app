import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { recommendTrackType } from '../services/openai.service';

const router = Router();
const prisma = new PrismaClient();

// ─── GET /api/meditation/tracks — 트랙 목록 ─────────────────
router.get('/tracks', async (req: Request, res: Response) => {
  const { emotion, lang, type } = req.query as { emotion?: string; lang?: string; type?: string };
  const where: any = {};
  if (emotion) where.emotion = emotion;
  if (lang) where.lang = lang;
  if (type) where.type = type;

  const tracks = await prisma.meditationTrack.findMany({ where, orderBy: { weekCreated: 'desc' } });
  return res.json(tracks);
});

// ─── GET /api/meditation/recommend — 감정 기반 추천 ─────────
router.get('/recommend', async (req: Request, res: Response) => {
  const { userId } = req as any;
  const { emotion } = req.query as { emotion?: string };
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const lang = user?.lang ?? 'en';

  const { type, reason } = recommendTrackType(emotion ?? '');
  const tracks = await prisma.meditationTrack.findMany({
    where: { type, lang },
    take: 3,
    orderBy: { weekCreated: 'desc' },
  });

  return res.json({ tracks, reason, recommendedType: type });
});

// ─── POST /api/meditation/complete — 명상 세션 완료 리워드 ───
router.post('/complete', async (req: Request, res: Response) => {
  const { userId } = req as any;
  const { trackId, trackType } = req.body as { trackId: string; trackType: string };

  if (!trackId || !trackType) {
    return res.status(400).json({ error: 'trackId and trackType are required' });
  }

  // 오늘 같은 트랙 중복 완료 방지
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const existing = await prisma.meditationLog.findFirst({
    where: { userId, trackId, createdAt: { gte: today, lt: tomorrow } },
  });
  if (existing) {
    return res.status(409).json({ error: 'Already completed today', alreadyClaimed: true });
  }

  // 타입별 리워드
  const coinsGained = trackType === 'breathing' ? 30 : 50;
  const expGained   = trackType === 'breathing' ? 20 : 40;

  const EXP_THRESHOLDS: Record<number, number> = { 1: 0, 2: 100, 3: 250, 4: 500, 5: 800, 6: 1200, 7: 2000 };

  const [, user, character] = await Promise.all([
    prisma.meditationLog.create({ data: { userId, trackId, trackType, coinsGained, expGained } }),
    prisma.user.update({ where: { id: userId }, data: { zenCoins: { increment: coinsGained } } }),
    prisma.character.update({ where: { userId }, data: { exp: { increment: expGained } } }),
  ]);

  // 레벨업 체크
  let newLevel = character.level;
  for (let lv = 7; lv >= 1; lv--) {
    if (character.exp >= EXP_THRESHOLDS[lv]) { newLevel = lv; break; }
  }
  let isLevelUp = false;
  if (newLevel > character.level) {
    await prisma.character.update({ where: { userId }, data: { level: newLevel } });
    isLevelUp = true;
  }

  return res.status(201).json({
    coinsGained,
    expGained,
    totalCoins: user.zenCoins,
    isLevelUp,
    newLevel,
  });
});

export { router as meditationRouter };
