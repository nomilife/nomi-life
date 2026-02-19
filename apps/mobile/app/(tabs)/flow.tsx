import { useState, useMemo } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
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

const todayStr = dayjs().format('YYYY-MM-DD');

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

function sortAndMergeItems(items: TimelineItem[]): Array<{ item: TimelineItem; time: string }> {
  const events = items
    .filter((i) => i.kind === 'event' || i.kind === 'habit_block')
    .sort((a, b) => {
      const aT = (a.startAt as string) ?? '';
      const bT = (b.startAt as string) ?? '';
      return aT.localeCompare(bT);
    });
  const bills = items.filter((i) => i.kind === 'bill');
  const rows: Array<{ item: TimelineItem; time: string }> = [];
  for (const e of events) {
    rows.push({ item: e, time: e.startAt ? dayjs(e.startAt as string).format('HH:mm') : '08:00' });
  }
  for (const b of bills) {
    rows.push({ item: b, time: '12:30' });
  }
  rows.sort((a, b) => a.time.localeCompare(b.time));
  return rows;
}

type Habit = { id: string; title: string; todayStatus?: string | null };

export default function FlowScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuVisible, setMenuVisible] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['timeline', todayStr],
    queryFn: ({ signal }) => api<TimelineData>(`/timeline?date=${todayStr}`, { signal }),
    retry: 2,
    retryDelay: 1000,
    staleTime: 60_000,
  });

  const { data: routineData } = useQuery({
    queryKey: ['routine', todayStr],
    queryFn: () => api<{ flowState: number; activeHabits: Habit[] }>(`/habits/routine?date=${todayStr}`),
    enabled: true,
  });

  const entryMutation = useMutation({
    mutationFn: ({ habitId, status }: { habitId: string; status: 'done' | 'skipped' }) =>
      api(`/habits/${habitId}/entry`, {
        method: 'POST',
        body: JSON.stringify({ date: todayStr, status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routine', todayStr] });
      queryClient.invalidateQueries({ queryKey: ['timeline', todayStr] });
    },
  });

  const habitsByStatus = useMemo(() => {
    const m: Record<string, string | null> = {};
    for (const h of routineData?.activeHabits ?? []) {
      m[h.id] = h.todayStatus ?? null;
    }
    return m;
  }, [routineData?.activeHabits]);

  const items = data?.items ?? [];
  const rows = useMemo(() => sortAndMergeItems(items), [items]);
  const hasAnyItems = items.length > 0;
  const now = dayjs().format('HH:mm');

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
        <HomeMenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} currentDate={todayStr} />

        <SwipeableTabContent currentTab="flow">
          <ScreenHeader
            onMenuPress={() => setMenuVisible(true)}
            title="Today's Flow"
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
