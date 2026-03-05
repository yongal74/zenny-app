# CLAUDE.md — Zenny Project Master Directives

> 이 파일은 모든 세션에서 최우선으로 적용됩니다.
> 상세 기술 스펙: `DevPlanning/DevArtifacts/CLAUDE.md`

---

## 1. 세션 프로토콜 (절대 준수)

| 세션 | 용도 | 허용 작업 |
|------|------|-----------|
| **세션 A** | 기획/디자인/스펙 | 문서 작성/수정만. 코드 파일 절대 수정 금지 |
| **세션 B** | 코어 루프 코드 | 게임 로직, API 라우트, 버그 수정 |
| **세션 C** | UI/UX 리팩터링 | 스타일, 컴포넌트, 애니메이션 |
| **세션 D** | 테스트/빌드 | 빌드, QA, 배포 준비 |

사용자가 세션을 선언하면 **해당 세션 범위 외의 파일은 스캔/수정 금지**.

---

## 2. 바이브 코딩 7대 원칙

### 원칙 1 — 컨텍스트 확인 (Map & Tasks)
- 작업 시작 전 `tasks.md` / `TODO.md` 또는 세션 로그 (`logs/YYYY-MM-DD-session.md`)를 읽고 현재 스프린트 목표 파악
- 요청하지 않은 기능 선제 개발 금지

### 원칙 2 — 선 설계, 후 코딩 (Plan Mode First)
- "Plan 모드" / "설계해줘" 요청 시 **코드 수정 절대 금지**
- 화면/모듈 구조 분석 → 우선순위 → 마크다운 문서로만 답변

### 원칙 3 — 최소 범위 수정 (Micro-Scope)
- 1회 턴에서 **1~2개 파일/컴포넌트**만 수정
- 요청하지 않은 파일의 비즈니스 로직 수정 금지
- 리팩터링, 개선, 추가 주석 — 명시적 요청 없으면 하지 않음

### 원칙 4 — UI/UX 퀄리티 자동 체크
UI 수정 요청 시 자동으로 점검:
- 터치 영역: 모든 터치 요소 `minHeight: 44px` (theme.minTouchTarget)
- 타이포: 본문 최소 13px, 캡션 최소 12px (11px 이하 금지)
- Empty State: 로딩 / 빈 상태 / 에러 상태 3종 모두 처리
- theme.ts 단일 진실 공급원 (하드코딩 색상/간격 금지)

### 원칙 5 — 테스트 및 검증 의무화
- 코드 변경 후 로컬 검증 명령어 사용자에게 안내 (`npm test`, `npm run dev`)
- 주요 비즈니스 로직 추가 시 단위 테스트 + 디버그 로그 함께 작성
- 디버그 로그 형식: `[Zenny:Module] event — key=value ...`

### 원칙 6 — 세션 로깅 & 롤백 플랜
세션 종료 또는 사용자 요청 시:
1. `logs/YYYY-MM-DD-session.md`에 변경 파일, 사유, 롤백 방법 기록
2. 의미 있는 Git 커밋 메시지 3개 제안

### 원칙 7 — 세션/컨텍스트 분리 인지
- 세션 선언 시 해당 범위 외 작업 완전 차단
- 다른 화면/기능으로 작업 목표가 바뀌면 `/clear` 권고

---

## 3. API 비용 및 토큰 최적화

| 상황 | 조치 |
|------|------|
| 10~15턴 이상 대화 또는 큰 기능 완료 | `/compact` 실행 권고 |
| 완전히 새로운 기능/화면으로 전환 | `/clear` 실행 권고 |
| 오타 수정/포맷팅/README 등 단순 작업 | `/model haiku` 권고 |
| 파일 스캔 | 전체 디렉토리 스캔 금지 — tasks.md에 정의된 파일만 타겟 읽기 |

---

## 4. 핵심 아키텍처 (현재 구현 기준)

```
apps/mobile/   — React Native (Expo SDK 54) + TypeScript
apps/api/      — Node.js + Express + Prisma + PostgreSQL (포트 5000)
```

- 백엔드 실제 구현: `routes/*.routes.ts` (controllers/ 는 미사용/outdated)
- 상태관리: Zustand (characterStore, authStore, chatStore)
- API 통신: React Query (@tanstack/react-query)
- 인증: Replit OIDC + JWT guest login
- AI: OpenAI GPT-4o-mini (coach.routes.ts)
- 결제: Polar.sh (polar.routes.ts)

---

## 5. EXP / 레벨 시스템 (프론트-백 통일값)

```
{ 1:0, 2:100, 3:250, 4:500, 5:800, 6:1200, 7:2000 }
```

순수 유틸: `apps/mobile/src/utils/exp.ts` — `getExpProgress`, `calcLevel`, `didLevelUp`
백엔드는 동일 로직을 인라인으로 구현 (meditation.routes.ts, quest.routes.ts, emotion.routes.ts)

---

## 6. 디자인 시스템 핵심 규칙

- 색상/간격/타이포: `apps/mobile/src/constants/theme.ts` 에서만 import
- `constants/colors.ts`: re-export only (직접 import 금지)
- 공통 컴포넌트: `Button.tsx` (variant: primary/secondary/ghost/teal/danger), `Card.tsx` (variant: default/elevated/bordered)
- 애니메이션: `hooks/useAnimation.ts` 6종 훅 (react-native-reanimated 사용 금지)
- 다크 테마 고정: bg `#09090F` → surface `#19191F`, 텍스트 primary `#E0E0E8`

---

## 7. Conversational UI 원칙 (AI Coach 핵심 기능)

1. **Pure Focus**: 다마코치 질문이 전체 화면을 큰 폰트로 점유 (Typeform 방식)
2. **Card Pair History**: 질문 → 카드형 축소, 내 답변 → 1단계 들여쓰기 + 다른 색상 카드
3. **Dynamic Character Scale**: 웰컴 화면 캐릭터 크게(65% 영역), 대화 중 작게(80px 헤더)
4. **Swipe-up History**: 히스토리 기본 접힘, 스와이프로 펼침
5. **Dark Aurora**: 단순 다크 아님 — 그라데이션 + 선명한 색 + 보라색 글로우 조합
6. **캐릭터 공간 보장**: 대화 중에도 캐릭터가 보이는 공간 확보 (커스터마이즈 동기 유지)

---

## 8. GitHub & 배포 규칙

- Source of Record: GitHub
- Claude는 직접 배포 시도 안 함 — CI/CD 스크립트 유지보수만
- Railway 배포 URL: `https://zenny-app-production.up.railway.app`
- 모바일 API URL: `EXPO_PUBLIC_API_URL` (로컬: `http://172.30.1.29:5000/api`, 배포: Railway URL)
