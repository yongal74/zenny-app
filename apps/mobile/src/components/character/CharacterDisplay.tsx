import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../../constants/theme';

interface CharacterDisplayProps {
  characterType: 'hana' | 'sora' | 'tora' | 'mizu' | 'kaze';
  level: number;
  bgTheme: string;
  equippedItems?: Record<string, string | null>;
  compact?: boolean;
}

const CHARACTER_DATA: Record<string, { emoji: string; body: string; color: string; glow: string }> = {
  hana: { emoji: '🌸', body: '🌸', color: '#7EECD4', glow: 'rgba(126,236,212,0.22)' }, // 에메랄드 민트 (틸 계열)
  sora: { emoji: '🌤️', body: '💫', color: '#A0C4E8', glow: 'rgba(160,196,232,0.15)' },
  tora: { emoji: '🦊', body: '🔥', color: '#E8C0A0', glow: 'rgba(232,192,160,0.15)' },
  mizu: { emoji: '💧', body: '🌊', color: '#A0D8E8', glow: 'rgba(160,216,232,0.15)' },
  kaze: { emoji: '🍃', body: '🌿', color: '#A0E8B0', glow: 'rgba(160,232,176,0.15)' },
};

const LEVEL_NAMES: Record<number, { en: string; ko: string }> = {
  1: { en: 'Seed', ko: '씨앗' },
  2: { en: 'Sprout', ko: '새싹' },
  3: { en: 'Blossom', ko: '꽃봉오리' },
  4: { en: 'Awakened', ko: '각성' },
  5: { en: 'Meditator', ko: '명상자' },
  6: { en: 'Practitioner', ko: '수련자' },
  7: { en: 'Sage', ko: '현자' },
};

// 악세사리 ID → 이모지 (seed.ts DB ID와 1:1 매핑)
const ACCESSORY_DISPLAY: Record<string, string> = {
  // Hat
  hat_flower_crown: '🌸', hat_moon_headband: '🌙', hat_star_crown: '⭐',
  hat_sage_hood: '🧙', hat_lotus_tiara: '🪷', hat_wizard: '🎩',
  hat_halo: '👼', hat_samurai: '⛩️', hat_diamond_crown: '💎', hat_zen_bamboo: '🎋',
  // Face
  face_crystal_glasses: '🔮', face_third_eye: '👁️', face_zen_blush: '🌸',
  face_starry_eyes: '✨', face_monocle: '🎭', face_meditation_mark: '🕉️',
  face_rainbow_blush: '🌈', face_moon_tears: '🌙', face_fire_eyes: '🔥', face_nature_mark: '🍃',
  // Body
  body_starlight_robe: '✨', body_sakura_kimono: '🌸', body_cloud_cape: '☁️',
  body_zen_robe: '🧘', body_warrior_armor: '⚔️', body_mage_cloak: '🪄',
  body_fox_vest: '🦊', body_aurora_cape: '🌌', body_nature_wrap: '🌿', body_ocean_mantle: '🌊',
  // Hand/Staff (body slot)
  hand_bamboo_staff: '🎋', hand_crystal_ball: '🔮', hand_prayer_beads: '📿',
  hand_lotus_scepter: '🪷', hand_moon_wand: '🌙', hand_zen_bowl: '🎵',
  hand_fire_torch: '🔥', hand_nature_branch: '🌿', hand_cosmic_staff: '⭐', hand_book_wisdom: '📖',
  // Aura (bg slot)
  bg_starlight_aura: '✨', bg_flame_aura: '🔥', bg_ice_aura: '🧊',
  bg_nature_aura: '🌿', bg_cosmic_aura: '🌌', bg_rainbow_aura: '🌈',
  bg_moon_aura: '🌙', bg_sun_aura: '☀️', bg_zen_aura: '🕉️', bg_shadow_aura: '🌑',
  // Pet
  pet_mini_dragon: '🐉', pet_firefly: '✨', pet_cloud_rabbit: '☁️',
  pet_lotus_fish: '🐟', pet_moon_cat: '🌙', pet_zen_turtle: '🐢',
  pet_star_bird: '🕊️', pet_spirit_wolf: '🐺',
  // Seasonal (bg slot)
  seasonal_cherry_blossom: '🌸', seasonal_snowflake: '❄️', seasonal_harvest_moon: '🌕',
  seasonal_new_year: '🎆', seasonal_spring_spirit: '🌱', seasonal_summer_wave: '🌊',
  seasonal_autumn_leaves: '🍁', seasonal_winter_sage: '🌨️',
  // 추가 모자 4종
  hat_mushroom_crown: '🍄', hat_butterfly_clip: '🦋', hat_galaxy_tiara: '🌌', hat_lotus_wreath: '🪷',
  // 추가 얼굴 4종
  face_cosmic_tears: '💫', face_golden_mark: '✨', face_frost_veil: '🧊', face_heart_blush: '💗',
  // 추가 바디 2종
  body_lightning_cloak: '⚡', body_crystal_robe: '💎',
  // 추가 펫 4종
  pet_spirit_koi: '🐠', pet_mini_phoenix: '🦜', pet_cloud_jelly: '🪼', pet_zen_owl: '🦉',
};

// 스킨 bgTheme → 캐릭터 배경 글로우 색상
const SKIN_GLOW: Record<string, string> = {
  starlight: 'rgba(200,200,255,0.12)', sakura: 'rgba(255,182,200,0.12)',
  ocean: 'rgba(64,164,223,0.12)', forest: 'rgba(80,180,100,0.12)',
  aurora: 'rgba(130,80,220,0.14)', desert: 'rgba(220,160,80,0.12)',
  arctic: 'rgba(140,210,240,0.12)', zenGarden: 'rgba(160,200,160,0.12)',
  neonCity: 'rgba(80,200,255,0.14)', deepSea: 'rgba(40,100,180,0.14)',
  moonlight: 'rgba(180,180,255,0.12)', sunfire: 'rgba(255,120,40,0.14)',
  bamboo: 'rgba(120,180,100,0.12)', crystal: 'rgba(180,220,255,0.16)',
  autumn: 'rgba(200,120,60,0.12)', midnight: 'rgba(40,40,100,0.18)',
  cloud: 'rgba(200,210,255,0.10)', rainbow: 'rgba(200,100,200,0.14)',
  gold: 'rgba(255,200,60,0.18)', cherry: 'rgba(255,100,120,0.12)',
};

export function CharacterDisplay({ characterType, level, bgTheme, equippedItems, compact }: CharacterDisplayProps) {
  const char = CHARACTER_DATA[characterType] ?? CHARACTER_DATA.hana;
  const levelName = LEVEL_NAMES[level] ?? LEVEL_NAMES[1];

  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 3000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.95, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const hatItem  = equippedItems?.hat  ? ACCESSORY_DISPLAY[equippedItems.hat]  : null;
  const faceItem = equippedItems?.face ? ACCESSORY_DISPLAY[equippedItems.face] : null;
  const bodyItem = equippedItems?.body ? ACCESSORY_DISPLAY[equippedItems.body] : null;
  const bgItem   = equippedItems?.bg   ? ACCESSORY_DISPLAY[equippedItems.bg]   : null;
  const petItem  = equippedItems?.pet  ? ACCESSORY_DISPLAY[equippedItems.pet]  : null;

  // 스킨 글로우 — bgTheme 기반 (장착 스킨 없으면 캐릭터 기본 글로우)
  const skinGlow = SKIN_GLOW[bgTheme] ?? char.glow;

  const SIZE = compact ? 80 : 140;
  const OUTER = compact ? SIZE + 50 : SIZE + 80;
  const MID = compact ? SIZE + 30 : SIZE + 50;

  return (
    <View style={[styles.wrapper, compact && { gap: 4 }]}>
      {/* 링 + 캐릭터를 OUTER 크기 컨테이너로 묶어 중앙 정렬 보장 */}
      <View style={{ width: OUTER, height: OUTER, justifyContent: 'center', alignItems: 'center' }}>
        {/* 글로우 링 (절대 위치, 컨테이너 기준 중앙) */}
        <Animated.View style={[styles.outerRing, { width: OUTER, height: OUTER, borderRadius: OUTER / 2, backgroundColor: skinGlow, opacity: glowAnim, transform: [{ scale: pulseAnim }] }]} />
        <Animated.View style={[styles.midRing, { width: MID, height: MID, borderRadius: MID / 2, borderColor: char.color }]} />

        {/* 캐릭터 본체 (float 애니메이션, zIndex로 링 위에) */}
        <Animated.View style={{ transform: [{ translateY: floatAnim }], alignItems: 'center', zIndex: 2 }}>
          {hatItem && (
            <Text style={[styles.accessoryHat, compact && { fontSize: 20 }]}>{hatItem}</Text>
          )}
          <View style={[styles.characterBody, { width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderColor: char.color, backgroundColor: char.color + '18' }]}>
            <Text style={[styles.characterEmoji, compact && { fontSize: 36 }]}>{char.emoji}</Text>
            {faceItem && (
              <Text style={[styles.faceItem, compact && { fontSize: 14 }]}>{faceItem}</Text>
            )}
          </View>
          {bodyItem && (
            <Text style={[styles.accessoryBody, compact && { fontSize: 16 }]}>{bodyItem}</Text>
          )}
        </Animated.View>

        {/* 배경 이펙트 */}
        {bgItem && (
          <View style={styles.bgEffectRow}>
            <Text style={styles.bgEffect}>{bgItem}</Text>
            <Text style={styles.bgEffect}>{bgItem}</Text>
            <Text style={styles.bgEffect}>{bgItem}</Text>
          </View>
        )}

        {/* 펫 아이템 */}
        {petItem && (
          <Animated.Text style={[styles.petItem, { transform: [{ translateY: Animated.multiply(floatAnim, -0.5) }] }]}>
            {petItem}
          </Animated.Text>
        )}
      </View>

      {!compact && (
        <Text style={styles.characterName}>
          {characterType.charAt(0).toUpperCase() + characterType.slice(1)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', minHeight: 260, justifyContent: 'center', alignItems: 'center', gap: 6 },
  outerRing: { position: 'absolute' },
  midRing: { position: 'absolute', borderWidth: 1.5, backgroundColor: 'transparent' },
  characterBody: {
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    zIndex: 2,
  },
  characterEmoji: { fontSize: 48 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 1, marginTop: 4 },
  characterName: { ...theme.typography.h3, color: theme.colors.text.primary, fontWeight: '500' },
  levelInline: { ...theme.typography.labelSm, color: theme.colors.accent },
  accessoryHat: { fontSize: 26, zIndex: 3, marginBottom: -10 },
  accessoryBody: { fontSize: 20, zIndex: 3, marginTop: -8 },
  faceItem: { fontSize: 18, position: 'absolute', bottom: 6, right: 6, zIndex: 4 },
  bgEffectRow: { position: 'absolute', flexDirection: 'row', gap: 40, top: 10, opacity: 0.4 },
  bgEffect: { fontSize: 18 },
  petItem: { position: 'absolute', bottom: 10, right: -20, fontSize: 28, zIndex: 3 },
});
