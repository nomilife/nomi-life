import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { View, TextInput, ScrollView, Alert } from 'react-native';
import { api } from '@/lib/api';
import { AppCard, AppText, AppButton, SectionHeader, LoadingState } from '@/components/ui';
import { useTheme } from '@/theme';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { ExternalAppShortcut } from '@/components/ExternalAppShortcut';
import { AddAppShortcutModal } from '@/components/AddAppShortcutModal';

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

type ShortcutInfo = { id?: string | null; label: string; url: string; storeUrl?: string | null };

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [appShortcutModalVisible, setAppShortcutModalVisible] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () =>
      api<
        Record<string, unknown> & {
          shortcut?: ShortcutInfo | null;
          participants?: Array<{ invited_email?: string; user_id?: string; role: string }>;
        }
      >(`/events/${id}`),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (body: { shortcutId?: string | null }) =>
      api(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (email: string) =>
      api(`/events/${id}/invite`, { method: 'POST', body: JSON.stringify({ email }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events', 'invites'] });
      setInviteEmail('');
    },
    onError: (e) => Alert.alert(t('event.inviteInvalid'), (e as Error).message),
  });

  const handleInvite = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !isValidEmail(email)) {
      Alert.alert(t('event.inviteInvalid', 'Invalid email'));
      return;
    }
    inviteMutation.mutate(email);
  };

  if (isLoading) return <LoadingState />;
  if (error || !data) {
    return (
      <View style={{ flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.background }}>
        <AppText variant="body" color="danger">
          Failed to load event
        </AppText>
        <AppButton variant="secondary" onPress={() => router.back()} style={{ marginTop: theme.spacing.lg }}>
          Go back
        </AppButton>
      </View>
    );
  }

  const title = (data.title as string) ?? '';
  const startAt = data.startAt as string | null;
  const endAt = data.endAt as string | null;
  const location = data.location as string | null;
  const participants = (data.participants as Array<{ invited_email?: string; user_id?: string; role: string }>) ?? [];
  const guests = participants.filter((p) => p.role === 'guest');
  const shortcut = data.shortcut as ShortcutInfo | null | undefined;
  const eventCategory = (data.metadata as Record<string, unknown> | null)?.category as string | undefined;

  const handleAddAppShortcut = (shortcutId: string) => {
    updateMutation.mutate({ shortcutId });
    setAppShortcutModalVisible(false);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
    >
      <SectionHeader title={title} />
      <AppCard>
        {startAt && (
          <AppText variant="caption" color="secondary">
            {dayjs(startAt).format('ddd, MMM D · HH:mm')} – {endAt ? dayjs(endAt).format('HH:mm') : '?'}
          </AppText>
        )}
        {location && (
          <AppText variant="body" style={{ marginTop: theme.spacing.sm }}>
            {location}
          </AppText>
        )}
      </AppCard>

      <AppText variant="h3" style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm }}>
        {t('event.inviteSection', 'Invite')}
      </AppText>
      <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>
        {t('event.inviteHint')}
      </AppText>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <TextInput
          style={{
            flex: 1,
            ...theme.typography.body,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            color: theme.colors.text,
          }}
          placeholder={t('auth.emailPlaceholder', 'name@example.com')}
          value={inviteEmail}
          onChangeText={setInviteEmail}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AppButton variant="primary" onPress={handleInvite} disabled={inviteMutation.isPending}>
          {inviteMutation.isPending ? '...' : t('event.inviteAdd', 'Add invite')}
        </AppButton>
      </View>
      {guests.length > 0 && (
        <View style={{ marginBottom: theme.spacing.lg }}>
          <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.xs }}>
            {t('network.invites', 'Invites')}
          </AppText>
          {guests.map((p, i) => (
            <AppText key={i} variant="body">
              {p.invited_email ?? '—'}
            </AppText>
          ))}
        </View>
      )}

      <AppText variant="h3" style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm }}>
        {t('event.appLink', 'App shortcut')}
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
        eventCategory={eventCategory}
      />

      <AppButton
        variant="primary"
        onPress={() => router.push({ pathname: '/(tabs)/event/[id]/chat', params: { id: id! } })}
        style={{ marginTop: theme.spacing.sm }}
      >
        {t('network.openChat', 'Open chat')}
      </AppButton>
      <AppButton variant="ghost" onPress={() => router.back()} style={{ marginTop: theme.spacing.md }}>
        {t('flow.back', 'Back')}
      </AppButton>
    </ScrollView>
  );
}
