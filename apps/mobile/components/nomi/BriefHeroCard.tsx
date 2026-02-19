import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { AppText } from '@/components/ui';
import { nomiColors } from '@/theme/tokens';

interface BriefHeroCardProps {
  userName: string;
  summary: string;
  onReorganize: () => void;
  actionChips?: Array<{ label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }>;
}

export function BriefHeroCard({ userName, summary, onReorganize, actionChips = [] }: BriefHeroCardProps) {
  const theme = useTheme();
  const primary = (theme.colors as { primary?: string }).primary ?? nomiColors.primary;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: theme.radius.xxl,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: '#E8D5C4',
        ...theme.elevations[2],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="sparkles" size={24} color={primary} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="body" style={{ color: '#2D3748', marginBottom: 4 }}>
            {greeting}, {userName}.
          </AppText>
          <AppText variant="small" style={{ color: '#718096', lineHeight: 20 }}>
            {summary}
          </AppText>
          <Pressable
            onPress={onReorganize}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.sm,
              marginTop: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              backgroundColor: primary,
              borderRadius: theme.radius.full,
              alignSelf: 'flex-start',
            }}
          >
            <Ionicons name="options" size={18} color="#fff" />
            <AppText variant="small" style={{ color: '#fff', fontWeight: '700' }}>Reorganize</AppText>
          </Pressable>
        </View>
      </View>
      {actionChips.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
          {actionChips.map((chip) => (
            <Pressable
              key={chip.label}
              onPress={chip.onPress}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.xs,
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.radius.full,
                backgroundColor: '#FFF8F0',
                borderWidth: 1,
                borderColor: 'rgba(224, 124, 60, 0.3)',
              }}
            >
              <Ionicons name={chip.icon} size={16} color={primary} />
              <AppText variant="small" style={{ color: primary, fontWeight: '600' }}>{chip.label}</AppText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
