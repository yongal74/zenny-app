import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS } from '../../constants/colors';
import { useCharacterStore } from '../../stores/characterStore';
import { apiClient } from '../../utils/api';

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

export function QuestScreen() {
  const { lang, updateExp, setZenCoins } = useCharacterStore();
  const queryClient = useQueryClient();

  const { data: quests = [], isLoading } = useQuery<UserQuest[]>({
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

  const title = lang === 'ko' ? '✦ 오늘의 퀘스트' : '✦ Daily Quests';
  const progressLabel = lang === 'ko'
    ? `${completed.length}/${quests.length}개 완료 · ✦ ${totalCoins} 획득`
    : `${completed.length}/${quests.length} done · ✦ ${totalCoins} earned`;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.progressLabel}>{progressLabel}</Text>
        </View>

        {/* 진행 바 */}
        <View style={s.overallBar}>
          <View style={[s.overallFill, { width: `${quests.length ? (completed.length / quests.length) * 100 : 0}%` }]} />
        </View>

        {/* 미완료 퀘스트 */}
        {pending.map((q) => (
          <QuestCard key={q.id} quest={q} lang={lang} onComplete={() => completeQuest.mutate(q.id)} />
        ))}

        {/* 완료 퀘스트 */}
        {completed.length > 0 && (
          <>
            <Text style={s.sectionDivider}>
              {lang === 'ko' ? '✓ 완료됨' : '✓ Completed'}
            </Text>
            {completed.map((q) => (
              <QuestCard key={q.id} quest={q} lang={lang} onComplete={() => { }} done />
            ))}
          </>
        )}

        {/* 빈 상태 */}
        {quests.length === 0 && !isLoading && (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>✿</Text>
            <Text style={s.emptyText}>
              {lang === 'ko' ? '퀘스트를 불러오는 중...' : 'Loading quests...'}
            </Text>
          </View>
        )}

        {/* Zen 코인 획득 안내 */}
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
  quest: UserQuest; lang: string; onComplete: () => void; done?: boolean
}) {
  const title = lang === 'ko' ? quest.titleKo : quest.title;
  return (
    <View style={[s.card, done && s.cardDone]}>
      <View style={s.cardLeft}>
        <Text style={s.cardCheck}>{done ? '✓' : '○'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.cardTitle, done && s.cardTitleDone]}>{title}</Text>
          <Text style={s.cardDesc} numberOfLines={1}>{quest.description}</Text>
        </View>
      </View>

      <View style={s.cardRight}>
        <View style={s.rewardBadge}>
          <Text style={s.rewardText}>✦ {quest.coinsReward}</Text>
        </View>
        {!done && (
          <TouchableOpacity style={s.completeBtn} onPress={onComplete} activeOpacity={0.85}>
            <Text style={s.completeBtnText}>{lang === 'ko' ? '완료' : 'Done'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  header: { padding: 24, paddingBottom: 8 },
  title: { fontSize: 24, fontFamily: 'Fraunces_500Medium', color: COLORS.text, marginBottom: 4 },
  progressLabel: { fontSize: 13, color: COLORS.text2, fontFamily: 'DMSans_400Regular' },

  overallBar: { height: 4, backgroundColor: COLORS.border, marginHorizontal: 20, marginBottom: 20, borderRadius: 2, overflow: 'hidden' },
  overallFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 2 },

  sectionDivider: { fontSize: 12, color: COLORS.text3, fontFamily: 'DMSans_600SemiBold', marginHorizontal: 20, marginTop: 8, marginBottom: 8 },

  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 10, backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 14,
  },
  cardDone: { opacity: 0.5 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 12 },
  cardCheck: { fontSize: 18, color: COLORS.accent, width: 24 },
  cardTitle: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: COLORS.text, marginBottom: 2 },
  cardTitleDone: { textDecorationLine: 'line-through', color: COLORS.text3 },
  cardDesc: { fontSize: 11, color: COLORS.text3, fontFamily: 'DMSans_400Regular' },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  rewardBadge: { backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  rewardText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: COLORS.gold },
  completeBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  completeBtnText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: COLORS.text },

  emptyState: { alignItems: 'center', padding: 40, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 14, color: COLORS.text2, fontFamily: 'DMSans_400Regular' },

  tipCard: {
    marginHorizontal: 20, marginBottom: 24, marginTop: 8,
    backgroundColor: 'rgba(200,200,240,0.06)', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(200,200,240,0.10)',
  },
  tipText: { fontSize: 13, color: COLORS.text2, fontFamily: 'DMSans_400Regular', lineHeight: 20 },
});
