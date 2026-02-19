import { View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from '@/components/ui';

interface ProgressRingProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({ completed, total, size = 64, strokeWidth = 6 }: ProgressRingProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: (theme.colors as { primaryMuted?: string }).primaryMuted ?? theme.colors.border,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.elevations[1],
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <AppText variant="h2" style={{ color: theme.colors.primary, fontWeight: '700' }}>
          {total > 0 ? completed : '0'}
        </AppText>
        <AppText variant="small" color="muted">of {total}</AppText>
      </View>
    </View>
  );
}
