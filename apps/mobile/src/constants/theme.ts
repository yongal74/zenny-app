/**
 * Zenny 디자인 시스템 - 단일 진실 공급원 (Single Source of Truth)
 * 세션 C: UI/UX 리팩터링
 *
 * 사용법:
 *   import { theme } from '../../constants/theme';
 *   style={{ color: theme.colors.text.primary, padding: theme.spacing.md }}
 *
 * 기존 COLORS 호환: import { COLORS } from '../../constants/theme';
 */

export const theme = {
  colors: {
    // 배경 계층
    bg: '#09090F',
    bg2: '#111118',
    surface: '#19191F',
    surface2: '#222230',

    // 텍스트 계층
    text: {
      primary: '#E0E0E8',
      secondary: '#8888A0',
      tertiary: '#505068',
      inverse: '#09090F',
    },

    // 브랜드 색상
    primary: '#3A3A55',
    accent: '#B8B8D8',
    teal: '#8888B8',
    gold: '#C8A860',

    // 피드백
    success: '#7EB87E',
    error: '#C87E7E',
    warning: '#C8A860',

    // 기타
    border: '#28283A',
    bottomBar: '#060608',
    overlay: 'rgba(0,0,0,0.7)',

    // Dark Aurora 시그니처
    purple: '#7C3AED',
    tealVivid: '#2DD4BF',  // EXP 바, 완료 체크마크

    // 글래스모피즘 카드 (Behance 크립토 대시보드 스타일)
    glass: 'rgba(255,255,255,0.08)',
    glassBorder: 'rgba(255,255,255,0.16)',
    glassHighlight: 'rgba(255,255,255,0.12)',
  },

  /** 간격 (8pt 그리드 기반) */
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  /** 둥근 모서리 */
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    pill: 999,
  },

  /** 타이포그래피 (폰트 로드 후 사용) */
  typography: {
    // 제목 계열 (Manrope - 모던 지오메트릭)
    h1: { fontSize: 28, fontFamily: 'Manrope_700Bold', lineHeight: 36 },
    h2: { fontSize: 22, fontFamily: 'Manrope_700Bold', lineHeight: 30 },
    h3: { fontSize: 18, fontFamily: 'Manrope_600SemiBold', lineHeight: 26 },

    // 본문 계열 (Inter - 클린 모던)
    body1: { fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 26 },
    body2: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
    body3: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },

    // 굵은 본문
    bold1: { fontSize: 16, fontFamily: 'Inter_700Bold', lineHeight: 26 },
    bold2: { fontSize: 14, fontFamily: 'Inter_700Bold', lineHeight: 22 },
    bold3: { fontSize: 13, fontFamily: 'Inter_700Bold', lineHeight: 20 },

    // 라벨/캡션
    label: { fontSize: 13, fontFamily: 'Inter_600SemiBold', lineHeight: 18 },
    labelSm: { fontSize: 12, fontFamily: 'Inter_600SemiBold', lineHeight: 16 },
    caption: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  },

  /**
   * 최소 터치 영역
   * iOS HIG: 44pt, Android: 48dp 권장
   * 44를 기준으로 사용
   */
  minTouchTarget: 44,

  /** 그레이디언트 */
  gradients: {
    splash: ['#09090F', '#14141C', '#09090F'] as const,
    header: ['#111118', '#09090F'] as const,
    card: ['#19191F', '#14141C'] as const,
    aurora1: ['#2d0b6b', '#09090F', '#003366'] as const,
    aurora2: ['#0d2e5a', '#09090F', '#3b0f82'] as const,
  },

  /** 캐릭터 글로우 */
  glow: {
    soft: 'rgba(180,180,220,0.06)',
    medium: 'rgba(180,180,220,0.10)',
    strong: 'rgba(200,200,240,0.16)',
  },
} as const;

/**
 * 기존 COLORS 상수와 100% 호환되는 별칭
 * 점진적 마이그레이션: 기존 파일은 그대로 두고 신규 파일만 theme 사용
 */
export const COLORS = {
  bg: theme.colors.bg,
  bg2: theme.colors.bg2,
  surface: theme.colors.surface,
  surface2: theme.colors.surface2,

  text: theme.colors.text.primary,
  text2: theme.colors.text.secondary,
  text3: theme.colors.text.tertiary,

  primary: theme.colors.primary,
  accent: theme.colors.accent,
  gold: theme.colors.gold,
  teal: theme.colors.teal,

  border: theme.colors.border,
  bottomBar: theme.colors.bottomBar,

  charGlow1: theme.glow.soft,
  charGlow2: theme.glow.medium,
  charGlow3: theme.glow.strong,

  gradient: theme.gradients,
} as const;
