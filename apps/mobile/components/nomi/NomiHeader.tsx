import { View, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { AppText } from '@/components/ui';
import { nomiColors } from '@/theme/tokens';

interface NomiHeaderProps {
  title: string;
  subtitle?: string;
  right?: {
    search?: () => void;
    settings?: () => void;
    avatar?: string;
  };
}

export function NomiHeader({ title, subtitle, right }: NomiHeaderProps) {
  const theme = useTheme();
  const colors = (theme.colors as typeof nomiColors) ?? theme.colors;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md }}>
      <View>
        <AppText variant="h2" style={{ color: colors.textPrimary ?? theme.colors.textPrimary, fontWeight: '700' }}>
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="small" style={{ color: colors.textMuted ?? theme.colors.textMuted, marginTop: 2 }}>
            {subtitle}
          </AppText>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        {right?.search && (
          <Pressable onPress={right.search} accessibilityLabel="Search" style={{ padding: theme.spacing.sm }}>
            <Ionicons name="search" size={22} color={colors.textMuted ?? theme.colors.textMuted} />
          </Pressable>
        )}
        {right?.settings && (
          <Pressable onPress={right.settings} accessibilityLabel="Settings" style={{ padding: theme.spacing.sm }}>
            <Ionicons name="settings-outline" size={22} color={colors.textMuted ?? theme.colors.textMuted} />
          </Pressable>
        )}
        {right?.avatar && (
          <Image source={{ uri: right.avatar }} style={{ width: 40, height: 40, borderRadius: 20 }} />
        )}
      </View>
    </View>
  );
}
