import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

type Variant = 'display' | 'title' | 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'small';

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: 'primary' | 'secondary' | 'muted' | 'accent' | 'success' | 'warning' | 'danger';
}

export function AppText({
  variant = 'body',
  color,
  style,
  ...props
}: AppTextProps) {
  const theme = useTheme();
  const textColor =
    color === 'secondary'
      ? theme.colors.textSecondary
      : color === 'muted'
        ? theme.colors.muted
        : color === 'accent'
          ? theme.colors.accent
          : color === 'success'
            ? theme.colors.success
            : color === 'warning'
              ? theme.colors.warning
              : color === 'danger'
                ? theme.colors.danger
                : theme.colors.textPrimary;

  return (
    <Text
      style={[
        theme.typography[variant],
        { color: textColor },
        style,
      ]}
      {...props}
    />
  );
}
