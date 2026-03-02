# Zone 4: 캐릭터 + 아이템 시스템 — Claude Code 지시서
# 다중 캐릭터(5종), 악세사리 80종, 스킨 20종, 명상 트랙 20개

## 실행 방법
```bash
cd /path/to/Zenny
claude --directive DevArtifacts/claude-directives/zone4-character-system.md
```

---

## Task 1 — 캐릭터 정의 시스템

파일: `apps/api/src/data/characters.data.ts`

```typescript
import { CharacterType, Language } from '../types';

export interface CharacterDefinition {
  type: CharacterType;
  name: string;
  personalityEn: string;
  personalityKo: string;
  coachTone: string;
  emoji: string;
  // Lv1~7 외관 설명 (에셋 파일명 패턴)
  levelAssets: Record<number, { assetKey: string; nameEn: string; nameKo: string }>;
}

export const CHARACTER_DEFINITIONS: Record<CharacterType, CharacterDefinition> = {
  hana: {
    type: 'hana',
    name: 'Hana',
    emoji: '✿',
    personalityEn: 'Warm, empathetic, nurturing flower spirit',
    personalityKo: '따뜻하고 공감적인 꽃 정령',
    coachTone: 'warm',
    levelAssets: {
      1: { assetKey: 'hana_lv1_seed',        nameEn: 'Seed',         nameKo: '씨앗' },
      2: { assetKey: 'hana_lv2_sprout',       nameEn: 'Sprout',       nameKo: '새싹' },
      3: { assetKey: 'hana_lv3_blossom',      nameEn: 'Blossom',      nameKo: '꽃봉오리' },
      4: { assetKey: 'hana_lv4_awakened',     nameEn: 'Awakened',     nameKo: '각성' },
      5: { assetKey: 'hana_lv5_meditator',    nameEn: 'Meditator',    nameKo: '명상자' },
      6: { assetKey: 'hana_lv6_practitioner', nameEn: 'Practitioner', nameKo: '수련자' },
      7: { assetKey: 'hana_lv7_sage',         nameEn: 'Sage',         nameKo: '현자' },
    },
  },
  sora: {
    type: 'sora', name: 'Sora', emoji: '☁️',
    personalityEn: 'Calm, intellectual, analytical cloud spirit',
    personalityKo: '차분하고 지적인 구름 정령',
    coachTone: 'logical',
    levelAssets: {
      1: { assetKey: 'sora_lv1_seed',        nameEn: 'Mist',         nameKo: '안개' },
      2: { assetKey: 'sora_lv2_sprout',       nameEn: 'Cloud',        nameKo: '구름' },
      3: { assetKey: 'sora_lv3_blossom',      nameEn: 'Nimbus',       nameKo: '뭉게' },
      4: { assetKey: 'sora_lv4_awakened',     nameEn: 'Cirrus',       nameKo: '각성' },
      5: { assetKey: 'sora_lv5_meditator',    nameEn: 'Sky Mind',     nameKo: '하늘 마음' },
      6: { assetKey: 'sora_lv6_practitioner', nameEn: 'Storm Calm',   nameKo: '폭풍 고요' },
      7: { assetKey: 'sora_lv7_sage',         nameEn: 'Sky Sage',     nameKo: '하늘 현자' },
    },
  },
  tora: {
    type: 'tora', name: 'Tora', emoji: '🦊',
    personalityEn: 'Energetic, brave, encouraging fox spirit',
    personalityKo: '활발하고 용감한 여우 정령',
    coachTone: 'energetic',
    levelAssets: {
      1: { assetKey: 'tora_lv1_kit',          nameEn: 'Kit',          nameKo: '새끼 여우' },
      2: { assetKey: 'tora_lv2_cub',          nameEn: 'Cub',          nameKo: '아기 여우' },
      3: { assetKey: 'tora_lv3_pup',          nameEn: 'Pup',          nameKo: '여우 꽃봉오리' },
      4: { assetKey: 'tora_lv4_swift',        nameEn: 'Swift',        nameKo: '빠른 여우' },
      5: { assetKey: 'tora_lv5_brave',        nameEn: 'Brave',        nameKo: '용감한 여우' },
      6: { assetKey: 'tora_lv6_warrior',      nameEn: 'Warrior',      nameKo: '전사 여우' },
      7: { assetKey: 'tora_lv7_sage',         nameEn: 'Fox Sage',     nameKo: '현자 여우' },
    },
  },
  mizu: { type: 'mizu', name: 'Mizu', emoji: '💧',
    personalityEn: 'Flexible, empathetic water spirit', personalityKo: '유연하고 공감적인 물 정령',
    coachTone: 'gentle',
    levelAssets: { 1: { assetKey: 'mizu_lv1', nameEn: 'Drop', nameKo: '물방울' },
      2: { assetKey: 'mizu_lv2', nameEn: 'Stream', nameKo: '시내' },
      3: { assetKey: 'mizu_lv3', nameEn: 'Pool', nameKo: '연못' },
      4: { assetKey: 'mizu_lv4', nameEn: 'River', nameKo: '강' },
      5: { assetKey: 'mizu_lv5', nameEn: 'Ocean', nameKo: '바다' },
      6: { assetKey: 'mizu_lv6', nameEn: 'Tide', nameKo: '조류' },
      7: { assetKey: 'mizu_lv7', nameEn: 'Water Sage', nameKo: '물 현자' } },
  },
  kaze: { type: 'kaze', name: 'Kaze', emoji: '🍃',
    personalityEn: 'Free, intuitive wind spirit', personalityKo: '자유롭고 직관적인 바람 정령',
    coachTone: 'free',
    levelAssets: { 1: { assetKey: 'kaze_lv1', nameEn: 'Breeze', nameKo: '산들바람' },
      2: { assetKey: 'kaze_lv2', nameEn: 'Wind', nameKo: '바람' },
      3: { assetKey: 'kaze_lv3', nameEn: 'Gust', nameKo: '돌풍' },
      4: { assetKey: 'kaze_lv4', nameEn: 'Zephyr', nameKo: '서풍' },
      5: { assetKey: 'kaze_lv5', nameEn: 'Whirlwind', nameKo: '회오리' },
      6: { assetKey: 'kaze_lv6', nameEn: 'Tempest', nameKo: '폭풍' },
      7: { assetKey: 'kaze_lv7', nameEn: 'Wind Sage', nameKo: '바람 현자' } },
  },
};
```

---

## Task 2 — 악세사리 80종 + 스킨 20종 시드 데이터

파일: `apps/api/prisma/seed.ts`

### 스킨 20종 (price: 5,000~10,000 coins):
```typescript
const SKINS = [
  { id: 'skin_starlight', name: 'Starlight', price: 0, rarity: 'common', bgTheme: 'starlight' }, // 기본
  { id: 'skin_sakura',    name: '🌸 Sakura',   price: 5000, rarity: 'rare', bgTheme: 'sakura' },
  { id: 'skin_ocean',     name: '🌊 Ocean',    price: 5000, rarity: 'rare', bgTheme: 'ocean' },
  { id: 'skin_forest',    name: '🌿 Forest',   price: 5000, rarity: 'rare', bgTheme: 'forest' },
  { id: 'skin_aurora',    name: '🌌 Aurora',   price: 7000, rarity: 'rare', bgTheme: 'aurora' },
  { id: 'skin_desert',    name: '🏜️ Desert',   price: 5000, rarity: 'rare', bgTheme: 'desert' },
  { id: 'skin_arctic',    name: '🧊 Arctic',   price: 6000, rarity: 'rare', bgTheme: 'arctic' },
  { id: 'skin_zenGarden', name: '🪨 Zen Garden', price: 6000, rarity: 'rare', bgTheme: 'zenGarden' },
  { id: 'skin_neonCity',  name: '🌃 Neon City', price: 7000, rarity: 'rare', bgTheme: 'neonCity' },
  { id: 'skin_deepSea',   name: '🐟 Deep Sea', price: 7000, rarity: 'rare', bgTheme: 'deepSea' },
  { id: 'skin_moonlight', name: '🌙 Moonlight', price: 6000, rarity: 'rare', bgTheme: 'moonlight' },
  { id: 'skin_sunfire',   name: '🔥 Sunfire',  price: 7000, rarity: 'rare', bgTheme: 'sunfire' },
  { id: 'skin_bamboo',    name: '🎋 Bamboo',   price: 5000, rarity: 'rare', bgTheme: 'bamboo' },
  { id: 'skin_crystal',   name: '💎 Crystal',  price: 8000, rarity: 'legendary', bgTheme: 'crystal' },
  { id: 'skin_autumn',    name: '🍂 Autumn',   price: 5000, rarity: 'rare', bgTheme: 'autumn' },
  { id: 'skin_midnight',  name: '✨ Midnight', price: 8000, rarity: 'legendary', bgTheme: 'midnight' },
  { id: 'skin_cloud',     name: '☁️ Cloud',    price: 5000, rarity: 'rare', bgTheme: 'cloud' },
  { id: 'skin_rainbow',   name: '🌈 Rainbow',  price: 8000, rarity: 'legendary', bgTheme: 'rainbow' },
  { id: 'skin_gold',      name: '👑 Gold',     price: 10000, rarity: 'legendary', bgTheme: 'gold' }, // 프리미엄
  { id: 'skin_cherry',    name: '🍒 Cherry',   price: 6000, rarity: 'rare', bgTheme: 'cherry' },
];
```

### 악세사리 80종 카테고리 (각 category에 10~16개):
```typescript
// 모자/왕관 (16개): zen_flower_crown, moon_headband, star_crown, sage_hood ...
// 얼굴 (12개): crystal_glasses, third_eye_gem, rose_blush ...
// 오라/배경 (10개): starlight_aura, flame_aura, ice_aura ...
// 손/지팡이 (10개): bamboo_staff, crystal_ball, prayer_beads ...
// 의상/망토 (16개): starlight_robe, sakura_kimono, cloud_cape ...
// 펫 (8개): mini_dragon, firefly, cloud_rabbit, lotus_fish ...
// 한정판 (8개): seasonal특별 아이템

// 가격 범위:
// common (1000~2000): 기본 악세사리
// rare (3000~5000): 특별 악세사리
// legendary (5000~): 한정판

// 전체 80개 아이템 ID와 데이터를 ShopItem 테이블에 시드
```

시드 실행: `npx prisma db seed`

---

## Task 3 — 명상 트랙 초기 데이터 (론칭 20개)

파일: `apps/api/prisma/seed.ts` (트랙 시드 섹션)

### 📌 반드시 20개 준비 (EN 10개 + KO 10개)

```typescript
// EN 트랙 10개:
const EN_TRACKS = [
  { id: 'en-breath-box-01', title: '2-Min Box Breathing',
    type: 'breathing', emotion: 'stressed', lang: 'en', duration: 120,
    audioUrl: 'https://cdn.zenny.app/tracks/en/breath-box-01.mp3',
    musicUrl: 'https://cdn.zenny.app/tracks/music/calm-nature-01.mp3' },
  { id: 'en-breath-478-01', title: '4-7-8 Anxiety Relief',
    type: 'breathing', emotion: 'anxious', lang: 'en', duration: 120 },
  { id: 'en-body-scan-01', title: 'Full Body Scan',
    type: 'bodyscan', emotion: 'tired', lang: 'en', duration: 120 },
  { id: 'en-guided-love-01', title: 'Loving Kindness (Metta)',
    type: 'guided', emotion: 'lonely', lang: 'en', duration: 120 },
  { id: 'en-guided-zen-01', title: 'Zen Stillness',
    type: 'guided', emotion: 'stressed', lang: 'en', duration: 120 },
  { id: 'en-nature-rain-01', title: 'Rain Forest Calm',
    type: 'nature', emotion: 'tired', lang: 'en', duration: 120 },
  { id: 'en-nature-ocean-01', title: 'Ocean Waves',
    type: 'nature', emotion: 'anxious', lang: 'en', duration: 120 },
  { id: 'en-breath-pranayama-01', title: 'Pranayama Breath',
    type: 'breathing', emotion: 'confused', lang: 'en', duration: 120 },
  { id: 'en-guided-stoic-01', title: 'Stoic Morning Reflection',
    type: 'guided', emotion: 'sad', lang: 'en', duration: 120 },
  { id: 'en-guided-gratitude-01', title: 'Gratitude Visualization',
    type: 'guided', emotion: 'happy', lang: 'en', duration: 120 },
];

// KO 트랙 10개 (동일 유형, 한국어 음성):
const KO_TRACKS = [
  { id: 'ko-breath-box-01', title: '2분 박스 호흡',
    type: 'breathing', emotion: 'stressed', lang: 'ko', duration: 120 },
  { id: 'ko-breath-478-01', title: '4-7-8 불안 해소 호흡',
    type: 'breathing', emotion: 'anxious', lang: 'ko', duration: 120 },
  { id: 'ko-body-scan-01', title: '전신 바디스캔',
    type: 'bodyscan', emotion: 'tired', lang: 'ko', duration: 120 },
  { id: 'ko-guided-love-01', title: '자애 명상 (메타)',
    type: 'guided', emotion: 'lonely', lang: 'ko', duration: 120 },
  { id: 'ko-guided-zen-01', title: '선(禪) 고요 명상',
    type: 'guided', emotion: 'stressed', lang: 'ko', duration: 120 },
  { id: 'ko-nature-rain-01', title: '숲속 빗소리',
    type: 'nature', emotion: 'tired', lang: 'ko', duration: 120 },
  { id: 'ko-nature-ocean-01', title: '파도 소리 명상',
    type: 'nature', emotion: 'anxious', lang: 'ko', duration: 120 },
  { id: 'ko-breath-pranayama-01', title: '프라나야마 호흡법',
    type: 'breathing', emotion: 'confused', lang: 'ko', duration: 120 },
  { id: 'ko-guided-cbm-01', title: 'CBT 기반 아침 명상',
    type: 'guided', emotion: 'sad', lang: 'ko', duration: 120 },
  { id: 'ko-guided-gratitude-01', title: '감사 시각화 명상',
    type: 'guided', emotion: 'happy', lang: 'ko', duration: 120 },
];
// weekCreated: '2026-W09' (론칭 주차)
```

---

## Task 4 — 캐릭터 서비스

파일: `apps/api/src/services/character.service.ts`

```typescript
// calculateLevelUp(currentExp: number): { level: number; isLevelUp: boolean }
// → CHARACTER_EXP_THRESHOLDS로 레벨 계산

// applyHungerDecay(): 6시간마다 hunger -= 10
// 스케줄러로 6시간 주기 실행 (node-cron)

// getCharacterAssetKey(type: CharacterType, level: number): string
// → CHARACTER_DEFINITIONS[type].levelAssets[level].assetKey

// equipItemWithBgSync(userId, itemId, slot):
// → slot === 'skin'이면 ShopItem.bgTheme → character.bgTheme 동기화
```

---

## Task 5 — PNG 레이어 합성 유틸리티 (클라이언트)

파일: `apps/mobile/src/utils/characterRenderer.ts`

```typescript
// 캐릭터 레이어 합성 순서:
// 1. base: assets/characters/{type}_lv{level}.png
// 2. skin: assets/skins/{skinId}.png (투명 오버레이)
// 3. body: assets/accessories/body/{bodyId}.png
// 4. hat: assets/accessories/hat/{hatId}.png
// 5. face: assets/accessories/face/{faceId}.png
// 6. bg: assets/backgrounds/{bgTheme}.png (캐릭터 뒤 원형 배경)
// 7. pet: assets/accessories/pet/{petId}.png (우측 하단)

// React Native에서는 Image 컴포넌트 층 구조로 구현:
// <View>
//   <Image source={getBgAsset(bgTheme)} style={[styles.layer, styles.bg]} />
//   <Image source={getCharacterAsset(type, level)} style={styles.layer} />
//   <Image source={getSkinAsset(skinId)} style={styles.layer} />
//   {bodyId && <Image source={getAccessoryAsset('body', bodyId)} style={styles.layer} />}
//   {hatId && <Image source={getAccessoryAsset('hat', hatId)} style={styles.layer} />}
// </View>
```

---

## 완료 기준
- [ ] `npx prisma db seed` — 20개 스킨 + 80개 악세사리 + 20개 트랙 DB 삽입
- [ ] `GET /api/shop/items?type=skin` → 20개 스킨 반환
- [ ] `GET /api/meditation/tracks?emotion=anxious&lang=ko` → 한국어 불안 트랙 반환
- [ ] `POST /api/character/equip` → 스킨 장착 시 bgTheme 자동 업데이트
- [ ] `calculateLevelUp(2001)` → `{ level: 7, isLevelUp: true }` (현자 달성)
- [ ] 캐릭터 레이어 합성이 iOS 시뮬레이터에서 정상 렌더링
