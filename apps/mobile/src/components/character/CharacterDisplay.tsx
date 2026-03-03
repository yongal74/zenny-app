import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../constants/colors';

interface CharacterDisplayProps {
  characterType: 'hana' | 'sora' | 'tora' | 'mizu' | 'kaze';
  level: number;
  bgTheme: string;
  equippedItems?: Record<string, string | null>;
  compact?: boolean;
}

const CHARACTER_DATA: Record<string, { emoji: string; body: string; color: string; glow: string }> = {
  hana: { emoji: '✿', body: '🌸', color: '#E8A0BF', glow: 'rgba(232,160,191,0.15)' },
  sora: { emoji: '☁', body: '💫', color: '#A0C4E8', glow: 'rgba(160,196,232,0.15)' },
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

const ACCESSORY_DISPLAY: Record<string, string> = {
  'hat-top': '🎩', 'hat-flower': '🌻', 'hat-crown': '👑',
  'face-shades': '😎', 'face-heart': '🥰',
  'body-scarf': '🧣', 'body-wings': '🦋',
  'bg-star': '✨', 'bg-rainbow': '🌈',
  'pet-cat': '🐱', 'pet-bunny': '🐰', 'pet-fox': '🦊',
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

  const hatItem = equippedItems?.hat ? ACCESSORY_DISPLAY[equippedItems.hat] : null;
  const petItem = equippedItems?.pet ? ACCESSORY_DISPLAY[equippedItems.pet] : null;
  const bgItem = equippedItems?.bg ? ACCESSORY_DISPLAY[equippedItems.bg] : null;
  const bodyItem = equippedItems?.body ? ACCESSORY_DISPLAY[equippedItems.body] : null;

  const SIZE = compact ? 80 : 110;
  const OUTER = compact ? SIZE + 50 : SIZE + 60;
  const MID = compact ? SIZE + 30 : SIZE + 36;

  return (
    <View style={[styles.wrapper, compact && { gap: 4 }]}>
      <Animated.View style={[styles.outerRing, { width: OUTER, height: OUTER, borderRadius: OUTER / 2, backgroundColor: char.glow, opacity: glowAnim, transform: [{ scale: pulseAnim }] }]} />
      <Animated.View style={[styles.midRing, { width: MID, height: MID, borderRadius: MID / 2, borderColor: char.color }]} />

      <Animated.View style={{ transform: [{ translateY: floatAnim }], alignItems: 'center' }}>
        {hatItem && (
          <Text style={[styles.accessoryHat, compact && { fontSize: 20, top: -8 }]}>{hatItem}</Text>
        )}

        <View style={[styles.characterBody, { width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderColor: char.color }]}>
          <Text style={[styles.characterEmoji, compact && { fontSize: 36 }]}>{char.emoji}</Text>
        </View>

        {bodyItem && (
          <Text style={[styles.accessoryBody, compact && { fontSize: 16 }]}>{bodyItem}</Text>
        )}
      </Animated.View>

      {bgItem && (
        <View style={styles.bgEffectRow}>
          <Text style={styles.bgEffect}>{bgItem}</Text>
          <Text style={styles.bgEffect}>{bgItem}</Text>
          <Text style={styles.bgEffect}>{bgItem}</Text>
        </View>
      )}

      {petItem && (
        <Animated.Text style={[styles.petItem, { transform: [{ translateY: Animated.multiply(floatAnim, -0.5) }] }]}>{petItem}</Animated.Text>
      )}

      {!compact && (
        <>
          <Text style={styles.characterName}>
            {characterType.charAt(0).toUpperCase() + characterType.slice(1)}
          </Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv.{level} {levelName.en}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', minHeight: 220, justifyContent: 'center', alignItems: 'center', gap: 6 },
  outerRing: { position: 'absolute' },
  midRing: { position: 'absolute', borderWidth: 1.5, backgroundColor: 'transparent' },
  characterBody: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    zIndex: 2,
  },
  characterEmoji: { fontSize: 48 },
  characterName: { fontSize: 18, fontFamily: 'Fraunces_500Medium', color: COLORS.text, fontWeight: '500', zIndex: 1, marginTop: 4 },
  levelBadge: {
    backgroundColor: 'rgba(200,200,240,0.10)',
    paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(200,200,240,0.15)', zIndex: 1,
  },
  levelText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', fontWeight: '600', color: COLORS.accent },
  accessoryHat: { fontSize: 26, zIndex: 3, marginBottom: -10 },
  accessoryBody: { fontSize: 20, zIndex: 3, marginTop: -8 },
  bgEffectRow: { position: 'absolute', flexDirection: 'row', gap: 40, top: 10, opacity: 0.4 },
  bgEffect: { fontSize: 18 },
  petItem: { position: 'absolute', bottom: 10, right: -20, fontSize: 28, zIndex: 3 },
});
