// Auth 화면들 — 기본 스텁 (추후 상세 구현)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

export function SplashScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.logo}>✿</Text>
            <Text style={styles.appName}>Zenny</Text>
            <Text style={styles.tagline}>Your Zen Companion</Text>
        </View>
    );
}

export function LoginScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.logo}>✿</Text>
            <Text style={styles.title}>Sign In</Text>
        </View>
    );
}

export function OnboardingScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Choose Your Character</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center' },
    logo: { fontSize: 64, marginBottom: 12 },
    appName: { fontSize: 36, fontFamily: 'Fraunces_500Medium', color: theme.colors.text.primary, marginBottom: 4 },
    tagline: { fontSize: 14, color: theme.colors.text.secondary, fontFamily: 'DMSans_400Regular' },
    title: { fontSize: 24, fontFamily: 'Fraunces_500Medium', color: theme.colors.text.primary },
});
