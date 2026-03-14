import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal,
  TextInput, Animated, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { theme } from '../../constants/theme';
import { CharacterDisplay } from '../../components/character/CharacterDisplay';
import { useCharacterStore } from '../../stores/characterStore';
import { apiClient } from '../../utils/api';
import { useProgressBar, useBounceSelect } from '../../hooks/useAnimation';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import { getExpProgress } from '../../utils/exp';

interface UserQuest {
  id: string;
  questId: string;
  title: string;
  titleKo: string;
  description: string;
  coinsReward: number;
  expReward: number;
  completedAt: string | null;
}

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
  const { character, lang, zenCoins, updateExp, setZenCoins, setCharacterType } = useCharacterStore();
  const [showCheckin, setShowCheckin] = useState(false);
  const [showCharSwitch, setShowCharSwitch] = useState(false);
  const queryClient = useQueryClient();

  // Daily Quest 데이터
  const { data: quests = [], isLoading: questLoading } = useQuery<UserQuest[]>({
    queryKey: ['quests'],
    queryFn: async () => { const { data } = await apiClient.get('/quests'); return data; },
  });
  const completeQuest = useMutation({
    mutationFn: async (questId: string) => {
      const { data } = await apiClient.post(`/quests/${questId}/complete`); return data;
    },
    onSuccess: (data) => {
      updateExp(data.expGained ?? 0);
      if (data.totalCoins !== undefined) setZenCoins(data.totalCoins);
      queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
  });
  const completedQuests = quests.filter(q => q.completedAt);
  const pendingQuests = quests.filter(q => !q.completedAt);

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
          <TouchableOpacity
            style={styles.characterCard}
            activeOpacity={1}
            onLongPress={() => { Vibration.vibrate(40); setShowCharSwitch(true); }}
            delayLongPress={500}
          >
            <CharacterDisplay
              characterType={character?.characterType ?? 'hana'}
              level={level}
              bgTheme={character?.bgTheme ?? 'starlight'}
            />
            <Text style={styles.charHint}>Hold to change character</Text>

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
          </TouchableOpacity>

          {/* 오늘 기분 + AI 코치 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {lang === 'ko' ? '오늘 기분이 어때요?' : 'How are you feeling today?'}
            </Text>
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary]}
                activeOpacity={0.82}
                onPress={() => setShowCheckin(true)}
              >
                <Text style={styles.actionBtnLabel}>
                  {lang === 'ko' ? 'Log Emotions' : 'Log Emotions'}
                </Text>
                <Text style={styles.actionBtnSub}>
                  {lang === 'ko' ? '감정 기록 · +100 ✦' : 'Check in · +100 ✦'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                activeOpacity={0.82}
                onPress={() => navigation.navigate('AICoach')}
              >
                <Text style={styles.actionBtnLabel}>
                  {lang === 'ko' ? 'AI Coach' : 'AI Coach'}
                </Text>
                <Text style={styles.actionBtnSub}>
                  {lang === 'ko' ? '마음 대화' : 'Talk to Zenny'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Daily Quest 섹션 */}
          <View style={styles.section}>
            <View style={styles.questHeader}>
              <Text style={styles.sectionTitle}>
                {lang === 'ko' ? 'Daily Quests' : 'Daily Quests'}
              </Text>
              {quests.length > 0 && (
                <Text style={styles.questProgress}>
                  {completedQuests.length}/{quests.length} · ✦ {completedQuests.reduce((s, q) => s + q.coinsReward, 0)}
                </Text>
              )}
            </View>

            {/* 전체 진행 바 */}
            {quests.length > 0 && (
              <View style={styles.questBarBg}>
                <View style={[styles.questBarFill, { width: `${(completedQuests.length / quests.length) * 100}%` as any }]} />
              </View>
            )}

            {questLoading ? (
              <Text style={styles.questEmptyText}>{lang === 'ko' ? '불러오는 중...' : 'Loading...'}</Text>
            ) : quests.length === 0 ? (
              <Text style={styles.questEmptyText}>{lang === 'ko' ? '오늘의 퀘스트가 없어요.' : 'No quests today.'}</Text>
            ) : (
              <>
                {pendingQuests.map(q => (
                  <View key={q.id} style={styles.questCard}>
                    <View style={styles.questCardLeft}>
                      <Text style={styles.questTitle}>{lang === 'ko' ? q.titleKo : q.title}</Text>
                      <Text style={styles.questDesc} numberOfLines={1}>{q.description}</Text>
                    </View>
                    <View style={styles.questCardRight}>
                      <Text style={styles.questReward}>✦ {q.coinsReward}</Text>
                      <TouchableOpacity
                        style={styles.questDoneBtn}
                        onPress={() => completeQuest.mutate(q.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.questDoneBtnText}>{lang === 'ko' ? '완료' : 'Done'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {pendingQuests.length === 0 && (
                  <View style={styles.questAllDone}>
                    <Text style={styles.questAllDoneText}>
                      {lang === 'ko' ? '🎉 오늘 퀘스트 모두 완료!' : '🎉 All done today!'}
                    </Text>
                  </View>
                )}
                {completedQuests.map(q => (
                  <View key={q.id} style={[styles.questCard, { opacity: 0.35 }]}>
                    <Text style={[styles.questTitle, { textDecorationLine: 'line-through' }]}>{lang === 'ko' ? q.titleKo : q.title}</Text>
                    <Text style={styles.questReward}>✦ {q.coinsReward}</Text>
                  </View>
                ))}
              </>
            )}
          </View>

        </ScrollView>

        {/* 캐릭터 변경 모달 */}
        <CharacterSwitchModal
          visible={showCharSwitch}
          currentType={character?.characterType ?? 'hana'}
          onClose={() => setShowCharSwitch(false)}
          onSwitch={(type) => { setCharacterType(type); setShowCharSwitch(false); }}
        />

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

// ────────── 캐릭터 변경 모달 ──────────
const CHARACTER_OPTIONS: Array<{
  type: string;
  emoji: string;
  name: string;
  tagline: string;
  color: string;
}> = [
  { type: 'hana', emoji: '🌸', name: 'Hana', tagline: 'Warm & Nurturing',       color: '#7EECD4' },
  { type: 'sora', emoji: '🌤️', name: 'Sora', tagline: 'Calm & Intellectual',    color: '#A0C4E8' },
  { type: 'tora', emoji: '🦊', name: 'Tora', tagline: 'Energetic & Bold',       color: '#E8C0A0' },
  { type: 'mizu', emoji: '💧', name: 'Mizu', tagline: 'Gentle & Empathetic',    color: '#A0D8E8' },
  { type: 'kaze', emoji: '🍃', name: 'Kaze', tagline: 'Free-Spirited & Intuitive', color: '#A0E8B0' },
];

function CharacterSwitchModal({
  visible, currentType, onClose, onSwitch,
}: {
  visible: boolean;
  currentType: string;
  onClose: () => void;
  onSwitch: (type: string) => void;
}): React.JSX.Element {
  const handleSwitch = async (type: string): Promise<void> => {
    onSwitch(type);
    try {
      await apiClient.post('/character/switch-type', { characterType: type });
    } catch {
      // 로컬 상태는 이미 변경됨, 백엔드 실패는 무시
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { gap: 0 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Your Character</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.charHint, { marginBottom: 20, opacity: 1 }]}>
            Your companion on the mindfulness journey
          </Text>
          {CHARACTER_OPTIONS.map((opt) => {
            const isActive = opt.type === currentType;
            return (
              <TouchableOpacity
                key={opt.type}
                style={[switchStyles.charRow, isActive && { borderColor: opt.color, backgroundColor: `${opt.color}12` }]}
                activeOpacity={0.8}
                onPress={() => { void handleSwitch(opt.type); }}
              >
                <View style={[switchStyles.charCircle, { borderColor: opt.color, backgroundColor: `${opt.color}20` }]}>
                  <Text style={switchStyles.charEmoji}>{opt.emoji}</Text>
                </View>
                <View style={switchStyles.charInfo}>
                  <Text style={switchStyles.charName}>{opt.name}</Text>
                  <Text style={switchStyles.charTagline}>{opt.tagline}</Text>
                </View>
                {isActive && (
                  <View style={[switchStyles.activeBadge, { backgroundColor: `${opt.color}22`, borderColor: opt.color }]}>
                    <Text style={[switchStyles.activeBadgeText, { color: opt.color }]}>Active</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const switchStyles = StyleSheet.create({
  charRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  charCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charEmoji: { fontSize: 34 },
  charInfo: { flex: 1 },
  charName: { ...theme.typography.bold1, color: theme.colors.text.primary },
  charTagline: { ...theme.typography.body3, color: theme.colors.text.secondary, marginTop: 2 },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  activeBadgeText: { fontSize: 12, fontFamily: 'DMSans_500Medium' },
});

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
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalSheet} onPress={() => {}}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: theme.spacing.xl }}
          >
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
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
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
    fontSize: 36,
    fontFamily: 'BebasNeue_400Regular',
    color: theme.colors.text.primary,
    lineHeight: 38,
    letterSpacing: 1.5,
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
    backgroundColor: 'rgba(0,232,168,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,232,168,0.20)',
    borderRadius: theme.radius.xxl,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#00E8A8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  charHint: { ...theme.typography.caption, color: theme.colors.text.tertiary, opacity: 0.6, letterSpacing: 0.3 },
  expBarWrapper: { width: '100%', gap: 6 },
  expRowLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelBadgeText: { ...theme.typography.labelSm, color: theme.colors.accent },
  expBarBg: { height: 4, backgroundColor: 'rgba(0,232,168,0.12)', borderRadius: 2, overflow: 'hidden' },
  expBarFill: { height: '100%', backgroundColor: theme.colors.tealVivid, borderRadius: 2, shadowColor: '#00FFB8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 },
  expText: { ...theme.typography.caption, color: theme.colors.text.tertiary },

  section: { paddingHorizontal: theme.spacing.xl, marginBottom: theme.spacing.xxl, marginTop: theme.spacing.lg },
  sectionTitle: { fontSize: 22, fontFamily: 'BebasNeue_400Regular', letterSpacing: 1, color: theme.colors.text.primary, marginBottom: theme.spacing.md },

  btnRow: { flexDirection: 'row', gap: theme.spacing.md },
  actionBtn: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    gap: 3,
    shadowColor: '#00E8A8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  actionBtnPrimary: {
    backgroundColor: 'rgba(0,232,168,0.13)',
    borderColor: 'rgba(0,232,168,0.30)',
  },
  actionBtnSecondary: {
    backgroundColor: 'rgba(0,232,168,0.07)',
    borderColor: 'rgba(0,232,168,0.20)',
  },
  actionBtnLabel: {
    ...theme.typography.bold1,
    color: theme.colors.accent,
    letterSpacing: 0.3,
  },
  actionBtnSub: {
    ...theme.typography.caption,
    color: 'rgba(0,232,168,0.65)',
  },
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
    fontFamily: 'DMSans_400Regular',
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

  // Daily Quest
  questHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
  questProgress: { ...theme.typography.caption, color: theme.colors.gold },
  questBarBg: { height: 3, backgroundColor: 'rgba(0,232,168,0.10)', borderRadius: 2, marginBottom: theme.spacing.md, overflow: 'hidden' },
  questBarFill: { height: '100%', backgroundColor: theme.colors.tealVivid, borderRadius: 2 },
  questEmptyText: { ...theme.typography.body3, color: theme.colors.text.tertiary, paddingVertical: 12 },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 8,
  },
  questCardLeft: { flex: 1, marginRight: 12 },
  questTitle: { ...theme.typography.bold2, color: theme.colors.text.primary, marginBottom: 2 },
  questDesc: { ...theme.typography.caption, color: theme.colors.text.tertiary },
  questCardRight: { alignItems: 'flex-end', gap: 6 },
  questReward: { ...theme.typography.bold3, color: theme.colors.gold },
  questDoneBtn: {
    backgroundColor: 'rgba(0,232,168,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0,232,168,0.30)',
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 32,
    justifyContent: 'center',
  },
  questDoneBtnText: { ...theme.typography.bold3, color: theme.colors.accent },
  questAllDone: {
    backgroundColor: 'rgba(0,232,168,0.06)',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,232,168,0.18)',
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: 8,
  },
  questAllDoneText: { ...theme.typography.bold2, color: theme.colors.tealVivid },
});
