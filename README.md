# Zenny 🌸 — Your Zen Companion

> AI-powered meditation & mindfulness companion with pixel-art characters  
> Tamagotchi × Zen × 심리학/뇌과학/철학/종교 이론 기반 명상 앱 (EN/KO 바이링구얼)

## 🗂️ Project Structure

```
Zenny/
├── apps/
│   ├── mobile/          # React Native (Expo SDK 51)
│   │   ├── src/
│   │   │   ├── screens/       # AICoachScreen, HomeScreen, ShopScreen, ...
│   │   │   ├── components/    # CharacterDisplay, QuickReplyGrid, CustomizeModal
│   │   │   ├── stores/        # Zustand (characterStore, chatStore, shopStore)
│   │   │   ├── services/      # coach.service.ts, meditation.service.ts
│   │   │   ├── constants/     # colors.ts (Starlight 테마: #0F1528 + #B8B4FF + #EC4899)
│   │   │   └── types/         # 공통 TypeScript 타입
│   │   └── App.tsx
│   └── api/             # Node.js + Express + Prisma
│       ├── src/
│       │   ├── routes/        # auth, coach, character, shop, quest, emotion, meditation
│       │   ├── services/      # openai.service.ts, redis.service.ts
│       │   └── middleware/    # auth (JWT), error
│       └── prisma/
│           ├── schema.prisma  # 8 테이블 (User, Character, EmotionCheckin, MeditationTrack, ...)
│           └── seed.ts        # 명상 20개(EN10+KO10) + 스킨 20종 + 악세사리 80종 + 퀘스트
├── DevPlanning/
│   ├── A1_spec.md        # 서비스 스펙 (다중 캐릭터 5종 확정)
│   ├── A3_api_model.md   # API + DB 모델
│   └── DevArtifacts/
│       └── CLAUDE.md     # 개발 지시서 (전체 기술 스택 + 코딩 컨벤션)
├── DevArtifacts/
│   └── claude-directives/  # Claude Code 지시서 4개
└── docker-compose.yml      # PostgreSQL + Redis
```

## 🚀 Quick Start

```bash
# 1. Docker (PostgreSQL + Redis)
docker-compose up -d

# 2. 백엔드 세팅
cd apps/api
cp .env.example .env    # API 키 입력 (OPENAI_API_KEY, DATABASE_URL, REDIS_URL, ...)
npm install
npx prisma migrate dev
npx prisma db seed      # 명상 트랙 20개 + 악세사리/스킨 100종 + 퀘스트 시드
npm run dev             # http://localhost:3000

# 3. 모바일 앱
cd apps/mobile
npm install
expo start
```

## 🎮 Features

| 기능 | 상태 | 설명 |
|------|------|------|
| **AI Coach CUI** | ✅ 완료 | GPT-4o-mini 기본, 버튼형 빠른응답(6개) + 자유타이핑, EN/KO |
| **캐릭터 5종** | ✅ 완료 | Hana🌸 Sora☁️ Tora🦊 Mizu💧 Kaze🍃, 각 Lv1-7 성장 |
| **Lv7 현자 성장** | ✅ 완료 | 씨앗 → 현자, 픽셀 고도화(Stardew Valley 스타일) |
| **Conversational UI** | ✅ 완료 | 라운드 박스형 메시지, 사용자 들여쓰기, 버튼 2열 그리드 |
| **Zen Coins 경제** | ✅ 완료 | 체크인 15 / 명상 20-50 / IAP 코인팩 |
| **악세사리 80종** | ✅ 완료 | 슬롯: Hat/Face/Body/Aura/Pet/Seasonal, PNG 레이어 합성 |
| **스킨 20종** | ✅ 완료 | 각 스킨 → 캐릭터 배경 테마 자동 연동 |
| **명상 트랙 20개** | ✅ 완료 | **초기 EN 10개 + KO 10개** (호흡/바디스캔/가이드/자연음) |
| **매주 2개 생성** | ✅ 완료 | ElevenLabs 음성 + Suno AI 음악 → S3 → CDN |
| **인터랙티브 푸시** | ✅ 완료 | 딥링크로 즉시 명상 시작 → 완료 시 코인 보상 |
| **Customize Modal** | ✅ 완료 | 6탭 + 3열 그리드 + 실시간 장착 미리보기 |

## 🧘 다학제 이론 기반 AI 코치

매 대화에 아래 이론들을 근거로 응답:

| 분야 | 이론 |
|------|------|
| 심리학 | CBT(인지행동치료), MBSR(마음챙김 기반 스트레스 감소) |
| 뇌과학 | DMN(디폴트 모드 네트워크), 세로토닌·도파민 분비 원리 |
| 철학 | Zen 불교, 스토이시즘, 에피쿠로스 |
| 종교 | 불교 위파사나, 기독교 관상기도, 힌두 트란센덴탈 명상 |
| 호흡 | 4-7-8 호흡, 박스 호흡, 코호흡(Pranayama) |

## 🎵 명상 콘텐츠 (초기 20개)

| 언어 | 유형 | 개수 |
|------|------|------|
| EN | 호흡 가이드 | 3 |
| EN | 바디스캔 | 3 |
| EN | 가이드 명상 | 2 |
| EN | 자연음+음악 | 2 |
| KO | 호흡 가이드 | 3 |
| KO | 바디스캔 | 3 |
| KO | 가이드 명상 | 2 |
| KO | 자연음+음악 | 2 |
| **합계** | | **20개** |

이후 매주 2개 자동 생성 (Suno AI + ElevenLabs 배치)

## 💰 Coin Economy

| 행동 | 획득 Coins |
|------|-----------|
| 감정 체크인 | 15 |
| 호흡 명상 완료 | 20 |
| 일반 명상 완료 | 50 |
| 퀘스트 완료 | 15-50 |
| 주간 스트릭 | 150 |

| 아이템 | 가격 |
|--------|------|
| 악세사리 (common) | 1,000-2,000 |
| 악세사리 (rare) | 3,000-5,000 |
| 악세사리 (legendary) | 5,000 |
| 스킨 (rare) | 5,000-7,000 |
| 스킨 (legendary) | 8,000-10,000 |
| 추가 캐릭터 해금 | 15,000 |

## 🧠 AI 비용 최적화

- **기본 모델**: GPT-4o-mini (~10배 저렴)
- **심층 분석**: GPT-4o (15턴 초과 시 자동 전환)
- **Redis 캐싱**: 유사 감정패턴 응답 5분 TTL 재활용
- **컨텍스트 압축**: 10턴 초과 시 세션 자동 요약 → 토큰 절약
- **음성/음악**: 1회 생성 → S3 저장 → CDN 재활용 (실시간 생성 X)
- **이론 기반**: CBT, MBSR, DMN 신경과학, 불교/스토아 철학, 프라나야마

## 📦 Tech Stack

**Frontend**: React Native · Expo SDK 51 · TypeScript · React Navigation · Zustand · React Query · i18next · Expo AV · Expo Notifications

**Backend**: Node.js · Express · TypeScript · Prisma · PostgreSQL · Redis · JWT

**AI**: OpenAI GPT-4o-mini/4o · ElevenLabs(음성) · Suno AI(음악) · AWS S3/CloudFront

**결제**: RevenueCat (Zen Coins IAP)

## 🎨 Design System

**Starlight Theme**: `#0F1528` (딥 스페이스 네이비) + `#B8B4FF` (라벤더 글로우) + `#EC4899` (핑크 액센트) + `#6366F1` (인디고)

Font: Fraunces (헤더) + DM Sans (본문)
