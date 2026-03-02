import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Dimensions, Animated, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { useCharacterStore } from '../../stores/characterStore';
import type { CharacterType } from '../../types';

const { width: W } = Dimensions.get('window');

// ─── 캐릭터 5종 정의 ──────────────────────────────────────────
const CHARACTERS: Array<{
    type: CharacterType;
    name: string;
    emoji: string;
    tagline: string;
    taglineKo: string;
    personality: string;
    personalityKo: string;
    color: string;
}> = [
        {
            type: 'hana',
            name: 'Hana',
            emoji: '🌸',
            tagline: 'Warm & Nurturing',
            taglineKo: '따뜻하고 포근한',
            personality: 'Hana embraces you with unconditional warmth. Grounded in loving-kindness meditation and CBT.',
            personalityKo: '하나는 따뜻한 사랑으로 당신을 감싸줍니다. 자애 명상과 CBT를 기반으로 합니다.',
            color: '#EC4899',
        },
        {
            type: 'sora',
            name: 'Sora',
            emoji: '☁️',
            tagline: 'Calm & Intellectual',
            taglineKo: '차분하고 지적인',
            personality: 'Sora guides you with clarity and insight. Rooted in Stoic philosophy and neuroscience.',
            personalityKo: '소라는 명료하고 통찰력 있는 가이드입니다. 스토아 철학과 신경과학을 기반으로 합니다.',
            color: '#6366F1',
        },
        {
            type: 'tora',
            name: 'Tora',
            emoji: '🦊',
            tagline: 'Energetic & Action-Oriented',
            taglineKo: '활기차고 실천적인',
            personality: 'Tora ignites your inner fire. Inspired by breathwork and mindful movement.',
            personalityKo: '토라는 당신의 내면의 불꽃을 일깨웁니다. 호흡법과 마음챙김 움직임을 기반으로 합니다.',
            color: '#F59E0B',
        },
        {
            type: 'mizu',
            name: 'Mizu',
            emoji: '💧',
            tagline: 'Gentle & Deeply Empathetic',
            taglineKo: '부드럽고 깊이 공감하는',
            personality: 'Mizu flows with your emotions. Rooted in Vipassana and somatic awareness.',
            personalityKo: '미즈는 당신의 감정과 함께 흐릅니다. 위빠사나와 신체 인식을 기반으로 합니다.',
            color: '#22D3EE',
        },
        {
            type: 'kaze',
            name: 'Kaze',
            emoji: '🍃',
            tagline: 'Free-Spirited & Intuitive',
            taglineKo: '자유롭고 직관적인',
            personality: 'Kaze inspires you to trust your inner wisdom. Grounded in Zen and nature therapy.',
            personalityKo: '카제는 내면의 지혜를 믿도록 영감을 줍니다. 선(禪)과 자연 치유를 기반으로 합니다.',
            color: '#4ADE80',
        },
    ];

interface OnboardingScreenProps {
    lang?: 'en' | 'ko';
}

export function OnboardingScreen({ lang = 'en' }: OnboardingScreenProps) {
    const [selected, setSelected] = useState<CharacterType | null>(null);
    const [step, setStep] = useState<'select' | 'confirm'>('select');
    const navigation = useNavigation<any>();
    const { setCharacter } = useCharacterStore();

    const selectedChar = CHARACTERS.find((c) => c.type === selected);

    const handleConfirm = () => {
        if (!selected || !selectedChar) return;
        setCharacter({
            userId: '',
            characterType: selected,
            level: 1,
            exp: 0,
            hunger: 100,
            mood: 100,
            equippedSkin: 'starlight',
            equippedItems: {},
            ownedItems: [],
            bgTheme: 'starlight',
            lastFedAt: new Date().toISOString(),
        });
        navigation.replace('Main');
    };

    if (step === 'confirm' && selectedChar) {
        return (
            <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
                <LinearGradient colors={[COLORS.bg2, COLORS.bg]} style={styles.confirmContainer}>
                    {/* 캐릭터 대형 표시 */}
                    <View style={[styles.bigCharCircle, { borderColor: selectedChar.color + '55' }]}>
                        <Text style={styles.bigEmoji}>{selectedChar.emoji}</Text>
                    </View>

                    <Text style={styles.confirmName}>{selectedChar.name}</Text>
                    <Text style={styles.confirmTagline}>
                        {lang === 'ko' ? selectedChar.taglineKo : selectedChar.tagline}
                    </Text>
                    <Text style={styles.confirmPersonality}>
                        {lang === 'ko' ? selectedChar.personalityKo : selectedChar.personality}
                    </Text>

                    {/* Lv1 시작 뱃지 */}
                    <View style={styles.levelBadge}>
                        <Text style={styles.levelBadgeText}>Lv.1 Seed — Your journey begins 🌱</Text>
                    </View>

                    <View style={styles.confirmBtns}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => setStep('select')} activeOpacity={0.8}>
                            <Text style={styles.backBtnText}>← Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.startBtn, { backgroundColor: selectedChar.color }]}
                            onPress={handleConfirm}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.startBtnText}>
                                {lang === 'ko' ? '시작하기 ✦' : 'Begin Journey ✦'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <View style={styles.container}>
                {/* 헤더 */}
                <View style={styles.header}>
                    <Text style={styles.logo}>✿ Zenny</Text>
                    <Text style={styles.subtitle}>
                        {lang === 'ko' ? '당신의 명상 친구를 선택하세요' : 'Choose your companion'}
                    </Text>
                </View>

                {/* MVP 안내 (3종 먼저, 나머지 잠금) */}
                <Text style={styles.mvpNote}>
                    {lang === 'ko' ? '3종 무료 · 2종은 Lv.3 이후 해금' : '3 free · 2 unlock at Lv.3'}
                </Text>

                {/* 캐릭터 카드 리스트 */}
                <ScrollView contentContainerStyle={styles.charList} showsVerticalScrollIndicator={false}>
                    {CHARACTERS.map((char, idx) => {
                        const isLocked = idx >= 3;  // MVP: 처음 3종만 선택 가능
                        const isSelected = selected === char.type;

                        return (
                            <TouchableOpacity
                                key={char.type}
                                style={[
                                    styles.charCard,
                                    isSelected && { borderColor: char.color },
                                    isLocked && styles.charCardLocked,
                                ]}
                                onPress={() => !isLocked && setSelected(char.type)}
                                activeOpacity={isLocked ? 1 : 0.85}
                            >
                                {/* 이모지 */}
                                <View style={[styles.charEmojiWrap, { backgroundColor: char.color + '22' }]}>
                                    <Text style={styles.charEmoji}>{char.emoji}</Text>
                                </View>

                                {/* 텍스트 */}
                                <View style={styles.charInfo}>
                                    <Text style={styles.charName}>{char.name}</Text>
                                    <Text style={styles.charTagline}>
                                        {lang === 'ko' ? char.taglineKo : char.tagline}
                                    </Text>
                                </View>

                                {/* 선택 체크 / 잠금 */}
                                {isLocked ? (
                                    <View style={styles.lockBadge}>
                                        <Text style={styles.lockText}>🔒 Lv.3</Text>
                                    </View>
                                ) : (
                                    <View style={[styles.checkCircle, isSelected && { backgroundColor: char.color }]}>
                                        {isSelected && <Text style={styles.checkMark}>✓</Text>}
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* 선택 버튼 */}
                <TouchableOpacity
                    style={[styles.nextBtn, !selected && styles.nextBtnDisabled]}
                    onPress={() => selected && setStep('confirm')}
                    disabled={!selected}
                    activeOpacity={0.85}
                >
                    <Text style={styles.nextBtnText}>
                        {selected
                            ? `${lang === 'ko' ? '선택' : 'Select'} ${selectedChar?.name} ${selectedChar?.emoji}`
                            : lang === 'ko' ? '캐릭터를 선택하세요' : 'Select a character'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    container: { flex: 1, paddingHorizontal: 20 },

    header: { alignItems: 'center', paddingTop: 24, paddingBottom: 12 },
    logo: { fontSize: 28, fontFamily: 'Fraunces_500Medium', color: COLORS.text, marginBottom: 4 },
    subtitle: { fontSize: 15, color: COLORS.text2, fontFamily: 'DMSans_400Regular' },
    mvpNote: { fontSize: 12, color: COLORS.text3, textAlign: 'center', marginBottom: 16, fontFamily: 'DMSans_400Regular' },

    // 캐릭터 목록
    charList: { paddingBottom: 16, gap: 12 },
    charCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: 'transparent',
        gap: 14,
    },
    charCardLocked: { opacity: 0.45 },
    charEmojiWrap: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
    charEmoji: { fontSize: 26 },
    charInfo: { flex: 1 },
    charName: { fontSize: 17, fontFamily: 'Fraunces_500Medium', color: COLORS.text, marginBottom: 2 },
    charTagline: { fontSize: 12, color: COLORS.text2, fontFamily: 'DMSans_400Regular' },
    checkCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
    checkMark: { fontSize: 13, fontWeight: '700', color: '#fff' },
    lockBadge: { backgroundColor: COLORS.surface2, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    lockText: { fontSize: 11, color: COLORS.text3, fontFamily: 'DMSans_600SemiBold' },

    // 선택 버튼
    nextBtn: { backgroundColor: COLORS.primary, borderRadius: 16, height: 54, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    nextBtnDisabled: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
    nextBtnText: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: COLORS.text },

    // 확인 화면
    confirmContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
    bigCharCircle: { width: 130, height: 130, borderRadius: 65, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 2, marginBottom: 8 },
    bigEmoji: { fontSize: 60 },
    confirmName: { fontSize: 32, fontFamily: 'Fraunces_500Medium', color: COLORS.text },
    confirmTagline: { fontSize: 14, color: COLORS.text2, fontFamily: 'DMSans_400Regular' },
    confirmPersonality: { fontSize: 14, color: COLORS.text2, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 22 },
    levelBadge: { backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary },
    levelBadgeText: { fontSize: 13, color: COLORS.accent, fontFamily: 'DMSans_600SemiBold' },
    confirmBtns: { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
    backBtn: { flex: 1, height: 50, borderRadius: 14, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
    backBtnText: { fontSize: 15, color: COLORS.text2, fontFamily: 'DMSans_600SemiBold' },
    startBtn: { flex: 2, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    startBtnText: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: '#fff' },
});
