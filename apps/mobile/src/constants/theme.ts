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
    // 배경 계층 — 딥 네이비/블랙 (퍼플 언더톤)
    bg: '#0a0a14',
    bg2: '#0d0d1a',
    surface: '#12121e',
    surface2: '#1a1a2e',

    // 텍스트 계층
    text: {
      primary: '#FFFFFF',
      secondary: '#9CA3AF',
      tertiary: '#6B7280',
      inverse: '#0a0a14',
    },

    // 브랜드 색상 — 퍼플 + 시안
    primary: '#8B5CF6',       // 퍼플
    accent: '#22D3EE',        // 시안 (민트 → 시안)
    teal: '#22D3EE',
    gold: '#F0C060',

    // 피드백
    success: '#22D3EE',
    error: '#FF4D6D',
    warning: '#F0C060',

    // 기타
    border: '#2a2a4a',
    bottomBar: '#0a0a14',
    overlay: 'rgba(0,0,0,0.85)',

    // 하위호환
    purple: '#8B5CF6',
    tealVivid: '#00FFE0',

    // 글래스모피즘 — 퍼플 테두리
    glass: 'rgba(139,92,246,0.05)',
    glassBorder: 'rgba(139,92,246,0.20)',
    glassHighlight: 'rgba(139,92,246,0.10)',
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
    md: 14,
    lg: 18,
    xl: 22,
    xxl: 28,
    pill: 999,
  },

  /** 타이포그래피 (폰트 로드 후 사용) */
  typography: {
    // 디스플레이 계열 (Bebas Neue — Tungsten 대체, 임팩트 있는 대문자 컨덴스드)
    display1: { fontSize: 64, fontFamily: 'BebasNeue_400Regular', lineHeight: 64, letterSpacing: 2 },
    display2: { fontSize: 48, fontFamily: 'BebasNeue_400Regular', lineHeight: 50, letterSpacing: 1.5 },
    h1: { fontSize: 36, fontFamily: 'BebasNeue_400Regular', lineHeight: 38, letterSpacing: 1 },
    h2: { fontSize: 28, fontFamily: 'BebasNeue_400Regular', lineHeight: 30, letterSpacing: 0.5 },
    h3: { fontSize: 20, fontFamily: 'DMSans_700Bold', lineHeight: 28 },

    // 본문 계열 (DM Sans — Acumin Pro 대체, 클린 모던)
    body1: { fontSize: 16, fontFamily: 'DMSans_400Regular', lineHeight: 26 },
    body2: { fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 22 },
    body3: { fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 20 },

    // 굵은 본문
    bold1: { fontSize: 16, fontFamily: 'DMSans_700Bold', lineHeight: 26 },
    bold2: { fontSize: 14, fontFamily: 'DMSans_700Bold', lineHeight: 22 },
    bold3: { fontSize: 13, fontFamily: 'DMSans_700Bold', lineHeight: 20 },

    // 라벨/캡션
    label: { fontSize: 13, fontFamily: 'DMSans_500Medium', lineHeight: 18 },
    labelSm: { fontSize: 12, fontFamily: 'DMSans_500Medium', lineHeight: 16 },
    caption: { fontSize: 12, fontFamily: 'DMSans_400Regular', lineHeight: 16 },
  },

  /**
   * 최소 터치 영역
   * iOS HIG: 44pt, Android: 48dp 권장
   */
  minTouchTarget: 44,

  /** 그레이디언트 — 딥 네이비 + 퍼플 */
  gradients: {
    splash: ['#0a0a14', '#0d0d1a', '#0a0a14'] as const,
    header: ['#0d0d1a', '#0a0a14'] as const,
    card: ['#12121e', '#0d0d1a'] as const,
    // 퍼플-핑크 강조 그라데이션 (버튼, 배지 등)
    purple: ['#8B5CF6', '#EC4899'] as const,
    // Aurora: 딥 퍼플 → 네이비 블랙 → 딥 블루
    aurora1: ['#1a0a2e', '#0a0a14', '#0a0f28'] as const,
    aurora2: ['#0a0f28', '#0a0a14', '#1a0a2e'] as const,
  },

  /** 캐릭터 글로우 — 퍼플 */
  glow: {
    soft: 'rgba(139,92,246,0.07)',
    medium: 'rgba(139,92,246,0.18)',
    strong: 'rgba(139,92,246,0.32)',
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
