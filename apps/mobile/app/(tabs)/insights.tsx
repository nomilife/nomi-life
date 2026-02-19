import { View, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useTheme } from '@/theme';
import {
  AppText,
  SectionHeader,
  ErrorState,
  LoadingState,
} from '@/components/ui';

type Insights = {
  period: { start: string; end: string };
  activeDaysCount: number;
  eventsCount: number;
  socialEventsCount: number;
  billsTotal: number;
};

// Simple radar-style labels around a circular progress
function LifeBalanceRadar({
  theme,
  labels,
  averagePct,
}: {
  theme: ReturnType<typeof useTheme>;
  labels: string[];
  averagePct: number;
}) {
  const size = 140;
  return (
    <View style={{ alignItems: 'center', marginVertical: theme.spacing.lg }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: theme.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.surface2,
        }}
      >
        <AppText variant="h1" style={{ color: theme.colors.textPrimary }}>{averagePct}%</AppText>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        {labels.map((label) => (
          <AppText key={label} variant="small" color="muted">
            {label}
          </AppText>
        ))}
      </View>
    </View>
  );
}

export default function InsightsScreen() {
  const { t } = useTranslation('insights');
  const theme = useTheme();
  const router = useRouter();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['timeline', 'insights'],
    queryFn: ({ signal }) => api<Insights>('/timeline/insights', { signal }),
    retry: 2,
    retryDelay: 1000,
    staleTime: 60_000,
  });

  if (isLoading) return <LoadingState />;
  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ErrorState
          message={(error as Error).message}
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  const ins = data ?? {
    period: { start: '', end: '' },
    activeDaysCount: 0,
    eventsCount: 0,
    socialEventsCount: 0,
    billsTotal: 0,
  };

  const periodLabel =
    ins.period.start && ins.period.end
      ? `${ins.period.start} – ${ins.period.end}`
      : 'OCT 12 – OCT 18';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 120 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
      </View>

      <AppText variant="display" style={{ color: theme.colors.textPrimary, marginBottom: theme.spacing.xs }}>
        {t('title', 'Insights')}
      </AppText>
      <AppText variant="body" color="muted" style={{ marginBottom: theme.spacing.xl }}>
        {periodLabel}
      </AppText>

      {/* Life Balance card */}
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.xl,
          padding: theme.spacing.lg,
          marginBottom: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
          <AppText variant="h2" style={{ color: theme.colors.textPrimary }}>
            Life Balance
          </AppText>
          <View
            style={{
              backgroundColor: theme.colors.surface2,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.radius.full,
            }}
          >
            <AppText variant="small" style={{ color: theme.colors.primary, fontWeight: '600' }}>
              GOOD PROGRESS
            </AppText>
          </View>
        </View>
        <LifeBalanceRadar
          theme={theme}
          labels={['HEALTH', 'FOCUS', 'SOCIAL', 'FINANCE', 'SPIRIT']}
          averagePct={84}
        />
        <View style={{ flexDirection: 'row', gap: theme.spacing.xl, marginTop: theme.spacing.lg }}>
          <View>
            <AppText variant="small" color="muted">AVERAGE</AppText>
            <AppText variant="h1" style={{ color: theme.colors.textPrimary }}>84%</AppText>
          </View>
          <View>
            <AppText variant="small" color="muted">VS PREV</AppText>
            <AppText variant="h1" style={{ color: theme.colors.success }}>+12%</AppText>
          </View>
        </View>
      </View>

      {/* Key metrics: Sleep Quality, Budget left */}
      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
        <View
          style={{
            flex: 1,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <Ionicons name="moon" size={20} color={theme.colors.primary} />
            <AppText variant="small" color="muted">Sleep Quality</AppText>
          </View>
          <AppText variant="h1" style={{ color: theme.colors.textPrimary, marginTop: theme.spacing.sm }}>92%</AppText>
          <AppText variant="small" style={{ color: theme.colors.success }}>+5%</AppText>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <Ionicons name="wallet" size={20} color={theme.colors.success} />
            <AppText variant="small" color="muted">Budget left</AppText>
          </View>
          <AppText variant="h1" style={{ color: theme.colors.textPrimary, marginTop: theme.spacing.sm }}>
            $1,240
          </AppText>
          <AppText variant="small" color="muted">of $3k</AppText>
        </View>
      </View>

      {/* Sleep Efficiency */}
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          marginBottom: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <AppText variant="h2" style={{ color: theme.colors.textPrimary }}>Sleep Efficiency</AppText>
        <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.md }}>
          Weekly trend analysis
        </AppText>
        <AppText variant="h1" style={{ color: theme.colors.textPrimary }}>7h 42m</AppText>
        <AppText variant="small" color="muted">AVERAGE</AppText>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            height: 60,
            marginTop: theme.spacing.lg,
            gap: 4,
          }}
        >
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <View key={day} style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: '100%',
                  height: [45, 35, 50, 30, 55, 40, 38][i],
                  backgroundColor: theme.colors.primary,
                  borderRadius: 4,
                  opacity: 0.6 + i * 0.05,
                }}
              />
              <AppText variant="small" color="muted" style={{ marginTop: 4 }}>{day}</AppText>
            </View>
          ))}
        </View>
      </View>

      {/* Daily Expenses */}
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          marginBottom: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
          <AppText variant="h2" style={{ color: theme.colors.textPrimary }}>Daily Expenses</AppText>
          <AppText variant="small" color="muted">This Week</AppText>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            height: 80,
            gap: 4,
          }}
        >
          {[40, 65, 30, 80, 55, 70, 45].map((pct, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: '80%',
                  height: '100%',
                  backgroundColor: theme.colors.surface2,
                  borderRadius: 4,
                  overflow: 'hidden',
                  justifyContent: 'flex-end',
                }}
              >
                <View
                  style={{
                    width: '100%',
                    height: `${pct}%`,
                    backgroundColor: theme.colors.primary,
                    borderRadius: 4,
                  }}
                />
              </View>
              <AppText variant="small" color="muted" style={{ marginTop: 4 }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      {/* AI Suggestion */}
      <View
        style={{
          backgroundColor: '#6B21A8',
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          borderWidth: 0,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
          <Ionicons name="sparkles" size={18} color="#fff" />
          <AppText variant="small" style={{ color: '#fff', fontWeight: '600' }}>AI SUGGESTION</AppText>
        </View>
        <AppText variant="body" style={{ color: '#fff', lineHeight: 24 }}>
          Consistency Peak You completed 100% of your habits on days you slept over 7.5 hours. Try to maintain this
          sleep schedule for better productivity.
        </AppText>
        <Pressable
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.radius.md,
            alignItems: 'center',
            marginTop: theme.spacing.lg,
          }}
        >
          <AppText variant="body" style={{ color: '#fff', fontWeight: '600' }}>Set Reminder</AppText>
        </Pressable>
      </View>
    </ScrollView>
  );
}
