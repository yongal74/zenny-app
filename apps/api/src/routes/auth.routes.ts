import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES = '30d';

// ─── POST /api/auth/register ─────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, lang = 'en' } = req.body as { email: string; password: string; lang?: string };

  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, password: hashed, provider: 'email', lang },
  });

  // 기본 캐릭터 생성 (Hana)
  await prisma.character.create({
    data: { userId: user.id, characterType: 'hana', level: 1, exp: 0 },
  });

  // 기본 일일 퀘스트 배정
  const questDefs = await prisma.questDefinition.findMany({ where: { type: 'daily' } });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  await prisma.userQuest.createMany({
    data: questDefs.map((q) => ({ userId: user.id, questId: q.id, date: today })),
  });

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

  return res.status(201).json({ token, userId: user.id, lang: user.lang });
});

// ─── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  if (user.provider !== 'email') {
    return res.status(400).json({ error: `Use ${user.provider} login` });
  }

  if (!user.password) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return res.json({ token, userId: user.id, lang: user.lang });
});

// ─── POST /api/auth/guest ─────────────────────────────────────
router.post('/guest', async (req: Request, res: Response) => {
  try {
    const rawLang = (req.body as { lang?: string })?.lang;
    const lang = rawLang === 'ko' ? 'ko' : 'en';

    const { randomUUID } = await import('crypto');
    const guestEmail = `guest_${randomUUID()}@guest.zenny.app`;

    const user = await prisma.user.create({
      data: { email: guestEmail, provider: 'guest', lang },
    });

    await prisma.character.create({
      data: { userId: user.id, characterType: 'hana', level: 1, exp: 0 },
    });

    const questDefs = await prisma.questDefinition.findMany({ where: { type: 'daily' } });
    if (questDefs.length > 0) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      await prisma.userQuest.createMany({
        data: questDefs.map((q) => ({ userId: user.id, questId: q.id, date: today })),
      });
    }

    const token = jwt.sign({ userId: user.id, email: guestEmail }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    return res.status(201).json({ token, userId: user.id, lang: user.lang });
  } catch (err: any) {
    console.error('Guest login error:', err);
    return res.status(500).json({ error: '게스트 계정 생성에 실패했습니다. 다시 시도해주세요.' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, zenCoins: true, streak: true, lang: true, createdAt: true },
    });
    return res.json(user);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export { router as authRouter };
