import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { AppText } from '@/components/ui';

interface BillCardProps {
  id: string;
  vendor: string;
  amount?: number | null;
  dueDate: string;
  autopay?: boolean;
  currency?: string;
  advisory?: string;
  compact?: boolean;
  onPress?: () => void;
  /** Stitch glass style, rose left border — Auto-Vault tarzı */
  glass?: boolean;
}

export function BillCard({
  id,
  vendor,
  amount,
  dueDate,
  currency = 'TRY',
  advisory,
  compact = false,
  onPress: onPressProp,
  glass = false,
}: BillCardProps) {
  const theme = useTheme();
  const accentRose = (theme.colors as { accentRose?: string }).accentRose ?? '#FDA4AF';
  const accentViolet = (theme.colors as { accent?: string }).accent ?? '#7C3AED';

  const router = useRouter();
  const handlePress = onPressProp ?? (() => router.push({ pathname: '/(tabs)/bill/[id]', params: { id } }));

  const glassStyle = glass
    ? {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        borderLeftWidth: 4,
        borderLeftColor: accentRose,
        shadowColor: '#6D28D9',
        shadowOffset: { width: 0, height: 4 } as const,
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 4,
      }
    : {};

  return (
    <Pressable onPress={handlePress}>
      <View
        style={[
          {
            borderRadius: theme.radius.xl,
            padding: compact ? theme.spacing.md : theme.spacing.lg,
            marginBottom: compact ? 0 : theme.spacing.md,
          },
          glassStyle,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: `${accentRose}20`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="wallet-outline" size={20} color={accentRose} />
          </View>
          <View>
            <AppText variant="body" style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>
              {vendor}
            </AppText>
            {advisory && (
              <AppText variant="small" style={{ color: theme.colors.textMuted, marginTop: 2 }}>{advisory}</AppText>
            )}
          </View>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
            padding: theme.spacing.sm,
            borderRadius: theme.radius.lg,
          }}
        >
          <AppText variant="small" style={{ color: theme.colors.textSecondary, fontStyle: 'italic', flex: 1 }} numberOfLines={1}>
            "{advisory ?? 'Ödeme bekleniyor'}"
          </AppText>
          <AppText variant="body" style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>
            {amount != null ? `${amount} ${currency}` : '—'}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}
