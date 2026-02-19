import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { api } from '@/lib/api';
import { useTheme } from '@/theme';
import {
  AppText,
  AppButton,
  EmptyState,
  LoadingState,
} from '@/components/ui';

type Invite = { id: string; title: string; startAt?: string; endAt?: string; location?: string; hostId?: string };
type SharedEvent = { id: string; title: string; startAt?: string; endAt?: string; location?: string; status?: string };

function GradientSectionHeader({
  title,
  theme,
  color,
}: {
  title: string;
  theme: ReturnType<typeof useTheme>;
  color: string;
}) {
  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <View
        style={{
          borderRadius: theme.radius.lg,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: color,
        }}
      >
        <AppText
          variant="h2"
          style={{
            color: '#fff',
            fontWeight: '700',
            letterSpacing: 0.5,
          }}
        >
          {title}
        </AppText>
      </View>
    </View>
  );
}

export default function NetworkScreen() {
  const { t } = useTranslation('network');
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: invites, isLoading: invitesLoading } = useQuery({
    queryKey: ['events', 'invites'],
    queryFn: () => api<Invite[]>('/events/invites'),
  });

  const { data: shared, isLoading: sharedLoading } = useQuery({
    queryKey: ['events', 'shared'],
    queryFn: () => api<SharedEvent[]>('/events/shared'),
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/events/${id}/rsvp`, { method: 'POST', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', 'invites'] });
      queryClient.invalidateQueries({ queryKey: ['events', 'shared'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
    },
  });

  const isLoading = invitesLoading || sharedLoading;
  const invitesList = invites ?? [];
  const sharedList = shared ?? [];
  const hasAny = invitesList.length > 0 || sharedList.length > 0;

  if (isLoading) return <LoadingState />;
  if (!hasAny) {
    return (
      <EmptyState
        title={t('noInvites', 'Bekleyen davet yok')}
        message={t('noSharedHint', 'Biri sizi davet ettiğinde veya bir etkinliği kabul ettiğinizde burada görünecek.')}
      />
    );
  }

  const INVITES_COLOR = '#E07C3C';
  const SHARED_COLOR = '#0D9488';
  const FRIENDS_COLOR = '#6366F1';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
    >
      <AppText variant="title" style={{ marginBottom: theme.spacing.xl, color: theme.colors.textPrimary }}>
        {t('title', 'Ağ')}
      </AppText>

      <GradientSectionHeader title={t('invites', 'Davetler')} theme={theme} color={INVITES_COLOR} />
      {invitesList.length === 0 ? (
        <View
          style={{
            backgroundColor: theme.colors.surface2,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.xl,
            marginBottom: theme.spacing.xxl,
          }}
        >
          <AppText variant="body" color="muted">{t('noInvites', 'Bekleyen davet yok')}</AppText>
        </View>
      ) : (
        invitesList.map((inv) => (
          <View
            key={inv.id}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.xl,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.md,
              borderLeftWidth: 4,
              borderLeftColor: theme.colors.primary,
              ...theme.elevations[1],
            }}
          >
            <AppText variant="h3" style={{ color: theme.colors.textPrimary }}>{inv.title}</AppText>
            {inv.startAt && (
              <AppText variant="caption" color="secondary" style={{ marginTop: theme.spacing.xs }}>
                {dayjs(inv.startAt).format('ddd, MMM D · HH:mm')}
              </AppText>
            )}
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
              <AppButton
                variant="primary"
                onPress={() => rsvpMutation.mutate({ id: inv.id, status: 'accepted' })}
                loading={rsvpMutation.isPending}
              >
                {t('accept', 'Kabul')}
              </AppButton>
              <AppButton
                variant="secondary"
                onPress={() => rsvpMutation.mutate({ id: inv.id, status: 'declined' })}
                disabled={rsvpMutation.isPending}
              >
                {t('decline', 'Reddet')}
              </AppButton>
              <AppButton
                variant="ghost"
                onPress={() => router.push({ pathname: '/(tabs)/event/[id]', params: { id: inv.id } })}
              >
                Görüntüle
              </AppButton>
            </View>
          </View>
        ))
      )}

      <GradientSectionHeader title={t('shared', 'Paylaşılan')} theme={theme} color={SHARED_COLOR} />
      {sharedList.length === 0 ? (
        <View
          style={{
            backgroundColor: theme.colors.surface2,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.xl,
            marginBottom: theme.spacing.xxl,
          }}
        >
          <AppText variant="body" color="muted">{t('noShared', 'Paylaşılan etkinlik yok')}</AppText>
        </View>
      ) : (
        sharedList.map((ev) => (
          <View
            key={ev.id}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.xl,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.md,
              borderLeftWidth: 4,
              borderLeftColor: '#0D9488',
              ...theme.elevations[1],
            }}
          >
            <AppText variant="h3" style={{ color: theme.colors.textPrimary }}>{ev.title}</AppText>
            {ev.startAt && (
              <AppText variant="caption" color="secondary" style={{ marginTop: theme.spacing.xs }}>
                {dayjs(ev.startAt).format('ddd, MMM D · HH:mm')}
              </AppText>
            )}
            <AppButton
              variant="primary"
              onPress={() => router.push({ pathname: '/(tabs)/event/[id]/chat', params: { id: ev.id } })}
              style={{ marginTop: theme.spacing.md }}
            >
              {t('openChat', 'Sohbete git')}
            </AppButton>
          </View>
        ))
      )}

      {(invitesList.length > 0 || sharedList.length > 0) && (
        <>
          <GradientSectionHeader title={t('friends', 'Etkinlik Arkadaşların')} theme={theme} color={FRIENDS_COLOR} />
          <View
            style={{
              backgroundColor: theme.colors.surface2,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
            }}
          >
            <AppText variant="body" color="muted" style={{ textAlign: 'center' }}>
              Davet ettiğin veya birlikte etkinlik yaptığın kişiler burada listelenecek.
            </AppText>
          </View>
        </>
      )}
    </ScrollView>
  );
}
