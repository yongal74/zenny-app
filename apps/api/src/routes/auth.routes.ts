import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';

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
  console.warn(`[Zenny:Auth] register OK — userId=${user.id}`);
  return res.status(201).json({ token, userId: user.id, lang: user.lang });
});

// ─── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  console.warn(`[Zenny:Auth] login attempt — email=${email}`);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  if (user.provider !== 'email') {
    return res.status(400).json({ error: `Use ${user.provider} login` });
  }

  if (!user.password) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  console.warn(`[Zenny:Auth] login OK — userId=${user.id}`);
  return res.json({ token, userId: user.id, lang: user.lang });
});

// ─── POST /api/auth/guest ─────────────────────────────────────
router.post('/guest', async (req: Request, res: Response) => {
  try {
    const rawLang = (req.body as { lang?: string })?.lang;
    const lang = rawLang === 'ko' ? 'ko' : 'en';
    console.warn(`[Zenny:Auth] guest login attempt — lang=${lang}`);

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
    console.warn(`[Zenny:Auth] guest OK — userId=${user.id} lang=${lang}`);
    return res.status(201).json({ token, userId: user.id, lang: user.lang });
  } catch (err: any) {
    console.error('[Zenny:Auth] guest error:', err);
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

// ─── Helper: find or create social user ──────────────────────
async function findOrCreateSocialUser(
  email: string,
  provider: string,
  displayName?: string,
) {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, provider, lang: 'en' },
    });
    await prisma.character.create({
      data: { userId: user.id, characterType: 'hana', level: 1, exp: 0 },
    });
    const questDefs = await prisma.questDefinition.findMany({ where: { type: 'daily' } });
    if (questDefs.length > 0) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      await prisma.userQuest.createMany({
        data: questDefs.map((q) => ({ userId: user!.id, questId: q.id, date: today })),
      });
    }
  }
  return user;
}

// ─── POST /api/auth/google ────────────────────────────────────
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body as { accessToken: string };
    if (!accessToken) return res.status(400).json({ error: 'accessToken required' });

    const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const email = data.email as string;
    if (!email) return res.status(400).json({ error: 'Cannot retrieve email from Google' });

    const user = await findOrCreateSocialUser(email, 'google', data.name);
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    return res.json({ token, userId: user.id, lang: user.lang });
  } catch (err: any) {
    console.error('Google auth error:', err);
    return res.status(500).json({ error: 'Google sign-in failed' });
  }
});

// ─── POST /api/auth/apple ─────────────────────────────────────
router.post('/apple', async (req: Request, res: Response) => {
  try {
    const { identityToken, email: appleEmail, fullName } = req.body as {
      identityToken: string; email?: string; fullName?: string;
    };
    if (!identityToken) return res.status(400).json({ error: 'identityToken required' });

    // Decode JWT payload without verification (Apple public key verification is complex)
    const payload = JSON.parse(Buffer.from(identityToken.split('.')[1], 'base64').toString());
    const email = appleEmail || payload.email;
    if (!email) return res.status(400).json({ error: 'Cannot retrieve email from Apple' });

    const user = await findOrCreateSocialUser(email, 'apple', fullName);
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    return res.json({ token, userId: user.id, lang: user.lang });
  } catch (err: any) {
    console.error('Apple auth error:', err);
    return res.status(500).json({ error: 'Apple sign-in failed' });
  }
});

// ─── POST /api/auth/facebook ──────────────────────────────────
router.post('/facebook', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body as { accessToken: string };
    if (!accessToken) return res.status(400).json({ error: 'accessToken required' });

    const { data } = await axios.get(
      `https://graph.facebook.com/me?fields=id,email,name&access_token=${accessToken}`,
    );
    const email = data.email as string;
    if (!email) return res.status(400).json({ error: 'Cannot retrieve email from Facebook' });

    const user = await findOrCreateSocialUser(email, 'facebook', data.name);
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    return res.json({ token, userId: user.id, lang: user.lang });
  } catch (err: any) {
    console.error('Facebook auth error:', err);
    return res.status(500).json({ error: 'Facebook sign-in failed' });
  }
});

// ─── POST /api/auth/twitter ───────────────────────────────────
router.post('/twitter', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body as { accessToken: string };
    if (!accessToken) return res.status(400).json({ error: 'accessToken required' });

    const { data } = await axios.get('https://api.twitter.com/2/users/me?user.fields=id,name,username', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // Twitter OAuth 2.0 doesn't always return email — use sub as identifier
    const twitterId = data?.data?.id as string;
    if (!twitterId) return res.status(400).json({ error: 'Cannot retrieve user from X' });

    const email = `twitter_${twitterId}@x.zenny.app`;
    const user = await findOrCreateSocialUser(email, 'twitter', data?.data?.name);
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    return res.json({ token, userId: user.id, lang: user.lang });
  } catch (err: any) {
    console.error('Twitter auth error:', err);
    return res.status(500).json({ error: 'X sign-in failed' });
  }
});

// ─── OAuth helpers ────────────────────────────────────────────
function makeJwt(user: { id: string; email: string }) {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function redirectToApp(res: Response, redirectBase: string, token: string, userId: string) {
  const url = `${redirectBase}?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(userId)}`;
  return res.redirect(url);
}

// ─── GET /api/auth/google/start ───────────────────────────────
router.get('/google/start', (req: Request, res: Response) => {
  const redirect = (req.query.redirect as string) || 'zenny://auth';
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: 'Google OAuth not configured' });

  const callbackUrl = `${process.env.API_PUBLIC_URL || 'http://172.30.1.29:5000/api'}/auth/google/callback?redirect=${encodeURIComponent(redirect)}`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
  });
  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// ─── GET /api/auth/google/callback ────────────────────────────
router.get('/google/callback', async (req: Request, res: Response) => {
  const { code, redirect = 'zenny://auth' } = req.query as { code: string; redirect: string };
  if (!code) return res.status(400).json({ error: 'No code' });

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const callbackUrl = `${process.env.API_PUBLIC_URL || 'http://172.30.1.29:5000/api'}/auth/google/callback?redirect=${encodeURIComponent(redirect)}`;

    const { data: tokenData } = await axios.post('https://oauth2.googleapis.com/token', {
      code, client_id: clientId, client_secret: clientSecret,
      redirect_uri: callbackUrl, grant_type: 'authorization_code',
    });
    const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const user = await findOrCreateSocialUser(profile.email, 'google', profile.name);
    const token = makeJwt(user);
    return redirectToApp(res, redirect, token, user.id);
  } catch (err) {
    console.error('Google callback error:', err);
    return res.redirect(`${redirect}?error=google_failed`);
  }
});

// ─── GET /api/auth/facebook/start ─────────────────────────────
router.get('/facebook/start', (req: Request, res: Response) => {
  const redirect = (req.query.redirect as string) || 'zenny://auth';
  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) return res.status(500).json({ error: 'Facebook OAuth not configured' });

  const callbackUrl = `${process.env.API_PUBLIC_URL || 'http://172.30.1.29:5000/api'}/auth/facebook/callback?redirect=${encodeURIComponent(redirect)}`;
  const params = new URLSearchParams({ client_id: appId, redirect_uri: callbackUrl, scope: 'email,public_profile' });
  return res.redirect(`https://www.facebook.com/v18.0/dialog/oauth?${params}`);
});

// ─── GET /api/auth/facebook/callback ──────────────────────────
router.get('/facebook/callback', async (req: Request, res: Response) => {
  const { code, redirect = 'zenny://auth' } = req.query as { code: string; redirect: string };
  if (!code) return res.status(400).json({ error: 'No code' });

  try {
    const appId = process.env.FACEBOOK_APP_ID!;
    const appSecret = process.env.FACEBOOK_APP_SECRET!;
    const callbackUrl = `${process.env.API_PUBLIC_URL || 'http://172.30.1.29:5000/api'}/auth/facebook/callback?redirect=${encodeURIComponent(redirect)}`;

    const { data: tokenData } = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: { client_id: appId, client_secret: appSecret, redirect_uri: callbackUrl, code },
    });
    const { data: profile } = await axios.get('https://graph.facebook.com/me', {
      params: { fields: 'id,email,name', access_token: tokenData.access_token },
    });
    if (!profile.email) return res.redirect(`${redirect}?error=no_email`);

    const user = await findOrCreateSocialUser(profile.email, 'facebook', profile.name);
    const token = makeJwt(user);
    return redirectToApp(res, redirect, token, user.id);
  } catch (err) {
    console.error('Facebook callback error:', err);
    return res.redirect(`${redirect}?error=facebook_failed`);
  }
});

// ─── GET /api/auth/twitter/start ──────────────────────────────
router.get('/twitter/start', (req: Request, res: Response) => {
  const redirect = (req.query.redirect as string) || 'zenny://auth';
  const clientId = process.env.TWITTER_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: 'X OAuth not configured' });

  const callbackUrl = `${process.env.API_PUBLIC_URL || 'http://172.30.1.29:5000/api'}/auth/twitter/callback?redirect=${encodeURIComponent(redirect)}`;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: 'tweet.read users.read',
    state: 'state',
    code_challenge: 'challenge',
    code_challenge_method: 'plain',
  });
  return res.redirect(`https://twitter.com/i/oauth2/authorize?${params}`);
});

// ─── GET /api/auth/twitter/callback ───────────────────────────
router.get('/twitter/callback', async (req: Request, res: Response) => {
  const { code, redirect = 'zenny://auth' } = req.query as { code: string; redirect: string };
  if (!code) return res.status(400).json({ error: 'No code' });

  try {
    const clientId = process.env.TWITTER_CLIENT_ID!;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET!;
    const callbackUrl = `${process.env.API_PUBLIC_URL || 'http://172.30.1.29:5000/api'}/auth/twitter/callback?redirect=${encodeURIComponent(redirect)}`;

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const { data: tokenData } = await axios.post('https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({ code, grant_type: 'authorization_code', redirect_uri: callbackUrl, code_verifier: 'challenge' }).toString(),
      { headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    const { data: profile } = await axios.get('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const twitterId = profile?.data?.id as string;
    if (!twitterId) return res.redirect(`${redirect}?error=no_user`);

    const email = `twitter_${twitterId}@x.zenny.app`;
    const user = await findOrCreateSocialUser(email, 'twitter', profile?.data?.name);
    const token = makeJwt(user);
    return redirectToApp(res, redirect, token, user.id);
  } catch (err) {
    console.error('Twitter callback error:', err);
    return res.redirect(`${redirect}?error=twitter_failed`);
  }
});

// ─── GET /api/auth/apple/start ────────────────────────────────
router.get('/apple/start', (_req: Request, res: Response) => {
  // Apple Sign In with Apple server-side는 별도 설정 필요
  return res.status(501).json({ error: 'Apple OAuth requires EAS build. Use guest login.' });
});

export { router as authRouter };
