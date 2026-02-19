import { useEffect, useState } from 'react';
import { View, ScrollView, Switch, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { HomeMenuModal } from '@/components/HomeMenuModal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SwipeableTabContent } from '@/components/SwipeableTabContent';
import { nomiAppColors } from '@/theme/tokens';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { useLifeAreasStore } from '@/store/lifeAreas';
import { registerForPushNotifications } from '@/lib/notifications';
import { api, getApiUrl, checkApiHealth } from '@/lib/api';
import {
  AppText,
  AppButton,
  AppInput,
  SectionHeader,
  SettingsRow,
  LoadingState,
} from '@/components/ui';

type Settings = {
  locale: string;
  timezone: string;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  username: string | null;
};

type NotificationRule = { id: string; rule_type: string; enabled: boolean };

const RULE_LABELS: Record<string, string> = {
  daily_checkin: 'Daily check-in',
  bill_amount_prompt: 'Bill amount reminders',
  event_reminder: 'Event reminders',
};

const RULE_LABELS_TR: Record<string, string> = {
  daily_checkin: 'Günlük kontrol',
  bill_amount_prompt: 'Fatura hatırlatmaları',
  event_reminder: 'Etkinlik hatırlatmaları',
};

export default function SystemScreen() {
  const { t, i18n } = useTranslation('system');
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const signOut = useAuthStore((s) => s.signOut);
  const screenMode = useThemeStore((s) => s.screenMode);
  const setScreenMode = useThemeStore((s) => s.setScreenMode);
  const lifeAreas = useLifeAreasStore((s) => s.areas);

  const [quietStart, setQuietStart] = useState('');
  const [quietEnd, setQuietEnd] = useState('');
  const [username, setUsername] = useState('');
  const [apiStatus, setApiStatus] = useState<{ ok: boolean; error?: string; hint?: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<Settings>('/settings'),
    retry: 0,
  });

  const testConnection = async () => {
    setApiStatus(null);
    setTestingConnection(true);
    try {
      const result = await checkApiHealth();
      setApiStatus(result);
    } finally {
      setTestingConnection(false);
    }
  };

  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['settings', 'notification-rules'],
    queryFn: () => api<NotificationRule[]>('/settings/notification-rules'),
    retry: 0,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<Settings>) =>
      api<Settings>('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
    onError: (e) => {
      Alert.alert('Hata', (e as Error).message);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      i18n.changeLanguage(res.locale);
      setQuietStart(res.quiet_hours_start ?? '');
      setQuietEnd(res.quiet_hours_end ?? '');
      setUsername(res.username ?? '');
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api(`/settings/notification-rules/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'notification-rules'] });
    },
  });

  useEffect(() => {
    registerForPushNotifications();
  }, []);

  useEffect(() => {
    if (settings) {
      i18n.changeLanguage(settings.locale);
      setQuietStart(settings.quiet_hours_start ?? '');
      setQuietEnd(settings.quiet_hours_end ?? '');
      setUsername(settings.username ?? '');
    }
  }, [settings?.locale, settings?.quiet_hours_start, settings?.quiet_hours_end, settings?.username]);

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'tr' : 'en';
    updateSettingsMutation.mutate({ locale: next });
  };

  const saveQuietHours = () => {
    const start = quietStart.trim() ? quietStart : null;
    const end = quietEnd.trim() ? quietEnd : null;
    updateSettingsMutation.mutate({
      quiet_hours_start: start,
      quiet_hours_end: end,
    });
  };

  const getRuleLabel = (ruleType: string) =>
    i18n.language === 'tr' ? RULE_LABELS_TR[ruleType] ?? ruleType : RULE_LABELS[ruleType] ?? ruleType;

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <SwipeableTabContent currentTab="system">
      <View style={{ flex: 1, backgroundColor: nomiAppColors.background }}>
        <HomeMenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />
        <ScreenHeader onMenuPress={() => setMenuVisible(true)} title={t('pageTitle')} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
        >

      <AppText variant="h3" style={{ marginBottom: theme.spacing.sm }}>
        Ekran modu
      </AppText>
      <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>
        Sıcak veya Dark
      </AppText>
      <View style={{ flexDirection: 'row', backgroundColor: theme.colors.surface2, borderRadius: theme.radius.full, padding: 2, marginBottom: theme.spacing.xl, alignSelf: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        {(['warm', 'dark'] as const).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setScreenMode(mode)}
            style={{
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.radius.full,
              backgroundColor: screenMode === mode ? theme.colors.primary : 'transparent',
            }}
          >
            <AppText variant="body" style={{ color: screenMode === mode ? '#fff' : theme.colors.textMuted }}>
              {mode === 'warm' ? 'Sıcak' : 'Dark'}
            </AppText>
          </Pressable>
        ))}
      </View>

      <AppText variant="h3" style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm }}>
        Life Areas
      </AppText>
      <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>
        Health · Career · Learning · Finance · Relationships · Mind (editable)
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
        {lifeAreas.map((area) => (
          <View
            key={area}
            style={{
              paddingVertical: theme.spacing.xs,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.surface2,
            }}
          >
            <AppText variant="caption" style={{ color: theme.colors.textPrimary }}>{area}</AppText>
          </View>
        ))}
      </View>

      <AppText variant="h3" style={{ marginBottom: theme.spacing.md }}>
        {t('username')}
      </AppText>
      <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>
        {t('usernameHint')}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
        <AppInput
          placeholder={t('usernamePlaceholder')}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={{ flex: 1, marginBottom: 0 }}
        />
        <AppButton
          variant="primary"
          onPress={() => updateSettingsMutation.mutate({ username: username.trim() || undefined })}
          disabled={!username.trim() || updateSettingsMutation.isPending}
        >
          {updateSettingsMutation.isPending ? '...' : t('saveUsername')}
        </AppButton>
      </View>

      <AppText variant="h3" style={{ marginBottom: theme.spacing.sm }}>
        API Bağlantısı
      </AppText>
      <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.xs }}>
        {getApiUrl()}
      </AppText>
      <AppButton
        variant="secondary"
        onPress={testConnection}
        disabled={testingConnection}
        style={{ marginBottom: theme.spacing.md }}
      >
        {testingConnection ? 'Test ediliyor...' : 'Bağlantıyı test et'}
      </AppButton>
      {apiStatus && (
        <View style={{ marginBottom: theme.spacing.lg }}>
          <AppText variant="body" color={apiStatus.ok ? 'success' : 'danger'}>
            {apiStatus.ok ? '✓ API erişilebilir' : `✗ ${apiStatus.error}`}
          </AppText>
          {!apiStatus.ok && apiStatus.hint && (
            <AppText variant="small" color="muted" style={{ marginTop: theme.spacing.sm }}>
              {apiStatus.hint}
            </AppText>
          )}
        </View>
      )}
      <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.lg }}>
        Cloudflared: Terminal 1 → pnpm dev:api. Terminal 2 → pnpm tunnel:api. Çıkan https://xxx.trycloudflare.com adresini .env EXPO_PUBLIC_API_URL olarak yaz, Expo yeniden başlat.
      </AppText>

      <AppText variant="h3" style={{ marginBottom: theme.spacing.md }}>
        {t('language')}
      </AppText>
      <SettingsRow
        label={i18n.language === 'en' ? 'English' : 'Türkçe'}
        subtitle={t('languageHint', 'Tap to switch')}
        right={
          <AppButton variant="secondary" onPress={toggleLanguage}>
            {i18n.language === 'en' ? 'TR' : 'EN'}
          </AppButton>
        }
      />

      <AppText variant="h3" style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.md }}>
        {t('notifications')}
      </AppText>
      {rulesLoading ? (
        <AppText color="muted">Loading...</AppText>
      ) : (
        rules.map((r) => (
          <SettingsRow
            key={r.id}
            label={getRuleLabel(r.rule_type)}
            right={
              <Switch
                value={r.enabled}
                onValueChange={(v: boolean) => updateRuleMutation.mutate({ id: r.id, enabled: v })}
                trackColor={{
                  false: theme.colors.surface2,
                  true: theme.colors.primaryMuted ?? theme.colors.primary,
                }}
                thumbColor={r.enabled ? theme.colors.primary : theme.colors.border}
              />
            }
          />
        ))
      )}

      <AppText variant="h3" style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.md }}>
        {t('quietHours')}
      </AppText>
      <View style={{ marginBottom: theme.spacing.sm }}>
        <AppInput
          label={t('quietHoursStart', 'Start (HH:MM)')}
          placeholder="22:00"
          value={quietStart}
          onChangeText={setQuietStart}
        />
      </View>
      <View style={{ marginBottom: theme.spacing.md }}>
        <AppInput
          label={t('quietHoursEnd', 'End (HH:MM)')}
          placeholder="08:00"
          value={quietEnd}
          onChangeText={setQuietEnd}
        />
      </View>
      <AppButton variant="secondary" onPress={saveQuietHours} style={{ marginBottom: theme.spacing.lg }}>
        {t('save', 'Save quiet hours')}
      </AppButton>

      <AppButton variant="danger" onPress={handleSignOut} style={{ marginTop: theme.spacing.xl }}>
        {t('signOut', 'Sign out')}
      </AppButton>
        </ScrollView>
      </View>
    </SwipeableTabContent>
  );
}
