/**
 * MeditationPlayerScreen — 세션 C: Dark Aurora + 타입별 색상 + 완료 리워드 모달
 *
 * 변경:
 * - 배경: aurora1 그라데이션
 * - TYPE_COLOR: breathing=teal / guided=purple / nature=green / bodyscan=blue
 * - outerGlow, breathCircle, progressBarFill, playBtn → 타입별 색상
 * - rewardBanner → full-screen gold 강조 Modal
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Animated, Dimensions, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { theme } from '../../constants/theme';
import { useCharacterStore } from '../../stores/characterStore';
import { apiClient } from '../../utils/api';
import type { MeditationTrack } from '../../types';

const { width: W } = Dimensions.get('window');

// 타입별 시그니처 색상 (A6 스펙)
const TYPE_COLOR: Record<string, string> = {
    breathing: '#2DD4BF',
    guided:    '#00D9A0',
    nature:    '#50B464',
    bodyscan:  '#40A4DF',
};
const TYPE_GLOW: Record<string, string> = {
    breathing: 'rgba(45,212,191,0.14)',
    guided:    'rgba(0,217,160,0.14)',
    nature:    'rgba(80,180,100,0.14)',
    bodyscan:  'rgba(64,164,223,0.14)',
};

// 호흡 유형별 타이밍 (초)
const BREATH_PATTERNS = {
    box:       { label: 'Box Breathing', phases: ['Inhale', 'Hold', 'Exhale', 'Hold'], durations: [4, 4, 4, 4] },
    '4-7-8':   { label: '4-7-8 Breathing', phases: ['Inhale', 'Hold', 'Exhale'], durations: [4, 7, 8] },
    coherent:  { label: 'Coherent', phases: ['Inhale', 'Exhale'], durations: [5, 5] },
    pranayama: { label: 'Pranayama', phases: ['Inhale', 'Hold', 'Exhale', 'Hold'], durations: [4, 16, 8, 0] },
};

interface MeditationPlayerProps {
    track: MeditationTrack;
    onClose: () => void;
    lang?: 'en' | 'ko';
}

export function MeditationPlayerScreen({ track, onClose, lang = 'en' }: MeditationPlayerProps) {
    const { updateExp, setZenCoins } = useCharacterStore();
    const [playing, setPlaying] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [breathPhase, setBreathPhase] = useState(0);
    const [breathPatternKey, setBreathPatternKey] = useState<keyof typeof BREATH_PATTERNS>('box');
    const [showBreath] = useState(track.type === 'breathing');
    const [rewardResult, setRewardResult] = useState<{ coinsGained: number; expGained: number } | null>(null);
    const [rewardClaimed, setRewardClaimed] = useState(false);
    const [showRewardModal, setShowRewardModal] = useState(false);

    const soundRef = useRef<Audio.Sound | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const breathIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 타입별 색상
    const typeColor = TYPE_COLOR[track.type] ?? theme.colors.purple;
    const typeGlow = TYPE_GLOW[track.type] ?? 'rgba(124,58,237,0.14)';

    // 애니메이션
    const glowAnim = useRef(new Animated.Value(0.8)).current;
    const breathAnim = useRef(new Animated.Value(1)).current;
    const rewardScaleAnim = useRef(new Animated.Value(0.7)).current;
    const rewardOpacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        return () => {
            soundRef.current?.unloadAsync();
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (breathIntervalRef.current) clearTimeout(breathIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 1.15, duration: 2200, useNativeDriver: true }),
                Animated.timing(glowAnim, { toValue: 0.8, duration: 2200, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    // 리워드 모달 열릴 때 spring 애니메이션
    useEffect(() => {
        if (showRewardModal) {
            Animated.parallel([
                Animated.spring(rewardScaleAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 }),
                Animated.timing(rewardOpacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
            ]).start();
        } else {
            rewardScaleAnim.setValue(0.7);
            rewardOpacityAnim.setValue(0);
        }
    }, [showRewardModal]);

    const claimReward = async () => {
        if (rewardClaimed) return;
        setRewardClaimed(true);
        try {
            const { data } = await apiClient.post('/meditation/complete', {
                trackId: track.id,
                trackType: track.type,
            });
            updateExp(data.expGained ?? 0);
            if (data.totalCoins !== undefined) setZenCoins(data.totalCoins);
            setRewardResult({ coinsGained: data.coinsGained, expGained: data.expGained });
            setShowRewardModal(true);
        } catch {
            // 409 (already claimed today) 등 무시
        }
    };

    const pattern = BREATH_PATTERNS[breathPatternKey];

    const animateBreath = (phase: number, duration: number) => {
        const isInhale = phase === 0;
        const isExhale = pattern.phases[phase] === 'Exhale';
        const scale = isInhale ? 1.3 : isExhale ? 0.85 : 1.0;
        Animated.timing(breathAnim, { toValue: scale, duration: duration * 900, useNativeDriver: true }).start();
    };

    const startBreathCycle = () => {
        let phaseIdx = 0;
        const runPhase = () => {
            setBreathPhase(phaseIdx);
            const dur = pattern.durations[phaseIdx];
            animateBreath(phaseIdx, dur);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            breathIntervalRef.current = setTimeout(() => {
                phaseIdx = (phaseIdx + 1) % pattern.phases.length;
                runPhase();
            }, dur * 1000);
        };
        runPhase();
    };

    const togglePlay = async () => {
        if (playing) {
            await soundRef.current?.pauseAsync();
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (breathIntervalRef.current) clearTimeout(breathIntervalRef.current);
            setPlaying(false);
        } else {
            if (!soundRef.current && track.audioUrl) {
                const { sound } = await Audio.Sound.createAsync(
                    { uri: track.audioUrl },
                    { shouldPlay: true, volume: 1.0 }
                );
                soundRef.current = sound;
            } else {
                await soundRef.current?.playAsync();
            }
            intervalRef.current = setInterval(() => {
                setElapsed((e) => {
                    if (e >= track.duration) {
                        clearInterval(intervalRef.current!);
                        setPlaying(false);
                        claimReward();
                        return track.duration;
                    }
                    return e + 1;
                });
            }, 1000);
            if (showBreath) startBreathCycle();
            setPlaying(true);
        }
    };

    const progress = elapsed / (track.duration || 120);
    const remainSec = Math.max(0, (track.duration || 120) - elapsed);
    const remainStr = `${String(Math.floor(remainSec / 60)).padStart(2, '0')}:${String(remainSec % 60).padStart(2, '0')}`;
    const currentPhase = pattern.phases[breathPhase] ?? '';
    const phaseKo: Record<string, string> = { Inhale: '들이쉬기', Hold: '멈추기', Exhale: '내쉬기' };

    return (
        <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
            <View style={s.container}>
                {/* 헤더 */}
                <View style={s.header}>
                    <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                        <Text style={s.closeText}>✕</Text>
                    </TouchableOpacity>
                    <Text style={[s.trackType, { color: typeColor }]}>{track.type.toUpperCase()}</Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* 글로우 원 + 호흡 애니메이션 */}
                <View style={s.centerArea}>
                    <Animated.View style={[s.outerGlow, { backgroundColor: typeGlow, transform: [{ scale: glowAnim }] }]} />
                    <Animated.View style={[s.breathCircle, { borderColor: typeColor + '40', transform: [{ scale: breathAnim }] }]}>
                        <Text style={s.breathEmoji}>
                            {track.type === 'breathing' ? '🌬️' : track.type === 'guided' ? '🔮' : track.type === 'nature' ? '🌿' : '🧘'}
                        </Text>
                    </Animated.View>
                    {showBreath && playing && (
                        <Text style={[s.phaseText, { color: typeColor }]}>
                            {lang === 'ko' ? (phaseKo[currentPhase] ?? currentPhase) : currentPhase}
                        </Text>
                    )}
                </View>

                {/* 트랙 정보 */}
                <View style={s.trackInfo}>
                    <Text style={s.trackTitle}>{lang === 'ko' ? track.titleKo || track.title : track.title}</Text>
                    <Text style={s.trackDuration}>{remainStr}</Text>
                </View>

                {/* 진행 바 */}
                <View style={s.progressBarBg}>
                    <View style={[s.progressBarFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: typeColor }]} />
                </View>

                {/* 호흡법 선택 */}
                {track.type === 'breathing' && (
                    <View style={s.patternRow}>
                        {(Object.keys(BREATH_PATTERNS) as Array<keyof typeof BREATH_PATTERNS>).map((key) => (
                            <TouchableOpacity
                                key={key}
                                style={[s.patternBtn, breathPatternKey === key && { backgroundColor: typeColor + '25', borderColor: typeColor + '80' }]}
                                onPress={() => setBreathPatternKey(key)}
                            >
                                <Text style={[s.patternText, breathPatternKey === key && { color: typeColor }]}>
                                    {BREATH_PATTERNS[key].label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* 컨트롤 */}
                <View style={s.controls}>
                    <TouchableOpacity style={[s.playBtn, { backgroundColor: typeColor }]} onPress={togglePlay} activeOpacity={0.85}>
                        <Text style={s.playIcon}>{playing ? '⏸' : '▶'}</Text>
                    </TouchableOpacity>
                </View>

                {/* 힌트 */}
                {!rewardResult && (
                    <Text style={s.hint}>
                        {lang === 'ko'
                            ? `완료 시 ${track.type === 'breathing' ? 30 : 50} Zen Coins 지급`
                            : `Earn ${track.type === 'breathing' ? 30 : 50} Zen Coins on completion ✦`}
                    </Text>
                )}
            </View>

            {/* ─── 완료 리워드 모달 (gold 강조) ─────────────────────── */}
            <Modal visible={showRewardModal} transparent animationType="none">
                <View style={s.modalOverlay}>
                    <Animated.View style={[s.rewardModal, { transform: [{ scale: rewardScaleAnim }], opacity: rewardOpacityAnim }]}>
                        {/* 별 글로우 */}
                        <Text style={s.rewardStar}>✦</Text>
                        <Text style={s.rewardTitle}>
                            {lang === 'ko' ? '명상 완료!' : 'Session Complete!'}
                        </Text>
                        <Text style={s.rewardSub}>
                            {lang === 'ko' ? '잘 하셨어요. 마음이 한결 가벼워졌을 거예요.' : 'Well done. Your mind is clearer now.'}
                        </Text>

                        {/* 보상 수치 */}
                        <View style={s.rewardNumbers}>
                            <View style={s.rewardItem}>
                                <Text style={s.rewardValue}>+{rewardResult?.coinsGained ?? 0}</Text>
                                <Text style={s.rewardLabel}>Zen Coins</Text>
                            </View>
                            <View style={s.rewardDivider} />
                            <View style={s.rewardItem}>
                                <Text style={s.rewardValue}>+{rewardResult?.expGained ?? 0}</Text>
                                <Text style={s.rewardLabel}>EXP</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={s.rewardCloseBtn}
                            onPress={() => { setShowRewardModal(false); onClose(); }}
                            activeOpacity={0.85}
                        >
                            <Text style={s.rewardCloseBtnText}>
                                {lang === 'ko' ? '확인' : 'Done'}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const CIRCLE = W * 0.52;

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.bg },
    container: { flex: 1, alignItems: 'center', paddingHorizontal: 24, backgroundColor: theme.colors.bg },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', paddingTop: 16, paddingBottom: 8,
    },
    closeBtn: {
        width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 22, justifyContent: 'center', alignItems: 'center',
    },
    closeText: { fontSize: 13, color: theme.colors.text.secondary, fontWeight: '600' },
    trackType: { fontSize: 12, letterSpacing: 2, fontFamily: 'Inter_600SemiBold' },

    centerArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    outerGlow: {
        position: 'absolute',
        width: CIRCLE + 80, height: CIRCLE + 80,
        borderRadius: (CIRCLE + 80) / 2,
    },
    breathCircle: {
        width: CIRCLE, height: CIRCLE, borderRadius: CIRCLE / 2,
        backgroundColor: 'rgba(25,25,31,0.8)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2,
    },
    breathEmoji: { fontSize: 64 },
    phaseText: {
        position: 'absolute', bottom: -44,
        fontSize: 18, fontFamily: 'Manrope_600SemiBold',
    },

    trackInfo: { alignItems: 'center', gap: 6, marginBottom: 16 },
    trackTitle: { fontSize: 20, fontFamily: 'Manrope_600SemiBold', color: theme.colors.text.primary, textAlign: 'center' },
    trackDuration: { fontSize: 32, fontFamily: 'Inter_700Bold', color: theme.colors.text.primary, letterSpacing: 2 },

    progressBarBg: { width: '100%', height: 4, backgroundColor: theme.colors.border, borderRadius: 2, marginBottom: 16 },
    progressBarFill: { height: '100%', borderRadius: 2 },

    patternRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 },
    patternBtn: {
        paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
        backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
        minHeight: theme.minTouchTarget, justifyContent: 'center',
    },
    patternText: { fontSize: 12, color: theme.colors.text.tertiary, fontFamily: 'Inter_600SemiBold' },

    controls: { marginBottom: 24 },
    playBtn: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
    playIcon: { fontSize: 28, color: '#FFFFFF' },

    hint: {
        fontSize: 12, color: theme.colors.text.tertiary,
        fontFamily: 'Inter_400Regular', marginBottom: 16, textAlign: 'center',
    },

    // ── 완료 리워드 모달 ──────────────────────────────────────
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 32,
    },
    rewardModal: {
        width: '100%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xxl,
        padding: 32,
        alignItems: 'center',
        gap: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(200,168,96,0.30)',
    },
    rewardStar: { fontSize: 40, color: theme.colors.gold },
    rewardTitle: {
        ...theme.typography.h2,
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    rewardSub: {
        ...theme.typography.body2,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    rewardNumbers: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(200,168,96,0.10)',
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: 'rgba(200,168,96,0.25)',
        paddingVertical: 16,
        paddingHorizontal: 24,
        marginTop: 8,
        gap: 24,
    },
    rewardItem: { alignItems: 'center', gap: 4 },
    rewardValue: { fontSize: 28, fontFamily: 'Inter_700Bold', color: theme.colors.gold },
    rewardLabel: { ...theme.typography.labelSm, color: theme.colors.text.tertiary },
    rewardDivider: { width: 1, height: 40, backgroundColor: 'rgba(200,168,96,0.25)' },
    rewardCloseBtn: {
        width: '100%',
        backgroundColor: theme.colors.gold,
        borderRadius: theme.radius.md,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
        minHeight: theme.minTouchTarget,
    },
    rewardCloseBtnText: { ...theme.typography.bold1, color: theme.colors.bg },
});
