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

export { router as meditationRouter };
