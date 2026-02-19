import { useEffect } from 'react';
import { View, Pressable, LayoutAnimation, UIManager, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { AppText, AppButton } from '@/components/ui';
import { EventCard } from '@/components/timeline/EventCard';
import { BillCard } from '@/components/timeline/BillCard';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TimelineItem = Record<string, unknown> & {
  id: string;
  kind: string;
  title?: string;
  startAt?: string | null;
  endAt?: string | null;
  vendor?: string;
  amount?: number | null;
  dueDate?: string;
  autopay?: boolean;
  currency?: string;
  location?: string | null;
  status?: string;
  metadata?: Record<string, unknown>;
};

interface FlowActivityCardProps {
  item: TimelineItem;
  time: string;
  isNow: boolean;
  isSelected: boolean;
  isPast: boolean;
  habitStatus?: string | null;
  isExpanded: boolean;
  onPress: () => void;
  onHabitEntry?: (habitId: string, status: 'done' | 'skipped') => void;
  entryLoading?: boolean;
}

export function FlowActivityCard({
  item,
  time,
  isNow,
  isSelected,
  isPast,
  habitStatus,
  isExpanded,
  onPress,
  onHabitEntry,
  entryLoading = false,
}: FlowActivityCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const accentViolet = '#7C3AED';
  const slate300 = '#94a3b8';

  const handleNavigate = () => {
    if (item.kind === 'habit_block') {
      const habitId = (item.metadata?.habitId as string) ?? item.id;
      router.push({ pathname: '/(tabs)/habit/[id]', params: { id: habitId } } as never);
    } else if (item.kind === 'event') {
      router.push({ pathname: '/(tabs)/event/[id]', params: { id: item.id } } as never);
    } else if (item.kind === 'bill') {
      router.push({ pathname: '/(tabs)/bill/[id]', params: { id: item.id } } as never);
    } else if (['work_block', 'task', 'appointment', 'reminder', 'subscription', 'goal', 'travel', 'journal'].includes(item.kind)) {
      router.push({ pathname: '/(tabs)/item/[id]', params: { id: item.id, kind: item.kind } } as never);
    }
  };

  // Bill: direct navigation, no accordion
  if (item.kind === 'bill') {
    return (
      <BillCard
        id={item.id}
        vendor={(item.vendor ?? item.title) as string}
        amount={item.amount as number | null}
        dueDate={(item.dueDate as string) ?? ''}
        autopay={item.autopay as boolean}
        currency={(item.currency as string) ?? 'TRY'}
        advisory="Subscription Advisory"
        compact
        glass
        onPress={handleNavigate}
      />
    );
  }

  // Event or Habit: accordion on tap
  const isHabit = item.kind === 'habit_block';
  const habitId = isHabit ? ((item.metadata?.habitId as string) ?? item.id) : '';
  const isDone = habitStatus === 'done';
  const isSkipped = habitStatus === 'skipped';

  useEffect(() => {
    if (isExpanded) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  }, [isExpanded]);

  const kindTag = (): string | undefined => {
    if (isHabit) return 'HABIT';
    const labels: Record<string, string> = {
      work_block: 'WORK',
      task: 'TASK',
      appointment: 'APPOINTMENT',
      reminder: 'REMINDER',
      subscription: 'SUB',
      goal: 'GOAL',
      travel: 'TRAVEL',
      journal: 'JOURNAL',
    };
    return labels[item.kind] ?? (isNow || isSelected ? 'EVENT' : undefined);
  };
  const subtext = (item.location as string) ?? (item as Record<string, unknown>).project ?? (item as Record<string, unknown>).withWhom ?? (item as Record<string, unknown>).vendor ?? null;

  return (
    <View>
      <Pressable onPress={onPress}>
        <EventCard
          id={isHabit ? habitId : item.id}
          title={(item.title as string) ?? ''}
          startAt={(item.startAt ?? (item as Record<string, unknown>).remindAt) as string | null}
          endAt={item.endAt as string | null}
          location={subtext}
          status={isDone || isSkipped ? 'completed' : (item.status as string) ?? 'scheduled'}
          summary={item.summary as string | null}
          tag={kindTag()}
          kind={(isHabit ? 'habit_block' : item.kind) as 'event' | 'habit_block' | 'work_block' | 'task' | 'appointment' | 'reminder' | 'subscription' | 'goal' | 'travel' | 'journal'}
          participantCount={(item.metadata?.participantCount as number) ?? 0}
          participants={(item.metadata?.participants as Array<{ email?: string; displayName?: string }>) ?? undefined}
          compact
          glass
          borderLeftColor={isPast ? slate300 : isNow || isSelected ? accentViolet : slate300}
          dimmed={isPast}
          isActive={isNow || isSelected || isExpanded}
          disableNavigation
        />
      </Pressable>

      {isExpanded && (
        <View
          style={{
            marginTop: theme.spacing.sm,
            padding: theme.spacing.md,
            backgroundColor: 'rgba(124, 58, 237, 0.08)',
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: 'rgba(124, 58, 237, 0.2)',
            gap: theme.spacing.sm,
          }}
        >
          {isHabit ? (
            <>
              {!isDone && !isSkipped && (
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
                  <AppButton
                    variant="primary"
                    onPress={() => onHabitEntry?.(habitId, 'done')}
                    loading={entryLoading}
                    style={{ flex: 1, minWidth: 100 }}
                  >
                    Tamamladım
                  </AppButton>
                  <AppButton
                    variant="secondary"
                    onPress={() => onHabitEntry?.(habitId, 'skipped')}
                    loading={entryLoading}
                    style={{ flex: 1, minWidth: 100 }}
                  >
                    Atladım
                  </AppButton>
                </View>
              )}
              {(isDone || isSkipped) && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                  <Ionicons
                    name={isDone ? 'checkmark-circle' : 'close-circle-outline'}
                    size={20}
                    color={isDone ? theme.colors.success : theme.colors.textSecondary}
                  />
                  <AppText color={isDone ? 'success' : 'secondary'}>
                    {isDone ? 'Tamamlandı' : 'Atlandı'}
                  </AppText>
                </View>
              )}
              <Pressable
                onPress={handleNavigate}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: theme.spacing.xs,
                }}
              >
                <AppText color="secondary">Detaylar</AppText>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={handleNavigate}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: theme.spacing.xs,
              }}
            >
              <AppText color="secondary">Detaylar</AppText>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
