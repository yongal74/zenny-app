import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.routes';
import { coachRouter } from './routes/coach.routes';
import { characterRouter } from './routes/character.routes';
import { shopRouter } from './routes/shop.routes';
import { meditationRouter } from './routes/meditation.routes';
import { questRouter } from './routes/quest.routes';
import { polarRouter } from './routes/polar.routes';
import { emotionRouter } from './routes/emotion.routes';
import audioRouter from './routes/audio.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

// 줄바꿈/공백 제거 (Railway Variables 붙여넣기 오류 방지)
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/\s+/g, '');
}

// OpenAI 진단 로그
const openaiRaw = process.env.OPENAI_API_KEY;
console.log('[OpenAI] OPENAI_API_KEY type:', typeof openaiRaw);
console.log('[OpenAI] OPENAI_API_KEY length:', openaiRaw?.length ?? 0);
console.log('[OpenAI] env keys with OPENAI:', Object.keys(process.env).filter(k => k.toUpperCase().includes('OPENAI')));
if (openaiRaw && openaiRaw.trim().length > 0) {
  process.env.OPENAI_API_KEY = openaiRaw.trim();
  console.log('[OpenAI] Key loaded OK, prefix:', process.env.OPENAI_API_KEY.slice(0, 7) + '...');
} else {
  console.warn('[OpenAI] WARNING: OPENAI_API_KEY is not set!');
}

const PORT = 5000;
const DIST_DIR = path.resolve(__dirname, '../../mobile/dist');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 200, standardHeaders: true }));

async function start() {
  // Replit Auth은 Replit 환경에서만 활성화
  if (process.env.REPL_ID) {
    const { setupAuth } = await import('./replit-auth/replitAuth');
    await setupAuth(app);
  }

  app.use('/api/auth', authRouter);
  app.use('/api/coach', authMiddleware, coachRouter);
  app.use('/api/character', authMiddleware, characterRouter);
  app.use('/api/shop', authMiddleware, shopRouter);
  app.use('/api/meditation', authMiddleware, meditationRouter);
  app.use('/api/quests', authMiddleware, questRouter);
  app.use('/api/polar', polarRouter);
  app.use('/api/emotion', authMiddleware, emotionRouter);
  app.use('/api/audio', audioRouter); // public — TTS scripts are not sensitive

  app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

  app.use(errorHandler);

  // 웹 빌드가 있을 때만 정적 파일 서빙 (Expo Go 테스트 시에는 불필요)
  if (fs.existsSync(DIST_DIR)) {
    app.use(express.static(DIST_DIR));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zenny running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
