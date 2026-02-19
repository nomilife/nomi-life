import { Pressable, ViewProps } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

interface AppChipProps extends ViewProps {
  label: string;
  selected?: boolean;
  /** Badge stili: koyu mor arka plan, beyaz yazı (event kartları için) */
  variant?: 'default' | 'badge';
  onPress?: () => void;
}

const BADGE_BG = '#5B4B8A';

export function AppChip({ label, selected, variant = 'default', onPress, style, ...props }: AppChipProps) {
  const theme = useTheme();
  const isBadge = variant === 'badge';
  const bgColor = isBadge ? BADGE_BG : (selected ? theme.colors.primary : theme.colors.surface2);
  const textColor = isBadge || selected ? '#fff' : theme.colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.radius.full,
          backgroundColor: bgColor,
        },
        style,
      ]}
      {...props}
    >
      <AppText variant="caption" style={{ color: textColor, fontWeight: '600' }}>
        {label}
      </AppText>
    </Pressable>
  );
}
