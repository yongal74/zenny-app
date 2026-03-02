# Zone 2: Backend API — Claude Code 지시서
# Zenny Node.js + Express + Prisma + PostgreSQL + Redis

## 실행 방법
```bash
cd /path/to/Zenny
claude --directive DevArtifacts/claude-directives/zone2-backend.md
```

---

## Task 1 — 프로젝트 초기화

```bash
cd apps/api
npm init -y
npm install express prisma @prisma/client jsonwebtoken bcryptjs cors helmet
npm install express-rate-limit ioredis dotenv
npm install -D typescript ts-node nodemon @types/node @types/express @types/jsonwebtoken
npx prisma init
```

`tsconfig.json`:
```json
{ "compilerOptions": { "strict": true, "target": "ES2020", "module": "commonjs",
  "outDir": "./dist", "rootDir": "./src", "esModuleInterop": true } }
```

---

## Task 2 — Prisma 스키마 (전체)

파일: `apps/api/prisma/schema.prisma`

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

model User {
  id         String   @id @default(uuid())
  email      String   @unique
  provider   String   // "email" | "apple" | "google"
  zenCoins   Int      @default(100)
  streak     Int      @default(0)
  lang       String   @default("en")
  createdAt  DateTime @default(now())
  character  Character?
  checkins   EmotionCheckin[]
  quests     Quest[]
  sessions   CoachSession[]
}

model Character {
  userId        String   @id
  characterType String   @default("hana")  // hana|sora|tora|mizu|kaze
  level         Int      @default(1)
  exp           Int      @default(0)
  hunger        Int      @default(100)
  mood          Int      @default(100)
  equippedSkin  String   @default("starlight")
  equippedItems Json     @default("{}")  // { hat, face, body, bg, pet }
  ownedItems    String[] @default([])
  bgTheme       String   @default("starlight")
  lastFedAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id])
}

model EmotionCheckin {
  id         String   @id @default(uuid())
  userId     String
  emotion    String
  text       String?
  intensity  Int      // 1-5
  expGained  Int
  coinsGained Int
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
  @@index([userId, createdAt])
}

model CoachSession {
  id        String   @id @default(uuid())
  userId    String
  messages  Json     @default("[]")  // ChatMessage[]
  summary   String?
  turnCount Int      @default(0)
  lang      String   @default("en")
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  @@index([userId, createdAt])
}

model Quest {
  id          String    @id @default(uuid())
  userId      String
  type        String    // "daily" | "weekly"
  title       String
  description String
  coinsReward Int
  expReward   Int
  completedAt DateTime?
  date        DateTime  @default(now())
  user        User      @relation(fields: [userId], references: [id])
  @@index([userId, type, date])
}

model ShopItem {
  id            String  @id
  name          String
  type          String  // "accessory" | "skin" | "character"
  slot          String  // "hat" | "face" | "body" | "skin" | "bg" | "pet"
  category      String
  price         Int
  rarity        String  // "common" | "rare" | "legendary"
  imageUrl      String
  bgTheme       String?
  levelRequired Int     @default(1)
  @@index([type, category])
}

model MeditationTrack {
  id          String  @id @default(uuid())
  title       String
  type        String  // "breathing" | "bodyscan" | "guided" | "nature"
  emotion     String?
  audioUrl    String
  musicUrl    String?
  duration    Int     @default(120)
  lang        String  @default("en")
  weekCreated String  // "2026-W09"
  @@index([emotion, lang])
}
```

---

## Task 3 — Express 서버

파일: `apps/api/src/server.ts`
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { coachRouter } from './routes/coach.routes';
import { shopRouter } from './routes/shop.routes';
import { meditationRouter } from './routes/meditation.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api', authMiddleware, dashboardRouter);
app.use('/api/coach', authMiddleware, coachRouter);
app.use('/api/shop', authMiddleware, shopRouter);
app.use('/api/meditation', authMiddleware, meditationRouter);
app.use(errorHandler);

export default app;
```

---

## Task 4 — 핵심 API 라우트 및 컨트롤러

### 4-1. 감정 체크인 (`/api/emotion/checkin` POST)
```typescript
// controllers/checkin.controller.ts
// 로직:
// 1. 오늘 이미 체크인했는지 검사
// 2. EmotionCheckin 생성 (emotion, text, intensity)
// 3. COIN_REWARDS.emotionCheckin(15) 지급
// 4. 캐릭터 EXP += 30
// 5. streak 업데이트
// 6. { checkinId, expGained: 30, coinsGained: 15, streak } 반환
```

### 4-2. 캐릭터 장착 (`/api/character/equip` POST)
```typescript
// body: { itemId, slot }
// 1. character.ownedItems에 itemId 포함 확인
// 2. character.equippedItems[slot] = itemId 업데이트
// 3. slot === 'skin'이면 ShopItem.bgTheme → character.bgTheme도 업데이트
// 4. { character: { equippedItems, bgTheme } } 반환
```

### 4-3. Zen Shop 구매 (`/api/shop/purchase` POST)
```typescript
// body: { itemId }
// 1. ShopItem 조회 (가격, levelRequired 확인)
// 2. user.zenCoins >= price 확인
// 3. character.level >= levelRequired 확인
// 4. user.zenCoins -= price
// 5. character.ownedItems.push(itemId)
// 6. { success: true, remainingCoins, item } 반환
```

### 4-4. 퀘스트 완료 (`/api/quests/:questId/complete` POST)
```typescript
// 1. Quest find (userId 확인, completedAt null 확인)
// 2. quest.completedAt = now()
// 3. user.zenCoins += quest.coinsReward
// 4. character.exp += quest.expReward
// 5. 레벨업 체크 (CHARACTER_EXP_THRESHOLDS 기준)
// 6. { coinsGained, expGained, isLevelUp, newLevel } 반환
```

---

## Task 5 — JWT 인증 미들웨어

파일: `apps/api/src/middleware/auth.middleware.ts`
```typescript
// Authorization: Bearer <token> 헤더 파싱
// jwt.verify(token, process.env.JWT_SECRET)
// req.userId = payload.userId
```

---

## Task 6 — Docker Compose

파일: `docker-compose.yml` (루트)
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: zenny
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru

volumes:
  postgres_data:
```

---

## Task 7 — 환경 변수

파일: `apps/api/.env.example`
```env
DATABASE_URL=postgresql://admin:password@localhost:5432/zenny
JWT_SECRET=your-super-secret-jwt-key-here
OPENAI_API_KEY=sk-...
REDIS_URL=redis://localhost:6379
AWS_S3_BUCKET=zenny-meditation-tracks
AWS_REGION=ap-northeast-2
ELEVENLABS_API_KEY=...
CLIENT_URL=http://localhost:8081
```

---

## 완료 기준
- [ ] `docker-compose up -d` 오류 없이 실행
- [ ] `npx prisma migrate dev` 성공
- [ ] `npm run dev` 3000번 포트 서버 실행
- [ ] POST `/api/emotion/checkin` 200 응답
- [ ] POST `/api/shop/purchase` 코인 차감 및 아이템 지급 동작
