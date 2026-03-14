import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

export const SplashScreen = () => {
  const ring1Scale = useRef(new Animated.Value(0.5)).current;
  const ring2Scale = useRef(new Animated.Value(0.65)).current;
  const ring3Scale = useRef(new Animated.Value(0.8)).current;
  const ring1Opacity = useRef(new Animated.Value(0.0)).current;
  const ring2Opacity = useRef(new Animated.Value(0.0)).current;
  const ring3Opacity = useRef(new Animated.Value(0.0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(16)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 링 순차 등장
    Animated.stagger(180, [
      Animated.parallel([
        Animated.timing(ring3Scale, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(ring3Opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ring2Scale, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(ring2Opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ring1Scale, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(ring1Opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    ]).start();

    // 로고 + 타이틀 등장
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 9 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 400);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 650);

    setTimeout(() => {
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 900);

    // 링 루프 글로우
    const loopGlow = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(ring1Opacity, { toValue: 0.55, duration: 2200, useNativeDriver: true }),
          Animated.timing(ring1Opacity, { toValue: 0.22, duration: 2200, useNativeDriver: true }),
        ])
      ).start();
    };
    setTimeout(loopGlow, 1200);
  }, []);

  return (
    <LinearGradient
      colors={['#010503', '#020A07', '#041210', '#020A07', '#010503']}
      locations={[0, 0.25, 0.5, 0.75, 1]}
      style={s.container}
    >
      {/* 동심원 링 */}
      <View style={s.ringsWrap}>
        <Animated.View style={[s.ring, s.ring3, { transform: [{ scale: ring3Scale }], opacity: ring3Opacity }]} />
        <Animated.View style={[s.ring, s.ring2, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />
        <Animated.View style={[s.ring, s.ring1, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />

        {/* 로고 원 */}
        <Animated.View style={[s.logoCircle, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
          <LinearGradient
            colors={['rgba(0,232,168,0.20)', 'rgba(0,232,168,0.05)']}
            style={s.logoGradient}
          >
            <Text style={s.logoEmoji}>🌸</Text>
          </LinearGradient>
        </Animated.View>
      </View>

      {/* 타이틀 */}
      <Animated.Text style={[s.title, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
        ZENNY
      </Animated.Text>
      <Animated.Text style={[s.tagline, { opacity: taglineOpacity }]}>
        Your AI Wellness Companion
      </Animated.Text>
    </LinearGradient>
  );
};

const RING3 = 260;
const RING2 = 190;
const RING1 = 126;
const LOGO = 80;

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
  },
  ringsWrap: {
    width: RING3,
    height: RING3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1,
  },
  ring3: {
    width: RING3,
    height: RING3,
    borderColor: 'rgba(0,232,168,0.10)',
    backgroundColor: 'rgba(0,232,168,0.02)',
  },
  ring2: {
    width: RING2,
    height: RING2,
    borderColor: 'rgba(0,232,168,0.18)',
    backgroundColor: 'rgba(0,232,168,0.04)',
  },
  ring1: {
    width: RING1,
    height: RING1,
    borderColor: 'rgba(0,232,168,0.30)',
    backgroundColor: 'rgba(0,232,168,0.07)',
  },
  logoCircle: {
    width: LOGO,
    height: LOGO,
    borderRadius: LOGO / 2,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0,232,168,0.40)',
  },
  logoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: { fontSize: 40 },
  title: {
    fontSize: 56,
    fontFamily: 'BebasNeue_400Regular',
    color: theme.colors.text.primary,
    letterSpacing: 8,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.text.secondary,
    letterSpacing: 1.5,
    marginTop: 6,
  },
});
