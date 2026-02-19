import { useState, useMemo } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, FlowThemeProvider } from '@/theme';
import { flowDefaultColors } from '@/theme/tokens';
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
  const accentViolet = '#7C3AED';
  const accentRose = '#FDA4AF';

  if (isLoading && !data) return <LoadingState />;
  if (error && !data) {
    const errMsg = (error as Error).message;
    const isNetwork =
      errMsg.includes('fetch') || errMsg.includes('Network') || errMsg.includes('ulaşılamıyor');
    return (
      <View style={{ flex: 1, backgroundColor: flowDefaultColors.background }}>
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

  const flowTheme = { ...theme, colors: flowDefaultColors };

  return (
    <FlowThemeProvider theme={flowTheme}>
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={['#ffffff', '#f3f0ff', '#fff5f7']}
          locations={[0, 0.5, 1]}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <View style={{ position: 'absolute', top: -50, right: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(124, 58, 237, 0.1)' }} />
        <View style={{ position: 'absolute', bottom: '15%', left: -100, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(253, 164, 175, 0.2)' }} />

        <HomeMenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} currentDate={todayStr} />

        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: flowTheme.spacing.lg, paddingTop: 48, paddingBottom: flowTheme.spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: flowTheme.spacing.xs }}>
              <Pressable onPress={() => setMenuVisible(true)} style={{ padding: flowTheme.spacing.xs }}>
                <Ionicons name="menu" size={24} color={flowTheme.colors.textPrimary} />
              </Pressable>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <AppText
                  variant="small"
                  style={{ color: accentViolet, letterSpacing: 3, fontWeight: '700', opacity: 0.8, marginBottom: 2 }}
                >
                  LIFEOS 2.4
                </AppText>
                <AppText variant="title" style={{ color: flowTheme.colors.textPrimary, fontWeight: '700' }}>
                  Today's Flow
                </AppText>
              </View>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: 'rgba(124, 58, 237, 0.4)',
                  backgroundColor: flowTheme.colors.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="person" size={24} color={accentViolet} />
              </View>
            </View>

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
              <AppText variant="small" style={{ color: accentViolet, fontWeight: '700' }}>
                Next sync in 15m. Need a briefing?
              </AppText>
            </Pressable>
            <Pressable onPress={() => router.push('/(modal)/voice' as never)} style={{ alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(124, 58, 237, 0.15)' }} />
              <View style={{ position: 'absolute', width: 136, height: 136, borderRadius: 68, backgroundColor: 'rgba(124, 58, 237, 0.06)' }} />
              <LinearGradient
                colors={['#7C3AED', '#A78BFA', '#FDA4AF', '#A78BFA', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#7C3AED',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.4,
                  shadowRadius: 25,
                  elevation: 8,
                }}
              >
                <Ionicons name="mic" size={28} color="#fff" />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </FlowThemeProvider>
  );
}
