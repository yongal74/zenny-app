# CLAUDE.md

## 프로젝트 목적
Zenny는 북미/한국 직장인을 위한 Tamagotchi × Zen 명상 습관 형성 앱입니다.

**앱의 핵심**: AI Conversational UI (버튼형 빠른응답 + 자유 텍스트) 기반의 감정 로그 → 맞춤형 명상 가이드.
- 심리학(CBT/MBSR), 뇌과학(DMN), 철학(Zen/스토이시즘), 종교(위파사나/관상기도), 호흡(박스/4-7-8/Pranayama) 이론 기반
- **다중 캐릭터 5종** (MVP 3종: Hana🌸/Sora☁️/Tora🦊), 각 Lv1~7 픽셀 고도화 성장
- **악세사리 80종 + 스킨 20종** PNG 레이어 합성 시스템 (조합 21,000+)
- **AI 명상 음성+음악** 매주 2개 자동 생성 (ElevenLabs + Suno AI → S3 → CDN)
- **EN/KO 바이링구얼** Conversational UI
- React Native (Expo) + Node.js 백엔드 모노레포

---

## 기술 스택

### Frontend
- **React Native** (Expo SDK 51+) - iOS/Android 동시 빌드
- **TypeScript** 5.x (strict mode)
- **React Navigation** 6.x - 탭/스택 네비게이션
- **Expo Notifications** - 인터랙티브 푸시 알림 (딥링크 지원)
- **Expo AV** - 명상 음성/음악 재생
- **Lottie** - 캐릭터 애니메이션
- **React Query** - 서버 상태 관리
- **Zustand** - 클라이언트 상태 관리
- **i18next** - EN/KO 다국어 지원

### Backend
- **Node.js** 20.x LTS + **Express** 4.x
- **TypeScript** 5.x (strict mode)
- **Prisma** 5.x - ORM
- **PostgreSQL** 15+
- **Redis** - 응답 캐싱 (AI 비용 절감)
- **JWT** - 인증 토큰
- **OpenAI API** — GPT-4o-mini 기본, 복잡 세션만 GPT-4o (비용 최적화)
- **AWS S3 + CloudFront** - 명상 음성/음악 CDN

### AI 비용 최적화 전략
- GPT-4o-mini 기본 (GPT-4o 대비 ~10배 저렴)
- 세션 10턴 초과 시 컨텍스트 요약 압축 → 토큰 절약
- Redis 캐시: 유사 감정패턴 AI 응답 재활용
- ElevenLabs 음성: 1회 생성 → S3 저장 재활용 (매 요청 생성 X)
- Suno AI 음악: 주 2회 배치 생성 → CDN 배포

### Infrastructure & Tools
- **Firebase Auth / Clerk** - 소셜 로그인 (Apple/Google/Email)
- **RevenueCat** - Zen Coins 인앱 결제
- **ESLint + Prettier** - 코드 포맷팅
- **Jest + React Native Testing Library** - 테스트
- **Docker** - 로컬 PostgreSQL + Redis 환경

---

## 폴더 구조

```
zenny/
├── apps/
│   ├── mobile/                 # React Native (Expo)
│   │   ├── src/
│   │   │   ├── components/     # 재사용 가능한 UI 컴포넌트
│   │   │   │   ├── common/     # Button, Input, Card 등
│   │   │   │   ├── character/  # ZenCharacter, LevelBadge 등
│   │   │   │   └── quest/      # QuestCard, ProgressBar 등
│   │   │   ├── screens/        # 화면 컴포넌트
│   │   │   │   ├── auth/       # LoginScreen, OnboardingScreen
│   │   │   │   ├── home/       # DashboardScreen
│   │   │   │   ├── checkin/    # EmotionCheckinScreen
│   │   │   │   ├── ai-coach/   # AIChatScreen
│   │   │   │   ├── quests/     # QuestListScreen
│   │   │   │   └── settings/   # SettingsScreen
│   │   │   ├── navigation/     # React Navigation 설정
│   │   │   ├── hooks/          # useAuth, useCharacter, useQuests 등
│   │   │   ├── services/       # API 클라이언트, OpenAI 통합
│   │   │   ├── stores/         # Zustand 스토어
│   │   │   ├── types/          # TypeScript 타입 정의
│   │   │   ├── utils/          # 헬퍼 함수
│   │   │   └── constants/      # 설정 상수
│   │   ├── assets/             # 이미지, 애니메이션 (Lottie JSON)
│   │   ├── app.json            # Expo 설정
│   │   ├── App.tsx             # 앱 진입점
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api/                    # Node.js + Express 백엔드
│       ├── src/
│       │   ├── controllers/    # 라우트 핸들러
│       │   │   ├── auth.controller.ts
│       │   │   ├── dashboard.controller.ts
│       │   │   ├── checkin.controller.ts
│       │   │   ├── quest.controller.ts
│       │   │   └── ai.controller.ts
│       │   ├── services/       # 비즈니스 로직
│       │   │   ├── auth.service.ts
│       │   │   ├── character.service.ts
│       │   │   ├── quest.service.ts
│       │   │   └── openai.service.ts
│       │   ├── middleware/     # JWT 인증, 에러 핸들러
│       │   ├── routes/         # Express 라우터
│       │   ├── types/          # TypeScript 타입
│       │   ├── utils/          # 헬퍼 함수
│       │   ├── config/         # 환경 변수, DB 설정
│       │   └── server.ts       # Express 앱 설정
│       ├── prisma/
│       │   ├── schema.prisma   # DB 스키마
│       │   ├── migrations/     # DB 마이그레이션
│       │   └── seed.ts         # 초기 데이터
│       ├── tests/              # API 테스트
│       ├── package.json
│       └── tsconfig.json
│
├── packages/                   # 공유 패키지 (optional)
│   └── shared-types/           # 프론트/백 공통 타입
│
├── docs/                       # 문서
│   ├── API.md                  # API 명세
│   ├── DATABASE.md             # DB 스키마 상세
│   └── DEVELOPMENT.md          # 개발 가이드
│
├── .github/                    # CI/CD 워크플로우
├── docker-compose.yml          # 로컬 PostgreSQL 환경
├── package.json                # 루트 package.json (모노레포 관리)
├── turbo.json                  # Turborepo 설정 (optional)
└── README.md
```

---

## 코딩 컨벤션

### TypeScript
- **Strict Mode 활성화**: `tsconfig.json`에서 `"strict": true` 필수
- **명시적 타입 지정**: 함수 매개변수와 반환 타입 항상 명시
- **Interface vs Type**: 확장 가능한 객체는 `interface`, 유니온/교차 타입은 `type` 사용
- **Enum 대신 Union Type**: `type Status = 'active' | 'completed'` 선호

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  profile: UserProfile | null;
}

function createUser(email: string): Promise<User> {
  // ...
}

// ❌ Bad
function createUser(email) {
  // ...
}
```

### 네이밍 규칙
- **파일명**: kebab-case (예: `emotion-checkin.screen.tsx`)
- **컴포넌트**: PascalCase (예: `EmotionCheckinScreen`)
- **함수/변수**: camelCase (예: `getUserProfile`)
- **상수**: UPPER_SNAKE_CASE (예: `MAX_QUEST_COUNT`)
- **Private 메서드**: 접두사 `_` 사용 (예: `_calculateExpGain`)

### React Native
- **Functional Components Only**: 클래스 컴포넌트 사용 금지
- **Hooks 규칙 준수**: `useEffect` 의존성 배열 누락 금지
- **컴포넌트 분리**: 200줄 초과 시 리팩토링 필수
- **Props 타입**: `interface` 사용 (예: `interface ButtonProps {}`)

```typescript
// ✅ Good
interface EmotionGridProps {
  onSelect: (emoji: string) => void;
  selectedEmoji?: string;
}

export const EmotionGrid: React.FC<EmotionGridProps> = ({ onSelect, selectedEmoji }) => {
  // ...
};

// ❌ Bad
export const EmotionGrid = (props) => {
  // ...
};
```

### Backend API
- **RESTful 설계**: HTTP 메서드 의미 준수 (GET/POST/PATCH/DELETE)
- **에러 핸들링**: 모든 라우트에서 try-catch 필수
- **HTTP 상태 코드**: 명확한 응답 코드 사용 (200, 201, 400, 401, 500)
- **응답 형식 일관성**: `{ success: boolean, data?: any, error?: string }` 구조

```typescript
// ✅ Good
router.post('/checkin', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const result = await checkinService.create(req.body);
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});
```

### ESLint 규칙
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "react/react-in-jsx-scope": "off",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### 주석 작성
- **한국어 주석**: 비즈니스 로직 설명
- **JSDoc**: Public API/함수에 필수
- **TODO/FIXME**: Issue 번호와 함께 작성

```typescript
/**
 * 사용자의 감정 체크인을 처리하고 캐릭터 EXP를 증가시킵니다.
 * @param userId - 사용자 ID
 * @param emoji - 선택한 이모지 (5x5 그리드 중 하나)
 * @param text - 선택적 텍스트 입력 (최대 500자)
 * @returns 업데이트된 캐릭터 상태와 획득한 EXP
 */
export async function processCheckin(
  userId: string,
  emoji: string,
  text?: string
): Promise<CheckinResult> {
  // 일일 체크인 중복 확인
  const todayCheckin = await prisma.checkin.findFirst({
    where: {
      userId,
      createdAt: {
        gte: startOfDay(new Date())
      }
    }
  });

  // TODO(ZEN-23): 연속 체크인 보너스 로직 추가
  if (todayCheckin) {
    throw new Error('Already checked in today');
  }

  // ...
}
```

---

## 주요 명령어

### 모노레포 루트
```bash
# 의존성 설치 (전체)
npm install

# 모든 앱 병렬 실행 (Turborepo 사용 시)
npm run dev

# 린트 검사 (전체)
npm run lint

# 테스트 실행 (전체)
npm run test
```

### Mobile App (`apps/mobile`)
```bash
# 개발 서버 시작 (Expo)
npm run dev
# 또는
npm run start

# iOS 시뮬레이터 실행
npm run ios

# Android 에뮬레이터 실행
npm run android

# TypeScript 타입 체크
npm run type-check

# 린트 검사
npm run lint

# 린트 자동 수정
npm run lint:fix

# 테스트 실행 (Jest)
npm run test

# 테스트 커버리지
npm run test:coverage

# 프로덕션 빌드
npm run build:ios    # iOS
npm run build:android # Android
```

### Backend API (`apps/api`)
```bash
# 개발 서버 시작 (Nodemon + ts-node)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm run start

# Prisma 마이그레이션 생성
npm run prisma:migrate

# Prisma Studio (DB GUI)
npm run prisma:studio

# DB 시드 데이터 삽입
npm run prisma:seed

# TypeScript 타입 체크
npm run type-check

# 린트 검사
npm run lint

# 테스트 실행 (Jest + Supertest)
npm run test

# E2E 테스트
npm run test:e2e
```

### Docker (로컬 DB)
```bash
# PostgreSQL 컨테이너 실행
docker-compose up -d

# 컨테이너 중지
docker-compose down

# 로그 확인
docker-compose logs -f postgres
```

---

## 개발 순서 가이드

### Phase 1: 프로젝트 초기 설정 (Day 1-2)
1. **모노레포 구조 생성**
   ```bash
   mkdir zenny && cd zenny
   npm init -y
   npm install -D turbo # optional
   ```

2. **React Native 앱 생성**
   ```bash
   mkdir -p apps/mobile
   cd apps/mobile
   npx create-expo-app@latest . --template blank-typescript
   ```

3. **백엔드 프로젝트 생성**
   ```bash
   mkdir -p apps/api
   cd apps/api
   npm init -y
   npm install express prisma @prisma/client jsonwebtoken bcrypt
   npm install -D typescript @types/node @types/express ts-node nodemon
   npx prisma init
   ```

4. **환경 변수 설정**
   - `apps/mobile/.env`: `API_URL`, `OPENAI_API_KEY`
   - `apps/api/.env`: `DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`

5. **Docker Compose 설정**
   ```yaml
   # docker-compose.yml
   version: '3.8'
   services:
     postgres:
       image: postgres:15-alpine
       environment:
         POSTGRES_DB: zenny
         POSTGRES_USER: admin
         POSTGRES_PASSWORD: password
       ports:
         - "5432:5