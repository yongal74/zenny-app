import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { CharacterDisplay } from '../../components/character/CharacterDisplay';
import { useCharacterStore } from '../../stores/characterStore';

export function HomeScreen() {
  const { character, lang } = useCharacterStore();

  const greeting = lang === 'ko' ? '좋은 하루예요 ✨' : 'Good day ✨';
  const dateStr = new Date().toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <LinearGradient colors={[...COLORS.gradient.header]} style={styles.header}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.date}>{dateStr}</Text>
          {/* Zen Coins */}
          <View style={styles.coinsRow}>
            <Text style={styles.coinsIcon}>✦</Text>
            <Text style={styles.coinsText}>{character ? 100 : 0} Zen Coins</Text>
          </View>
        </LinearGradient>

        {/* 캐릭터 카드 */}
        <View style={styles.characterCard}>
          <CharacterDisplay
            characterType={character?.characterType ?? 'hana'}
            level={character?.level ?? 1}
            bgTheme={character?.bgTheme ?? 'starlight'}
          />

          {/* EXP 바 */}
          <View style={styles.expBarWrapper}>
            <View style={styles.expBarBg}>
              <View style={[styles.expBarFill, { width: `${Math.min((character?.exp ?? 0) / 100 * 100, 100)}%` }]} />
            </View>
            <Text style={styles.expText}>{character?.exp ?? 0} EXP</Text>
          </View>
        </View>

        {/* 오늘 기분 체크 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {lang === 'ko' ? '오늘 기분이 어때요?' : 'How are you feeling today?'}
          </Text>
          <TouchableOpacity style={styles.checkinBtn} activeOpacity={0.85}>
            <Text style={styles.checkinBtnText}>
              {lang === 'ko' ? '✿ Zen AI와 대화하기' : '✿ Talk with Zen AI'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 일일 퀘스트 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {lang === 'ko' ? '오늘의 퀘스트' : 'Daily Quests'}
          </Text>
          {SAMPLE_QUESTS.map((q) => (
            <QuestCard key={q.id} quest={q} lang={lang} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const SAMPLE_QUESTS = [
  { id: '1', title: '2-Min Breathing', titleKo: '2분 호흡하기', coins: 20, done: false },
  { id: '2', title: 'Log Your Emotion', titleKo: '감정 기록하기', coins: 15, done: true },
  { id: '3', title: 'Evening Reflection', titleKo: '저녁 명상', coins: 50, done: false },
];

function QuestCard({ quest, lang }: { quest: typeof SAMPLE_QUESTS[0]; lang: string }) {
  return (
    <View style={[styles.questCard, quest.done && styles.questCardDone]}>
      <View style={styles.questLeft}>
        <Text style={styles.questCheck}>{quest.done ? '✓' : '○'}</Text>
        <Text style={[styles.questTitle, quest.done && styles.questTitleDone]}>
          {lang === 'ko' ? quest.titleKo : quest.title}
        </Text>
      </View>
      <View style={styles.questReward}>
        <Text style={styles.questCoin}>✦ {quest.coins}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },

  header: { padding: 24, paddingBottom: 16 },
  greeting: { fontSize: 22, fontFamily: 'Fraunces_500Medium', color: COLORS.text, marginBottom: 2 },
  date: { fontSize: 13, color: COLORS.text2, fontFamily: 'DMSans_400Regular' },
  coinsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  coinsIcon: { fontSize: 14, color: COLORS.gold },
  coinsText: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: COLORS.gold },

  characterCard: {
    margin: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },

  expBarWrapper: { width: '100%', gap: 4 },
  expBarBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  expBarFill: { height: '100%', backgroundColor: COLORS.teal, borderRadius: 3 },
  expText: { fontSize: 11, color: COLORS.text3, fontFamily: 'DMSans_400Regular', textAlign: 'right' },

  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: COLORS.text, marginBottom: 12 },

  checkinBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkinBtnText: { fontSize: 15, fontFamily: 'DMSans_600SemiBold', color: COLORS.text },

  questCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  questCardDone: { opacity: 0.5 },
  questLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  questCheck: { fontSize: 16, color: COLORS.accent },
  questTitle: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: COLORS.text, flex: 1 },
  questTitleDone: { textDecorationLine: 'line-through', color: COLORS.text3 },
  questReward: { backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  questCoin: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: COLORS.gold },
});
