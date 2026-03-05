import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateCoachResponse } from '../services/openai.service';
import type { Language, ChatMessage } from '../../../../packages/shared-types/src/index';

const router = Router();
const prisma = new PrismaClient();

router.post('/session/start', async (req: Request, res: Response) => {
  const { userId } = req as any;
  const { lang: reqLang, characterType: reqChar } = req.body as { lang?: string; characterType?: string };

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const lang = (reqLang || user?.lang || 'en') as Language;
    const characterType = reqChar || 'hana';
    console.warn(`[Zenny:Coach] session/start — userId=${userId} lang=${lang} char=${characterType}`);

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

    res.json({ sessionId: session.id, response, quickReplies, model: 'gpt-4o-mini' });
  } catch (err: any) {
    console.error('[Zenny:Coach] session/start error:', err?.message ?? err);
    res.status(500).json({ error: 'Session start failed.' });
  }
});

router.post('/chat', async (req: Request, res: Response) => {
  const { userId } = req as any;
  const { message, lang: reqLang, characterType, history: clientHistory, turnCount: clientTurnCount } = req.body;
  console.warn(`[Zenny:Coach] chat — userId=${userId} turn=${clientTurnCount ?? 0} msg="${String(message).slice(0, 40)}"`);

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const lang = (reqLang || user?.lang || 'en') as Language;
    const charType = characterType || 'hana';
    const history = (clientHistory || []) as ChatMessage[];
    const turnCount = clientTurnCount || 0;

    const { response, quickReplies, model } = await generateCoachResponse({
      userId,
      message,
      lang,
      characterType: charType,
      history,
      turnCount,
    });

    console.warn(`[Zenny:Coach] chat OK — model=${model} userId=${userId}`);
    return res.json({ response, quickReplies, model });
  } catch (err: any) {
    // 200으로 내려줘야 클라이언트가 axios throw 없이 fallback 메시지를 표시할 수 있음
    console.error('[Zenny:Coach] chat error:', err?.message ?? err);
    console.error('[Zenny:Coach] status:', err?.status, 'code:', err?.code, 'type:', err?.type);
    return res.json({
      response: 'Sorry, something went wrong. Please try again 🌟',
      model: 'error',
      error: true,
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
