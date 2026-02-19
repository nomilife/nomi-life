import { useState, useEffect } from 'react';
import { View, TextInput, Pressable, Text, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { api } from '@/lib/api';
import dayjs from 'dayjs';
import { AppText } from '@/components/ui';
import { DateTimeRecurrencePicker, type DateTimeRecurrenceValue } from '@/components/DateTimeRecurrencePicker';

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export default function EventCreateScreen() {
  const { t } = useTranslation('flow');
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ title?: string; startAt?: string; endAt?: string; location?: string }>();
  const [title, setTitle] = useState(params.title ?? '');
  const [location, setLocation] = useState(params.location ?? '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [participantsEmails, setParticipantsEmails] = useState<string[]>([]);
  const roundTo15 = (d: dayjs.Dayjs) => {
    const m = d.minute();
    const r = Math.min(45, Math.round(m / 15) * 15);
    return d.minute(r).second(0).format('HH:mm');
  };
  const [datetime, setDatetime] = useState<DateTimeRecurrenceValue>(() => {
    const start = params.startAt ? dayjs(params.startAt) : dayjs();
    const end = params.endAt ? dayjs(params.endAt) : start.add(1, 'hour');
    return {
      date: start.format('YYYY-MM-DD'),
      startTime: roundTo15(start),
      endTime: roundTo15(end),
      recurrence: 'once',
    };
  });

  useEffect(() => {
    if (params.title != null) setTitle(params.title);
    if (params.startAt != null) {
      const s = dayjs(params.startAt);
      setDatetime((d) => ({
        ...d,
        date: s.format('YYYY-MM-DD'),
        startTime: s.format('HH:mm'),
      }));
    }
    if (params.endAt != null) {
      setDatetime((d) => ({ ...d, endTime: dayjs(params.endAt).format('HH:mm') }));
    }
    if (params.location != null) setLocation(params.location);
  }, [params.title, params.startAt, params.endAt, params.location]);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api('/events', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['events', 'invites'] });
      router.back();
    },
    onError: (e) => {
      const msg = (e as Error).message;
      const hint = msg.includes('fetch') || msg.includes('Network') ? ' Telefon ve bilgisayar aynı WiFi\'de mi? .env\'de EXPO_PUBLIC_API_URL bilgisayarın IP\'si mi?' : '';
      Alert.alert('Hata', msg + hint);
    },
  });

  const addInvite = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !isValidEmail(email)) {
      Alert.alert(t('event.inviteInvalid', 'Geçersiz e-posta'));
      return;
    }
    if (participantsEmails.includes(email)) return;
    setParticipantsEmails((prev) => [...prev, email]);
    setInviteEmail('');
  };

  const removeInvite = (email: string) => {
    setParticipantsEmails((prev) => prev.filter((e) => e !== email));
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    const startAt = dayjs(`${datetime.date}T${datetime.startTime}`).toISOString();
    const endAt = dayjs(`${datetime.date}T${datetime.endTime}`).toISOString();
    createMutation.mutate({
      title: title.trim(),
      startAt,
      endAt,
      location: location.trim() || null,
      recurrence: datetime.recurrence === 'once' ? undefined : datetime.recurrence,
      visibility: participantsEmails.length > 0 ? 'shared' : 'private',
      participantsEmails,
    });
  };

  const inputStyle = {
    ...theme.typography.body,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
    >
      <View style={{ marginBottom: theme.spacing.xl }}>
        <Text style={{ ...theme.typography.h2, color: theme.colors.text }}>{t('eventFormTitle', 'Yeni Etkinlik')}</Text>
        <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, marginTop: theme.spacing.xs }}>
          {t('eventFormSubtitle', 'Etkinlik bilgilerini gir')}
        </Text>
      </View>

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
        <TextInput
          style={{ ...inputStyle, marginTop: 0 }}
          placeholder={t('eventTitlePlaceholder', 'Başlık')}
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={theme.colors.textMuted}
        />
        <TextInput
          style={{ ...inputStyle, marginTop: theme.spacing.md }}
          placeholder={t('eventLocationPlaceholder', 'Konum')}
          value={location}
          onChangeText={setLocation}
          placeholderTextColor={theme.colors.textMuted}
        />
        <View style={{ marginTop: theme.spacing.lg }}>
          <DateTimeRecurrencePicker value={datetime} onChange={setDatetime} />
        </View>
      </View>

      <AppText variant="h3" style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm }}>
        {t('event.inviteSection', 'Davet et')}
      </AppText>
      <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>
        {t('event.inviteHint', 'E-posta gir – uygulama kullanıcısıysa bildirim gider, Network\'ten kabul eder.')}
      </AppText>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
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
          placeholder="ornek@email.com"
          value={inviteEmail}
          onChangeText={setInviteEmail}
          onSubmitEditing={addInvite}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Pressable
          onPress={addInvite}
          style={{
            backgroundColor: theme.colors.primary,
            padding: theme.spacing.md,
            borderRadius: theme.radius.md,
            justifyContent: 'center',
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>
      {participantsEmails.map((email) => (
        <View
          key={email}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: theme.spacing.sm,
            padding: theme.spacing.sm,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.md,
          }}
        >
          <AppText variant="body">{email}</AppText>
          <Pressable onPress={() => removeInvite(email)} hitSlop={8}>
            <Ionicons name="close-circle" size={22} color={theme.colors.muted} />
          </Pressable>
        </View>
      ))}

      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.xl,
          padding: theme.spacing.lg,
          marginTop: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Pressable
        onPress={handleCreate}
        disabled={createMutation.isPending}
        style={{
          backgroundColor: theme.colors.primary,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.lg,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', ...theme.typography.body, fontWeight: '600' }}>{t('eventCreateButton', 'Oluştur')}</Text>
      </Pressable>
      </View>
    </ScrollView>
  );
}
