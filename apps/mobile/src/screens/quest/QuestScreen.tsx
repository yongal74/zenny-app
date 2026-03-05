/**
 * QuestScreen - 세션 C: UI/UX 리팩터링
 *
 * 수정:
 * - theme.ts 기반 스타일 통일
 * - cardDesc 11→12px (가독성 최소 기준)
 * - completeBtn paddingVertical 6→10, minHeight 44px
 * - 빈 상태 3단계 분기 (loading / error / empty)
 * - overallBar 애니메이션 (useProgressBar)
 */
import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { theme } from '../../constants/theme';
import { useCharacterStore } from '../../stores/characterStore';
import { apiClient } from '../../utils/api';
import { useProgressBar, useCheckComplete } from '../../hooks/useAnimation';

interface UserQuest {
  id: string;
  questId: string;
  title: string;
  titleKo: string;
  description: string;
  coinsReward: number;
  expReward: number;
  progress: number;
  target: number;
  completedAt: string | null;
}

export function QuestScreen(): React.JSX.Element {
  const { lang, updateExp, setZenCoins } = useCharacterStore();
  const queryClient = useQueryClient();

  const { data: quests = [], isLoading, isError } = useQuery<UserQuest[]>({
    queryKey: ['quests'],
    queryFn: async () => {
      const { data } = await apiClient.get('/quests');
      return data;
    },
  });

  const completeQuest = useMutation({
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

  const completed = quests.filter((q) => q.completedAt);
  const pending = quests.filter((q) => !q.completedAt);
  const totalCoins = quests.reduce((sum, q) => sum + (q.completedAt ? q.coinsReward : 0), 0);
  const overallRatio = quests.length > 0 ? completed.length / quests.length : 0;

  // 전체 진행 바 애니메이션
  const { progress: barProgress, animateTo } = useProgressBar(0);
  useEffect(() => {
    animateTo(overallRatio, 600);
  }, [overallRatio, animateTo]);
  const barWidth = barProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>{lang === 'ko' ? '✦ 오늘의 퀘스트' : '✦ Daily Quests'}</Text>
          {!isLoading && quests.length > 0 && (
            <Text style={s.progressLabel}>
              {lang === 'ko'
                ? `${completed.length}/${quests.length}개 완료 · ✦ ${totalCoins} 획득`
                : `${completed.length}/${quests.length} done · ✦ ${totalCoins} earned`}
            </Text>
          )}
        </View>

        {/* 전체 진행 바 */}
        {quests.length > 0 && (
          <View style={s.overallBar}>
            <Animated.View style={[s.overallFill, { width: barWidth }]} />
          </View>
        )}

        {/* 빈 상태 3단계 분기 */}
        {isLoading ? (
          <View style={s.emptyState}>
            <Text style={s.emptyText}>
              {lang === 'ko' ? '퀘스트 불러오는 중...' : 'Loading quests...'}
            </Text>
          </View>
        ) : isError ? (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>⚠️</Text>
            <Text style={s.emptyText}>
              {lang === 'ko'
                ? '퀘스트를 불러오지 못했어요.\n잠시 후 다시 시도해 주세요.'
                : 'Could not load quests.\nPlease try again.'}
            </Text>
            <TouchableOpacity
              style={s.retryBtn}
              onPress={() => queryClient.invalidateQueries({ queryKey: ['quests'] })}
              activeOpacity={0.8}
            >
              <Text style={s.retryBtnText}>{lang === 'ko' ? '다시 시도' : 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        ) : quests.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>✿</Text>
            <Text style={s.emptyText}>
              {lang === 'ko'
                ? '아직 퀘스트가 없어요.\n내일 다시 확인해 보세요!'
                : 'No quests yet.\nCheck back tomorrow!'}
            </Text>
          </View>
        ) : (
          <>
            {pending.map((q) => (
              <QuestCard key={q.id} quest={q} lang={lang} onComplete={() => completeQuest.mutate(q.id)} />
            ))}

            {pending.length === 0 && (
              <View style={s.allDoneCard}>
                <Text style={s.allDoneText}>
                  {lang === 'ko' ? '🎉 오늘 퀘스트 모두 완료!' : '🎉 All quests done today!'}
                </Text>
              </View>
            )}

            {completed.length > 0 && (
              <>
                <Text style={s.sectionDivider}>
                  {lang === 'ko' ? '✓ 완료됨' : '✓ Completed'}
                </Text>
                {completed.map((q) => (
                  <QuestCard key={q.id} quest={q} lang={lang} onComplete={() => {}} done />
                ))}
              </>
            )}
          </>
        )}

        <View style={s.tipCard}>
          <Text style={s.tipText}>
            {lang === 'ko'
              ? '💡 명상, 호흡, 감정 기록으로 Zen Coins를 모아 희귀 아이템을 획득하세요!'
              : '💡 Earn Zen Coins through meditation, breathing & emotion logs to unlock rare items!'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
    </View>
  );
}

function QuestCard({ quest, lang, onComplete, done = false }: {
  quest: UserQuest;
  lang: string;
  onComplete: () => void;
  done?: boolean;
}): React.JSX.Element {
  const { scale, opacity, complete } = useCheckComplete();

  useEffect(() => {
    if (done) complete();
  }, []);

  return (
    <View style={[s.card, done && s.cardDone]}>
      <View style={s.cardLeft}>
        <View style={{ flex: 1 }}>
          <Text style={[s.cardTitle, done && s.cardTitleDone]}>
            {lang === 'ko' ? quest.titleKo : quest.title}
          </Text>
          <Text style={s.cardDesc} numberOfLines={1}>{quest.description}</Text>
        </View>
      </View>

      <View style={s.cardRight}>
        <View style={s.rewardBadge}>
          <Text style={s.rewardText}>✦ {quest.coinsReward}</Text>
        </View>
        {!done && (
          <TouchableOpacity
            style={s.completeBtn}
            onPress={onComplete}
            activeOpacity={0.85}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Text style={s.completeBtnText}>{lang === 'ko' ? '완료' : 'Done'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  header: { paddingHorizontal: theme.spacing.xxl, paddingTop: theme.spacing.xxl, paddingBottom: theme.spacing.md },
  title: { ...theme.typography.h2, color: theme.colors.text.primary },
  progressLabel: { ...theme.typography.body3, color: theme.colors.text.secondary, marginTop: 6 },

  overallBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderRadius: 2,
    overflow: 'hidden',
  },
  overallFill: { height: '100%', backgroundColor: theme.colors.tealVivid, borderRadius: 2 },

  sectionDivider: {
    ...theme.typography.labelSm,
    color: theme.colors.text.tertiary,
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.5,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: theme.spacing.xl,
    marginBottom: 10,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    minHeight: 64,
  },
  cardDone: { opacity: 0.45 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, marginRight: 12 },
  cardCheck: { fontSize: 18, color: 'rgba(255,255,255,0.3)', width: 24 },
  cardCheckDone: { color: theme.colors.tealVivid },
  cardTitle: { ...theme.typography.bold2, color: theme.colors.text.primary, marginBottom: 3 },
  cardTitleDone: { textDecorationLine: 'line-through', color: theme.colors.text.tertiary },
  cardDesc: { ...theme.typography.caption, color: theme.colors.text.tertiary, lineHeight: 18 },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  rewardBadge: {
    backgroundColor: 'rgba(200,168,96,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(200,168,96,0.25)',
  },
  rewardText: { ...theme.typography.bold3, color: theme.colors.gold },
  completeBtn: {
    backgroundColor: 'rgba(124,58,237,0.8)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    minHeight: theme.minTouchTarget,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.5)',
  },
  completeBtnText: { ...theme.typography.bold3, color: '#fff' },

  emptyState: { alignItems: 'center', padding: 48, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { ...theme.typography.body2, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    marginTop: 4,
    backgroundColor: theme.colors.glass,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    minHeight: theme.minTouchTarget,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  retryBtnText: { ...theme.typography.label, color: theme.colors.text.primary },

  allDoneCard: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    backgroundColor: 'rgba(45,212,191,0.08)',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.2)',
  },
  allDoneText: { ...theme.typography.bold2, color: theme.colors.tealVivid },

  tipCard: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xxl,
    marginTop: theme.spacing.sm,
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
  },
  tipText: { ...theme.typography.body3, color: theme.colors.text.secondary, lineHeight: 22 },
});
