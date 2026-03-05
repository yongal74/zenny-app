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
    // 배경 계층 — 딥 다크 에메랄드 (Dribbble Xino 스타일)
    bg: '#050E0B',
    bg2: '#081510',
    surface: '#0D1F19',
    surface2: '#122A20',

    // 텍스트 계층
    text: {
      primary: '#E8F5F0',
      secondary: '#6BAD98',
      tertiary: '#3A6B57',
      inverse: '#050E0B',
    },

    // 브랜드 색상
    primary: '#0A2A22',
    accent: '#00D9A0',   // 메인 포인트 — 밝은 민트/틸
    teal: '#00D9A0',
    gold: '#D4A850',

    // 피드백
    success: '#00D9A0',
    error: '#E05C5C',
    warning: '#D4A850',

    // 기타
    border: '#1A3D30',
    bottomBar: '#040C09',
    overlay: 'rgba(0,0,0,0.75)',

    // 퍼플 자리 → 틸로 교체 (하위호환)
    purple: '#00D9A0',
    tealVivid: '#00FFB8',  // EXP 바, 완료 체크마크

    // 글래스모피즘 카드 — 틸 틴트
    glass: 'rgba(0,217,160,0.06)',
    glassBorder: 'rgba(0,217,160,0.15)',
    glassHighlight: 'rgba(0,217,160,0.10)',
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
    // 제목 계열 (Manrope - 모던 지오메트릭)
    h1: { fontSize: 32, fontFamily: 'Manrope_700Bold', lineHeight: 40 },
    h2: { fontSize: 24, fontFamily: 'Manrope_700Bold', lineHeight: 32 },
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
   */
  minTouchTarget: 44,

  /** 그레이디언트 — 에메랄드 다크 */
  gradients: {
    splash: ['#050E0B', '#0A1C15', '#050E0B'] as const,
    header: ['#081510', '#050E0B'] as const,
    card: ['#0D1F19', '#0A1810'] as const,
    aurora1: ['#003322', '#050E0B', '#001A2E'] as const,  // 틸-다크-네이비
    aurora2: ['#001E3A', '#050E0B', '#002E22'] as const,
  },

  /** 캐릭터 글로우 — 틸 계열 */
  glow: {
    soft: 'rgba(0,217,160,0.06)',
    medium: 'rgba(0,217,160,0.12)',
    strong: 'rgba(0,217,160,0.20)',
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
