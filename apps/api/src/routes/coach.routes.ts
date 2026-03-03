import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateCoachResponse } from '../services/openai.service';
import type { Language, ChatMessage } from '../../../../packages/shared-types/src/index';

const router = Router();
const prisma = new PrismaClient();

router.post('/session/start', async (req: Request, res: Response) => {
  const { userId } = req as any;
  const { lang: reqLang, characterType: reqChar } = req.body as { lang?: string; characterType?: string };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const lang = (reqLang || user?.lang || 'en') as Language;
  const characterType = reqChar || 'hana';

  const { response, quickReplies } = await generateCoachResponse({
    userId,
    message: 'start session greeting',
    lang,
    characterType,
    history: [],
    turnCount: 0,
  });

  const session = await prisma.coachSession.create({
    data: { userId, lang, messages: [], turnCount: 0 },
  });

  res.json({
    sessionId: session.id,
    response,
    quickReplies,
    model: 'gpt-4o-mini',
  });
});

router.post('/chat', async (req: Request, res: Response) => {
  const { userId } = req as any;
  const { message, lang: reqLang, characterType, history: clientHistory, turnCount: clientTurnCount } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const lang = (reqLang || user?.lang || 'en') as Language;
  const charType = characterType || 'hana';

  const history = (clientHistory || []) as ChatMessage[];
  const turnCount = clientTurnCount || 0;

  try {
    const { response, quickReplies, model } = await generateCoachResponse({
      userId,
      message,
      lang,
      characterType: charType,
      history,
      turnCount,
    });

    return res.json({ response, quickReplies, model });
  } catch (err: any) {
    console.error('Coach chat error:', err);
    return res.status(500).json({
      error: 'AI response failed.',
      response: 'Sorry, something went wrong. Please try again 🌟',
    });
  }
});

router.get('/sessions', async (req: Request, res: Response) => {
  const { userId } = req as any;
  const sessions = await prisma.coachSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, createdAt: true, turnCount: true, summary: true, lang: true },
  });
  res.json(sessions);
});

export { router as coachRouter };
