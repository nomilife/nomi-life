import { useMemo, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useTheme } from '@/theme';
import { EventCard } from '@/components/timeline/EventCard';
import { BillCard } from '@/components/timeline/BillCard';
import {
  AppText,
  AppButton,
  SectionHeader,
  EmptyState,
  LoadingState,
} from '@/components/ui';
import { HabitStreakBadge } from '@/components/HabitStreakBadge';
import { HomeMenuModal } from '@/components/HomeMenuModal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { nomiAppColors } from '@/theme/tokens';

const today = dayjs().format('YYYY-MM-DD');

type TimelineItem = Record<string, unknown> & {
  id: string;
  kind: string;
  title?: string;
  summary?: string | null;
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

type Habit = { id: string; title: string; todayStatus?: string | null };

export default function RoutineScreen() {
  const { t } = useTranslation('routine');
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuVisible, setMenuVisible] = useState(false);

  const { data: timelineData, isLoading: timelineLoading, error: timelineError } = useQuery({
    queryKey: ['timeline', today],
    queryFn: ({ signal }) =>
      api<{ items: TimelineItem[] }>(`/timeline?date=${today}`, { signal }),
    staleTime: 30_000,
  });

  const { data: routineData } = useQuery({
    queryKey: ['routine', today],
    queryFn: () =>
      api<{ flowState: number; activeHabits: Habit[] }>(`/habits/routine?date=${today}`),
  });

  const entryMutation = useMutation({
    mutationFn: ({ habitId, status }: { habitId: string; status: string }) =>
      api(`/habits/${habitId}/entry`, {
        method: 'POST',
        body: JSON.stringify({ date: today, status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routine', today] });
      queryClient.invalidateQueries({ queryKey: ['timeline', today] });
    },
  });

  const items = timelineData?.items ?? [];
  const habitsByStatus = useMemo(() => {
    const m: Record<string, string | null> = {};
    for (const h of routineData?.activeHabits ?? []) {
      m[h.id] = h.todayStatus ?? null;
    }
    return m;
  }, [routineData?.activeHabits]);

  const sortedRows = useMemo(() => {
    const withTime: Array<{ item: TimelineItem; sortKey: string }> = [];
    for (const item of items) {
      if (item.kind === 'event' || item.kind === 'habit_block') {
        const t = (item.startAt as string) ?? '23:59:59';
        withTime.push({ item, sortKey: t });
      } else if (item.kind === 'bill') {
        const due = (item.dueDate as string) ?? '';
        withTime.push({ item, sortKey: due ? `${due}T12:00:00` : '23:59:59' });
      }
    }
    withTime.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    return withTime.map((r) => r.item);
  }, [items]);

  const flowState = Math.round((routineData?.flowState ?? 0) * 100);

  if (timelineLoading) return <LoadingState />;
  if (timelineError) {
    return (
      <View style={{ flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.background }}>
        <AppText color="danger">{(timelineError as Error).message}</AppText>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: nomiAppColors.background }}>
      <HomeMenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <ScreenHeader onMenuPress={() => setMenuVisible(true)} title={t('title')} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
      >
      <SectionHeader
        title={t('title')}
        action={
          <AppButton variant="primary" onPress={() => router.push('/(tabs)/habit-create')}>
            {t('addHabit', 'Add habit')}
          </AppButton>
        }
      />
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          borderWidth: 8,
          borderColor: theme.colors.primaryMuted,
          backgroundColor: theme.colors.surface,
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'center',
          marginVertical: theme.spacing.xl,
          ...theme.elevations[2],
        }}
      >
        <AppText variant="title" style={{ color: theme.colors.primary }}>{flowState}%</AppText>
        <AppText variant="small" color="muted">flow</AppText>
      </View>

      <SectionHeader title={t('tasksToday', 'Bugünkü görevler')} />
      {sortedRows.length === 0 ? (
        <EmptyState
          title={t('noHabits', 'Henüz görev yok')}
          message={t('noHabitsHint', 'Habit veya etkinlik ekleyerek başlayın.')}
          actionLabel={t('addHabit', 'Add habit')}
          onAction={() => router.push('/(tabs)/habit-create')}
        />
      ) : (
        sortedRows.map((item) => {
          if (item.kind === 'event') {
            return (
              <EventCard
                key={item.id}
                id={item.id}
                title={(item.title as string) ?? ''}
                startAt={item.startAt as string | null}
                endAt={item.endAt as string | null}
                location={item.location as string | null}
                status={(item.status as string) ?? 'scheduled'}
                summary={item.summary as string | null}
                tag={(item.metadata?.tag as string) ?? undefined}
                participantCount={(item.metadata?.participantCount as number) ?? 0}
                participants={(item.metadata?.participants as Array<{ email?: string; displayName?: string }>) ?? undefined}
              />
            );
          }
          if (item.kind === 'habit_block') {
            const habitId = (item.metadata?.habitId as string) ?? item.id;
            const todayStatus = habitsByStatus[habitId];
            const isDone = todayStatus === 'done';
            const streak = (item.metadata?.streak as number) ?? 0;
            return (
              <View key={item.id} style={{ marginBottom: theme.spacing.md }}>
                <Pressable onPress={() => router.push({ pathname: '/(tabs)/habit/[id]', params: { id: habitId } })}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <EventCard
                        id={habitId}
                        title={(item.title as string) ?? ''}
                        startAt={item.startAt as string | null}
                        endAt={item.endAt as string | null}
                        status={isDone ? 'completed' : 'scheduled'}
                        tag="HABIT"
                        disableNavigation
                      />
                    </View>
                    {streak > 0 && <HabitStreakBadge streak={streak} />}
                  </View>
                </Pressable>
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.xs, marginLeft: theme.spacing.lg }}>
                  <AppButton
                    variant={isDone ? 'primary' : 'secondary'}
                    onPress={() =>
                      entryMutation.mutate({
                        habitId,
                        status: isDone ? 'skipped' : 'done',
                      })
                    }
                    loading={entryMutation.isPending}
                  >
                    {isDone ? '✓' : t('done', 'Yapıldı')}
                  </AppButton>
                </View>
              </View>
            );
          }
          if (item.kind === 'bill') {
            return (
              <BillCard
                key={item.id}
                id={item.id}
                vendor={(item.vendor ?? item.title) as string}
                amount={item.amount as number | null}
                dueDate={(item.dueDate as string) ?? ''}
                autopay={item.autopay as boolean}
                currency={(item.currency as string) ?? 'TRY'}
                advisory="Subscription Advisory"
              />
            );
          }
          return null;
        })
      )}
      </ScrollView>
    </View>
  );
}
