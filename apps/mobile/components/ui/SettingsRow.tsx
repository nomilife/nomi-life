import { View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

interface SettingsRowProps {
  label: string;
  subtitle?: string;
  right: React.ReactNode;
}

export function SettingsRow({ label, subtitle, right }: SettingsRowProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        marginBottom: theme.spacing.sm,
        ...theme.elevations[1],
      }}
    >
      <View style={{ flex: 1, marginRight: theme.spacing.md }}>
        <AppText variant="body">{label}</AppText>
        {subtitle ? (
          <AppText variant="small" color="muted" style={{ marginTop: theme.spacing.xs }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}
