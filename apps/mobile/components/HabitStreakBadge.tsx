import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { AppText } from '@/components/ui';

interface HabitStreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md';
}

export function HabitStreakBadge({ streak, size = 'sm' }: HabitStreakBadgeProps) {
  const theme = useTheme();
  const isSm = size === 'sm';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: isSm ? theme.spacing.xs : theme.spacing.sm,
        paddingHorizontal: isSm ? theme.spacing.sm : theme.spacing.md,
        borderRadius: theme.radius.full,
        backgroundColor: (theme.colors as { primaryMuted?: string }).primaryMuted ?? theme.colors.surface2,
      }}
    >
      <Ionicons name="flame" size={isSm ? 14 : 18} color={theme.colors.primary} style={{ marginRight: theme.spacing.xs }} />
      <AppText variant="small" style={{ color: theme.colors.primary, fontWeight: '600' }}>{streak}</AppText>
    </View>
  );
}
