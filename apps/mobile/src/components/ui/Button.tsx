/**
 * 공통 Button 컴포넌트 - 세션 C: UI/UX 리팩터링
 *
 * 사용법:
 *   <Button label="기록하기" onPress={...} />
 *   <Button label="AI 코치" variant="secondary" icon="✿" onPress={...} />
 *   <Button label="완료" variant="teal" size="sm" onPress={...} />
 *   <Button label="저장 중..." loading onPress={...} />
 */
import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, type TouchableOpacityProps, type ViewStyle,
} from 'react-native';
import { theme } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'teal' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** 아이콘 이모지 또는 문자 (선택) */
  icon?: string;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style as ViewStyle,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.82}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.text.primary} />
      ) : (
        <>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={[styles.label, labelVariantStyles[variant], labelSizeStyles[size]]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radius.md,
    // 최소 터치 영역 보장 (iOS 44pt / Android 48dp)
    minHeight: theme.minTouchTarget,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.4 },
  label: { fontFamily: 'Inter_600SemiBold' },
  icon: { fontSize: 18 },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.surface2 },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  teal: { backgroundColor: theme.colors.teal },
  danger: { backgroundColor: theme.colors.error },
});

const labelVariantStyles = StyleSheet.create({
  primary: { color: theme.colors.text.primary },
  secondary: { color: theme.colors.text.primary },
  ghost: { color: theme.colors.text.secondary },
  teal: { color: theme.colors.text.primary },
  danger: { color: theme.colors.text.primary },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
  md: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  lg: { paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.md + 2 },
});

const labelSizeStyles = StyleSheet.create({
  sm: { fontSize: 13 },
  md: { fontSize: 14 },
  lg: { fontSize: 15 },
});
