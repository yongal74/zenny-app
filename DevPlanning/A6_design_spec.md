# A6 — Zenny 디자인 스펙 (2026-03-05 재작성)

> 이전 파일 손상으로 완전 재작성.
> 기준: 실제 구현 코드(`theme.ts`, `CharacterDisplay.tsx`, `AICoachScreen.tsx`) + 사용자 원칙.

---

## 1. 디자인 철학

**Dark Aurora** — 단순 다크 테마가 아닌, 우주적 깊이감을 가진 그라데이션 + 선명한 글로우 조합.
- 배경은 어둡지만 캐릭터와 핵심 요소는 생동감 있는 색
- 보라색 글로우가 앱 전체의 시그니처 색조
- 웰니스(Calm 스타일) + RPG 성장(다마고치)의 감성 결합

---

## 2. 컬러 시스템

### 배경 계층 (현재 theme.ts 기준 — 유지)
```
bg:       #09090F  (최하단 — 거의 순수 블랙)
bg2:      #111118  (섹션 구분)
surface:  #19191F  (카드 기본)
surface2: #222230  (카드 강조, 모달)
```

### Dark Aurora 그라데이션 (신규 추가)
AI Coach 화면, 온보딩, 레벨업 연출에 사용:
```
aurora-1: linear(135deg, #1a0533 0%, #09090F 50%, #001233 100%)
aurora-2: linear(135deg, #0d1b2a 0%, #09090F 50%, #1a0533 100%)
hero-glow: radial(circle at 50% 40%, rgba(139,92,246,0.18) 0%, transparent 70%)
```

### 텍스트 계층 (유지)
```
primary:   #E0E0E8
secondary: #8888A0
tertiary:  #505068
accent:    #9B8EC4  (라벤더 퍼플)
```

### 시그니처 포인트 컬러
```
purple-glow:  #7C3AED  (핵심 액션, 레벨업, AI Coach 말풍선 border)
teal:         #2DD4BF  (성공, 완료, 명상)
gold:         #F59E0B  (zen coins, legendary 아이템)
danger:       #EF4444  (에러, 취소)
```

---

## 3. 타이포그래피

```
h1:      32px / bold   — 환영 메시지, 감정 체크인 질문
h2:      24px / bold   — 화면 제목
h3:      18px / semibold
body1:   16px / regular — 대화 메시지
body2:   14px / regular — 설명, 부제목
body3:   13px / regular — 카드 내용
caption: 12px / regular — 레이블, 뱃지 (최솟값)
```

> **금지**: 11px 이하. 모든 터치 요소 minHeight 44px.

---

## 4. Conversational UI 설계 (핵심)

AI Coach 화면(`AICoachScreen`)의 3-Zone 레이아웃:

```
┌─────────────────────────────┐
│  Zone 1: Character Zone     │  ← 캐릭터 + 이름 + 레벨
│  (Welcome: 65vh / Chat: 80px header)  │
├─────────────────────────────┤
│  Zone 2: Active Question    │  ← 현재 질문 + 답변 입력
│  (Pure Focus — 전체 집중)    │
├─────────────────────────────┤
│  Zone 3: History Zone       │  ← 기본 접힘, 스와이프로 펼침
│  (Card Pair Stack)          │
└─────────────────────────────┘
```

### Zone 1 — Character Zone

**Welcome 상태** (처음 진입 / 대화 시작 전):
- CharacterDisplay 크기: SIZE=140, OUTER=200 (compact=false)
- 캐릭터 아래 레벨 뱃지 + 이름 표시
- 배경: `hero-glow` 라디얼 그라데이션

**In-chat 상태** (대화 진행 중):
- 헤더 80px 고정으로 축소
- 캐릭터: compact=true (SIZE=80)
- 캐릭터 이름 + 레벨 텍스트 제거 (공간 절약)
- 탭 1개로 AI Coach 탭 + CharacterDisplay 인라인 배치

### Zone 2 — Active Question Zone (Pure Focus)

**원칙**: 다마코치의 질문이 전체 영역을 차지. 사용자가 답하기 전까지 다른 요소 최소화.

**질문 표시**:
```
font-size: 24px (h2)
font-weight: bold
color: #E0E0E8
text-align: center
padding: 24px 20px
background: transparent
```

**빠른 답변 카드** (QuickReply):
- 가로 스크롤 카드 리스트 (각 카드 minHeight 48px)
- 배경: `rgba(139,92,246,0.10)` / border: `rgba(139,92,246,0.25)`
- 선택 시: border-color → `#7C3AED`, background → `rgba(139,92,246,0.20)`
- 선택 후 → Zone 3으로 카드 쌍 추가

**자유 텍스트 입력**:
- 입력창 하단 고정
- 배경: `surface2` (#222230)
- placeholder: "Share how you feel..."
- 전송 버튼: 보라색 글로우 버튼

### Zone 3 — History Zone (Card Pair)

**기본 상태**: 접힘 (히스토리 미표시)
**스와이프 업**: 히스토리 카드 스택 펼침 (최대 높이 40vh)

**카드 쌍 구조**:
```
┌─────────────────────────────┐  ← 다마코치 카드
│ 🤖  "How are you feeling?"  │     배경: rgba(139,92,246,0.08)
│     border-left: 2px purple │     border-left: #7C3AED
└─────────────────────────────┘
    ┌─────────────────────────┐  ← 사용자 카드 (1단계 들여쓰기)
    │  "I feel stressed today"│     배경: rgba(255,255,255,0.05)
    │  border-left: 2px teal  │     border-left: #2DD4BF
    └─────────────────────────┘
```

---

## 5. 화면별 디자인 지침

### 5-1. HomeScreen

- 상단: CharacterDisplay (compact=true) + EXP 바 + zenCoins
- 중단: 오늘의 퀘스트 카드 리스트 (Card variant=elevated)
- 하단: 감정 체크인 CTA 버튼 (variant=teal, fullWidth)
- 배경: `aurora-2` 그라데이션 (전체 화면)
- EXP 바: `teal` (#2DD4BF) 기반 → 레벨업 시 gold 플래시

### 5-2. AICoachScreen

- 3-Zone 레이아웃 (Section 4 참고)
- 배경: `aurora-1` 그라데이션
- 상태 전환: Welcome → In-chat 시 캐릭터 축소 애니메이션 (duration 400ms)

### 5-3. QuestScreen

- 퀘스트 카드: Card variant=elevated, 완료 시 teal 체크마크 + scale 애니메이션
- 완료 카드: opacity 0.6, 취소선 X (완료감 주되 가시성 유지)
- 에러 상태: retry 버튼 포함 (Button variant=ghost)

### 5-4. MeditationScreen / PlayerScreen

- 명상 트랙 카드: 타입별 색상 (breathing=teal, guided=purple, nature=green, bodyscan=blue)
- 재생 화면: 전체화면 배경 블러 + 캐릭터 floating 애니메이션
- 완료 시: 코인+EXP 획득 모달 (gold 컬러 강조)

### 5-5. ShopScreen / CustomizeModal

- 탭: Skins / Hat / Face / Body / Aura / Pet
- 아이템 그리드: 3열 or 2열 (compact 모드)
- 레어리티 색상: common=secondary / rare=accent(purple) / legendary=gold
- 스킨 선택 시: 캐릭터 배경 글로우 즉시 변경 (skinGlow 미리보기)
- 장착 중: "ON" 뱃지 teal 색상

---

## 6. 캐릭터 시스템 현황 및 방향

### 현재 구현 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| 캐릭터 5종 (hana/sora/tora/mizu/kaze) | 완비 | 이모지 기반 |
| 레벨 7단계 + 이름 | 완비 | Seed→Sage |
| 스킨 20종 (DB) | 완비 | bgTheme 컬럼 |
| 스킨 글로우 시각 반영 | 완료 (세션B 2026-03-05) | CharacterDisplay skinGlow 맵 추가 |
| 악세사리 66종 (DB, 14개 placeholder 제외) | 완비 | |
| 악세사리 → 렌더링 연결 | 완료 (세션B 2026-03-05) | ACCESSORY_DISPLAY 전체 재매핑 |
| Face 슬롯 렌더링 | 완료 (세션B 2026-03-05) | faceItem 추가 |
| Hunger / Mood 로직 | 미구현 | DB 컬럼만 존재 |
| 캐릭터 아트 (픽셀아트/2D) | 미구현 | 현재 이모지 방식 유지 |

### 향후 방향 (우선순위 순)

1. **Hunger/Mood 로직** (세션 B) — 하루 2회 feeding 미션, mood가 quest/coin에 영향
2. **캐릭터 아트 업그레이드** — 현재 이모지 → 커스텀 SVG 또는 Lottie 애니메이션
   - 단기: 캐릭터당 이모지 조합을 정교화 (배경 레이어 추가)
   - 장기: PNG 스프라이트 + Lottie (EAS 빌드 후)

---

## 7. 수정 필요 항목 (우선순위 + 난이도)

### 즉시 가능 (세션 C 대상)

| 항목 | 난이도 | 예상 시간 | 파일 |
|------|--------|-----------|------|
| HomeScreen Dark Aurora 배경 그라데이션 적용 | 낮음 | 30분 | HomeScreen.tsx |
| EXP 바 teal 색상 + 레벨업 gold 플래시 | 낮음 | 30분 | HomeScreen.tsx |
| QuickReply 카드 보라 글로우 스타일 | 낮음 | 30분 | AICoachScreen.tsx |
| AI Coach 3-Zone 레이아웃 구조 개편 | 높음 | 3~4시간 | AICoachScreen.tsx |
| Character Zone 동적 축소 애니메이션 | 중간 | 1시간 | AICoachScreen.tsx |
| Card Pair History (스와이프) | 중간 | 2시간 | AICoachScreen.tsx |
| 명상 트랙 카드 타입별 색상 | 낮음 | 30분 | MeditationScreen.tsx |
| 퀘스트 완료 체크 애니메이션 강화 | 낮음 | 30분 | QuestScreen.tsx |

### 세션 B 대상 (로직)

| 항목 | 난이도 | 예상 시간 | 파일 |
|------|--------|-----------|------|
| Hunger/Mood 게임 로직 구현 | 높음 | 4~5시간 | character.routes.ts + HomeScreen |
| 14개 placeholder 악세사리 교체 | 낮음 | 1시간 | seed.ts (DB re-seed) |

---

## 8. 레퍼런스 앱 분석

| 앱 | 차용할 요소 | 차용하지 않을 요소 |
|----|------------|----------------|
| **Typeform** | Pure Focus 질문 (1번에 1개) | B2B UI 느낌 |
| **Woebot** | 구조화된 카드 선택지 | 단조로운 색상 |
| **Replika** | 캐릭터 프레즌스 + 대화 일체감 | 과도한 3D 렌더링 |
| **Calm** | 고급스러운 다크 배경, 타이포 | 캐릭터 없는 미니멀 |
| **Headspace** | 밝고 친근한 캐릭터 표현 | 라이트 테마 |
| **Finch** | 다마고치 성장 메카닉 | 과도한 귀여움 |
