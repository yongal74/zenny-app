import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import type { QuickReply } from '../../types';

interface QuickReplyGridProps {
    replies: QuickReply[];
    onSelect: (reply: QuickReply) => void;
}

/**
 * 빠른 응답 버튼 — 2열 그리드, 정렬 통일
 */
export function QuickReplyGrid({ replies, onSelect }: QuickReplyGridProps) {
    const leftCol = replies.filter((_, i) => i % 2 === 0);
    const rightCol = replies.filter((_, i) => i % 2 === 1);

    return (
        <View style={styles.grid}>
            <Column replies={leftCol} onSelect={onSelect} />
            <Column replies={rightCol} onSelect={onSelect} />
        </View>
    );
}

function Column({ replies, onSelect }: { replies: QuickReply[]; onSelect: (r: QuickReply) => void }) {
    return (
        <View style={styles.col}>
            {replies.map((reply) => (
                <QuickReplyButton key={reply.id} reply={reply} onSelect={onSelect} />
            ))}
        </View>
    );
}

function QuickReplyButton({ reply, onSelect }: { reply: QuickReply; onSelect: (r: QuickReply) => void }) {
    return (
        <TouchableOpacity
            style={styles.btn}
            onPress={() => onSelect(reply)}
            activeOpacity={0.75}
        >
            <Text style={styles.btnText}>{reply.label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    grid: { flexDirection: 'row', gap: 8, marginTop: 6 },
    col: { flex: 1, gap: 8 },
    btn: {
        backgroundColor: 'rgba(0,217,160,0.08)',
        borderRadius: 10,
        minHeight: theme.minTouchTarget,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,217,160,0.22)',
    },
    btnText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.primary,
        fontFamily: 'Inter_600SemiBold',
    },
});
