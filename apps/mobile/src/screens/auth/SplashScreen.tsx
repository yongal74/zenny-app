import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';

export const SplashScreen = () => {
  return (
    <LinearGradient
      colors={['#0C0C14', '#151520', '#1A1A2E', '#151520', '#0C0C14']}
      locations={[0, 0.25, 0.5, 0.75, 1]}
      style={styles.container}
    >
      <View style={styles.ringContainer}>
        <View style={styles.ringOuter} />
        <View style={styles.ringMid} />
        <View style={styles.ringInner} />
        <View style={styles.logoCircle}>
          <Text style={styles.logo}>✿</Text>
        </View>
      </View>
      <Text style={styles.title}>Zenny</Text>
      <Text style={styles.tagline}>Your Zen Companion</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ringOuter: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(200,200,240,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(200,200,240,0.06)',
  },
  ringMid: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(200,200,240,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(200,200,240,0.09)',
  },
  ringInner: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(200,200,240,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(200,200,240,0.12)',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(200,200,240,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 40,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.text2,
    marginTop: 6,
    letterSpacing: 1,
  },
});
