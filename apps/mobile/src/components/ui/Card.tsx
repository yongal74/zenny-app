/**
 * 공통 Card 컴포넌트 - 세션 C: UI/UX 리팩터링
 *
 * 사용법:
 *   <Card>...</Card>
 *   <Card variant="elevated" padding="xxl">...</Card>
 *   <Card variant="bordered">...</Card>
 *   <Card variant="glow">...</Card>  ← 퍼플 글로우 강조 카드
 */
import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { theme } from '../../constants/theme';

export type CardVariant = 'default' | 'elevated' | 'bordered' | 'glow';

export interface CardProps extends ViewProps {
  variant?: CardVariant;
  /** theme.spacing의 키 */
  padding?: keyof typeof theme.spacing;
}

export function Card({
  variant = 'default',
  padding = 'xl',
  style,
  children,
  ...props
}: CardProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.base,
        { padding: theme.spacing[padding] },
        variantStyles[variant],
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.lg,
  },
});

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  elevated: {
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  bordered: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  glow: {
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
});
