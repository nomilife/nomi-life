import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppText } from '@/components/ui';
import { api } from '@/lib/api';
import { useTheme } from '@/theme';
import { nomiAppColors } from '@/theme/tokens';

const KIND_ENDPOINTS: Record<string, string> = {
  work_block: '/work-blocks',
  task: '/tasks',
  appointment: '/appointments',
  reminder: '/reminders',
  subscription: '/subscriptions',
  goal: '/goals',
  travel: '/travel',
  journal: '/journals',
};

const KIND_LABELS: Record<string, string> = {
  work_block: 'Work Block',
  task: 'Task',
  appointment: 'Appointment',
  reminder: 'Reminder',
  subscription: 'Subscription',
  goal: 'Goal',
  travel: 'Travel',
  journal: 'Journal',
};

export default function ItemDetailScreen() {
  const { id, kind } = useLocalSearchParams<{ id: string; kind?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const colors = { ...theme.colors, ...nomiAppColors };
  const endpoint = kind && KIND_ENDPOINTS[kind] ? `${KIND_ENDPOINTS[kind]}/${id}` : null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['item', kind, id],
    queryFn: () => api<Record<string, unknown>>(endpoint!),
    enabled: !!endpoint,
  });

  if (!kind || !KIND_ENDPOINTS[kind]) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <AppText color="muted">Geçersiz öğe türü</AppText>
        <Pressable onPress={() => router.back()} style={{ marginTop: theme.spacing.lg, padding: theme.spacing.md }}>
          <AppText style={{ color: colors.primary }}>Geri</AppText>
        </Pressable>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <AppText color="muted">Yükleniyor...</AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl }}>
        <AppText color="muted" style={{ textAlign: 'center' }}>{(error as Error).message}</AppText>
        <Pressable onPress={() => router.back()} style={{ marginTop: theme.spacing.lg, padding: theme.spacing.md }}>
          <AppText style={{ color: colors.primary }}>Geri</AppText>
        </Pressable>
      </View>
    );
  }

  const item = data ?? {};
  const label = KIND_LABELS[kind] ?? kind;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader showBack title={label} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <AppText variant="h2" style={{ marginBottom: theme.spacing.md }}>
            {String(item.title ?? '—')}
          </AppText>
          {item.summary && (
            <AppText variant="body" color="muted" style={{ marginBottom: theme.spacing.sm }}>
              {String(item.summary)}
            </AppText>
          )}
          {item.status && (
            <AppText variant="small" color="muted">
              Durum: {String(item.status)}
            </AppText>
          )}
          {item.dueDate && (
            <AppText variant="small" color="muted">
              Tarih: {String(item.dueDate)}
            </AppText>
          )}
          {item.nextBillDate && (
            <AppText variant="small" color="muted">
              Sonraki ödeme: {String(item.nextBillDate)}
            </AppText>
          )}
          {item.project && (
            <AppText variant="small" color="muted">
              Proje: {String(item.project)}
            </AppText>
          )}
          {item.vendor && (
            <AppText variant="small" color="muted">
              Tedarikçi: {String(item.vendor)}
            </AppText>
          )}
          {item.destination && (
            <AppText variant="small" color="muted">
              Varış: {String(item.destination)}
            </AppText>
          )}
          {item.content && (
            <AppText variant="body" style={{ marginTop: theme.spacing.md }}>
              {String(item.content)}
            </AppText>
          )}
        </View>
        <Pressable
          onPress={() => Alert.alert('Bilgi', 'Düzenleme ekranı yakında eklenecek.')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: theme.spacing.md,
            backgroundColor: colors.surface2,
            borderRadius: theme.radius.md,
          }}
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} style={{ marginRight: theme.spacing.sm }} />
          <AppText style={{ color: colors.primary }}>Düzenle</AppText>
        </Pressable>
      </ScrollView>
    </View>
  );
}
