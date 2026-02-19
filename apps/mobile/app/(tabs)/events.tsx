import { useState, useMemo, useEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { api } from '@/lib/api';
import { EventCard } from '@/components/timeline/EventCard';
import { AppText, AppButton, EmptyState, ErrorState, LoadingState } from '@/components/ui';

type TimelineItem = Record<string, unknown> & {
  id: string;
  kind: string;
  title?: string;
  startAt?: string | null;
  endAt?: string | null;
  location?: string | null;
  status?: string;
  metadata?: Record<string, unknown>;
};

interface TimelineData {
  date: string;
  items: TimelineItem[];
}

/** Yoğunluk arttıkça koyulaşan renkler (0..4+ etkinlik) */
const DENSITY_COLORS = [
  'rgba(232, 213, 196, 0.4)',
  'rgba(224, 124, 60, 0.35)',
  'rgba(224, 124, 60, 0.55)',
  'rgba(200, 90, 43, 0.7)',
  'rgba(184, 115, 51, 0.9)',
] as const;

const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function getDensityColor(count: number): string {
  return DENSITY_COLORS[Math.min(count, 4)];
}

interface TimelineRangeResponse {
  dates: Record<string, TimelineData>;
}

function useMonthEvents(year: number, month: number, enabled: boolean) {
  const start = dayjs().year(year).month(month).startOf('month');
  const startStr = start.format('YYYY-MM-DD');
  const endStr = start.endOf('month').format('YYYY-MM-DD');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['timeline-range', startStr, endStr],
    queryFn: ({ signal }) =>
      api<TimelineRangeResponse>(`/timeline?start=${startStr}&end=${endStr}`, { signal }),
    retry: 2,
    retryDelay: 800,
    enabled: enabled,
    staleTime: 60_000,
  });

  const { dayCounts, eventsByDate, dates } = useMemo(() => {
    const mStart = dayjs().year(year).month(month).startOf('month');
    const datesArr = Array.from(
      { length: mStart.daysInMonth() },
      (_, i) => mStart.add(i, 'day').format('YYYY-MM-DD')
    );
    const dayCounts: Record<string, number> = {};
    const eventsByDate: Record<string, Array<{ item: TimelineItem; date: string }>> = {};
    const rangeDates = data?.dates ?? {};
    for (const d of datesArr) {
      const dayData = rangeDates[d];
      if (dayData?.items) {
        const items = dayData.items
          .filter((it) => it.kind === 'event' || it.kind === 'habit_block')
          .sort((a, b) =>
            ((a.startAt as string) ?? '').localeCompare((b.startAt as string) ?? '')
          );
        dayCounts[d] = items.length;
        eventsByDate[d] = items.map((item) => ({ item, date: d }));
      } else {
        dayCounts[d] = 0;
        eventsByDate[d] = [];
      }
    }
    return { dayCounts, eventsByDate, dates: datesArr };
  }, [data, year, month]);

  return { dayCounts, eventsByDate, dates, isLoading, error, refetch };
}

function useWeekEvents(startDate: string, enabled: boolean) {
  const startStr = startDate;
  const endStr = dayjs(startDate).add(6, 'day').format('YYYY-MM-DD');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['timeline-range', startStr, endStr],
    queryFn: ({ signal }) =>
      api<TimelineRangeResponse>(`/timeline?start=${startStr}&end=${endStr}`, { signal }),
    retry: 2,
    retryDelay: 800,
    enabled: enabled,
    staleTime: 60_000,
  });

  const { dayCounts, eventsByDate, dates } = useMemo(() => {
    const datesArr = Array.from(
      { length: 7 },
      (_, i) => dayjs(startDate).add(i, 'day').format('YYYY-MM-DD')
    );
    const dayCounts: Record<string, number> = {};
    const eventsByDate: Record<string, Array<{ item: TimelineItem; date: string }>> = {};
    const rangeDates = data?.dates ?? {};
    for (const d of datesArr) {
      const dayData = rangeDates[d];
      if (dayData?.items) {
        const items = dayData.items
          .filter((it) => it.kind === 'event' || it.kind === 'habit_block')
          .sort((a, b) =>
            ((a.startAt as string) ?? '').localeCompare((b.startAt as string) ?? '')
          );
        dayCounts[d] = items.length;
        eventsByDate[d] = items.map((item) => ({ item, date: d }));
      } else {
        dayCounts[d] = 0;
        eventsByDate[d] = [];
      }
    }
    return { dayCounts, eventsByDate, dates: datesArr };
  }, [data, startDate]);

  return { dayCounts, eventsByDate, dates, isLoading, error, refetch };
}

type ViewMode = 'month' | 'week' | 'year';

export default function EventsScreen() {
  const { t } = useTranslation('events');
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ year?: string; month?: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [viewMonth, setViewMonth] = useState(() => ({
    year: dayjs().year(),
    month: dayjs().month(),
  }));

  useEffect(() => {
    const year = params.year ? parseInt(params.year, 10) : null;
    const month = params.month ? parseInt(params.month, 10) : null;
    if (year != null && !isNaN(year) && month != null && !isNaN(month) && month >= 0 && month <= 11) {
      setViewMonth({ year, month });
      setViewMode('month');
    }
  }, [params.year, params.month]);
  const [weekStart, setWeekStart] = useState(() =>
    dayjs().subtract((dayjs().day() + 6) % 7, 'day').format('YYYY-MM-DD')
  );
  const [viewYear, setViewYear] = useState(() => dayjs().year());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthData = useMonthEvents(viewMonth.year, viewMonth.month, viewMode === 'month');
  const weekData = useWeekEvents(weekStart, viewMode === 'week');

  const { dayCounts, eventsByDate, dates, isLoading, error, refetch } =
    viewMode === 'month' ? monthData : weekData;

  const start = dayjs().year(viewMonth.year).month(viewMonth.month).startOf('month');
  const leadingEmpty = start.day() === 0 ? 6 : start.day() - 1;
  const gridDays = useMemo(() => {
    if (viewMode === 'week') {
      return dates;
    }
    const arr: (string | null)[] = Array(leadingEmpty).fill(null);
    dates.forEach((d) => arr.push(d));
    return arr;
  }, [viewMode, leadingEmpty, dates]);

  if (isLoading) return <LoadingState />;

  if (error) {
    const errMsg = (error as Error).message;
    const isAbort = errMsg.includes('abort') || errMsg.includes('signal');
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ErrorState
          title={isAbort ? 'Bağlantı kesildi' : 'Bir hata oluştu'}
          message={isAbort ? 'İstek iptal edildi. Tekrar deneyin.' : errMsg}
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  const monthLabel = start.format('MMMM YYYY');
  const weekLabel = `${dayjs(weekStart).format('D MMM')} – ${dayjs(weekStart).add(6, 'day').format('D MMM YYYY')}`;

  const prev = () => {
    if (viewMode === 'month') {
      setViewMonth((m) => {
        const d = dayjs().year(m.year).month(m.month).subtract(1, 'month');
        return { year: d.year(), month: d.month() };
      });
    } else if (viewMode === 'week') {
      setWeekStart((d) => dayjs(d).add(-7, 'day').format('YYYY-MM-DD'));
    } else {
      setViewYear((y) => y - 1);
    }
    setSelectedDate(null);
  };

  const next = () => {
    if (viewMode === 'month') {
      setViewMonth((m) => {
        const d = dayjs().year(m.year).month(m.month).add(1, 'month');
        return { year: d.year(), month: d.month() };
      });
    } else if (viewMode === 'week') {
      setWeekStart((d) => dayjs(d).add(7, 'day').format('YYYY-MM-DD'));
    } else {
      setViewYear((y) => y + 1);
    }
    setSelectedDate(null);
  };

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] ?? [] : [];
  const totalEvents = Object.values(eventsByDate).reduce((s, arr) => s + arr.length, 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <AppText variant="title">{t('title')}</AppText>
        <Link href="/(tabs)/event-create" asChild>
          <AppButton variant="primary">{t('addEvent')}</AppButton>
        </Link>
      </View>

      {/* Görünüm seçici: Aylık / Haftalık / Yıllık */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: theme.colors.surface2,
          borderRadius: theme.radius.full,
          padding: 4,
          marginBottom: theme.spacing.xl,
        }}
      >
        {(['month', 'week', 'year'] as const).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setViewMode(mode)}
            style={{
              flex: 1,
              paddingVertical: theme.spacing.sm,
              alignItems: 'center',
              borderRadius: theme.radius.full,
              backgroundColor: viewMode === mode ? theme.colors.primary : 'transparent',
            }}
          >
            <AppText
              variant="small"
              style={{
                color: viewMode === mode ? '#fff' : theme.colors.textMuted,
                fontWeight: '600',
              }}
            >
              {mode === 'month' ? t('month', 'Aylık') : mode === 'week' ? t('week', 'Haftalık') : t('year', 'Yıllık')}
            </AppText>
          </Pressable>
        ))}
      </View>

      {/* Yıllık görünüm: 12 ay grid */}
      {viewMode === 'year' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: theme.spacing.xl }}>
          {MONTHS_TR.map((label, i) => (
            <Pressable
              key={i}
              onPress={() => {
                setViewMonth({ year: viewYear, month: i });
                setViewMode('month');
              }}
              style={{
                width: '25%',
                padding: theme.spacing.sm,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: '100%',
                  aspectRatio: 1,
                  borderRadius: theme.radius.lg,
                  backgroundColor: theme.colors.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: dayjs().month() === i && dayjs().year() === viewYear ? 2 : 0,
                  borderColor: theme.colors.primary,
                }}
              >
                <AppText variant="caption" color="muted">{label}</AppText>
                <AppText variant="small" style={{ marginTop: 2 }}>{viewYear}</AppText>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <>
          {/* Takvim kartı - iPhone tarzı */}
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.xl,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.xl,
              borderWidth: 0,
              overflow: 'hidden',
              ...theme.elevations[1],
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
              <Pressable onPress={prev} style={{ padding: theme.spacing.sm }}>
                <AppText variant="h2" color="primary">‹</AppText>
              </Pressable>
              <AppText variant="h2" style={{ textTransform: 'capitalize', color: theme.colors.textPrimary }}>
                {viewMode === 'month' ? monthLabel : weekLabel}
              </AppText>
              <Pressable onPress={next} style={{ padding: theme.spacing.sm }}>
                <AppText variant="h2" color="primary">›</AppText>
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', marginBottom: theme.spacing.sm }}>
              {WEEKDAYS.map((w) => (
                <View key={w} style={{ flex: 1, alignItems: 'center' }}>
                  <AppText variant="caption" color="muted">{w}</AppText>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {gridDays.map((date, i) => {
                const d = typeof date === 'string' ? date : null;
                if (!d) {
                  return <View key={`e-${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }} />;
                }
                const count = dayCounts[d] ?? 0;
                const isSelected = selectedDate === d;
                const isToday = d === dayjs().format('YYYY-MM-DD');
                return (
                  <Pressable
                    key={d}
                    onPress={() => setSelectedDate(selectedDate === d ? null : d)}
                    style={{
                      width: `${100 / 7}%`,
                      aspectRatio: 1,
                      padding: 2,
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        borderRadius: 12,
                        backgroundColor: getDensityColor(count),
                        borderWidth: isToday ? 2 : 0,
                        borderColor: theme.colors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: [{ scale: isSelected ? 1.05 : 1 }],
                      }}
                    >
                      <AppText
                        variant="caption"
                        style={{
                          fontWeight: isToday ? '700' : isSelected ? '600' : '500',
                          color: count > 0 ? theme.colors.textPrimary : theme.colors.textMuted,
                          fontSize: 14,
                        }}
                      >
                        {dayjs(d).date()}
                      </AppText>
                      {count > 0 && (
                        <View
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: theme.colors.primary,
                            marginTop: 2,
                          }}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Seçili gün detayı */}
          {selectedDate ? (
            <View style={{ marginBottom: theme.spacing.lg }}>
              <AppText variant="h3" style={{ marginBottom: theme.spacing.md, color: theme.colors.textPrimary }}>
                {dayjs(selectedDate).format('ddd, D MMMM')}
              </AppText>
              {selectedEvents.length === 0 ? (
                <EmptyState
                  message={t('empty')}
                  hint="Bu gün için etkinlik yok."
                />
              ) : (
                selectedEvents.map(({ item, date }) => (
                  <View key={`${date}-${item.id}`} style={{ marginBottom: theme.spacing.md }}>
                    <EventCard
                      id={item.kind === 'habit_block' ? ((item.metadata as Record<string, unknown>)?.habitId as string ?? item.id) : item.id}
                      title={(item.title as string) ?? ''}
                      startAt={item.startAt as string | null}
                      endAt={item.endAt as string | null}
                      location={item.location as string | null}
                      status={(item.status as string) ?? 'scheduled'}
                      summary={item.summary as string | null}
                      tag={item.kind === 'habit_block' ? 'habit' : (item.metadata as Record<string, unknown> | undefined)?.tag as string | undefined}
                      participantCount={((item.metadata as Record<string, unknown> | undefined)?.participantCount as number) ?? 0}
                      participants={(item.metadata as Record<string, unknown> | undefined)?.participants as Array<{ email?: string; displayName?: string }> | undefined}
                      kind={item.kind === 'habit_block' ? 'habit_block' : 'event'}
                    />
                  </View>
                ))
              )}
            </View>
          ) : totalEvents === 0 ? (
            <EmptyState
              message={t('empty')}
              hint={t('emptyHint')}
              action={
                <Link href="/(tabs)/event-create" asChild>
                  <AppButton variant="primary">{t('addEvent')}</AppButton>
                </Link>
              }
            />
          ) : (
            <AppText variant="small" color="muted">
              {t('tapDay')}
            </AppText>
          )}
        </>
      )}
    </ScrollView>
  );
}
