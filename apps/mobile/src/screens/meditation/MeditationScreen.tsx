import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { COLORS } from '../../constants/colors';
import { useCharacterStore } from '../../stores/characterStore';
import { MeditationPlayerScreen } from './MeditationPlayerScreen';
import type { MeditationTrack } from '../../types';
import { apiClient } from '../../utils/api';

const TYPE_EMOJI: Record<string, string> = { breathing: '🌬️', bodyscan: '🧘', guided: '✿', nature: '🌿' };
const TYPE_LABEL_KO: Record<string, string> = { breathing: '호흡', bodyscan: '바디스캔', guided: '가이드', nature: '자연' };

export function MeditationScreen() {
  const [selectedTrack, setSelectedTrack] = useState<MeditationTrack | null>(null);
  const { lang } = useCharacterStore();

  const { data: recommended = [] } = useQuery({
    queryKey: ['recommended-tracks'],
    queryFn: async () => {
      const { data } = await apiClient.get('/meditation/recommend', { params: { lang } });
      return data.tracks ?? [];
    },
  });

  const { data: allTracks = [] } = useQuery({
    queryKey: ['all-tracks', lang],
    queryFn: async () => {
      const { data } = await apiClient.get('/meditation/tracks', { params: { lang } });
      return data ?? [];
    },
  });

  if (selectedTrack) {
    return (
      <MeditationPlayerScreen
        track={selectedTrack}
        onClose={() => setSelectedTrack(null)}
        lang={lang}
      />
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>{lang === 'ko' ? '🧘 명상' : '🧘 Meditation'}</Text>
          <Text style={s.subtitle}>{lang === 'ko' ? '마음의 평온을 찾아보세요' : 'Find your inner peace'}</Text>
        </View>

        {recommended.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{lang === 'ko' ? '✦ 추천' : '✦ Recommended'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.trackRow}>
              {recommended.slice(0, 5).map((track: MeditationTrack) => (
                <TouchableOpacity key={track.id} style={s.trackCard} onPress={() => setSelectedTrack(track)} activeOpacity={0.85}>
                  <View style={s.trackCardIcon}>
                    <Text style={s.trackEmoji}>{TYPE_EMOJI[track.type] ?? '✿'}</Text>
                  </View>
                  <Text style={s.trackCardTitle} numberOfLines={2}>
                    {lang === 'ko' ? (track.titleKo || track.title) : track.title}
                  </Text>
                  <Text style={s.trackCardDur}>{Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={s.section}>
          <Text style={s.sectionTitle}>{lang === 'ko' ? '전체 트랙' : 'All Tracks'}</Text>
          {allTracks.map((track: MeditationTrack) => (
            <TouchableOpacity key={track.id} style={s.trackListItem} onPress={() => setSelectedTrack(track)} activeOpacity={0.8}>
              <View style={s.trackListIcon}>
                <Text style={{ fontSize: 22 }}>{TYPE_EMOJI[track.type] ?? '✿'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.trackListTitle} numberOfLines={1}>
                  {lang === 'ko' ? (track.titleKo || track.title) : track.title}
                </Text>
                <Text style={s.trackListType}>{lang === 'ko' ? TYPE_LABEL_KO[track.type] ?? track.type : track.type}</Text>
              </View>
              <Text style={s.trackListDur}>{Math.floor(track.duration / 60)} min</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  header: { padding: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontFamily: 'Fraunces_500Medium', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.text2, fontFamily: 'DMSans_400Regular', marginTop: 4 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: COLORS.text, marginBottom: 12 },
  trackRow: { gap: 12, paddingRight: 8 },
  trackCard: { width: 140, backgroundColor: COLORS.surface, borderRadius: 16, padding: 14, gap: 8 },
  trackCardIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  trackEmoji: { fontSize: 22 },
  trackCardTitle: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: COLORS.text, lineHeight: 18 },
  trackCardDur: { fontSize: 11, color: COLORS.text3, fontFamily: 'DMSans_400Regular' },
  trackListItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 8 },
  trackListIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  trackListTitle: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: COLORS.text },
  trackListType: { fontSize: 11, color: COLORS.text3, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  trackListDur: { fontSize: 12, color: COLORS.text2, fontFamily: 'DMSans_400Regular' },
});
