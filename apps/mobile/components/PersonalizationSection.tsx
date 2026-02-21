import { useState, useEffect } from 'react';
import { View, Pressable, Switch, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { api } from '@/lib/api';
import { AppText, AppButton } from '@/components/ui';
import { nomiAppColors } from '@/theme/tokens';

const LIFE_AREAS = [
  { key: 'social', label: 'Social' },
  { key: 'health', label: 'Health' },
  { key: 'finance', label: 'Finance' },
  { key: 'mind', label: 'Mind' },
  { key: 'relationships', label: 'Relationships' },
  { key: 'admin', label: 'Admin' },
  { key: 'work', label: 'Work' },
] as const;

const TONE_OPTIONS = [
  { value: 'calm', label: 'Calm & Friendly' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'strict', label: 'Strict' },
] as const;

type OnboardingData = {
  lifeAreas?: Record<string, boolean>;
  aiPreferences?: {
    tone?: string;
    response_length?: string;
    emoji_level?: number;
    checkin_preference?: string;
  };
};

function toPayload(areas: Record<string, boolean>): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const k of LIFE_AREAS.map((a) => a.key)) {
    out[k] = areas[k] ?? false;
  }
  return out;
}

export function PersonalizationSection() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [lifeAreas, setLifeAreas] = useState<Record<string, boolean>>({});
  const [tone, setTone] = useState('calm');
  const [responseLength, setResponseLength] = useState('short');
  const [emojiLevel, setEmojiLevel] = useState(1);
  const [checkinPref, setCheckinPref] = useState('evening');

  const { data } = useQuery({
    queryKey: ['onboarding', 'data'],
    queryFn: () => api<OnboardingData>('/onboarding/data'),
    retry: 0,
  });

  useEffect(() => {
    if (data?.lifeAreas) {
      setLifeAreas((prev) => ({ ...prev, ...data.lifeAreas }));
    }
    if (data?.aiPreferences) {
      const p = data.aiPreferences;
      if (p.tone) setTone(p.tone);
      if (p.response_length) setResponseLength(p.response_length);
      if (p.emoji_level !== undefined) setEmojiLevel(p.emoji_level);
      if (p.checkin_preference) setCheckinPref(p.checkin_preference);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api('/onboarding/preferences', { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['onboarding'] }),
    onError: (e) => Alert.alert('Hata', (e as Error).message),
  });

  const resetMutation = useMutation({
    mutationFn: () => api('/onboarding/reset', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      router.replace('/onboarding');
    },
    onError: (e) => Alert.alert('Hata', (e as Error).message),
  });

  const toggleLifeArea = (key: string) => {
    const next = { ...lifeAreas, [key]: !lifeAreas[key] };
    if (Object.values(next).filter(Boolean).length === 0 && !next[key]) return;
    setLifeAreas(next);
    updateMutation.mutate({ lifeAreas: toPayload(next) });
  };

  const savePrefs = (updates: Record<string, unknown>) => {
    updateMutation.mutate(updates);
  };

  return (
    <View style={{ marginBottom: theme.spacing.xl }}>
      <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>
        Life areas, AI tone, check-in. Edit anytime.
      </AppText>

      <AppText variant="caption" style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.xs }}>Life Areas</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {LIFE_AREAS.map((a) => (
          <Pressable
            key={a.key}
            onPress={() => toggleLifeArea(a.key)}
            style={{
              paddingVertical: theme.spacing.xs,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.radius.full,
              backgroundColor: lifeAreas[a.key] ? nomiAppColors.primary + '25' : theme.colors.surface2,
              borderWidth: 1,
              borderColor: lifeAreas[a.key] ? nomiAppColors.primary : theme.colors.border,
            }}
          >
            <AppText variant="caption" style={{ color: lifeAreas[a.key] ? nomiAppColors.primary : theme.colors.textMuted }}>
              {a.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      <AppText variant="caption" style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.xs }}>AI Tone</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {TONE_OPTIONS.map((o) => (
          <Pressable
            key={o.value}
            onPress={() => {
              setTone(o.value);
              savePrefs({ tone: o.value });
            }}
            style={{
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.radius.md,
              backgroundColor: tone === o.value ? nomiAppColors.primary : theme.colors.surface2,
            }}
          >
            <AppText variant="small" style={{ color: tone === o.value ? '#fff' : theme.colors.text }}>{o.label}</AppText>
          </Pressable>
        ))}
      </View>

      <AppText variant="caption" style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.xs }}>Response Length</AppText>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        {(['short', 'balanced', 'detailed'] as const).map((v) => (
          <Pressable
            key={v}
            onPress={() => {
              setResponseLength(v);
              savePrefs({ responseLength: v });
            }}
            style={{
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.radius.md,
              backgroundColor: responseLength === v ? nomiAppColors.primary : theme.colors.surface2,
            }}
          >
            <AppText variant="small" style={{ color: responseLength === v ? '#fff' : theme.colors.text }}>{v}</AppText>
          </Pressable>
        ))}
      </View>

      <AppText variant="caption" style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.xs }}>Emoji Level</AppText>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        {[0, 1, 2].map((v) => (
          <Pressable
            key={v}
            onPress={() => {
              setEmojiLevel(v);
              savePrefs({ emojiLevel: v });
            }}
            style={{
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.radius.md,
              backgroundColor: emojiLevel === v ? nomiAppColors.primary : theme.colors.surface2,
            }}
          >
            <AppText variant="small" style={{ color: emojiLevel === v ? '#fff' : theme.colors.text }}>{v}</AppText>
          </Pressable>
        ))}
      </View>

      <AppText variant="caption" style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.xs }}>Check-in Preference</AppText>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        {(['morning', 'evening', 'adaptive'] as const).map((v) => (
          <Pressable
            key={v}
            onPress={() => {
              setCheckinPref(v);
              savePrefs({ checkinPreference: v });
            }}
            style={{
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.radius.md,
              backgroundColor: checkinPref === v ? nomiAppColors.primary : theme.colors.surface2,
            }}
          >
            <AppText variant="small" style={{ color: checkinPref === v ? '#fff' : theme.colors.text }}>{v}</AppText>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: theme.spacing.lg, paddingVertical: theme.spacing.sm }}>
        <AppText variant="body" style={{ color: theme.colors.text }}>Work Mode</AppText>
        <Switch
          value={lifeAreas.work ?? false}
          onValueChange={(v) => {
            const next = { ...lifeAreas, work: v };
            setLifeAreas(next);
            updateMutation.mutate({ lifeAreas: toPayload(next) });
          }}
          trackColor={{ true: nomiAppColors.primary }}
        />
      </View>

      <AppText variant="caption" style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.xs, color: theme.colors.textMuted }}>
        Test
      </AppText>
      <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>
        Yeniden adım adım test etmek için
      </AppText>
      <AppButton
        variant="secondary"
        disabled={resetMutation.isPending}
        onPress={() => {
          const doReset = () => resetMutation.mutate();
          if (Platform.OS === 'web') {
            if (window.confirm("Onboarding'i sıfırla – mevcut hesabınla tekrar test etmek için. Devam?")) doReset();
          } else {
            Alert.alert(
              'Onboarding\'i sıfırla',
              'Mevcut hesabınla onboarding ekranına dönüp tekrar test edebilirsin. Devam?',
              [
                { text: 'İptal', style: 'cancel' },
                { text: 'Sıfırla', style: 'destructive', onPress: doReset },
              ]
            );
          }
        }}
      >
        {resetMutation.isPending ? 'Sıfırlanıyor...' : "Onboarding'i sıfırla"}
      </AppButton>
    </View>
  );
}
