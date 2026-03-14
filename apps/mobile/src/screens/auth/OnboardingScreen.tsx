import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, Animated, FlatList,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { useCharacterStore } from '../../stores/characterStore';
import type { CharacterType } from '../../types';

const { width: W, height: H } = Dimensions.get('window');

// ─── Feature Slides ──────────────────────────────────────────
const SLIDES = [
  {
    key: 'welcome',
    gradient: ['#010805', '#031A10', '#010805'] as const,
    accentColor: '#00E8A8',
    icon: '🌸',
    eyebrow: 'WELCOME TO',
    title: 'ZENNY',
    subtitle: 'Your AI-powered wellness companion.\nGuided by science, built with compassion.',
    features: [],
  },
  {
    key: 'coach',
    gradient: ['#010805', '#041520', '#010805'] as const,
    accentColor: '#60B8FF',
    icon: '✦',
    eyebrow: 'FEATURE 01',
    title: 'AI COACH',
    subtitle: 'Talk to your personal AI wellness coach — available 24/7, tailored to your emotions and goals.',
    features: ['GPT-powered conversations', 'Emotion-aware responses', 'Evidence-based techniques'],
  },
  {
    key: 'meditation',
    gradient: ['#010805', '#071420', '#010805'] as const,
    accentColor: '#2DD4BF',
    icon: '🌬️',
    eyebrow: 'FEATURE 02',
    title: 'MEDITATE & BREATHE',
    subtitle: '20+ guided sessions for breathing, body scans, and deep relaxation. Anytime, anywhere.',
    features: ['Box, 4-7-8, Pranayama breathing', 'Guided body scan sessions', 'Nature & ambient soundscapes'],
  },
  {
    key: 'quests',
    gradient: ['#010805', '#0D1205', '#010805'] as const,
    accentColor: '#F0C060',
    icon: '⚡',
    eyebrow: 'FEATURE 03',
    title: 'LEVEL UP DAILY',
    subtitle: 'Complete daily wellness quests, earn Zen Coins, and watch your character grow stronger.',
    features: ['Daily quests & challenges', 'Zen Coins reward system', '5 unique AI companions'],
  },
];

// ─── Characters ───────────────────────────────────────────────
const CHARACTERS: Array<{
  type: CharacterType;
  name: string;
  emoji: string;
  tagline: string;
  personality: string;
  color: string;
}> = [
  {
    type: 'hana',
    name: 'Hana',
    emoji: '🌸',
    tagline: 'Warm & Nurturing',
    personality: 'Embraces you with unconditional warmth. Grounded in loving-kindness & CBT.',
    color: '#EC4899',
  },
  {
    type: 'sora',
    name: 'Sora',
    emoji: '☁️',
    tagline: 'Calm & Intellectual',
    personality: 'Guides you with clarity and insight. Rooted in Stoic philosophy & neuroscience.',
    color: '#60B8FF',
  },
  {
    type: 'tora',
    name: 'Tora',
    emoji: '🦊',
    tagline: 'Energetic & Action-Oriented',
    personality: 'Ignites your inner fire. Inspired by breathwork & mindful movement.',
    color: '#F59E0B',
  },
  {
    type: 'mizu',
    name: 'Mizu',
    emoji: '💧',
    tagline: 'Gentle & Empathetic',
    personality: 'Flows with your emotions. Rooted in Vipassana & somatic awareness.',
    color: '#22D3EE',
  },
  {
    type: 'kaze',
    name: 'Kaze',
    emoji: '🍃',
    tagline: 'Free-Spirited & Intuitive',
    personality: 'Inspires you to trust your inner wisdom. Grounded in Zen & nature therapy.',
    color: '#4ADE80',
  },
];

export function OnboardingScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const [selected, setSelected] = useState<CharacterType | null>(null);
  const [step, setStep] = useState<'slides' | 'character' | 'confirm'>('slides');
  const flatRef = useRef<FlatList>(null);
  const navigation = useNavigation<any>();
  const { setCharacter } = useCharacterStore();

  const totalSlides = SLIDES.length;
  const selectedChar = CHARACTERS.find(c => c.type === selected);

  const handleNext = () => {
    if (currentPage < totalSlides - 1) {
      const next = currentPage + 1;
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentPage(next);
    } else {
      setStep('character');
    }
  };

  const handleConfirm = () => {
    if (!selected || !selectedChar) return;
    setCharacter({
      userId: '',
      characterType: selected,
      level: 1,
      exp: 0,
      hunger: 100,
      mood: 100,
      equippedSkin: 'starlight',
      equippedItems: {},
      ownedItems: [],
      bgTheme: 'starlight',
      lastFedAt: new Date().toISOString(),
    });
    navigation.replace('Main');
  };

  // ── Confirm step ──────────────────────────────────────────
  if (step === 'confirm' && selectedChar) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
          <LinearGradient
            colors={['#010805', '#031A10', '#010805']}
            style={s.confirmContainer}
          >
            {/* Glowing ring */}
            <View style={[s.confirmRingOuter, { borderColor: selectedChar.color + '30' }]}>
              <View style={[s.confirmRingInner, { borderColor: selectedChar.color + '50', backgroundColor: selectedChar.color + '08' }]}>
                <Text style={s.confirmEmoji}>{selectedChar.emoji}</Text>
              </View>
            </View>

            <Text style={[s.confirmName, { color: selectedChar.color }]}>{selectedChar.name.toUpperCase()}</Text>
            <Text style={s.confirmTagline}>{selectedChar.tagline}</Text>
            <Text style={s.confirmPersonality}>{selectedChar.personality}</Text>

            <View style={[s.levelBadge, { borderColor: selectedChar.color + '40', backgroundColor: selectedChar.color + '10' }]}>
              <Text style={[s.levelBadgeText, { color: selectedChar.color }]}>Lv.1 Seed  —  Your journey begins 🌱</Text>
            </View>

            <View style={s.confirmBtns}>
              <TouchableOpacity style={s.backBtn} onPress={() => setStep('character')} activeOpacity={0.8}>
                <Text style={s.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.startBtn, { backgroundColor: selectedChar.color }]}
                onPress={handleConfirm}
                activeOpacity={0.85}
              >
                <Text style={s.startBtnText}>Begin Journey ✦</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </SafeAreaView>
      </View>
    );
  }

  // ── Character select step ─────────────────────────────────
  if (step === 'character') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
          <View style={s.charScreen}>
            <View style={s.charHeader}>
              <Text style={s.charEyebrow}>CHOOSE YOUR COMPANION</Text>
              <Text style={s.charTitle}>WHO GUIDES YOU?</Text>
              <Text style={s.charSubtitle}>3 free · Mizu & Kaze unlock at Lv.3</Text>
            </View>

            <ScrollView contentContainerStyle={s.charList} showsVerticalScrollIndicator={false}>
              {CHARACTERS.map((char, idx) => {
                const isLocked = idx >= 3;
                const isSelected = selected === char.type;
                return (
                  <TouchableOpacity
                    key={char.type}
                    style={[
                      s.charCard,
                      isSelected && { borderColor: char.color, backgroundColor: char.color + '0E' },
                      isLocked && s.charCardLocked,
                    ]}
                    onPress={() => !isLocked && setSelected(char.type)}
                    activeOpacity={isLocked ? 1 : 0.85}
                  >
                    <View style={[s.charEmojiWrap, { backgroundColor: char.color + '18', borderColor: char.color + '40' }]}>
                      <Text style={s.charEmoji}>{char.emoji}</Text>
                    </View>
                    <View style={s.charInfo}>
                      <Text style={[s.charName, isSelected && { color: char.color }]}>{char.name}</Text>
                      <Text style={s.charTagline}>{char.tagline}</Text>
                    </View>
                    {isLocked ? (
                      <View style={s.lockBadge}>
                        <Text style={s.lockText}>🔒 Lv.3</Text>
                      </View>
                    ) : (
                      <View style={[s.checkCircle, isSelected && { backgroundColor: char.color, borderColor: char.color }]}>
                        {isSelected && <Text style={s.checkMark}>✓</Text>}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[s.nextBtn, !selected && s.nextBtnDisabled, selected && { backgroundColor: selectedChar?.color }]}
              onPress={() => selected && setStep('confirm')}
              disabled={!selected}
              activeOpacity={0.85}
            >
              <Text style={s.nextBtnText}>
                {selected ? `Select ${selectedChar?.name} ${selectedChar?.emoji}` : 'Choose a companion'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Feature slides ────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <FlatList
          ref={flatRef}
          data={SLIDES}
          keyExtractor={i => i.key}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item: slide }) => (
            <SlideItem slide={slide} />
          )}
        />

        {/* Bottom nav */}
        <View style={s.bottomNav}>
          {/* Dots */}
          <View style={s.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  s.dot,
                  i === currentPage
                    ? [s.dotActive, { backgroundColor: SLIDES[currentPage].accentColor }]
                    : s.dotInactive,
                ]}
              />
            ))}
          </View>

          {/* Skip */}
          {currentPage < totalSlides - 1 && (
            <TouchableOpacity style={s.skipBtn} onPress={() => setStep('character')} activeOpacity={0.7}>
              <Text style={s.skipText}>Skip</Text>
            </TouchableOpacity>
          )}

          {/* Next / Get Started */}
          <TouchableOpacity
            style={[s.nextSlideBtn, { backgroundColor: SLIDES[currentPage].accentColor }]}
            onPress={handleNext}
            activeOpacity={0.88}
          >
            <Text style={[s.nextSlideBtnText, { color: currentPage === 0 ? '#020806' : '#020806' }]}>
              {currentPage === totalSlides - 1 ? 'Get Started  →' : 'Next  →'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

function SlideItem({ slide }: { slide: typeof SLIDES[0] }) {
  const glowAnim = useRef(new Animated.Value(0.85)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1.15, duration: 2800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.85, duration: 2800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <LinearGradient colors={slide.gradient} style={s.slide}>
      {/* Icon area */}
      <View style={s.iconArea}>
        {/* Outer glow ring */}
        <Animated.View style={[s.glowRingOuter, { borderColor: slide.accentColor + '15', transform: [{ scale: glowAnim }] }]} />
        <Animated.View style={[s.glowRingInner, { borderColor: slide.accentColor + '28' }]} />
        <View style={[s.iconCircle, { backgroundColor: slide.accentColor + '12', borderColor: slide.accentColor + '35' }]}>
          <Text style={s.slideIcon}>{slide.icon}</Text>
        </View>
      </View>

      {/* Text */}
      <View style={s.textArea}>
        <Text style={[s.eyebrow, { color: slide.accentColor }]}>{slide.eyebrow}</Text>
        <Text style={s.slideTitle}>{slide.title}</Text>
        <Text style={s.slideSubtitle}>{slide.subtitle}</Text>

        {/* Feature list */}
        {slide.features.length > 0 && (
          <View style={s.featureList}>
            {slide.features.map((f, i) => (
              <View key={i} style={s.featureRow}>
                <View style={[s.featureDot, { backgroundColor: slide.accentColor }]} />
                <Text style={s.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  // ── Slides ──────────────────────────────────────────
  slide: {
    width: W,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 120,
  },
  iconArea: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  glowRingOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
  },
  glowRingInner: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideIcon: { fontSize: 48 },

  textArea: { alignItems: 'center', gap: 10 },
  eyebrow: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    letterSpacing: 3,
  },
  slideTitle: {
    fontSize: 52,
    fontFamily: 'BebasNeue_400Regular',
    color: theme.colors.text.primary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  slideSubtitle: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  featureList: { marginTop: 8, gap: 8, alignSelf: 'flex-start', width: '100%' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureDot: { width: 5, height: 5, borderRadius: 3 },
  featureText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.text.secondary,
  },

  // ── Bottom nav ──────────────────────────────────────
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: 36,
    paddingTop: 16,
    gap: 16,
    backgroundColor: 'transparent',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 4, borderRadius: 2 },
  dotActive: { width: 24 },
  dotInactive: { width: 6, backgroundColor: 'rgba(255,255,255,0.20)' },
  skipBtn: { position: 'absolute', top: 16, right: 28 },
  skipText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.text.tertiary,
  },
  nextSlideBtn: {
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextSlideBtnText: {
    fontSize: 17,
    fontFamily: 'DMSans_700Bold',
  },

  // ── Character select ────────────────────────────────
  charScreen: { flex: 1, paddingHorizontal: 20 },
  charHeader: { alignItems: 'center', paddingTop: 24, paddingBottom: 20, gap: 6 },
  charEyebrow: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    color: theme.colors.accent,
    letterSpacing: 3,
  },
  charTitle: {
    fontSize: 42,
    fontFamily: 'BebasNeue_400Regular',
    color: theme.colors.text.primary,
    letterSpacing: 1.5,
  },
  charSubtitle: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.text.tertiary,
  },
  charList: { paddingBottom: 16, gap: 10 },
  charCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 14,
  },
  charCardLocked: { opacity: 0.40 },
  charEmojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charEmoji: { fontSize: 26 },
  charInfo: { flex: 1 },
  charName: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  charTagline: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.text.secondary,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: { fontSize: 13, color: '#020806', fontFamily: 'DMSans_700Bold' },
  lockBadge: {
    backgroundColor: theme.colors.surface2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  lockText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: theme.colors.text.tertiary,
  },
  nextBtn: {
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  nextBtnDisabled: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: '#020806',
  },

  // ── Confirm ─────────────────────────────────────────
  confirmContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 14,
  },
  confirmRingOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  confirmRingInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmEmoji: { fontSize: 64 },
  confirmName: {
    fontSize: 48,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 2,
  },
  confirmTagline: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.text.secondary,
  },
  confirmPersonality: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  levelBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 4,
  },
  levelBadgeText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
  confirmBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  backBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  backBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
    color: theme.colors.text.secondary,
  },
  startBtn: {
    flex: 2,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startBtnText: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: '#020806',
  },
});
