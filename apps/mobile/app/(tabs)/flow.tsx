import { useState, useMemo, useEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, FlowThemeProvider } from '@/theme';
import { api } from '@/lib/api';
import { FlowActivityCard } from '@/components/timeline/FlowActivityCard';
import { TimelineRail } from '@/components/timeline/TimelineRail';
import { FlowHighlightsBar } from '@/components/home/FlowHighlightsBar';
import {
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/ui';
import { HomeMenuModal } from '@/components/HomeMenuModal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SwipeableTabContent } from '@/components/SwipeableTabContent';
import { nomiAppColors } from '@/theme/tokens';

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
  location?: string | null;
  status?: string;
  currency?: string;
  metadata?: Record<string, unknown>;
};

interface TimelineData {
  date: string;
  items: TimelineItem[];
  highlights?: { focusState?: number; netLiquid?: number; bioSync?: string };
}

const TIME_BASED_KINDS = ['event', 'habit_block', 'work_block', 'appointment', 'reminder', 'travel'] as const;
const ALL_DAY_KINDS = ['task', 'goal', 'journal'] as const;
const DUE_KINDS = ['bill', 'subscription'] as const;

function getSortTime(item: TimelineItem): string {
  const remindAt = (item as Record<string, unknown>).remindAt as string | undefined;
  const startAt = item.startAt as string | undefined;
  const dueDate = (item as Record<string, unknown>).dueDate as string | undefined;
  const nextBillDate = (item as Record<string, unknown>).nextBillDate as string | undefined;
  if (remindAt) return dayjs(remindAt).format('HH:mm');
  if (startAt) return dayjs(startAt).format('HH:mm');
  if (dueDate) return dayjs(dueDate).format('HH:mm');
  if (nextBillDate) return dayjs(nextBillDate).format('HH:mm');
  return '09:00';
}

function sortAndMergeItems(items: TimelineItem[]): Array<{ item: TimelineItem; time: string }> {
  const timeBased = items
    .filter((i) => TIME_BASED_KINDS.includes(i.kind as (typeof TIME_BASED_KINDS)[number]))
    .sort((a, b) => {
      const aT = (a.startAt as string) ?? (a as Record<string, unknown>).remindAt ?? '';
      const bT = (b.startAt as string) ?? (b as Record<string, unknown>).remindAt ?? '';
      return aT.localeCompare(bT);
    });
  const allDay = items.filter((i) => ALL_DAY_KINDS.includes(i.kind as (typeof ALL_DAY_KINDS)[number]));
  const dueItems = items.filter((i) => DUE_KINDS.includes(i.kind as (typeof DUE_KINDS)[number]));
  const rows: Array<{ item: TimelineItem; time: string }> = [];
  for (const e of timeBased) {
    rows.push({ item: e, time: getSortTime(e) });
  }
  for (const a of allDay) {
    rows.push({ item: a, time: getSortTime(a) });
  }
  for (const d of dueItems) {
    rows.push({ item: d, time: getSortTime(d) });
  }
  rows.sort((a, b) => a.time.localeCompare(b.time));
  return rows;
}

export default function FlowScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ wowJobId?: string }>();
  const queryClient = useQueryClient();
  const [menuVisible, setMenuVisible] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const wowJobId = params.wowJobId;

  const dateStr = selectedDate;

  const { data: wowJob } = useQuery({
    queryKey: ['ai', 'job', wowJobId],
    queryFn: () => api<{ status: string; progressStage?: string; output?: { welcome_text?: string } }>(`/ai/jobs/${wowJobId}`),
    enabled: !!wowJobId,
    refetchInterval: (q) => (q.state.data?.status === 'done' || q.state.data?.status === 'failed' ? false : 1500),
  });

  useEffect(() => {
    if (wowJob?.status === 'done') {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
    }
  }, [wowJob?.status, queryClient]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['timeline', dateStr],
    queryFn: ({ signal }) => api<TimelineData>(`/timeline?date=${dateStr}`, { signal }),
    retry: 2,
    retryDelay: 1000,
    staleTime: 60_000,
  });

  const entryMutation = useMutation({
    mutationFn: ({ habitId, status }: { habitId: string; status: 'done' | 'skipped' }) =>
      api(`/habits/${habitId}/entry`, {
        method: 'POST',
        body: JSON.stringify({ date: dateStr, status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', dateStr] });
    },
  });

  const habitsByStatus = useMemo(() => {
    const m: Record<string, string | null> = {};
    for (const item of data?.items ?? []) {
      if (item.kind === 'habit_block') {
        const hid = (item.metadata?.habitId as string) ?? item.id;
        const status = (item.metadata?.todayStatus as string) ?? null;
        m[hid] = status ?? null;
      }
    }
    return m;
  }, [data?.items]);

  const items = data?.items ?? [];
  const rows = useMemo(() => sortAndMergeItems(items), [items]);
  const hasAnyItems = items.length > 0;
  const today = dayjs().format('YYYY-MM-DD');
  const now =
    dateStr === today
      ? dayjs().format('HH:mm')
      : dateStr < today
        ? '23:59'
        : '00:00';

  if (isLoading && !data) return <LoadingState />;
  if (error && !data) {
    const errMsg = (error as Error).message;
    const isNetwork =
      errMsg.includes('fetch') || errMsg.includes('Network') || errMsg.includes('ulaşılamıyor');
    return (
      <View style={{ flex: 1, backgroundColor: nomiAppColors.background }}>
        <ErrorState
          title={isNetwork ? 'Bağlantı hatası' : 'Hata'}
          message={
            isNetwork
              ? "API'ye ulaşılamıyor. System sekmesinden bağlantıyı test edin."
              : errMsg
          }
          onRetry={() => refetch()}
          retryLabel="Tekrar dene"
        />
      </View>
    );
  }

  const flowTheme = { ...theme, colors: nomiAppColors };

  return (
    <FlowThemeProvider theme={flowTheme}>
      <View style={{ flex: 1, backgroundColor: nomiAppColors.background }}>
        <HomeMenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} currentDate={dateStr} />

        <SwipeableTabContent currentTab="flow">
          {wowJobId && wowJob && (
            <View
              style={{
                marginHorizontal: flowTheme.spacing.lg,
                marginBottom: flowTheme.spacing.sm,
                padding: flowTheme.spacing.md,
                backgroundColor: wowJob.status === 'done' ? 'rgba(56,161,105,0.2)' : 'rgba(224,124,60,0.2)',
                borderRadius: flowTheme.radius.lg,
                borderWidth: 1,
                borderColor: wowJob.status === 'done' ? '#38A169' : nomiAppColors.primary,
              }}
            >
              <AppText variant="small" style={{ color: flowTheme.colors.text, fontWeight: '600' }}>
                {wowJob.status === 'done'
                  ? wowJob.output?.welcome_text ?? "Planın hazır! Bugünün akışını aşağıda görebilirsin."
                  : wowJob.progressStage ?? 'Plan oluşturuluyor...'}
              </AppText>
            </View>
          )}
          <ScreenHeader
            onMenuPress={() => setMenuVisible(true)}
            title={dateStr === today ? "Today's Flow" : dayjs(dateStr).format('ddd, MMM D')}
            subtitle="LIFEOS 2.4"
            rightElement={
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: nomiAppColors.primary + '60',
                  backgroundColor: nomiAppColors.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="person" size={24} color={nomiAppColors.primary} />
              </View>
            }
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: flowTheme.spacing.lg, marginBottom: flowTheme.spacing.sm }}>
            <Pressable
              onPress={() => setSelectedDate(dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD'))}
              style={{ padding: flowTheme.spacing.sm }}
            >
              <Ionicons name="chevron-back" size={24} color={nomiAppColors.primary} />
            </Pressable>
            <AppText variant="body" style={{ color: nomiAppColors.textPrimary, fontWeight: '600' }}>
              {dayjs(selectedDate).format('ddd, D MMM')}
            </AppText>
            <Pressable
              onPress={() => setSelectedDate(dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD'))}
              style={{ padding: flowTheme.spacing.sm }}
            >
              <Ionicons name="chevron-forward" size={24} color={nomiAppColors.primary} />
            </Pressable>
          </View>
          <View style={{ paddingHorizontal: flowTheme.spacing.lg, paddingBottom: flowTheme.spacing.md }}>
            <FlowHighlightsBar
              focusState={data?.highlights?.focusState}
              netLiquid={data?.highlights?.netLiquid}
              bioSync={data?.highlights?.bioSync}
            />
          </View>

          {!hasAnyItems ? (
            <EmptyState
              title="Bugün için plan yok"
              message="Etkinlik veya fatura ekleyerek başlayın."
              actionLabel="Etkinlik ekle"
              onAction={() => router.push('/(tabs)/event-create')}
            />
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: flowTheme.spacing.lg, paddingBottom: 140 }}
              showsVerticalScrollIndicator={false}
            >
              {rows.map(({ item, time }, idx) => {
                const isNow = time === now;
                const isExpanded = expandedItemId === item.id;
                const isPast = time < now;
                const habitId = item.kind === 'habit_block' ? ((item.metadata?.habitId as string) ?? item.id) : '';
                const habitStatus = habitId ? habitsByStatus[habitId] : null;

                return (
                  <View key={item.id} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: flowTheme.spacing.lg }}>
                    <TimelineRail
                      time={time}
                      isNow={isNow}
                      isSelected={isExpanded}
                      isLast={idx === rows.length - 1}
                      gradient
                    />
                    <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
                      <FlowActivityCard
                        item={item}
                        time={time}
                        isNow={isNow}
                        isSelected={isExpanded}
                        isPast={isPast}
                        habitStatus={habitStatus}
                        isExpanded={isExpanded}
                        onPress={() => setExpandedItemId((prev) => (prev === item.id ? null : item.id))}
                        onHabitEntry={
                          item.kind === 'habit_block'
                            ? (hid, status) => entryMutation.mutate({ habitId: hid, status })
                            : undefined
                        }
                        entryLoading={entryMutation.isPending}
                      />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          <View style={{ position: 'absolute', bottom: 90, left: 0, right: 0, alignItems: 'center', zIndex: 10 }}>
            <Pressable
              onPress={() => router.push('/(tabs)/copilot' as never)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.8)',
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 9999,
                marginBottom: flowTheme.spacing.md,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <AppText variant="small" style={{ color: nomiAppColors.primary, fontWeight: '700' }}>
                Next sync in 15m. Need a briefing?
              </AppText>
            </Pressable>
            <Pressable onPress={() => router.push('/(modal)/voice' as never)} style={{ alignItems: 'center', justifyContent: 'center' }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: nomiAppColors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: nomiAppColors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Ionicons name="mic" size={28} color="#fff" />
              </View>
            </Pressable>
          </View>
        </SwipeableTabContent>
      </View>
    </FlowThemeProvider>
  );
}
