import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import type { Language } from '../../types';

interface LanguageToggleProps {
    lang: Language;
    onToggle: (lang: Language) => void;
}

export function LanguageToggle({ lang, onToggle }: LanguageToggleProps) {
    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => onToggle('en')} activeOpacity={0.8}>
                <Text style={[styles.label, lang === 'en' && styles.labelActive]}>EN</Text>
            </TouchableOpacity>
            <Text style={styles.separator}>|</Text>
            <TouchableOpacity onPress={() => onToggle('ko')} activeOpacity={0.8}>
                <Text style={[styles.label, lang === 'ko' && styles.labelActive]}>KO</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface2,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontFamily: 'DMSans_500Medium',
        fontWeight: '600',
        color: theme.colors.text.tertiary,
    },
    labelActive: { color: theme.colors.text.primary },
    separator: { fontSize: 12, color: theme.colors.border },
});
