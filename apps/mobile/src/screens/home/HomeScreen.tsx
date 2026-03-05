import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../constants/theme';
import { CharacterDisplay } from '../../components/character/CharacterDisplay';
import { useCharacterStore } from '../../stores/characterStore';
import { apiClient } from '../../utils/api';
import { useProgressBar, useBounceSelect } from '../../hooks/useAnimation';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import { getExpProgress } from '../../utils/exp';

type HomeNavProp = NativeStackNavigationProp<AppStackParamList>;

const EMOTIONS = [
  { emoji: '😊', label: 'happy',   labelKo: '행복해요' },
  { emoji: '😐', label: 'calm',    labelKo: '평온해요' },
  { emoji: '😔', label: 'sad',     labelKo: '슬퍼요' },
  { emoji: '😰', label: 'anxious', labelKo: '불안해요' },
  { emoji: '😤', label: 'angry',   labelKo: '화나요' },
  { emoji: '😴', label: 'tired',   labelKo: '피곤해요' },
];

export function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<HomeNavProp>();
  const { character, lang, zenCoins, updateExp, setZenCoins, setCharacter } = useCharacterStore();
  const [showCheckin, setShowCheckin] = useState(false);

  const greeting = lang === 'ko' ? '좋은 하루예요' : 'Good day';
  const dateStr = new Date().toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const level = character?.level ?? 1;
  const exp = character?.exp ?? 0;
  const expProgress = getExpProgress(exp, level);

  const { progress: expBarProgress, animateTo } = useProgressBar(0);
  useEffect(() => {
    animateTo(expProgress);
  }, [expProgress, animateTo]);

  const expBarWidth = expBarProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.greeting}>{greeting}</Text>
                <Text style={styles.date}>{dateStr}</Text>
              </View>
              <View style={styles.coinsRow}>
                <Text style={styles.coinsIcon}>✦</Text>
                <Text style={styles.coinsText}>{zenCoins.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* 캐릭터 카드 */}
          <View style={styles.characterCard}>
            <CharacterDisplay
              characterType={character?.characterType ?? 'hana'}
              level={level}
              bgTheme={character?.bgTheme ?? 'starlight'}
            />

            {/* EXP 바 */}
            <View style={styles.expBarWrapper}>
              <View style={styles.expRowLabel}>
                <Text style={styles.levelBadgeText}>Lv.{level}</Text>
                <Text style={styles.expText}>{exp} EXP</Text>
              </View>
              <View style={styles.expBarBg}>
                <Animated.View style={[styles.expBarFill, { width: expBarWidth }]} />
              </View>
            </View>
          </View>

          {/* 오늘 기분 + AI 코치 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {lang === 'ko' ? '오늘 기분이 어때요?' : 'How are you feeling today?'}
            </Text>
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary]}
                activeOpacity={0.85}
                onPress={() => setShowCheckin(true)}
              >
                <Text style={styles.actionBtnText}>
                  {lang === 'ko' ? '기분 기록하기' : 'Log Emotion'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('AICoach')}
              >
                <Text style={styles.actionBtnText}>
                  {lang === 'ko' ? 'AI 코치' : 'AI Coach'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* 감정 체크인 모달 */}
        <EmotionCheckinModal
          visible={showCheckin}
          lang={lang}
          onClose={() => setShowCheckin(false)}
          onSuccess={(expGained, coinsGained) => {
            updateExp(expGained);
            setZenCoins(useCharacterStore.getState().zenCoins + coinsGained);
            setShowCheckin(false);
          }}
          onAlreadyDone={() => setShowCheckin(false)}
        />
      </SafeAreaView>
    </View>
  );
}

// ────────── 감정 체크인 모달 ──────────
function EmotionCheckinModal({
  visible, lang, onClose, onSuccess, onAlreadyDone,
}: {
  visible: boolean;
  lang: string;
  onClose: () => void;
  onSuccess: (exp: number, coins: number) => void;
  onAlreadyDone?: () => void;
}): React.JSX.Element {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [doneExp, setDoneExp] = useState(50);
  const [doneCoins, setDoneCoins] = useState(100);

  const handleSubmit = async (): Promise<void> => {
    if (!selectedEmotion) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post('/emotion/checkin', {
        emotion: selectedEmotion, intensity, text: text || undefined,
      });
      setDoneExp(data.expGained ?? 50);
      setDoneCoins(data.coinsGained ?? 100);
      setDone(true);
      setTimeout(() => {
        onSuccess(data.expGained ?? 50, data.coinsGained ?? 100);
        setSelectedEmotion(null); setIntensity(3); setText(''); setDone(false);
      }, 1200);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        onAlreadyDone?.();
      } else {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalSheet}>
          {done ? (
            <View style={styles.doneView}>
              <Text style={styles.doneEmoji}>✨</Text>
              <Text style={styles.doneText}>
                {lang === 'ko' ? `+${doneExp} EXP · +${doneCoins} Coins 획득!` : `+${doneExp} EXP · +${doneCoins} Coins earned!`}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {lang === 'ko' ? '오늘 기분은 어때요?' : 'How are you feeling?'}
                </Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.emojiGrid}>
                {EMOTIONS.map((e) => (
                  <AnimatedEmojiBtn
                    key={e.label}
                    emotion={e}
                    lang={lang}
                    selected={selectedEmotion === e.label}
                    onPress={() => setSelectedEmotion(e.label)}
                  />
                ))}
              </View>

              <View style={styles.intensityRow}>
                <Text style={styles.intensityLabel}>
                  {lang === 'ko' ? '강도' : 'Intensity'}
                </Text>
                {[1, 2, 3, 4, 5].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.intensityBtn, intensity === v && styles.intensityBtnSelected]}
                    onPress={() => setIntensity(v)}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Text style={[styles.intensityBtnText, intensity === v && styles.intensityBtnTextSelected]}>
                      {v}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.textInput}
                placeholder={lang === 'ko' ? '오늘 하루는 어땠나요? (선택사항)' : 'How was your day? (optional)'}
                placeholderTextColor={theme.colors.text.tertiary}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={500}
              />

              <TouchableOpacity
                style={[styles.submitBtn, (!selectedEmotion || loading) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!selectedEmotion || loading}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>
                  {loading
                    ? (lang === 'ko' ? '저장 중...' : 'Saving...')
                    : (lang === 'ko' ? '기록하기 ✦ +100 Coins' : 'Save ✦ +100 Coins')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AnimatedEmojiBtn({
  emotion, lang, selected, onPress,
}: {
  emotion: typeof EMOTIONS[0];
  lang: string;
  selected: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const { scale, bounce } = useBounceSelect();

  const handlePress = (): void => {
    bounce();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], width: '30%' }}>
      <TouchableOpacity
        style={[styles.emojiBtn, selected && styles.emojiBtnSelected]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={styles.emojiIcon}>{emotion.emoji}</Text>
        <Text style={styles.emojiLabel}>
          {lang === 'ko' ? emotion.labelKo : emotion.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },

  header: { paddingHorizontal: theme.spacing.xxl, paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: {
    fontSize: 30,
    fontFamily: 'Manrope_700Bold',
    color: theme.colors.text.primary,
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  date: { ...theme.typography.body3, color: theme.colors.text.secondary },
  coinsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(212,168,80,0.12)',
    paddingHorizontal: theme.spacing.md, paddingVertical: 7,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(212,168,80,0.22)',
    minHeight: theme.minTouchTarget,
  },
  coinsIcon: { fontSize: 13, color: theme.colors.gold },
  coinsText: { ...theme.typography.bold2, color: theme.colors.gold },

  characterCard: {
    margin: theme.spacing.xl,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: theme.radius.xxl,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 20,
  },
  expBarWrapper: { width: '100%', gap: 6 },
  expRowLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelBadgeText: { ...theme.typography.labelSm, color: theme.colors.accent },
  expBarBg: { height: 6, backgroundColor: theme.colors.border, borderRadius: 3, overflow: 'hidden' },
  expBarFill: { height: '100%', backgroundColor: theme.colors.tealVivid, borderRadius: 3 },
  expText: { ...theme.typography.caption, color: theme.colors.text.tertiary },

  section: { paddingHorizontal: theme.spacing.xl, marginBottom: theme.spacing.xxl, marginTop: theme.spacing.lg },
  sectionTitle: { ...theme.typography.bold1, color: theme.colors.text.primary, marginBottom: theme.spacing.md },

  btnRow: { flexDirection: 'row', gap: theme.spacing.md },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.lg,
    minHeight: 130,
    paddingVertical: 36,
  },
  actionBtnPrimary: { backgroundColor: theme.colors.primary },
  actionBtnSecondary: { backgroundColor: theme.colors.surface2 },
  actionBtnText: { ...theme.typography.bold2, color: theme.colors.text.primary },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.overlay },
  modalSheet: {
    backgroundColor: theme.colors.bg2,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    padding: theme.spacing.xxl,
    paddingBottom: 40,
    gap: theme.spacing.xl,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { ...theme.typography.h3, color: theme.colors.text.primary },
  modalClose: { fontSize: 18, color: theme.colors.text.secondary, padding: 12 },

  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  emojiBtn: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  emojiBtnSelected: { borderColor: theme.colors.tealVivid, backgroundColor: theme.colors.surface2 },
  emojiIcon: { fontSize: 28 },
  emojiLabel: { ...theme.typography.body3, color: theme.colors.text.secondary },

  intensityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  intensityLabel: { ...theme.typography.label, color: theme.colors.text.secondary, marginRight: 4 },
  intensityBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  intensityBtnSelected: { backgroundColor: theme.colors.tealVivid, borderColor: theme.colors.tealVivid },
  intensityBtnText: { ...theme.typography.bold2, color: theme.colors.text.secondary },
  intensityBtnTextSelected: { color: theme.colors.bg },

  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    color: theme.colors.text.primary,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  submitBtn: {
    backgroundColor: theme.colors.tealVivid,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: theme.minTouchTarget,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { ...theme.typography.bold1, color: theme.colors.bg },

  doneView: { alignItems: 'center', paddingVertical: 40, gap: 16 },
  doneEmoji: { fontSize: 64 },
  doneText: { ...theme.typography.h3, color: theme.colors.tealVivid },
});
