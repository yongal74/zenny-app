/**
 * MeditationScreen - 세션 C: UI/UX 리팩터링
 *
 * 수정:
 * - theme.ts 기반 스타일 통일
 * - trackCardDur, trackListType: 11→12px
 * - 빈 상태 처리: isLoading / empty 분기
 * - trackListItem minHeight 44px
 * - 추천 트랙 카드 너비 고정 → 가독성 개선
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { theme } from '../../constants/theme';
import { useCharacterStore } from '../../stores/characterStore';
import { MeditationPlayerScreen } from './MeditationPlayerScreen';
import type { MeditationTrack } from '../../types';
import { apiClient } from '../../utils/api';

const TYPE_EMOJI: Record<string, string> = {
  breathing: '🌬️',
  bodyscan: '🧘',
  guided: '🔮',
  nature: '🌿',
};
const TYPE_LABEL_KO: Record<string, string> = {
  breathing: '호흡',
  bodyscan: '바디스캔',
  guided: '가이드',
  nature: '자연',
};
// A6 스펙: breathing=teal, guided=purple, nature=green, bodyscan=blue
const TYPE_ICON_BG: Record<string, string> = {
  breathing: 'rgba(45,212,191,0.18)',
  guided:    'rgba(124,58,237,0.18)',
  nature:    'rgba(80,180,100,0.18)',
  bodyscan:  'rgba(64,164,223,0.18)',
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function MeditationScreen(): React.JSX.Element {
  const [selectedTrack, setSelectedTrack] = useState<MeditationTrack | null>(null);
  const { lang } = useCharacterStore();

  const { data: recommended = [], isLoading: recLoading, isError: recError } = useQuery({
    queryKey: ['recommended-tracks', lang],
    queryFn: async () => {
      const { data } = await apiClient.get('/meditation/recommend', { params: { lang } });
      return data.tracks ?? [];
    },
  });

  const { data: allTracks = [], isLoading: allLoading, isError: allError } = useQuery({
    queryKey: ['all-tracks', lang],
    queryFn: async () => {
      const { data } = await apiClient.get('/meditation/tracks', { params: { lang } });
      return data ?? [];
    },
  });

  const isLoading = recLoading || allLoading;
  const isError = recError || allError;

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
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>{lang === 'ko' ? '명상' : 'Meditation'}</Text>
          <Text style={s.subtitle}>
            {lang === 'ko' ? '마음의 평온을 찾아보세요' : 'Find your inner peace'}
          </Text>
        </View>

        {/* 빈 상태 처리 */}
        {isLoading ? (
          <View style={s.emptyState}>
            <Text style={s.emptyText}>
              {lang === 'ko' ? '트랙 불러오는 중...' : 'Loading tracks...'}
            </Text>
          </View>
        ) : isError ? (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>⚠️</Text>
            <Text style={s.emptyText}>
              {lang === 'ko'
                ? '트랙을 불러오지 못했어요.\n잠시 후 다시 시도해 주세요.'
                : 'Could not load tracks.\nPlease try again.'}
            </Text>
          </View>
        ) : (
          <>
            {/* 추천 트랙 (가로 스크롤) */}
            {recommended.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>
                  {lang === 'ko' ? '✦ 추천' : '✦ Recommended'}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.trackRow}
                >
                  {recommended.slice(0, 5).map((track: MeditationTrack) => (
                    <TouchableOpacity
                      key={track.id}
                      style={s.trackCard}
                      onPress={() => setSelectedTrack(track)}
                      activeOpacity={0.85}
                    >
                      <View style={[s.trackCardIcon, { backgroundColor: TYPE_ICON_BG[track.type] ?? 'rgba(136,136,160,0.15)' }]} />
                      <Text style={s.trackCardTitle} numberOfLines={2}>
                        {lang === 'ko' ? (track.titleKo || track.title) : track.title}
                      </Text>
                      {/* 11→12px */}
                      <Text style={s.trackCardDur}>{formatDuration(track.duration)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 전체 트랙 목록 */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>
                {lang === 'ko' ? '전체 트랙' : 'All Tracks'}
              </Text>

              {allTracks.length === 0 ? (
                <View style={s.emptyState}>
                  <Text style={s.emptyEmoji}>🎵</Text>
                  <Text style={s.emptyText}>
                    {lang === 'ko'
                      ? '아직 트랙이 없어요.\n곧 업데이트될 예정이에요!'
                      : 'No tracks available yet.\nCheck back soon!'}
                  </Text>
                </View>
              ) : (
                allTracks.map((track: MeditationTrack) => (
                  <TouchableOpacity
                    key={track.id}
                    style={s.trackListItem}
                    onPress={() => setSelectedTrack(track)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.trackListIcon, { backgroundColor: TYPE_ICON_BG[track.type] ?? 'rgba(136,136,160,0.15)' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.trackListTitle} numberOfLines={1}>
                        {lang === 'ko' ? (track.titleKo || track.title) : track.title}
                      </Text>
                      {/* 11→12px */}
                      <Text style={s.trackListType}>
                        {lang === 'ko' ? (TYPE_LABEL_KO[track.type] ?? track.type) : track.type}
                      </Text>
                    </View>
                    <Text style={s.trackListDur}>
                      {Math.floor(track.duration / 60)} min
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },

  header: { paddingHorizontal: theme.spacing.xxl, paddingTop: theme.spacing.xxl, paddingBottom: theme.spacing.lg },
  title: { ...theme.typography.h2, color: theme.colors.text.primary },
  subtitle: { ...theme.typography.body3, color: theme.colors.text.secondary, marginTop: 6 },

  section: { paddingHorizontal: theme.spacing.xl, marginBottom: theme.spacing.xxl },
  sectionTitle: { ...theme.typography.bold1, color: theme.colors.text.primary, marginBottom: theme.spacing.lg },

  // 추천 카드 (가로 스크롤) — 글래스모피즘
  trackRow: { gap: theme.spacing.md, paddingRight: theme.spacing.xl },
  trackCard: {
    width: 148,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    gap: 10,
  },
  trackCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackEmoji: { fontSize: 24 },
  trackCardTitle: { ...theme.typography.bold2, color: theme.colors.text.primary, lineHeight: 20 },
  trackCardDur: { ...theme.typography.caption, color: theme.colors.text.tertiary },

  // 전체 트랙 리스트 — 글래스모피즘
  trackListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: 10,
    minHeight: 64,
  },
  trackListIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackListEmoji: { fontSize: 24 },
  trackListTitle: { ...theme.typography.bold2, color: theme.colors.text.primary },
  trackListType: { ...theme.typography.caption, color: theme.colors.text.tertiary, marginTop: 3 },
  trackListDur: { ...theme.typography.body3, color: theme.colors.text.secondary },

  // 빈 상태
  emptyState: { alignItems: 'center', padding: 48, gap: 12 },
  emptyEmoji: { fontSize: 44 },
  emptyText: { ...theme.typography.body2, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 22 },
});
