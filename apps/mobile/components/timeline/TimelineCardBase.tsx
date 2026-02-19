import { View, Text } from 'react-native';
import dayjs from 'dayjs';
import { useTheme } from '@/theme';

interface TimelineCardBaseProps {
  kind: string;
  title: string;
  startAt?: string | null;
  endAt?: string | null;
  summary?: string | null;
  status?: string;
}

export function TimelineCardBase({
  kind,
  title,
  startAt,
  endAt,
  summary,
  status = 'scheduled',
}: TimelineCardBaseProps) {
  const theme = useTheme();
  const timeRange =
    startAt && endAt
      ? `${dayjs(startAt).format('HH:mm')} – ${dayjs(endAt).format('HH:mm')}`
      : null;

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
      }}
    >
      <Text style={{ ...theme.typography.h3, color: theme.colors.text }}>{title}</Text>
      {timeRange && (
        <Text style={{ ...theme.typography.caption, color: theme.colors.textMuted, marginTop: theme.spacing.xs }}>
          {timeRange}
        </Text>
      )}
      {summary && (
        <Text
          style={{ ...theme.typography.body, color: theme.colors.textMuted, marginTop: theme.spacing.xs }}
          numberOfLines={2}
        >
          {summary}
        </Text>
      )}
      <View style={{ marginTop: theme.spacing.sm }}>
        <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
          {kind} · {status}
        </Text>
      </View>
    </View>
  );
}
