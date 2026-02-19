import { View, ScrollView } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from '@/components/ui';

const GLASS_CARD = {
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.8)',
  shadowColor: '#6D28D9',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 20,
  elevation: 4,
} as const;

interface FlowHighlightsBarProps {
  focusState?: number;
  netLiquid?: number;
  bioSync?: string;
}

export function FlowHighlightsBar({ focusState, netLiquid, bioSync }: FlowHighlightsBarProps) {
  const theme = useTheme();
  const accentViolet = (theme.colors as { accent?: string }).accent ?? theme.colors.primary;
  const focusDisplay = focusState != null ? (focusState <= 1 ? Math.round(focusState * 100) : focusState) : null;
  const cards = [
    { label: 'FOCUS STATE', value: focusDisplay != null ? `${focusDisplay}%` : '—', color: accentViolet },
    { label: 'NET LIQUID', value: netLiquid != null ? `$${netLiquid.toLocaleString()}` : '—', color: '#1e293b' },
    { label: 'BIO-SYNC', value: bioSync ?? '—', color: '#10b981' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: theme.spacing.sm, marginTop: theme.spacing.md, paddingRight: theme.spacing.lg }}
    >
      {cards.map((card) => (
        <View
          key={card.label}
          style={{
            flex: 0,
            minWidth: 110,
            ...GLASS_CARD,
            borderRadius: theme.radius.xl,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
          }}
        >
          <AppText variant="small" style={{ color: '#94a3b8', letterSpacing: 2, fontSize: 9, fontWeight: '600', marginBottom: 2, textTransform: 'uppercase' }}>
            {card.label}
          </AppText>
          <AppText variant="caption" style={{ color: card.color, fontWeight: '700', fontSize: 18 }}>
            {card.value}
          </AppText>
        </View>
      ))}
    </ScrollView>
  );
}
