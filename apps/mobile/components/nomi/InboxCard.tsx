import { View, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { AppText } from '@/components/ui';
import { nomiColors } from '@/theme/tokens';
import { InboxItem } from '@/types/nomi';

function formatAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = (now - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

const LABEL_BY_TYPE: Record<string, string> = {
  voice: 'VOICE NOTE',
  note: 'QUICK NOTE',
  imported_email: 'IMPORTED (EMAIL)',
};

interface InboxCardProps {
  item: InboxItem;
  actions: Array<{ label: string; onPress: () => void }>;
}

export function InboxCard({ item, actions }: InboxCardProps) {
  const theme = useTheme();
  const primary = (theme.colors as { primary?: string }).primary ?? nomiColors.primary;

  const label = `${LABEL_BY_TYPE[item.type] ?? item.type} • ${formatAgo(item.createdAt)}`;
  const badge = item.aiLabel ? `AI: ${item.aiLabel}` : null;

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: theme.radius.xl,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: '#E8D5C4',
        ...theme.elevations[1],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
        <AppText variant="small" style={{ color: '#718096', textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>
          {label}
        </AppText>
        {badge && (
          <View style={{ backgroundColor: primary + '25', paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.radius.sm }}>
            <AppText variant="small" style={{ color: primary, fontWeight: '700', fontSize: 10 }}>{badge}</AppText>
          </View>
        )}
      </View>

      {item.type === 'voice' && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <View
                  key={i}
                  style={{
                    width: 4,
                    height: 12 + (i % 3) * 4,
                    borderRadius: 2,
                    backgroundColor: primary + '60',
                  }}
                />
              ))}
            </View>
            <AppText variant="small" style={{ color: '#718096' }}>
              {item.durationSeconds ? `0:${String(item.durationSeconds).padStart(2, '0')}` : '0:00'}
            </AppText>
          </View>
          <AppText variant="body" style={{ color: '#2D3748', fontStyle: 'italic', marginBottom: theme.spacing.md }}>
            "{item.content}"
          </AppText>
        </>
      )}

      {item.type === 'note' && (
        <>
          {item.title && <AppText variant="body" style={{ color: '#2D3748', fontWeight: '600', marginBottom: 4 }}>{item.title}</AppText>}
          <AppText variant="small" style={{ color: '#718096', marginBottom: theme.spacing.md }} numberOfLines={2}>{item.content}</AppText>
        </>
      )}

      {item.type === 'imported_email' && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <AppText variant="body" style={{ color: '#2D3748', fontWeight: '600', marginBottom: 4 }}>{item.title ?? item.content}</AppText>
            {item.from && (
              <AppText variant="small" style={{ color: '#718096', marginBottom: theme.spacing.sm }}>From: {item.from}</AppText>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.radius.lg, alignSelf: 'flex-start' }}>
              <AppText variant="small" style={{ color: '#718096', marginRight: 8 }}>AMOUNT DUE</AppText>
              <AppText variant="body" style={{ color: primary, fontWeight: '700' }}>
                ${item.amount != null ? item.amount.toFixed(2) : '124.50'}
              </AppText>
            </View>
          </View>
          {item.attachments?.[0] && (
            <Image
              source={{ uri: item.attachments[0].uri }}
              style={{ width: 64, height: 80, borderRadius: theme.radius.md, backgroundColor: '#f0f0f0' }}
              resizeMode="cover"
            />
          )}
        </View>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {actions.map((a) => (
          <Pressable
            key={a.label}
            onPress={a.onPress}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.xs,
              paddingVertical: theme.spacing.xs,
              paddingHorizontal: theme.spacing.sm,
              borderRadius: theme.radius.full,
              borderWidth: 1,
              borderColor: primary + '40',
            }}
          >
            <AppText variant="small" style={{ color: primary, fontWeight: '600' }}>{a.label}</AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
