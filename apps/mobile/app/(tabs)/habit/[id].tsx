import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, Alert } from 'react-native';
import { api } from '@/lib/api';
import { AppCard, AppText, AppButton, LoadingState, SectionHeader } from '@/components/ui';
import { useTheme } from '@/theme';
import dayjs from 'dayjs';
import { ExternalAppShortcut } from '@/components/ExternalAppShortcut';
import { AddAppShortcutModal } from '@/components/AddAppShortcutModal';
import { Ionicons } from '@expo/vector-icons';

const today = dayjs().format('YYYY-MM-DD');

type ShortcutInfo = { id?: string | null; label: string; url: string; storeUrl?: string | null };

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [appShortcutModalVisible, setAppShortcutModalVisible] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['habit', id],
    queryFn: () => api<Record<string, unknown>>(`/habits/${id}`),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (body: { appShortcutId?: string | null }) =>
      api(`/habits/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit', id] });
      queryClient.invalidateQueries({ queryKey: ['routine', today] });
      queryClient.invalidateQueries({ queryKey: ['timeline', today] });
    },
  });

  if (isLoading) return <LoadingState />;
  if (error || !data) {
    return (
      <View style={{ flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.background }}>
        <AppText variant="body" color="danger">
          {t('routine.loadError', 'Failed to load habit')}
        </AppText>
        <AppButton variant="secondary" onPress={() => router.back()} style={{ marginTop: theme.spacing.lg }}>
          {t('flow.back', 'Go back')}
        </AppButton>
      </View>
    );
  }

  const title = (data.title as string) ?? '';
  const schedule = (data.schedule as { days?: number[]; time?: string }) ?? {};
  const shortcut = data.shortcut as ShortcutInfo | null | undefined;
  const timeStr = schedule.time ?? '09:00';
  const routineCategory = (data.category as string) ?? '';

  const handleAddAppShortcut = (shortcutId: string) => {
    updateMutation.mutate({ appShortcutId: shortcutId });
    setAppShortcutModalVisible(false);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
    >
      <SectionHeader title={title} />
      <AppCard>
        <AppText variant="caption" color="secondary">
          {t('routine.daily', 'Daily')} · {timeStr}
        </AppText>
      </AppCard>

      <AppText variant="h3" style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm }}>
        {t('event.appLink', 'App shortcut')}
      </AppText>
      <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>
        {t('routine.appShortcutHint', 'Gym, fitness app, or any deep link (e.g. Apple Fitness)')}
      </AppText>
      {shortcut?.url ? (
        <ExternalAppShortcut
          label={shortcut.label || 'App'}
          url={shortcut.url}
          storeUrl={shortcut.storeUrl ?? undefined}
        />
      ) : (
        <AppButton
          variant="secondary"
          onPress={() => setAppShortcutModalVisible(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}
        >
          <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
          {t('event.addAppShortcut', 'Add App Shortcut')}
        </AppButton>
      )}
      <AddAppShortcutModal
        visible={appShortcutModalVisible}
        onClose={() => setAppShortcutModalVisible(false)}
        onSelect={handleAddAppShortcut}
        eventTitle={title}
        eventCategory={routineCategory}
      />

      <AppButton variant="ghost" onPress={() => router.back()} style={{ marginTop: theme.spacing.lg }}>
        {t('flow.back', 'Back')}
      </AppButton>
    </ScrollView>
  );
}
