import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { AppText } from '@/components/ui';

interface DailyBriefCardProps {
  brief?: string | null;
  onPlanDay?: () => void;
  onReschedule?: () => void;
  onSummarize?: () => void;
  onAddTask?: () => void;
  onHide?: () => void;
}

export function DailyBriefCard({
  brief,
  onPlanDay,
  onReschedule,
  onSummarize,
  onAddTask,
  onHide,
}: DailyBriefCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const handlePlanDay = () => onPlanDay ?? (() => router.push('/(modal)/voice' as never));
  const handleAddTask = () => onAddTask ?? (() => router.push('/(tabs)/event-create' as never));

  const glassStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  };

  return (
    <View
      style={{
        ...glassStyle,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.lg,
      }}
    >
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: (theme.colors as { primaryMuted?: string }).primaryMuted ?? theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: theme.spacing.sm,
            }}
          >
            <Ionicons name="sparkles" size={20} color={theme.colors.textPrimary} />
          </View>
          <AppText variant="h3" style={{ color: theme.colors.textPrimary }}>
            Your day at a glance
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          {onHide && (
            <Pressable onPress={onHide} hitSlop={12} style={{ padding: theme.spacing.xs }}>
              <Ionicons name="eye-off-outline" size={20} color={theme.colors.textMuted} />
            </Pressable>
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={theme.colors.textMuted}
          />
        </View>
      </Pressable>
      {expanded && (
        <>
          {brief ? (
            <AppText variant="body" color="muted" style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.md }}>
              {brief}
            </AppText>
          ) : (
            <AppText variant="body" color="muted" style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.md }}>
              No brief yet. Tap "Plan my day" to generate one.
            </AppText>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <Pressable
          onPress={() => router.push('/(tabs)/copilot' as never)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.primary + '20',
            borderWidth: 1,
            borderColor: theme.colors.primary,
          }}
        >
          <Ionicons name="chatbubbles" size={16} color={theme.colors.primary} style={{ marginRight: theme.spacing.xs }} />
          <AppText variant="small" style={{ color: theme.colors.primary, fontWeight: '600' }}>Chat with Nomi</AppText>
        </Pressable>
        <Pressable
          onPress={handlePlanDay}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} style={{ marginRight: theme.spacing.xs }} />
          <AppText variant="small" style={{ color: theme.colors.primary, fontWeight: '600' }}>Plan my day</AppText>
        </Pressable>
        <Pressable
          onPress={onReschedule}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Ionicons name="time-outline" size={16} color={theme.colors.primary} style={{ marginRight: theme.spacing.xs }} />
          <AppText variant="small" style={{ color: theme.colors.primary, fontWeight: '600' }}>Reschedule</AppText>
        </Pressable>
        <Pressable
          onPress={onSummarize}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Ionicons name="document-text-outline" size={16} color={theme.colors.primary} style={{ marginRight: theme.spacing.xs }} />
          <AppText variant="small" style={{ color: theme.colors.primary, fontWeight: '600' }}>Summarize</AppText>
        </Pressable>
        <Pressable
          onPress={handleAddTask}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Ionicons name="add-circle-outline" size={16} color={theme.colors.primary} style={{ marginRight: theme.spacing.xs }} />
          <AppText variant="small" style={{ color: theme.colors.primary, fontWeight: '600' }}>Add task</AppText>
        </Pressable>
      </View>
        </>
      )}
    </View>
  );
}
