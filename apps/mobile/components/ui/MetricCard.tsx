import { View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

interface MetricCardProps {
  label: string;
  value: string;
  valueColor?: 'default' | 'primary' | 'success' | 'muted';
}

export function MetricCard({ label, value, valueColor = 'default' }: MetricCardProps) {
  const theme = useTheme();
  const valueColorMap = {
    default: theme.colors.textPrimary,
    primary: theme.colors.primary,
    success: theme.colors.success,
    muted: theme.colors.muted,
  };
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        ...theme.elevations[1],
      }}
    >
      <AppText variant="small" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </AppText>
      <AppText
        variant="h2"
        style={{
          marginTop: theme.spacing.xs,
          color: valueColorMap[valueColor],
        }}
      >
        {value}
      </AppText>
    </View>
  );
}
