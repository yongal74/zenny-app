import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS } from '../../constants/colors';
import { CharacterDisplay } from '../../components/character/CharacterDisplay';
import { useCharacterStore } from '../../stores/characterStore';
import { apiClient } from '../../utils/api';
import type { AppStackParamList } from '../../navigation/RootNavigator';

type HomeNavProp = NativeStackNavigationProp<AppStackParamList>;

// EXP 레벨별 임계값 (프론트/백 통일)
const EXP_THRESHOLDS: Record<number, number> = {
  1: 0, 2: 100, 3: 250, 4: 500, 5: 800, 6: 1200, 7: 2000,
};

function getExpProgress(exp: number, level: number): number {
  const cur = EXP_THRESHOLDS[level] ?? 0;
  const next = EXP_THRESHOLDS[level + 1] ?? EXP_THRESHOLDS[7];
  if (next === cur) return 1;
  return Math.min((exp - cur) / (next - cur), 1);
}

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

// 감정 이모지 목록 (A1 스펙 기반)
const EMOTIONS = [
  { emoji: '😊', label: 'happy',   labelKo: '행복해요' },
  { emoji: '😐', label: 'calm',    labelKo: '평온해요' },
  { emoji: '😔', label: 'sad',     labelKo: '슬퍼요' },
  { emoji: '😰', label: 'anxious', labelKo: '불안해요' },
  { emoji: '😤', label: 'angry',   labelKo: '화나요' },
  { emoji: '😴', label: 'tired',   labelKo: '피곤해요' },
];

export function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { character, lang, zenCoins, updateExp, setZenCoins } = useCharacterStore();
  const queryClient = useQueryClient();
  const [showCheckin, setShowCheckin] = useState(false);

  const greeting = lang === 'ko' ? '좋은 하루예요 ✨' : 'Good day ✨';
  const dateStr = new Date().toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const level = character?.level ?? 1;
  const exp = character?.exp ?? 0;
  const expProgress = getExpProgress(exp, level);

  // 오늘의 퀘스트 조회
  const { data: quests = [] } = useQuery<UserQuest[]>({
    queryKey: ['quests', 'home'],
    queryFn: async () => {
      const { data } = await apiClient.get('/quests');
      return data;
    },
  });

  const pendingQuests = quests.filter((q) => !q.completedAt).slice(0, 3);
  const completedCount = quests.filter((q) => q.completedAt).length;

  // 퀘스트 완료
  const completeQuestMutation = useMutation({
    mutationFn: async (questId: string) => {
      const { data } = await apiClient.post(`/quests/${questId}/complete`);
      return data;
    },
    onSuccess: (data) => {
      updateExp(data.expGained ?? 0);
      if (data.totalCoins !== undefined) setZenCoins(data.totalCoins);
      queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <LinearGradient colors={[...COLORS.gradient.header]} style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.date}>{dateStr}</Text>
            </View>
            <View style={styles.coinsRow}>
              <Text style={styles.coinsIcon}>✦</Text>
              <Text style={styles.coinsText}>{zenCoins}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* 캐릭터 카드 */}
        <View style={styles.characterCard}>
          <CharacterDisplay
            characterType={character?.characterType ?? 'hana'}
            level={level}
            bgTheme={character?.bgTheme ?? 'starlight'}
          />
          <View style={styles.expRow}>
            <Text style={styles.levelBadge}>Lv.{level}</Text>
            <View style={styles.expBarWrapper}>
              <View style={styles.expBarBg}>
                <View style={[styles.expBarFill, { width: `${Math.round(expProgress * 100)}%` }]} />
              </View>
              <Text style={styles.expText}>{exp} EXP</Text>
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
              <Text style={styles.actionBtnIcon}>😊</Text>
              <Text style={styles.actionBtnText}>
                {lang === 'ko' ? '기분 기록하기' : 'Log Emotion'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AICoach')}
            >
              <Text style={styles.actionBtnIcon}>✿</Text>
              <Text style={styles.actionBtnText}>
                {lang === 'ko' ? 'AI 코치' : 'AI Coach'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 오늘의 퀘스트 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {lang === 'ko' ? '오늘의 퀘스트' : 'Daily Quests'}
            </Text>
            {quests.length > 0 && (
              <Text style={styles.sectionSubtitle}>
                {completedCount}/{quests.length} {lang === 'ko' ? '완료' : 'done'}
              </Text>
            )}
          </View>
          {pendingQuests.length === 0 && quests.length > 0 ? (
            <View style={styles.allDoneCard}>
              <Text style={styles.allDoneText}>
                {lang === 'ko' ? '🎉 오늘 퀘스트 모두 완료!' : '🎉 All quests done today!'}
              </Text>
            </View>
          ) : (
            pendingQuests.map((q) => (
              <QuestCard
                key={q.id}
                quest={q}
                lang={lang}
                onComplete={() => completeQuestMutation.mutate(q.id)}
              />
            ))
          )}
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
        onAlreadyDone={() => {
          setShowCheckin(false);
        }}
      />
    </SafeAreaView>
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
}) {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!selectedEmotion) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post('/emotion/checkin', {
        emotion: selectedEmotion, intensity, text: text || undefined,
      });
      setDone(true);
      setTimeout(() => {
        onSuccess(data.expGained ?? 50, data.coinsGained ?? 100);
        setSelectedEmotion(null); setIntensity(3); setText(''); setDone(false);
      }, 1200);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 409) {
        // 오늘 이미 체크인함
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
                {lang === 'ko' ? '+50 EXP · +100 Coins 획득!' : '+50 EXP · +100 Coins earned!'}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {lang === 'ko' ? '오늘 기분은 어때요?' : 'How are you feeling?'}
                </Text>
                <TouchableOpacity onPress={onClose}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
              </View>

              {/* 이모지 선택 */}
              <View style={styles.emojiGrid}>
                {EMOTIONS.map((e) => (
                  <TouchableOpacity
                    key={e.label}
                    style={[styles.emojiBtn, selectedEmotion === e.label && styles.emojiBtnSelected]}
                    onPress={() => setSelectedEmotion(e.label)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.emojiIcon}>{e.emoji}</Text>
                    <Text style={styles.emojiLabel}>
                      {lang === 'ko' ? e.labelKo : e.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 강도 슬라이더 (버튼식) */}
              <View style={styles.intensityRow}>
                <Text style={styles.intensityLabel}>
                  {lang === 'ko' ? '강도' : 'Intensity'}
                </Text>
                {[1, 2, 3, 4, 5].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.intensityBtn, intensity === v && styles.intensityBtnSelected]}
                    onPress={() => setIntensity(v)}
                  >
                    <Text style={[styles.intensityBtnText, intensity === v && styles.intensityBtnTextSelected]}>
                      {v}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 텍스트 입력 */}
              <TextInput
                style={styles.textInput}
                placeholder={lang === 'ko' ? '오늘 하루는 어땠나요? (선택사항)' : 'How was your day? (optional)'}
                placeholderTextColor={COLORS.text3}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={500}
              />

              {/* 저장 버튼 */}
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

// ────────── 퀘스트 카드 ──────────
function QuestCard({ quest, lang, onComplete }: {
  quest: UserQuest; lang: string; onComplete: () => void;
}) {
  return (
    <View style={styles.questCard}>
      <View style={styles.questLeft}>
        <Text style={styles.questCheck}>○</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.questTitle}>{lang === 'ko' ? quest.titleKo : quest.title}</Text>
        </View>
      </View>
      <View style={styles.questRight}>
        <View style={styles.questReward}>
          <Text style={styles.questCoin}>✦ {quest.coinsReward}</Text>
        </View>
        <TouchableOpacity style={styles.questDoneBtn} onPress={onComplete} activeOpacity={0.85}>
          <Text style={styles.questDoneBtnText}>{lang === 'ko' ? '완료' : 'Done'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },

  header: { padding: 24, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 22, fontFamily: 'Fraunces_500Medium', color: COLORS.text, marginBottom: 2 },
  date: { fontSize: 13, color: COLORS.text2, fontFamily: 'DMSans_400Regular' },
  coinsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(200,160,96,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  coinsIcon: { fontSize: 13, color: COLORS.gold },
  coinsText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: COLORS.gold },

  characterCard: {
    margin: 20, backgroundColor: COLORS.surface, borderRadius: 20, padding: 20,
    alignItems: 'center', gap: 14,
  },
  expRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelBadge: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: COLORS.accent, backgroundColor: COLORS.surface2, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  expBarWrapper: { flex: 1, gap: 3 },
  expBarBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  expBarFill: { height: '100%', backgroundColor: COLORS.teal, borderRadius: 3 },
  expText: { fontSize: 11, color: COLORS.text3, fontFamily: 'DMSans_400Regular', textAlign: 'right' },

  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: COLORS.text },
  sectionSubtitle: { fontSize: 13, color: COLORS.text2, fontFamily: 'DMSans_400Regular' },

  btnRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  actionBtnPrimary: { backgroundColor: COLORS.primary },
  actionBtnSecondary: { backgroundColor: COLORS.surface2 },
  actionBtnIcon: { fontSize: 18 },
  actionBtnText: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: COLORS.text },

  allDoneCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, alignItems: 'center' },
  allDoneText: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: COLORS.text },

  questCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 8 },
  questLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  questCheck: { fontSize: 16, color: COLORS.accent },
  questTitle: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: COLORS.text, flex: 1 },
  questRight: { alignItems: 'flex-end', gap: 6 },
  questReward: { backgroundColor: 'rgba(200,168,96,0.15)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  questCoin: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: COLORS.gold },
  questDoneBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  questDoneBtnText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: COLORS.text },

  // 모달 스타일
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: { backgroundColor: COLORS.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontFamily: 'Fraunces_500Medium', color: COLORS.text },
  modalClose: { fontSize: 18, color: COLORS.text2, padding: 4 },

  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  emojiBtn: { width: '30%', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 14, paddingVertical: 14, gap: 6, borderWidth: 1.5, borderColor: 'transparent' },
  emojiBtnSelected: { borderColor: COLORS.teal, backgroundColor: COLORS.surface2 },
  emojiIcon: { fontSize: 28 },
  emojiLabel: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: COLORS.text2 },

  intensityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  intensityLabel: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: COLORS.text2, marginRight: 4 },
  intensityBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  intensityBtnSelected: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  intensityBtnText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: COLORS.text2 },
  intensityBtnTextSelected: { color: COLORS.text },

  textInput: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    color: COLORS.text, fontFamily: 'DMSans_400Regular', fontSize: 14,
    minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.border,
  },

  submitBtn: { backgroundColor: COLORS.teal, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: COLORS.text },

  doneView: { alignItems: 'center', paddingVertical: 40, gap: 16 },
  doneEmoji: { fontSize: 64 },
  doneText: { fontSize: 18, fontFamily: 'DMSans_700Bold', color: COLORS.teal },
});
