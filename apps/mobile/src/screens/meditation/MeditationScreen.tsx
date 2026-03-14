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
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
const TYPE_LABEL: Record<string, string> = {
  breathing: 'Breathing',
  bodyscan:  'Body Scan',
  guided:    'Guided',
  nature:    'Nature',
};
const TYPE_LABEL_KO: Record<string, string> = {
  breathing: '호흡',
  bodyscan:  '바디스캔',
  guided:    '가이드',
  nature:    '자연',
};
const TYPE_ORDER = ['nature', 'breathing', 'guided', 'bodyscan'];
const TYPE_COLOR: Record<string, string> = {
  breathing: '#2DD4BF',
  guided:    '#00E8A8',
  bodyscan:  '#60B8FF',
  nature:    '#4ADE80',
};
// 타입별 컬러 오버레이 (틸 계열로 통일, 틴트만 다름)
const TYPE_OVERLAY: Record<string, string> = {
  breathing: 'rgba(0,217,160,0.35)',
  guided:    'rgba(0,200,180,0.35)',
  nature:    'rgba(20,180,130,0.35)',
  bodyscan:  'rgba(0,180,210,0.35)',
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
                      <ImageBackground
                        source={track.imageUrl ? { uri: track.imageUrl } : undefined}
                        style={s.trackCardImage}
                        imageStyle={{ borderRadius: 0 }}
                        resizeMode="cover"
                      >
                        <View style={[s.trackCardOverlay, { backgroundColor: TYPE_OVERLAY[track.type] ?? 'rgba(0,100,80,0.35)' }]} />
                      </ImageBackground>
                      <Text style={s.trackCardTitle} numberOfLines={2}>
                        {lang === 'ko' ? (track.titleKo || track.title) : track.title}
                      </Text>
                      <Text style={s.trackCardDur}>{formatDuration(track.duration)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 유형별 섹션 */}
            {allTracks.length === 0 ? (
              <View style={s.section}>
                <View style={s.emptyState}>
                  <Text style={s.emptyEmoji}>🎵</Text>
                  <Text style={s.emptyText}>
                    {lang === 'ko' ? '아직 트랙이 없어요.' : 'No tracks available yet.'}
                  </Text>
                </View>
              </View>
            ) : (
              TYPE_ORDER.map(type => {
                const tracks = allTracks.filter((t: MeditationTrack) => t.type === type);
                if (tracks.length === 0) return null;
                const color = TYPE_COLOR[type] ?? theme.colors.accent;
                return (
                  <View key={type} style={s.section}>
                    {/* 섹션 헤더 */}
                    <View style={s.typeSectionHeader}>
                      <View style={[s.typeTag, { backgroundColor: color + '18', borderColor: color + '40' }]}>
                        <Text style={s.typeTagEmoji}>{TYPE_EMOJI[type]}</Text>
                        <Text style={[s.typeTagLabel, { color }]}>
                          {lang === 'ko' ? TYPE_LABEL_KO[type] : TYPE_LABEL[type]}
                        </Text>
                      </View>
                      <Text style={s.typeTrackCount}>{tracks.length} tracks</Text>
                    </View>

                    {tracks.map((track: MeditationTrack) => (
                      <TouchableOpacity
                        key={track.id}
                        style={s.trackListItem}
                        onPress={() => setSelectedTrack(track)}
                        activeOpacity={0.8}
                      >
                        <ImageBackground
                          source={track.imageUrl ? { uri: track.imageUrl } : undefined}
                          style={s.trackListImage}
                          imageStyle={{ borderRadius: theme.radius.md }}
                        >
                          <View style={[StyleSheet.absoluteFill, { borderRadius: theme.radius.md, backgroundColor: TYPE_OVERLAY[track.type] ?? 'rgba(0,100,80,0.35)' }]} />
                        </ImageBackground>
                        <View style={{ flex: 1 }}>
                          <Text style={s.trackListTitle} numberOfLines={1}>
                            {lang === 'ko' ? (track.titleKo || track.title) : track.title}
                          </Text>
                          <Text style={[s.trackListType, { color }]}>
                            {lang === 'ko' ? (TYPE_LABEL_KO[track.type] ?? track.type) : TYPE_LABEL[track.type] ?? track.type}
                          </Text>
                        </View>
                        <Text style={s.trackListDur}>
                          {Math.floor(track.duration / 60)} min
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })
            )}
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

  // 추천 카드 (가로 스크롤) — 이미지 카드
  trackRow: { gap: theme.spacing.md, paddingRight: theme.spacing.xl },
  trackCard: {
    width: 148,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    gap: 8,
    paddingBottom: theme.spacing.md,
  },
  trackCardImage: {
    width: 148,
    height: 104,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  trackCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.radius.xl,
  },
  trackCardEmoji: { fontSize: 22, zIndex: 1 },
  trackCardTitle: { ...theme.typography.bold2, color: theme.colors.text.primary, lineHeight: 20, paddingHorizontal: theme.spacing.md },
  trackCardDur: { ...theme.typography.caption, color: theme.colors.text.tertiary, paddingHorizontal: theme.spacing.md },

  // 전체 트랙 리스트 — 이미지 썸네일
  trackListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 10,
    minHeight: 64,
    overflow: 'hidden',
  },
  trackListImage: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  trackListEmoji: { fontSize: 22, zIndex: 1 },
  trackListTitle: { ...theme.typography.bold2, color: theme.colors.text.primary },
  trackListType: { ...theme.typography.caption, color: theme.colors.text.tertiary, marginTop: 3 },
  trackListDur: { ...theme.typography.body3, color: theme.colors.text.secondary },

  // 유형별 섹션 헤더
  typeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  typeTagEmoji: { fontSize: 15 },
  typeTagLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.3,
  },
  typeTrackCount: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.text.tertiary,
  },

  // 빈 상태
  emptyState: { alignItems: 'center', padding: 48, gap: 12 },
  emptyEmoji: { fontSize: 44 },
  emptyText: { ...theme.typography.body2, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 22 },
});
