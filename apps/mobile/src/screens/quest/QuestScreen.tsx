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
        {done ? (
          <Animated.Text style={[s.cardCheck, s.cardCheckDone, { transform: [{ scale }], opacity }]}>
            ✓
          </Animated.Text>
        ) : (
          <Text style={s.cardCheck}>○</Text>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[s.cardTitle, done && s.cardTitleDone]}>
            {lang === 'ko' ? quest.titleKo : quest.title}
          </Text>
          {/* 11→12px */}
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
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: { flex: 1 },
  header: { padding: theme.spacing.xxl, paddingBottom: theme.spacing.sm },
  title: { ...theme.typography.h2, color: theme.colors.text.primary },
  progressLabel: { ...theme.typography.body3, color: theme.colors.text.secondary, marginTop: 4 },

  overallBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderRadius: 2,
    overflow: 'hidden',
  },
  overallFill: { height: '100%', backgroundColor: theme.colors.accent, borderRadius: 2 },

  sectionDivider: {
    ...theme.typography.labelSm,
    color: theme.colors.text.tertiary,
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: theme.spacing.xl,
    marginBottom: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    minHeight: theme.minTouchTarget,
  },
  cardDone: { opacity: 0.5 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 12 },
  cardCheck: { fontSize: 18, color: theme.colors.accent, width: 24 },
  cardCheckDone: { color: theme.colors.tealVivid },
  cardTitle: { ...theme.typography.label, color: theme.colors.text.primary, marginBottom: 2 },
  cardTitleDone: { textDecorationLine: 'line-through', color: theme.colors.text.tertiary },
  cardDesc: { ...theme.typography.caption, color: theme.colors.text.tertiary },   // 11→12
  cardRight: { alignItems: 'flex-end', gap: 6 },
  rewardBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
  },
  rewardText: { ...theme.typography.bold3, color: theme.colors.gold },
  // paddingVertical 6→10, minHeight 44
  completeBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    minHeight: theme.minTouchTarget,
    justifyContent: 'center',
  },
  completeBtnText: { ...theme.typography.bold3, color: theme.colors.text.primary },

  emptyState: { alignItems: 'center', padding: 40, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { ...theme.typography.body2, color: theme.colors.text.secondary, textAlign: 'center' },
  retryBtn: {
    marginTop: 4,
    backgroundColor: theme.colors.surface2,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    minHeight: theme.minTouchTarget,
    justifyContent: 'center',
  },
  retryBtnText: { ...theme.typography.label, color: theme.colors.text.primary },

  allDoneCard: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  allDoneText: { ...theme.typography.label, color: theme.colors.text.primary },

  tipCard: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xxl,
    marginTop: theme.spacing.sm,
    backgroundColor: theme.glow.soft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.glow.medium,
  },
  tipText: { ...theme.typography.body3, color: theme.colors.text.secondary, lineHeight: 20 },
});
