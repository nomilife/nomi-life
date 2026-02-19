import { Pressable, PressableProps, Text, ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface AppButtonProps extends Omit<PressableProps, 'children'> {
  variant?: Variant;
  loading?: boolean;
  children: string;
}

export function AppButton({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  style,
  ...props
}: AppButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';

  const bg = isPrimary
    ? theme.colors.primary
    : isGhost || isDanger
      ? 'transparent'
      : theme.colors.surface2;
  const textColor = isPrimary
    ? '#fff'
    : isDanger
      ? theme.colors.danger
      : isGhost
        ? theme.colors.primary
        : theme.colors.textPrimary;
  const borderWidth = isGhost && !isDanger ? 0 : 1;
  const borderColor = isDanger ? theme.colors.danger : theme.colors.border;

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
          borderWidth,
          borderColor,
          ...(isPrimary ? theme.elevations[1] : {}),
        },
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : theme.colors.primary} size="small" />
      ) : (
        <AppText style={{ color: textColor }} variant="body">
          {children}
        </AppText>
      )}
    </Pressable>
  );
}
