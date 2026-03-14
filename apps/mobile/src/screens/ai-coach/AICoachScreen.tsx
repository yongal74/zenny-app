/**
 * AICoachScreen — 세션 C: 3-Zone Conversational UI 리팩터링
 *
 * Zone 1: Character Zone
 *   - Welcome: Dark Aurora 배경 + CharacterDisplay full (compact=false)
 *   - In-chat: 90px 헤더 + 캐릭터 인라인 아바타 (400ms animated)
 *
 * Zone 2: Active Question (Pure Focus)
 *   - 마지막 AI 메시지를 큰 폰트로 전체 집중 표시
 *   - QuickReply 카드: 보라 글로우 스타일 (A6 스펙)
 *   - 입력창 하단 고정
 *
 * Zone 3: History Zone
 *   - 기본: 접힘 (height=0)
 *   - 핸들 탭 / 스와이프업: 펼침 (max 40vh)
 *   - Card Pair: AI 카드(보라 border) + 사용자 카드(teal border, 들여쓰기)
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Animated, KeyboardAvoidingView, Platform, Dimensions, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { CharacterDisplay } from '../../components/character/CharacterDisplay';
import { QuickReplyGrid } from '../../components/chat/QuickReplyGrid';
import { useCharacterStore } from '../../stores/characterStore';
import { useChatStore } from '../../stores/chatStore';
import { generateAIResponse } from '../../services/coach.service';
import { useNavigation } from '@react-navigation/native';
import type { ChatMessage, QuickReply } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const WELCOME_ZONE_H = SCREEN_HEIGHT * 0.42;
const CHAT_ZONE_H = 90;
const HISTORY_MAX_H = SCREEN_HEIGHT * 0.38;

// 캐릭터 인라인 아바타용 간이 이모지 맵
const CHAR_EMOJI: Record<string, string> = {
  hana: '🌸', sora: '🌤️', tora: '🦊', mizu: '💧', kaze: '🍃',
};

export function AICoachScreen(): React.JSX.Element {
  const { character, lang, zenCoins } = useCharacterStore();
  const navigation = useNavigation();
  const { currentSession, addMessage, turnCount, startSession } = useChatStore();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  // Zone 1 애니메이션: 1=welcome, 0=chat
  const zoneAnim = useRef(new Animated.Value(1)).current;
  // Zone 3 히스토리 패널: 0=접힘, 1=펼침
  const historyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!currentSession) startSession();
  }, []);

  const messages = currentSession?.messages ?? [];
  const isWelcome = messages.length === 0;

  // Welcome ↔ Chat 전환 (400ms)
  useEffect(() => {
    Animated.timing(zoneAnim, {
      toValue: isWelcome ? 1 : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [isWelcome]);

  // 히스토리 패널 토글
  const toggleHistory = useCallback(() => {
    const next = !historyExpanded;
    setHistoryExpanded(next);
    Animated.spring(historyAnim, {
      toValue: next ? 1 : 0,
      useNativeDriver: false,
      tension: 70,
      friction: 11,
    }).start();
  }, [historyExpanded, historyAnim]);

  // 스와이프 제스처 (PanResponder)
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10,
      onPanResponderRelease: (_, g) => {
        if (g.dy < -30 && !historyExpanded) {
          setHistoryExpanded(true);
          Animated.spring(historyAnim, { toValue: 1, useNativeDriver: false, tension: 70, friction: 11 }).start();
        } else if (g.dy > 30 && historyExpanded) {
          setHistoryExpanded(false);
          Animated.spring(historyAnim, { toValue: 0, useNativeDriver: false, tension: 70, friction: 11 }).start();
        }
      },
    })
  ).current;

  const characterZoneH = zoneAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CHAT_ZONE_H, WELCOME_ZONE_H],
  });

  const historyPanelH = historyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, HISTORY_MAX_H],
  });

  // Zone 2: 마지막 AI 메시지
  const lastAiMsg = [...messages].reverse().find(m => m.role === 'assistant');
  const aiMsgCount = messages.filter(m => m.role === 'assistant').length;
  const isFirstAiMsg = aiMsgCount <= 1;
  // Zone 3: 마지막 AI 메시지 제외한 히스토리
  const historyMsgs = lastAiMsg ? messages.filter(m => m.id !== lastAiMsg.id) : [];
  const pairCount = Math.floor(historyMsgs.filter(m => m.role === 'assistant').length);

  const charType = character?.characterType ?? 'hana';
  const charEmoji = CHAR_EMOJI[charType] ?? '✿';
  const placeholder = lang === 'ko' ? '메시지를 입력하세요...' : 'Type a message...';

  const handleSend = useCallback(async (text: string): Promise<void> => {
    if (!text.trim() || loading) return;
    setInputText('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);
    setLoading(true);

    try {
      const res = await generateAIResponse({
        message: text,
        lang,
        characterType: charType,
        history: messages,
        turnCount,
      });
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.response,
        timestamp: new Date().toISOString(),
        quickReplies: res.quickReplies,
      });
    } catch {
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: lang === 'ko'
          ? '죄송해요, 잠시 연결이 불안정해요. 다시 말씀해주세요 🌟'
          : 'Sorry, connection is unstable. Please try again 🌟',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, [loading, messages, lang, charType, turnCount, addMessage]);

  const handleQuickReply = useCallback((reply: QuickReply) => {
    void handleSend(reply.label.replace(/^[^\w가-힣]*/, '').trim());
  }, [handleSend]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 30}
      >
        {/* ─── Zone 1: Character Zone ───────────────────────────── */}
        <Animated.View style={[styles.characterZone, { height: characterZoneH }]}>
          <LinearGradient
            colors={isWelcome ? theme.gradients.aurora1 : theme.gradients.header}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.characterZoneInner}
          >
            {/* 헤더 row — 항상 표시 */}
            <View style={styles.headerRow}>
              <View style={styles.coinsDisplay}>
                <Text style={styles.coinsIcon}>✦</Text>
                <Text style={styles.coinsAmount}>{zenCoins.toLocaleString()}</Text>
              </View>

              {/* In-chat: 인라인 캐릭터 아바타 */}
              {!isWelcome && (
                <View style={styles.chatCharAvatar}>
                  <Text style={styles.chatCharEmoji}>{charEmoji}</Text>
                  <Text style={styles.chatCharLevel}>Lv.{character?.level ?? 1}</Text>
                </View>
              )}

              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.closeBtn}
                activeOpacity={0.8}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Welcome: 풀 CharacterDisplay */}
            {isWelcome && (
              <CharacterDisplay
                characterType={charType}
                level={character?.level ?? 1}
                bgTheme={character?.bgTheme ?? 'starlight'}
                equippedItems={character?.equippedItems as Record<string, string | null>}
                compact={false}
              />
            )}
          </LinearGradient>
        </Animated.View>

        {/* ─── Zone 2: Active Question (Pure Focus) ────────────── */}
        <View style={styles.activeZone}>
          {isWelcome ? (
            <View style={styles.welcomeWrap}>
              <Text style={styles.welcomeQ}>
                {lang === 'ko' ? '오늘 기분이 어떠세요?' : 'How are you feeling today?'}
              </Text>
              <Text style={styles.welcomeSub}>
                {lang === 'ko' ? '무엇이든 편하게 이야기해 보세요.' : 'Feel free to share anything.'}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.pureFocusScroll}
              contentContainerStyle={styles.pureFocusContent}
              showsVerticalScrollIndicator={false}
            >
              {lastAiMsg && (
                <Text style={[styles.pureFocusText, !isFirstAiMsg && styles.pureFocusTextSmall]}>{lastAiMsg.content}</Text>
              )}
              {loading && (
                <Text style={styles.typingDots}>• • •</Text>
              )}
              {!loading && lastAiMsg?.quickReplies && lastAiMsg.quickReplies.length > 0 && (
                <QuickReplyGrid
                  replies={lastAiMsg.quickReplies}
                  onSelect={handleQuickReply}
                />
              )}
            </ScrollView>
          )}

          {/* 히스토리 핸들 (히스토리가 있을 때만) */}
          {historyMsgs.length > 0 && (
            <View {...panResponder.panHandlers}>
              <TouchableOpacity
                style={styles.historyHandle}
                onPress={toggleHistory}
                activeOpacity={0.7}
              >
                <View style={styles.handleBar} />
                <Text style={styles.handleText}>
                  {historyExpanded
                    ? (lang === 'ko' ? '접기' : 'Collapse')
                    : (lang === 'ko' ? `이전 대화 ${pairCount}턴` : `${pairCount} past exchanges`)}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Zone 3: History Panel (접힘/펼침) */}
          <Animated.View style={[styles.historyPanel, { height: historyPanelH }]}>
            <ScrollView
              style={styles.historyScroll}
              contentContainerStyle={styles.historyContent}
              showsVerticalScrollIndicator={false}
            >
              {buildPairs(historyMsgs).map((pair, i) => (
                <CardPair key={i} pair={pair} />
              ))}
            </ScrollView>
          </Animated.View>

          {/* 입력창 */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.text.tertiary}
              multiline
              maxLength={500}
              onSubmitEditing={() => { void handleSend(inputText); }}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnOff]}
              onPress={() => { void handleSend(inputText); }}
              disabled={!inputText.trim() || loading}
              activeOpacity={0.8}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** AI + User 메시지를 [ai, user?] 쌍으로 묶기 */
function buildPairs(msgs: ChatMessage[]): Array<[ChatMessage, ChatMessage | null]> {
  const pairs: Array<[ChatMessage, ChatMessage | null]> = [];
  let i = 0;
  while (i < msgs.length) {
    if (msgs[i].role === 'assistant') {
      pairs.push([msgs[i], msgs[i + 1] ?? null]);
      i += 2;
    } else {
      i++;
    }
  }
  return pairs;
}

function CardPair({ pair: [ai, user] }: { pair: [ChatMessage, ChatMessage | null] }) {
  return (
    <View style={styles.cardPair}>
      <View style={styles.aiCard}>
        <Text style={styles.aiCardText}>{ai.content}</Text>
      </View>
      {user && (
        <View style={styles.userCard}>
          <Text style={styles.userCardText}>{user.content}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.bg },
  container: { flex: 1 },

  // Zone 1
  characterZone: { overflow: 'hidden' },
  characterZoneInner: { flex: 1, paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.sm },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(200,168,96,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(200,168,96,0.25)',
    minHeight: theme.minTouchTarget,
  },
  coinsIcon: { fontSize: 13, color: theme.colors.gold },
  coinsAmount: { ...theme.typography.bold2, color: theme.colors.gold },

  chatCharAvatar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  chatCharEmoji: { fontSize: 28 },
  chatCharLevel: { ...theme.typography.labelSm, color: theme.colors.text.secondary },

  closeBtn: {
    width: theme.minTouchTarget,
    height: theme.minTouchTarget,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { ...theme.typography.label, color: theme.colors.text.primary },

  // Zone 2
  activeZone: { flex: 1, backgroundColor: theme.colors.bg },
  welcomeWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxxl,
    gap: theme.spacing.md,
  },
  welcomeQ: {
    fontSize: 36,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 1,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  welcomeSub: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  pureFocusScroll: { flex: 1 },
  pureFocusContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  pureFocusText: {
    fontSize: 48,
    color: theme.colors.text.primary,
    lineHeight: 52,
    letterSpacing: 1,
    fontFamily: 'BebasNeue_400Regular',
  },
  pureFocusTextSmall: {
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: 0,
    fontFamily: 'DMSans_400Regular',
  },
  typingDots: {
    color: theme.colors.text.tertiary,
    fontSize: 20,
    letterSpacing: 6,
  },

  // History Handle
  historyHandle: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  handleText: {
    ...theme.typography.caption,
    color: theme.colors.accent,
  },

  // Zone 3 History Panel
  historyPanel: {
    overflow: 'hidden',
    backgroundColor: theme.colors.bg2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,217,160,0.12)',
  },
  historyScroll: { flex: 1 },
  historyContent: { padding: theme.spacing.md, gap: 10 },
  cardPair: { gap: 6 },
  aiCard: {
    backgroundColor: 'rgba(0,217,160,0.06)',
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    padding: 12,
  },
  aiCardText: { ...theme.typography.body2, color: theme.colors.text.primary },
  userCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.teal,
    borderRadius: theme.radius.sm,
    padding: 12,
    marginLeft: 16,
  },
  userCardText: { ...theme.typography.body2, color: theme.colors.text.secondary },

  // Input
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    padding: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.bg2,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 11,
    fontSize: 15,
    color: theme.colors.text.primary,
    fontFamily: 'DMSans_400Regular',
    maxHeight: 120,
  },
  sendBtn: {
    width: theme.minTouchTarget,
    height: theme.minTouchTarget,
    borderRadius: 22,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnOff: { backgroundColor: theme.colors.border },
  sendIcon: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
});
