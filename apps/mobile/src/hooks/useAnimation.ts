/**
 * 마이크로 인터렉션 훅 모음 - 세션 C: UI/UX 리팩터링
 * Expo 기본 Animated API만 사용 (react-native-reanimated 의존 없음)
 *
 * 사용법:
 *   const { scale, animatePress } = usePressScale();
 *   <Animated.View style={{ transform: [{ scale }] }}>
 *     <TouchableOpacity onPressIn={animatePress} onPressOut={animateRelease}>
 *
 *   const { opacity, fadeIn } = useFadeIn();
 *   useEffect(() => fadeIn(), []);
 */
import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';

// ────────── 버튼 눌림 효과 ──────────
export function usePressScale(toScale = 0.95) {
  const scale = useRef(new Animated.Value(1)).current;

  const animatePress = useCallback(() => {
    Animated.spring(scale, {
      toValue: toScale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scale, toScale]);

  const animateRelease = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  }, [scale]);

  return { scale, animatePress, animateRelease };
}

// ────────── 선택 시 bounce (이모지 그리드 등) ──────────
export function useBounceSelect() {
  const scale = useRef(new Animated.Value(1)).current;

  const bounce = useCallback(() => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.12,
        useNativeDriver: true,
        speed: 60,
        bounciness: 10,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
        bounciness: 8,
      }),
    ]).start();
  }, [scale]);

  return { scale, bounce };
}

// ────────── Fade In ──────────
export function useFadeIn(duration = 400, delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;

  const fadeIn = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [opacity, duration, delay]);

  return { opacity, fadeIn };
}

// ────────── 슬라이드 업 (모달/카드 등장) ──────────
export function useSlideUp(fromY = 40, duration = 350) {
  const translateY = useRef(new Animated.Value(fromY)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const slideIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity, duration]);

  return { translateY, opacity, slideIn };
}

// ────────── EXP 바 증가 애니메이션 ──────────
export function useProgressBar(initialValue = 0) {
  const progress = useRef(new Animated.Value(initialValue)).current;

  const animateTo = useCallback(
    (toValue: number, duration = 800) => {
      Animated.timing(progress, {
        toValue: Math.min(Math.max(toValue, 0), 1),
        duration,
        useNativeDriver: false, // width 애니메이션은 useNativeDriver: false 필요
      }).start();
    },
    [progress],
  );

  return { progress, animateTo };
}

// ────────── 퀘스트 완료 체크 애니메이션 ──────────
export function useCheckComplete() {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const complete = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
        bounciness: 12,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity]);

  return { scale, opacity, complete };
}
