import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { CharacterDisplay } from '../../components/character/CharacterDisplay';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { QuickReplyGrid } from '../../components/chat/QuickReplyGrid';
import { useCharacterStore } from '../../stores/characterStore';
import { useChatStore } from '../../stores/chatStore';
import { generateAIResponse } from '../../services/coach.service';
import type { ChatMessage, QuickReply, Language } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CHARACTER_ZONE = SCREEN_HEIGHT * 0.38;

export function AICoachScreen() {
  const { character, lang, setLang } = useCharacterStore();
  const { currentSession, addMessage, turnCount, startSession } = useChatStore();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!currentSession) {
      startSession();
    }
  }, []);

  const messages = currentSession?.messages ?? [];
  const placeholder = lang === 'ko' ? '메시지를 입력하세요...' : 'Type a message...';

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }, [messages.length]);

  const handleSend = useCallback(async (text: string) => {
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
        characterType: character?.characterType ?? 'hana',
        history: messages,
        turnCount,
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.response,
        timestamp: new Date().toISOString(),
        quickReplies: res.quickReplies,
      };
      addMessage(aiMsg);
    } catch (e) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: lang === 'ko'
          ? '죄송해요, 잠시 연결이 불안정해요. 다시 말씀해주세요 🌟'
          : 'Sorry, connection is unstable. Please try again 🌟',
        timestamp: new Date().toISOString(),
      };
      addMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, lang, character, turnCount, addMessage]);

  const handleQuickReply = useCallback((reply: QuickReply) => {
    handleSend(reply.label.replace(/^[^\w가-힣]*/, '').trim());
  }, [handleSend]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <LinearGradient
          colors={[...COLORS.gradient.header]}
          style={[styles.characterZone, { height: CHARACTER_ZONE }]}
        >
          <View style={styles.headerRow}>
            <View style={styles.coinsDisplay}>
              <Text style={styles.coinsIcon}>✦</Text>
              <Text style={styles.coinsAmount}>{useCharacterStore.getState().zenCoins}</Text>
            </View>
            <LanguageToggle lang={lang} onToggle={setLang} />
          </View>

          <CharacterDisplay
            characterType={character?.characterType ?? 'hana'}
            level={character?.level ?? 1}
            bgTheme={character?.bgTheme ?? 'starlight'}
            equippedItems={character?.equippedItems as Record<string, string | null>}
          />
        </LinearGradient>

        <View style={styles.chatZone}>
          <ScrollView
            ref={scrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => (
              <MessageRow key={msg.id} message={msg} onQuickReply={handleQuickReply} lang={lang} />
            ))}
            {loading && <TypingBubble />}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={placeholder}
              placeholderTextColor={COLORS.text3}
              multiline
              maxLength={500}
              onSubmitEditing={() => handleSend(inputText)}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnOff]}
              onPress={() => handleSend(inputText)}
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

function MessageRow({ message, onQuickReply, lang }: {
  message: ChatMessage;
  onQuickReply: (r: QuickReply) => void;
  lang: string;
}) {
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.msgRow,
        isUser ? styles.msgRowUser : styles.msgRowAI,
        { opacity: fadeAnim },
      ]}
    >
      {!isUser && (
        <Text style={styles.aiMeta}>
          Zen AI · {new Date(message.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{message.content}</Text>
      </View>
      {message.quickReplies && message.quickReplies.length > 0 && (
        <QuickReplyGrid replies={message.quickReplies} onSelect={onQuickReply} />
      )}
    </Animated.View>
  );
}

function TypingBubble() {
  return (
    <View style={[styles.bubble, styles.bubbleAI, { width: 72, marginLeft: 0 }]}>
      <Text style={styles.bubbleText}>• • •</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },

  characterZone: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(200,168,96,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(200,168,96,0.25)',
  },
  coinsIcon: { fontSize: 13, color: COLORS.gold },
  coinsAmount: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: COLORS.gold },

  chatZone: { flex: 1, backgroundColor: COLORS.bg },
  chatScroll: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 8, gap: 12 },

  msgRow: { gap: 4 },
  msgRowAI: { alignItems: 'flex-start', paddingRight: 48 },
  msgRowUser: { alignItems: 'flex-end', paddingLeft: 48 },
  aiMeta: { fontSize: 11, color: COLORS.text3, fontFamily: 'DMSans_400Regular', marginBottom: 2 },

  bubble: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  bubbleAI: { backgroundColor: '#16203A' },
  bubbleUser: { backgroundColor: '#6366F1' },
  bubbleText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: 'DMSans_400Regular',
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: '#FFFFFF',
  },

  inputRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bg2,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: 'DMSans_400Regular',
    maxHeight: 120,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnOff: { backgroundColor: COLORS.border },
  sendIcon: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
});
