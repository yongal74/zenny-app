import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Animated, Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/colors';
import type { MeditationTrack } from '../../types';

const { width: W } = Dimensions.get('window');

// 호흡 유형별 타이밍 (초)
const BREATH_PATTERNS = {
    box: { label: 'Box Breathing', phases: ['Inhale', 'Hold', 'Exhale', 'Hold'], durations: [4, 4, 4, 4] },
    '4-7-8': { label: '4-7-8 Breathing', phases: ['Inhale', 'Hold', 'Exhale'], durations: [4, 7, 8] },
    coherent: { label: 'Coherent', phases: ['Inhale', 'Exhale'], durations: [5, 5] },
    pranayama: { label: 'Pranayama', phases: ['Inhale', 'Hold', 'Exhale', 'Hold'], durations: [4, 16, 8, 0] },
};

interface MeditationPlayerProps {
    track: MeditationTrack;
    onClose: () => void;
    lang?: 'en' | 'ko';
}

export function MeditationPlayerScreen({ track, onClose, lang = 'en' }: MeditationPlayerProps) {
    const [playing, setPlaying] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [breathPhase, setBreathPhase] = useState(0);
    const [breathPatternKey, setBreathPatternKey] = useState<keyof typeof BREATH_PATTERNS>('box');
    const [showBreath, setShowBreath] = useState(track.type === 'breathing');

    const soundRef = useRef<Audio.Sound | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const breathIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // 글로우 애니메이션
    const glowAnim = useRef(new Animated.Value(0.8)).current;
    const breathAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        return () => {
            soundRef.current?.unloadAsync();
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        // 글로우 루프
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 1.1, duration: 2000, useNativeDriver: true }),
                Animated.timing(glowAnim, { toValue: 0.8, duration: 2000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const pattern = BREATH_PATTERNS[breathPatternKey];

    const animateBreath = (phase: number, duration: number) => {
        const isInhale = phase === 0;
        const isExhale = pattern.phases[phase] === 'Exhale';
        const scale = isInhale ? 1.3 : isExhale ? 0.85 : 1.0;
        Animated.timing(breathAnim, {
            toValue: scale,
            duration: duration * 900,
            useNativeDriver: true,
        }).start();
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
            // 일시정지
            await soundRef.current?.pauseAsync();
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (breathIntervalRef.current) clearTimeout(breathIntervalRef.current);
            setPlaying(false);
        } else {
            // 재생
            if (!soundRef.current && track.audioUrl) {
                const { sound } = await Audio.Sound.createAsync(
                    { uri: track.audioUrl },
                    { shouldPlay: true, volume: 1.0 }
                );
                soundRef.current = sound;
            } else {
                await soundRef.current?.playAsync();
            }
            // 타이머
            intervalRef.current = setInterval(() => {
                setElapsed((e) => {
                    if (e >= track.duration) {
                        clearInterval(intervalRef.current!);
                        setPlaying(false);
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
            <LinearGradient colors={[...COLORS.gradient.header]} style={s.container}>
                {/* 헤더 */}
                <View style={s.header}>
                    <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                        <Text style={s.closeText}>✕</Text>
                    </TouchableOpacity>
                    <Text style={s.trackType}>{track.type.toUpperCase()}</Text>
                    <View style={{ width: 36 }} />
                </View>

                {/* 글로우 원 + 호흡 애니메이션 */}
                <View style={s.centerArea}>
                    <Animated.View style={[s.outerGlow, { transform: [{ scale: glowAnim }] }]} />
                    <Animated.View style={[s.breathCircle, { transform: [{ scale: breathAnim }] }]}>
                        <Text style={s.breathEmoji}>✿</Text>
                    </Animated.View>

                    {/* 호흡 단계 텍스트 */}
                    {showBreath && playing && (
                        <Text style={s.phaseText}>
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
                    <Animated.View style={[s.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
                </View>

                {/* 호흡법 선택 (breathing 타입일 때) */}
                {track.type === 'breathing' && (
                    <View style={s.patternRow}>
                        {(Object.keys(BREATH_PATTERNS) as Array<keyof typeof BREATH_PATTERNS>).map((key) => (
                            <TouchableOpacity
                                key={key}
                                style={[s.patternBtn, breathPatternKey === key && s.patternBtnActive]}
                                onPress={() => setBreathPatternKey(key)}
                            >
                                <Text style={[s.patternText, breathPatternKey === key && s.patternTextActive]}>
                                    {BREATH_PATTERNS[key].label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* 컨트롤 */}
                <View style={s.controls}>
                    {/* 재생/정지 */}
                    <TouchableOpacity style={s.playBtn} onPress={togglePlay} activeOpacity={0.85}>
                        <Text style={s.playIcon}>{playing ? '⏸' : '▶'}</Text>
                    </TouchableOpacity>
                </View>

                {/* 하단 안내 */}
                <Text style={s.hint}>
                    {lang === 'ko'
                        ? '명상 후 10~50 Zen Coins 지급됩니다'
                        : 'Complete session to earn 10–50 Zen Coins ✦'}
                </Text>
            </LinearGradient>
        </SafeAreaView>
    );
}

const CIRCLE = W * 0.52;
const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    container: { flex: 1, alignItems: 'center', paddingHorizontal: 24 },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingTop: 16, paddingBottom: 8 },
    closeBtn: { width: 36, height: 36, backgroundColor: COLORS.surface, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    closeText: { fontSize: 13, color: COLORS.text2, fontWeight: '600' },
    trackType: { fontSize: 11, letterSpacing: 2, color: COLORS.text3, fontFamily: 'DMSans_600SemiBold' },

    centerArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    outerGlow: { position: 'absolute', width: CIRCLE + 60, height: CIRCLE + 60, borderRadius: (CIRCLE + 60) / 2, backgroundColor: 'rgba(200,200,240,0.05)' },
    breathCircle: { width: CIRCLE, height: CIRCLE, borderRadius: CIRCLE / 2, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(200,200,240,0.15)' },
    breathEmoji: { fontSize: 64 },
    phaseText: { position: 'absolute', bottom: -40, fontSize: 18, fontFamily: 'Fraunces_500Medium', color: COLORS.text },

    trackInfo: { alignItems: 'center', gap: 6, marginBottom: 16 },
    trackTitle: { fontSize: 20, fontFamily: 'Fraunces_500Medium', color: COLORS.text, textAlign: 'center' },
    trackDuration: { fontSize: 32, fontFamily: 'DMSans_700Bold', color: COLORS.text, letterSpacing: 2 },

    progressBarBg: { width: '100%', height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginBottom: 16 },
    progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },

    patternRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 },
    patternBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
    patternBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    patternText: { fontSize: 11, color: COLORS.text3, fontFamily: 'DMSans_600SemiBold' },
    patternTextActive: { color: COLORS.text },

    controls: { marginBottom: 24 },
    playBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    playIcon: { fontSize: 28, color: COLORS.text },

    hint: { fontSize: 12, color: COLORS.text3, fontFamily: 'DMSans_400Regular', marginBottom: 16, textAlign: 'center' },
});
