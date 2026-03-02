# Zenny — API·데이터 모델 (A3)

생성일: 2026-03-01

---

# Zenny 서비스 API 및 데이터 모델 설계 문서

**Node.js + Express 백엔드와 PostgreSQL/Firestore 중립적 설계**로 Zenny MVP 기능(감정 체크인, AI 코치, 캐릭터 육성, 퀘스트)을 커버합니다. 실무 배포 가능한 RESTful API와 스키마 제공.

## 1. 주요 API 엔드포인트 목록

### 사용자 인증 & 온보딩
| 메서드 | URL | 요청 필드 | 응답 필드 | 설명 |
|--------|-----|-----------|-----------|------|
| `POST` | `/api/auth/login` | `{ email: string, provider: 'email\|apple\|google' }` | `{ userId: string, token: string, refreshToken: string }` | 소셜/이메일 로그인, JWT 토큰 발급 |
| `POST` | `/api/auth/onboarding` | `{ userId: string, quizAnswers: { stressLevel: 1-5, meditationExp: boolean, goal: string }[] }` | `{ userId: string, profile: { persona: string, preferences: object } }` | 3문항 온보딩 퀴즈 저장, 페르소나 프로필 생성 |

### 홈 대시보드 & 캐릭터 상태
| 메서드 | URL | 요청 필드 | 응답 필드 | 설명 |
|--------|-----|-----------|-----------|------|
| `GET` | `/api/dashboard` | `{ userId: string (header) }` | `{ character: { level: number, exp: number, hunger: 0-100, mood: 0-100, items: [] }, quests: Quest[], coins: number, todayCheckin: boolean }` | 홈 대시보드 데이터: 캐릭터 상태 + 오늘 퀘스트 + 체크인 여부 |
| `POST` | `/api/character/feed` | `{ userId: string, action: 'feed\|play' }` | `{ character: { hunger: number, mood: number, exp: number }, message: string }` | Tamagotchi 인터랙션: 배고픔/기분 회복 + EXP 지급 |

### 감정 체크인
| 메서드 | URL | 요청 필드 | 응답 필드 | 설명 |
|--------|-----|-----------|-----------|------|
| `POST` | `/api/emotion/checkin` | `{ userId: string, emoji: string, text: string, intensity: 1-5 }` | `{ checkinId: string, expGained: number, coinsGained: number, streak: number }` | 매일 감정 기록, EXP/Zen Coins 보상, 스트릭 관리 |
| `GET` | `/api/emotion/history` | `{ userId: string, days?: number (기본 7) }` | `{ checkins: { date: string, emoji: string, text: string, intensity: number }[] }` | 감정 기록 히스토리 조회 (AI 코치용) |

### AI 명상 코치 — Conversational UI (앱 핵심)
| 메서드 | URL | 요청 필드 | 응답 필드 | 설명 |
|--------|-----|-----------|-----------|------|
| `POST` | `/api/coach/chat` | `{ userId: string, message: string, lang: 'en'\|'ko', quickReplyChoice?: string, sessionId?: string }` | `{ response: string, quickReplies?: string[], suggestedAction?: 'meditation'\|'breathing'\|'journal', coinsGained: number, expGained: number, sessionId: string }` | GPT-4o-mini 기본, 복잡 세션만 GPT-4o. 감정 선택지(quickReplies) 자동 생성. 심리학/뇌과학/철학/종교/호흡 이론 기반 응답 |
| `POST` | `/api/coach/session/start` | `{ userId: string, lang: 'en'\|'ko' }` | `{ sessionId: string, greeting: string, quickReplies: string[] }` | 새 대화 세션 시작. 감정 선택지 6개 반환 |
| `GET` | `/api/coach/sessions` | `{ userId: string, limit?: number }` | `{ sessions: { id: string, timestamp: string, summary: string }[] }` | 과거 코치 대화 세션 목록 |
| `POST` | `/api/coach/session/summarize` | `{ sessionId: string }` | `{ summary: string }` | 10턴 초과 시 컨텍스트 압축 (토큰 절약用) |

### AI 명상 음성 + 호흡 음악
| 메서드 | URL | 요청 필드 | 응답 필드 | 설명 |
|--------|-----|-----------|-----------|------|
| `GET` | `/api/meditation/tracks` | `{ userId: string, emotion?: string, type?: 'breathing'\|'bodyscan'\|'guided'\|'nature' }` | `{ tracks: { id, title, duration, audioUrl, type, emotion }[] }` | 감정 기반 추천 트랙. S3 CDN URL 반환 (실시간 생성 X) |
| `GET` | `/api/meditation/track/:id/play` | `{ userId: string }` | `{ audioUrl: string, coinsOnComplete: 20 }` | 트랙 재생 URL. 완료 시 코인 지급 |
| `POST` | `/api/meditation/track/complete` | `{ userId: string, trackId: string }` | `{ coinsGained: 20, expGained: 50, questUpdated: boolean }` | 명상 완료 처리 |

### Zen Shop — 악세사리 80종 + 스킨 20종
| 메서드 | URL | 요청 필드 | 응답 필드 | 설명 |
|--------|-----|-----------|-----------|------|
| `GET` | `/api/shop/items` | `{ userId: string, category?: string, type?: 'accessory'\|'skin' }` | `{ items: { id, name, type, category, price, rarity, imageUrl, owned, equipped, levelRequired }[], balance: number }` | 100종 아이템 목록 (악세사리 80 + 스킨 20). 소유/장착 여부 포함 |
| `POST` | `/api/shop/purchase` | `{ userId: string, itemId: string }` | `{ success: boolean, remainingCoins: number, item: { id, name, type } }` | Zen Coins로 구매. 가격: 일반 악세사리 1,000~2,000 / 레어 3,000~5,000 / 스킨 5,000~10,000 |
| `POST` | `/api/character/equip` | `{ userId: string, itemId: string, slot: 'hat'\|'face'\|'body'\|'skin'\|'bg'\|'pet' }` | `{ character: { equippedItems: object, skinId: string, bgTheme: string } }` | 아이템 장착. 스킨 선택 시 캐릭터 배경(bgTheme)도 자동 변경 |
| `GET` | `/api/character/wardrobe` | `{ userId: string }` | `{ owned: Item[], equipped: { hat, face, body, skin, bg, pet } }` | 보유 아이템 + 현재 장착 상태 |

### Zen 퀘스트
| 메서드 | URL | 요청 필드 | 응답 필드 | 설명 |
|--------|-----|-----------|-----------|------|
| `GET` | `/api/quests/today` | `{ userId: string }` | `{ daily: Quest[], weekly: Quest[] }` | 오늘/이번주 퀘스트 목록 (5분 명상, 체크인 등) |
| `POST` | `/api/quests/:questId/complete` | `{ userId: string, proof?: string (선택) }` | `{ questId: string, coins: number, exp: number, isLevelUp: boolean }` | 퀘스트 완료 처리, 보상 지급 + 레벨업 체크 |

### 설정 & 알림 (Post-MVP 포함)
| 메서드 | URL | 요청 필드 | 응답 필드 | 설명 |
|--------|-----|-----------|-----------|------|
| `GET` | `/api/settings` | `{ userId: string }` | `{ notifications: { enabled: boolean, types: [] }, language: string, interactions: { doubleTap: boolean } }` | 사용자 설정 조회 |
| `PATCH` | `/api/settings` | `{ userId: string, notifications?: object, language?: string }` | `{ updated: true }` | 알림 토글, 언어 변경 |

### Zen Shop (Post-MVP)
| 메서드 | URL | 요청 필드 | 응답 필드 | 설명 |
|--------|-----|-----------|-----------|------|
| `GET` | `/api/shop/items` | `{ userId: string, category?: string }` | `{ items: { id: string, name: string, price: number, category: string, owned: boolean }[], balance: number }` | 80개 아이템 목록 (모자/안경 등), 소유 여부 표시 |
| `POST` | `/api/shop/purchase` | `{ userId: string, itemId: string, useCoins: number }` | `{ success: boolean, remainingCoins: number, appliedItems: [] }` | Zen Coins로 아이템 구매/장착 |

## 2. DB 테이블(컬렉션) 구조

**PostgreSQL 테이블 + Firestore 문서 구조 병행 설계** (중립적)

### `users` 테이블/컬렉션
| 필드명 | 타입 | 설명 | 인덱스 후보 |
|--------|------|------|-------------|
| `id` | UUID / string | 사용자 ID (PK) | Primary Key |
| `email` | string | 로그인 이메일 | Unique Index |
| `profile` | JSONB / object | `{ persona: string, preferences: object, createdAt: timestamp }` | GIN Index (JSONB) |
| `settings` | JSONB / object | `{ notifications: object, language: 'en', interactions: object }` | GIN Index (JSONB) |
| `zenCoins` | integer | Zen Coins 잔고 (기본 100) | - |
| `streak` | integer | 감정 체크인 연속 일수 | - |
| `createdAt` | timestamp | 가입일 | Index |

### `characters` 테이블/컬렉션 (1:1 사용자 관계)
| 필드명 | 타입 | 설명 | 인덱스 후보 |
|--------|------|------|-------------|
| `userId` | UUID | 사용자 ID (FK) | Foreign Key / Index |
| `characterType` | string | 'hana'\|'sora'\|'tora'\|'mizu'\|'kaze' | Index |
| `level` | integer | 캐릭터 레벨 (1-7 MVP) | - |
| `exp` | integer | 현재 경험치 | - |
| `hunger` | integer | 배고픔 (0-100) | - |
| `mood` | integer | 기분 (0-100) | - |
| `equippedSkin` | string | 장착 스킨 ID (기본: 'default') | - |
| `equippedItems` | JSONB | 슬롯별 장착 `{ hat, face, body, bg, pet }` | GIN Index |
| `ownedItems` | JSONB | 보유 아이템 ID 배열 | GIN Index |
| `bgTheme` | string | 스킨 연동 배경 테마 | - |
| `lastFedAt` | timestamp | 마지막 먹이 시간 | Index |

### `shop_items` 테이블/컬렉션 (악세사리 80 + 스킨 20 = 100종)
| 필드명 | 타입 | 설명 | 인덱스 후보 |
|--------|------|------|-------------|
| `id` | UUID | 아이템 ID (PK) | Primary Key |
| `name` | string | 'Zen 모자' / 'Starlight Skin' 등 | - |
| `type` | string | 'accessory'\|'skin'\|'character' | Index |
| `slot` | string | 'hat'\|'face'\|'body'\|'skin'\|'bg'\|'pet' | Index |
| `category` | string | 악세사리 카테고리 (8개) | Index |
| `price` | integer | Zen Coins 가격 (1,000~15,000) | - |
| `rarity` | string | 'common'\|'rare'\|'legendary' | Index |
| `imageUrl` | string | S3 PNG 레이어 이미지 URL | - |
| `bgTheme` | string | 스킨일 때 배경 테마 ID | - |
| `levelRequired` | integer | 해금 필요 레벨 (기본 1) | - |

### `meditation_tracks` 테이블/컬렉션
| 필드명 | 타입 | 설명 | 인덱스 후보 |
|--------|------|------|-------------|
| `id` | UUID | 트랙 ID (PK) | Primary Key |
| `title` | string | '박스 호흡 2분' 등 | - |
| `type` | string | 'breathing'\|'bodyscan'\|'guided'\|'nature' | Index |
| `emotion` | string | 대상 감정 ('anxiety'\|'sadness'\|'stress'\|...) | Index |
| `audioUrl` | string | S3 CDN URL (ElevenLabs 음성) | - |
| `musicUrl` | string | S3 CDN URL (Suno AI 음악) | - |
| `duration` | integer | 초 단위 (기본 120초 = 2분) | - |
| `lang` | string | 'en'\|'ko' | Index |
| `weekCreated` | string | '2026-W09' 형식 (주간 배치用) | Index |

### `emotion_checkins` 테이블/컬렉션
| 필드명 | 타입 | 설명 | 인덱스 후보 |
|--------|------|------|-------------|
| `id` | UUID / string | 체크인 ID (PK) | Primary Key |
| `userId` | UUID / string | 사용자 ID | Index (Composite: userId+date) |
| `emoji` | string | 감정 이모지 | - |
| `text` | text | 텍스트 로그 | Full-text Search Index |
| `intensity` | integer | 강도 1-5 | - |
| `date` | date | 체크인 날짜 | Index |
| `expGained` | integer | 획득 EXP | - |

### `quests` 테이블/컬렉션
| 필드명 | 타입 | 설명 | 인덱스 후보 |
|--------|------|------|-------------|
| `id` | UUID / string | 퀘스트 ID (PK) | Primary Key |
| `userId` | UUID / string | 사용자 ID | Index |
| `type` | string | 'daily' \| 'weekly' | Index (Composite: userId+type+date) |
| `title` | string | '5분 명상' 등 | - |
| `description` | text | 퀘스트 설명 | - |
| `reward` | JSONB / object | `{ coins: number, exp: number }` | GIN Index |
| `completedAt` | timestamp | 완료 시간 (null 가능) | Index |
| `date` | date | 해당 날짜 | Index |

### `coach_sessions` 테이블/컬렉션
| 필드명 | 타입 | 설명 | 인덱스 후보 |
|--------|------|------|-------------|
| `id` | UUID / string | 세션 ID (PK) | Primary Key |
| `userId` | UUID / string | 사용자 ID | Index (Composite: userId+createdAt) |
| `messages` | JSONB / array | `[{ role: 'user\|assistant', content: string, timestamp }] ` | GIN Index |
| `summary` | text | AI 생성 요약 | Full-text Search |
| `createdAt` | timestamp | 대화 시작 시간 | Index |

### `shop_items` 테이블/컬렉션 (Post-MVP)
| 필드명 | 타입 | 설명 | 인덱스 후보 |
|--------|------|------|-------------|
| `id` | UUID / string | 아이템 ID (PK) | Primary Key |
| `name` | string | 'Zen Hat' 등 | - |
| `category` | string | 'hat\|glasses' 등 8개 | Index |
| `price` | integer | Zen Coins 가격 | - |
| `rarity` | string | 'common\|rare' | - |

## 구현 가이드 (Node.js + Express)
```javascript
// app.js 예시 구조
const express = require('express');
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use('/api/auth', authRoutes);
app.use('/api', authMiddleware, dashboardRoutes);
// Rate limiting, helmet 등 보안 미들웨어 적용
```

**PostgreSQL 쿼리 최적화**: `userId + date` 복합 인덱스로 감정 히스토리/퀘스트 조회 10ms 이내 목표.  
**Firestore 대안**: `userId`를 document ID로, subcollection으로 `checkins`, `quests` 구성.  

이 설계로 MVP 모든 화면 플로우와 푸시 알림 연동 가능. RevenueCat IAP은 `/api/shop/purchase`에서 트랜잭션 검증 추가.[1][2]