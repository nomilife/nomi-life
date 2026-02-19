import { View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from '@/components/ui';
import { nomiColors } from '@/theme/tokens';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  progress?: number;
  variant?: 'progress' | 'focus' | 'default';
}

export function MetricCard({ label, value, subtext, progress, variant = 'default' }: MetricCardProps) {
  const theme = useTheme();
  const primary = (theme.colors as { primary?: string }).primary ?? nomiColors.primary;

  if (variant === 'progress' && progress != null) {
    return (
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: theme.radius.xl,
          padding: theme.spacing.lg,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#E8D5C4',
          ...theme.elevations[1],
        }}
      >
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: primary + '15', borderWidth: 4, borderColor: primary + '40', alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="h1" style={{ color: '#2D3748', fontWeight: '700' }}>{progress}%</AppText>
        </View>
        <AppText variant="small" style={{ color: '#718096', marginTop: theme.spacing.sm, textTransform: 'uppercase', letterSpacing: 1 }}>
          {label}
        </AppText>
        {subtext && <AppText variant="small" style={{ color: primary, marginTop: 2, fontWeight: '600' }}>{subtext}</AppText>}
      </View>
    );
  }

  if (variant === 'focus') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FFF0E6',
          borderRadius: theme.radius.xl,
          padding: theme.spacing.md,
          borderWidth: 1,
          borderColor: 'rgba(224, 124, 60, 0.2)',
          ...theme.elevations[1],
        }}
      >
        <AppText variant="small" style={{ color: '#718096', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
          {label}
        </AppText>
        <AppText variant="h3" style={{ color: '#2D3748', fontWeight: '700' }}>{value}</AppText>
        {subtext && <AppText variant="small" style={{ color: '#718096', marginTop: 2 }}>{subtext}</AppText>}
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: theme.radius.xl,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: '#E8D5C4',
        ...theme.elevations[1],
      }}
    >
      <AppText variant="small" style={{ color: '#718096', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        {label}
      </AppText>
      <AppText variant="h3" style={{ color: '#2D3748', fontWeight: '700' }}>{value}</AppText>
    </View>
  );
}
