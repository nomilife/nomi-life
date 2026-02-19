import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { AppText, AppChip } from '@/components/ui';
import { AvatarStack } from '@/components/ui/AvatarStack';

export type EventParticipant = { email?: string; displayName?: string };

interface EventCardProps {
  id: string;
  title: string;
  disableNavigation?: boolean;
  onPress?: () => void;
  kind?: 'event' | 'habit_block';
  compact?: boolean;
  /** Stitch glass style + left border */
  glass?: boolean;
  /** Past event = slate, active = violet */
  borderLeftColor?: string;
  /** Dim past events */
  dimmed?: boolean;
  /** Active/now — premium shadow */
  isActive?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  location?: string | null;
  status?: string;
  tag?: string;
  participantCount?: number;
  participants?: EventParticipant[];
  summary?: string | null;
}

export function EventCard({
  id,
  title,
  startAt,
  endAt,
  location,
  status = 'scheduled',
  tag,
  participantCount = 0,
  participants,
  summary,
  disableNavigation = false,
  onPress: onPressProp,
  kind = 'event',
  compact = false,
  glass = false,
  borderLeftColor,
  dimmed = false,
  isActive = false,
}: EventCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const timeStr = startAt ? dayjs(startAt).format('HH:mm') : null;
  const minsLeft = startAt && endAt
    ? Math.max(0, dayjs(endAt).diff(dayjs(), 'minute'))
    : null;
  const isCompleted = status === 'completed' || status === 'done';
  const cardBg = 'cardBg' in theme.colors ? theme.colors.cardBg : theme.colors.surface;

  const glassStyle = glass ? {
    borderWidth: 1,
    borderColor: isActive ? 'rgba(109, 40, 217, 0.15)' : 'rgba(255, 255, 255, 0.8)',
    shadowColor: isActive ? '#6D28D9' : '#000',
    shadowOffset: { width: 0, height: isActive ? 10 : 4 },
    shadowOpacity: isActive ? 0.25 : 0.05,
    shadowRadius: isActive ? 40 : 20,
    elevation: isActive ? 8 : 4,
    borderLeftWidth: 4,
    borderLeftColor: borderLeftColor ?? theme.colors.border,
  } : {};

  const content = (
      <View
        style={[
          {
            backgroundColor: glass ? (isActive ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.5)') : cardBg,
            borderRadius: glass && isActive ? 32 : theme.radius.xl,
            padding: compact ? theme.spacing.md : (glass ? theme.spacing.lg : theme.spacing.lg),
            marginBottom: compact ? 0 : theme.spacing.md,
            overflow: 'hidden',
            opacity: dimmed ? 0.6 : 1,
          },
          !glass && theme.elevations[2],
          glassStyle,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
              {tag && <AppChip label={tag.toUpperCase()} variant="badge" style={{ alignSelf: 'flex-start' }} />}
              {timeStr && !isActive && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                  <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
                  <AppText variant="small" color="secondary">{timeStr}</AppText>
                </View>
              )}
              {isActive && (
                <View style={{ marginLeft: 'auto' }}>
                  <Ionicons name="flash" size={18} color={(theme.colors as { accent?: string }).accent ?? theme.colors.primary} />
                </View>
              )}
              {!isActive && (
              <View style={{ marginLeft: 'auto' }}>
                {isCompleted ? (
                  <Ionicons name="checkmark-circle" size={22} color={theme.colors.success} />
                ) : (
                  <Pressable onPress={(e) => { e.stopPropagation(); }}>
                    <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.muted} />
                  </Pressable>
                )}
              </View>
              )}
            </View>
            <AppText variant={isActive ? 'display' : 'h2'} style={{ fontSize: isActive ? 18 : 16, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs, fontWeight: '700' }}>{title}</AppText>
            {location ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                <Ionicons name="location-outline" size={14} color={theme.colors.muted} />
                <AppText variant="small" color="muted">{location}</AppText>
              </View>
            ) : null}
            {summary && (
              <AppText variant="caption" color="muted" style={{ marginTop: theme.spacing.xs }}>
                {summary}
              </AppText>
            )}
            {(participantCount > 0 || (participants && participants.length > 0)) && (
              <View style={{ marginTop: theme.spacing.md }}>
                <AppText variant="small" color="muted" style={{ textTransform: 'uppercase', marginBottom: theme.spacing.xs }}>
                  Grup
                </AppText>
                <AvatarStack
                  count={participantCount || participants?.length || 0}
                  maxShow={4}
                  participants={participants?.map((p) => ({ email: p.email, displayName: p.displayName }))}
                />
              </View>
            )}
            {minsLeft != null && minsLeft > 0 && (
              <AppText variant="small" color="muted" style={{ marginTop: theme.spacing.sm }}>
                {isActive ? `${minsLeft}m left` : `${minsLeft}m kaldı`}
              </AppText>
            )}
          </View>
          {!disableNavigation && <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />}
        </View>
      </View>
  );

  if (disableNavigation && !onPressProp) {
    return content;
  }
  const defaultPress = () => {
    const path = kind === 'habit_block' ? '/(tabs)/habit/[id]' : '/(tabs)/event/[id]';
    router.push({ pathname: path, params: { id } });
  };
  return <Pressable onPress={onPressProp ?? defaultPress}>{content}</Pressable>;
}
