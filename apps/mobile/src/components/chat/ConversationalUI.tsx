import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Animated,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { ChatMessage, QuickReply, Language } from '../../types';
import { COLORS } from '../../constants/colors';

// ─── Props ───────────────────────────────────────────────────
interface ConversationalUIProps {
    messages: ChatMessage[];
    onSend: (text: string) => void;
    onQuickReply: (reply: QuickReply) => void;
    lang: Language;
    loading?: boolean;
}

// ─── Message Bubble ──────────────────────────────────────────
/**
 * 박스형 메시지 (cornerRadius 12px, 말풍선 아님)
 * AI: 좌측 정렬, #16203A 배경
 * 사용자: 1~2칸 들여쓰기(paddingLeft 48), #6366F1 배경
 */
const MessageBubble: React.FC<{ message: ChatMessage; onQuickReply: (r: QuickReply) => void }> = ({
    message,
    onQuickReply,
}) => {
    const isUser = message.role === 'user';
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.messageRow,
                isUser ? styles.messageRowUser : styles.messageRowAI,
                { opacity: fadeAnim },
            ]}
        >
            {/* AI 헤더 */}
            {!isUser && (
                <Text style={styles.aiHeader}>Zen AI · {formatTime(String(message.timestamp))}</Text>
            )}

            {/* 박스형 메시지 */}
            <View style={[styles.messageBubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
                <Text style={styles.messageText}>{message.content}</Text>
            </View>

            {/* 빠른 응답 버튼 그리드 */}
            {message.quickReplies && message.quickReplies.length > 0 && (
                <QuickReplyGrid replies={message.quickReplies} onSelect={onQuickReply} />
            )}
        </Animated.View>
    );
};

// ─── Quick Reply Grid (2열 정렬) ─────────────────────────────
const QuickReplyGrid: React.FC<{
    replies: QuickReply[];
    onSelect: (r: QuickReply) => void;
}> = ({ replies, onSelect }) => {
    const leftCol = replies.filter((_, i) => i % 2 === 0);
    const rightCol = replies.filter((_, i) => i % 2 === 1);

    return (
        <View style={styles.quickReplyGrid}>
            <View style={styles.quickReplyCol}>
                {leftCol.map((reply) => (
                    <QuickReplyButton key={reply.id} reply={reply} onSelect={onSelect} />
                ))}
            </View>
            <View style={styles.quickReplyCol}>
                {rightCol.map((reply) => (
                    <QuickReplyButton key={reply.id} reply={reply} onSelect={onSelect} />
                ))}
            </View>
        </View>
    );
};

const QuickReplyButton: React.FC<{
    reply: QuickReply;
    onSelect: (r: QuickReply) => void;
}> = ({ reply, onSelect }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        ]).start();
        onSelect(reply);
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity style={styles.quickReplyBtn} onPress={handlePress} activeOpacity={0.8}>
                <Text style={styles.quickReplyText}>{reply.label}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─── Main Conversational UI ──────────────────────────────────
export const ConversationalUI: React.FC<ConversationalUIProps> = ({
    messages,
    onSend,
    onQuickReply,
    lang,
    loading = false,
}) => {
    const [inputText, setInputText] = React.useState('');
    const scrollRef = useRef<ScrollView>(null);

    const placeholder = lang === 'ko' ? '메시지를 입력하세요...' : 'Type a message...';

    useEffect(() => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, [messages]);

    const handleSend = () => {
        if (inputText.trim() === '') return;
        onSend(inputText.trim());
        setInputText('');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={80}
        >
            {/* 채팅 스크롤 영역 */}
            <ScrollView
                ref={scrollRef}
                style={styles.chatArea}
                contentContainerStyle={styles.chatContent}
                showsVerticalScrollIndicator={false}
            >
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} onQuickReply={onQuickReply} />
                ))}
                {loading && <TypingIndicator />}
            </ScrollView>

            {/* 입력 바 */}
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.text3}
                    multiline
                    maxLength={500}
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                    onPress={handleSend}
                    disabled={!inputText.trim()}
                    activeOpacity={0.8}
                >
                    <Text style={styles.sendIcon}>↑</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

// ─── Typing Indicator ────────────────────────────────────────
const TypingIndicator = () => (
    <View style={[styles.messageBubble, styles.bubbleAI, { width: 72 }]}>
        <Text style={styles.messageText}>• • •</Text>
    </View>
);

// ─── Helpers ─────────────────────────────────────────────────
const formatTime = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    chatArea: {
        flex: 1,
    },
    chatContent: {
        padding: 20,
        paddingBottom: 8,
        gap: 12,
    },
    messageRow: {
        gap: 6,
    },
    messageRowAI: {
        alignItems: 'flex-start',
        paddingRight: 48,
    },
    messageRowUser: {
        alignItems: 'flex-end',
        paddingLeft: 48, // 1~2칸 들여쓰기
    },
    aiHeader: {
        fontSize: 11,
        color: COLORS.text3,
        fontFamily: 'DMSans_400Regular',
        marginBottom: 2,
    },
    messageBubble: {
        borderRadius: 12, // 약간 라운드된 박스형 (말풍선 아님)
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    bubbleAI: {
        backgroundColor: COLORS.surface, // #16203A
    },
    bubbleUser: {
        backgroundColor: COLORS.primary, // #6366F1
    },
    messageText: {
        fontSize: 15,
        color: COLORS.text,
        fontFamily: 'DMSans_400Regular',
        lineHeight: 22,
    },

    // Quick reply grid — 2열
    quickReplyGrid: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    quickReplyCol: {
        flex: 1,
        gap: 8,
    },
    quickReplyBtn: {
        backgroundColor: COLORS.surface2, // #1E2D4A
        borderRadius: 10,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 14,
    },
    quickReplyText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
        fontFamily: 'DMSans_700Bold',
    },

    // 입력 바
    inputRow: {
        flexDirection: 'row',
        gap: 10,
        padding: 12,
        paddingHorizontal: 16,
        backgroundColor: COLORS.surface, // #141D38
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.bg2,
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.text,
        fontFamily: 'DMSans_400Regular',
        maxHeight: 120,
    },
    sendBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: COLORS.border,
    },
    sendIcon: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
});
