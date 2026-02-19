import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { AppText } from '@/components/ui';
import { nomiColors } from '@/theme/tokens';
import { AiProposalCard as ProposalType } from '@/types/nomi';

interface ProposalCardProps {
  card: ProposalType;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ProposalCard({ card, onConfirm, onCancel }: ProposalCardProps) {
  const theme = useTheme();
  const primary = (theme.colors as { primary?: string }).primary ?? nomiColors.primary;

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: theme.radius.xl,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: '#E8D5C4',
        ...theme.elevations[2],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
        <Ionicons name="calendar" size={24} color={primary} />
        <AppText variant="h3" style={{ color: '#2D3748', fontWeight: '700' }}>
          {card.title}
        </AppText>
      </View>
      {card.items.map((item) => (
        <View
          key={item.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.spacing.md,
            gap: theme.spacing.md,
          }}
        >
          <View
            style={{
              width: 48,
              height: 32,
              borderRadius: 16,
              backgroundColor: primary + '20',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText variant="small" style={{ color: primary, fontWeight: '600' }}>
              {item.time}
            </AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="body" style={{ color: '#2D3748', fontWeight: '600' }}>
              {item.title}
            </AppText>
            <AppText variant="small" style={{ color: '#718096', marginTop: 2 }}>
              {item.subtitle}
            </AppText>
          </View>
          <Ionicons name="reorder-four" size={20} color="#94a3b8" />
        </View>
      ))}
      {card.rationale && (
        <AppText variant="small" style={{ color: '#718096', marginBottom: theme.spacing.lg }}>
          {card.rationale}
        </AppText>
      )}
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <Pressable
          onPress={onCancel}
          style={{
            flex: 1,
            paddingVertical: theme.spacing.md,
            borderRadius: theme.radius.lg,
            backgroundColor: '#f0f0f0',
            alignItems: 'center',
          }}
        >
          <AppText variant="body" style={{ color: '#4A5568', fontWeight: '600' }}>Cancel</AppText>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.sm,
            paddingVertical: theme.spacing.md,
            borderRadius: theme.radius.lg,
            backgroundColor: primary,
            ...theme.elevations[1],
          }}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <AppText variant="body" style={{ color: '#fff', fontWeight: '600' }}>Confirm Schedule</AppText>
        </Pressable>
      </View>
    </View>
  );
}
