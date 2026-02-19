import { useState, useEffect, useRef } from 'react';
import { View, Pressable, TextInput, Platform, Alert, Text, ScrollView, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTheme } from '@/theme';
import { retroColors } from '@/theme/tokens';
import { api, API_TIMEOUT_AI } from '@/lib/api';
import { useChatStore } from '@/store/chat';
import { AppText } from '@/components/ui';

type ParsedAction = {
  action: string;
  data: Record<string, unknown>;
};

function getHighlightWords(text: string, parsed: ParsedAction | null): Set<string> {
  const words = new Set<string>();
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'pazartesi', 'sali', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar'];
  const lower = text.toLowerCase();
  dayNames.forEach((day) => {
    if (lower.includes(day)) words.add(day);
  });
  if (parsed) {
    const d = parsed.data;
    const title = ((d.title as string) ?? '').toLowerCase();
    const firstWord = title.split(/\s+/)[0];
    if (firstWord && lower.includes(firstWord)) words.add(firstWord);
  }
  return words;
}

function HighlightedQuote({ text, hint, highlightWords, theme }: { text: string; hint: string; highlightWords: Set<string>; theme: ReturnType<typeof useTheme> }) {
  if (!text) {
    return <AppText variant="display" style={{ color: theme.colors.textMuted }}>{`"${hint}"`}</AppText>;
  }
  const words = [...highlightWords];
  if (words.length === 0) {
    return <Text style={{ fontSize: 24, fontWeight: '600', color: theme.colors.textPrimary }}>{`"${text}"`}</Text>;
  }
  const parts: string[] = [];
  let remainder = text;
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');
  let m = regex.exec(remainder);
  while (m && m[0].length > 0) {
    if (m.index > 0) parts.push(remainder.slice(0, m.index));
    parts.push(`\0${m[1]}\0`);
    remainder = remainder.slice(m.index + m[0].length);
    regex.lastIndex = 0;
    m = regex.exec(remainder);
  }
  if (remainder) parts.push(remainder);

  return (
    <Text style={{ fontSize: 24, fontWeight: '600', color: theme.colors.textPrimary }}>
      {`"`}
      {parts.map((p, i) =>
        p.startsWith('\0') && p.endsWith('\0') ? (
          <Text key={i} style={{ color: theme.colors.primary }}>
            {p.slice(1, -1)}
          </Text>
        ) : (
          <Text key={i}>{p}</Text>
        )
      )}
      {`"`}
    </Text>
  );
}

function AudioVisualizer({ active }: { active: boolean }) {
  const theme = useTheme();
  const [heights, setHeights] = useState(() => Array.from({ length: 12 }, () => 8 + Math.random() * 24));

  useEffect(() => {
    const id = setInterval(() => {
      setHeights(() =>
        Array.from({ length: 12 }, () => 8 + Math.random() * 32)
      );
    }, 100);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: theme.spacing.xxl }}>
      {/* Pulsating bars around mic */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4, height: 56, marginBottom: theme.spacing.lg }}>
        {heights.map((h, i) => (
          <View
            key={i}
            style={{
              width: 3,
              height: active ? h : 8,
              borderRadius: 2,
              backgroundColor: theme.colors.primary,
              opacity: active ? 0.5 + Math.random() * 0.5 : 0.3,
            }}
          />
        ))}
      </View>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: theme.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="mic" size={36} color="#fff" />
      </View>
    </View>
  );
}

function ParsedCard({
  label,
  value,
  theme,
  style,
}: { label: string; value: string; theme: ReturnType<typeof useTheme>; style?: object }) {
  const cardBg = 'surface2' in theme.colors ? theme.colors.surface2 : theme.colors.surface;
  return (
    <View
      style={[
        {
          backgroundColor: cardBg,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.md,
          minWidth: 100,
        },
        style,
      ]}
    >
      <AppText variant="small" color="muted" style={{ textTransform: 'uppercase', marginBottom: theme.spacing.xs }}>
        {label}
      </AppText>
      <AppText variant="h3" style={{ color: theme.colors.textPrimary }}>{value}</AppText>
    </View>
  );
}

export default function VoiceScreen() {
  const { t } = useTranslation('voice');
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedAction | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [subscriptionAmount, setSubscriptionAmount] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const speechRecRef = useRef<{ stop: () => void } | null>(null);
  const inputRef = useRef<TextInput>(null);
  const isRecordingRef = useRef(false);
  isRecordingRef.current = isRecording;

  const parseMutation = useMutation({
    mutationFn: async (input: string) =>
      api<ParsedAction>('/ai/parse-command', {
        method: 'POST',
        body: JSON.stringify({ text: input }),
        timeoutMs: API_TIMEOUT_AI,
      }),
    onSuccess: (data, inputText) => {
      if (data.action === 'unknown' && inputText?.trim()) {
        useChatStore.getState().setPendingQuery(inputText.trim());
        router.replace('/(tabs)/copilot' as never);
        return;
      }
      setParsed(data);
      setSubscriptionAmount(data.action === 'create_subscription' && data.data?.amount != null ? String(data.data.amount) : '');
      setBillAmount(data.action === 'create_bill' && data.data?.amount != null ? String(data.data.amount) : '');
    },
    onError: (e) => {
      const msg = (e as Error).message;
      const isTimeout = msg.includes('abort') || msg.includes('Abort') || msg.includes('Zaman');
      Alert.alert(
        t('error'),
        isTimeout
          ? 'AI yanıt vermedi. Bağlantınızı kontrol edin veya kısa bir komut deneyin. Örn: "Yarın saat 8\'de toplantı"'
          : msg
      );
    },
  });

  const createEventMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/ai/create-event', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      router.back();
    },
    onError: (e) => {
      Alert.alert(t('error'), (e as Error).message);
    },
  });

  const createHabitMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/habits', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      router.back();
    },
    onError: (e) => {
      Alert.alert(t('error'), (e as Error).message);
    },
  });

  const createBillMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/bills', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      router.back();
    },
    onError: (e) => {
      Alert.alert(t('error'), (e as Error).message);
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/tasks', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      router.back();
    },
    onError: (e) => {
      Alert.alert(t('error'), (e as Error).message);
    },
  });
  const createWorkBlockMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/work-blocks', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      router.back();
    },
    onError: (e) => {
      Alert.alert(t('error'), (e as Error).message);
    },
  });
  const createAppointmentMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/appointments', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      router.back();
    },
    onError: (e) => {
      Alert.alert(t('error'), (e as Error).message);
    },
  });
  const createReminderMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/reminders', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      router.back();
    },
    onError: (e) => {
      Alert.alert(t('error'), (e as Error).message);
    },
  });
  const createSubscriptionMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/subscriptions', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      router.back();
    },
    onError: (e) => {
      Alert.alert(t('error'), (e as Error).message);
    },
  });
  const createGoalMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/goals', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      router.back();
    },
    onError: (e) => {
      Alert.alert(t('error'), (e as Error).message);
    },
  });
  const createTravelMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/travel', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      router.back();
    },
    onError: (e) => {
      Alert.alert(t('error'), (e as Error).message);
    },
  });
  const createJournalMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/journals', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      router.back();
    },
    onError: (e) => {
      Alert.alert(t('error'), (e as Error).message);
    },
  });

  const handleParse = () => {
    if (!text.trim()) return;
    parseMutation.mutate(text.trim());
  };

  const handleConfirm = () => {
    if (!parsed) return;
    const d = parsed.data;
    if (parsed.action === 'create_event') {
      const startDate = (d.startDate as string) ?? dayjs().format('YYYY-MM-DD');
      const startTime = (d.startTime as string) ?? '09:00';
      const endTime = (d.endTime as string) ?? '10:00';
      const startAt = `${startDate}T${startTime}:00`;
      const endAt = `${startDate}T${endTime}:00`;
      createEventMutation.mutate({
        title: (d.title as string) ?? 'Event',
        startAt: dayjs(startAt).toISOString(),
        endAt: dayjs(endAt).toISOString(),
        location: (d.location as string) ?? null,
        visibility: 'private',
      });
    } else if (parsed.action === 'create_habit') {
      const sched = (d.schedule as { days?: number[]; time?: string }) ?? {};
      createHabitMutation.mutate({
        title: (d.title as string) ?? 'Alışkanlık',
        schedule: {
          days: Array.isArray(sched.days) && sched.days.length > 0 ? sched.days : [0, 1, 2, 3, 4, 5, 6],
          time: (sched.time as string) ?? '09:00',
        },
      });
    } else if (parsed.action === 'create_bill') {
      const amount = billAmount.trim()
        ? parseFloat(billAmount.replace(',', '.')) || null
        : (typeof d.amount === 'number' ? d.amount : typeof d.amount === 'string' ? parseFloat(d.amount) || null : null);
      const due = (d.dueDate as string) ?? dayjs().endOf('month').format('YYYY-MM-DD');
      createBillMutation.mutate({
        vendor: (d.vendor as string) ?? 'Gider',
        amount,
        dueDate: due,
        recurrence: (d.recurrence as string) ?? 'monthly',
        autopay: false,
      });
    } else if (parsed.action === 'create_task') {
      const startDate = (d.startDate as string) ?? dayjs().format('YYYY-MM-DD');
      const startTime = (d.startTime as string) ?? '09:00';
      createTaskMutation.mutate({
        title: (d.title as string) ?? 'Task',
        dueDate: (d.dueDate as string) ?? startDate,
        dueTime: startTime,
        priority: (d.priority as string) ?? 'normal',
      });
    } else if (parsed.action === 'create_work_block') {
      const startDate = (d.startDate as string) ?? dayjs().format('YYYY-MM-DD');
      const startTime = (d.startTime as string) ?? '09:00';
      const endTime = (d.endTime as string) ?? '10:00';
      const startAt = `${startDate}T${startTime}:00`;
      const endAt = `${startDate}T${endTime}:00`;
      createWorkBlockMutation.mutate({
        title: (d.title as string) ?? 'Work',
        startAt: dayjs(startAt).toISOString(),
        endAt: dayjs(endAt).toISOString(),
        project: (d.project as string) ?? null,
      });
    } else if (parsed.action === 'create_appointment') {
      const startDate = (d.startDate as string) ?? dayjs().format('YYYY-MM-DD');
      const startTime = (d.startTime as string) ?? '09:00';
      const endTime = (d.endTime as string) ?? '10:00';
      const startAt = `${startDate}T${startTime}:00`;
      const endAt = `${startDate}T${endTime}:00`;
      createAppointmentMutation.mutate({
        title: (d.title as string) ?? 'Appointment',
        startAt: dayjs(startAt).toISOString(),
        endAt: dayjs(endAt).toISOString(),
        location: (d.location as string) ?? null,
        withWhom: (d.withWhom as string) ?? null,
      });
    } else if (parsed.action === 'create_reminder') {
      const remindAt = (d.remindAt as string) ?? `${(d.startDate as string) ?? dayjs().format('YYYY-MM-DD')}T${(d.startTime as string) ?? '09:00'}:00`;
      createReminderMutation.mutate({
        title: (d.title as string) ?? 'Reminder',
        remindAt: dayjs(remindAt).toISOString(),
        recurrence: (d.recurrence as string) ?? 'once',
      });
    } else if (parsed.action === 'create_subscription') {
      const amount = subscriptionAmount.trim()
        ? parseFloat(subscriptionAmount.replace(',', '.')) || null
        : (typeof d.amount === 'number' ? d.amount : typeof d.amount === 'string' ? parseFloat(d.amount) || null : null);
      createSubscriptionMutation.mutate({
        title: (d.title as string) ?? (d.vendor as string) ?? 'Subscription',
        vendor: (d.vendor as string) ?? 'Vendor',
        amount,
        billingCycle: (d.billingCycle as string) ?? 'monthly',
        nextBillDate: (d.nextBillDate as string) ?? dayjs().add(1, 'month').format('YYYY-MM-DD'),
      });
    } else if (parsed.action === 'create_goal') {
      createGoalMutation.mutate({
        title: (d.title as string) ?? 'Goal',
        targetDate: (d.targetDate as string) ?? null,
        lifeArea: (d.lifeArea as string) ?? null,
      });
    } else if (parsed.action === 'create_travel') {
      createTravelMutation.mutate({
        title: (d.title as string) ?? 'Travel',
        origin: (d.origin as string) ?? null,
        destination: (d.destination as string) ?? (d.title as string) ?? 'Destination',
        departureAt: (d.departureAt as string) ? dayjs(d.departureAt as string).toISOString() : null,
        arrivalAt: (d.arrivalAt as string) ? dayjs(d.arrivalAt as string).toISOString() : null,
      });
    } else if (parsed.action === 'create_journal') {
      createJournalMutation.mutate({
        title: (d.title as string) ?? 'Journal',
        content: (d.content as string) ?? (d.title as string) ?? 'Entry',
        mood: (d.mood as string) ?? null,
      });
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const SpeechRecognition =
          (window as unknown as { SpeechRecognition?: typeof globalThis.SpeechRecognition }).SpeechRecognition ??
          (window as unknown as { webkitSpeechRecognition?: typeof globalThis.SpeechRecognition }).webkitSpeechRecognition;
        if (SpeechRecognition) {
          try {
            speechRecRef.current = new SpeechRecognition();
            const rec = speechRecRef.current;
            rec.continuous = false;
            rec.interimResults = true;
            rec.lang = 'tr-TR';
            rec.onresult = (e: SpeechRecognitionEvent) => {
              const last = e.results[e.results.length - 1];
              const transcript = last[0]?.transcript ?? '';
              if (last.isFinal) {
                setText((prev) => (prev ? `${prev} ${transcript}` : transcript).trim());
                setIsRecording(false);
              }
            };
            rec.onerror = () => { speechRecRef.current = null; setIsRecording(false); };
            rec.onend = () => { speechRecRef.current = null; setIsRecording(false); };
            // Kısa gecikme: mikrofon ve ses motoru hazır olsun, ilk kelime kesilmesin
            setTimeout(() => {
              if (speechRecRef.current === rec && isRecordingRef.current) {
                try { rec.start(); } catch { /* zaten başlamış veya sonlanmış olabilir */ }
              }
            }, 450);
          } catch (err) {
            speechRecRef.current = null;
            setText(t('noSpeechWeb', 'Speech recognition error. Type your command.'));
            setIsRecording(false);
          }
        } else {
          setText(t('noSpeechWeb', 'Speech recognition not available. Type your command.'));
          setIsRecording(false);
        }
        return;
      }

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
          setText(t('noSpeechNative', 'Mikrofon Expo Go\'da çalışmaz. Metin alanına yazın.'));
          setIsRecording(false);
          return;
        }
        import('expo-speech-recognition')
          .then(async ({ ExpoSpeechRecognitionModule }) => {
            const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!granted) {
              setText(t('noPermission', 'Microfon izni gerekli. Ayarlardan izin verin.'));
              setIsRecording(false);
              return;
            }
            const removeResult = ExpoSpeechRecognitionModule.addListener('result', (event: { results?: Array<{ transcript?: string }> }) => {
              const transcript = event.results?.[0]?.transcript ?? '';
              if (transcript) setText((prev) => (prev ? `${prev} ${transcript}` : transcript).trim());
            });
            const removeEnd = ExpoSpeechRecognitionModule.addListener('end', () => {
              setIsRecording(false);
              removeResult.remove();
              removeEnd.remove();
            });
            ExpoSpeechRecognitionModule.start({ lang: 'tr-TR', interimResults: true });
          })
          .catch(() => {
            setText(t('noSpeechNative', 'Mikrofon için development build gerekli: npx expo run:android'));
            setIsRecording(false);
          });
      }
    }, 0);
  };

  const handleStopRecording = () => {
    if (Platform.OS === 'web' && speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {
        // ignore
      }
      speechRecRef.current = null;
    } else if (Platform.OS !== 'web') {
      import('expo-speech-recognition')
        .then(({ ExpoSpeechRecognitionModule }) => ExpoSpeechRecognitionModule.stop())
        .catch(() => {});
    }
    setIsRecording(false);
  };

  const isProcessing = parseMutation.isPending;
  const highlightWords = getHighlightWords(text, parsed);
  const CREATABLE_ACTIONS = [
    'create_event', 'create_habit', 'create_bill', 'create_task', 'create_work_block',
    'create_appointment', 'create_reminder', 'create_subscription', 'create_goal', 'create_travel', 'create_journal',
  ] as const;
  const hasParsedAction = parsed && CREATABLE_ACTIONS.includes(parsed.action as (typeof CREATABLE_ACTIONS)[number]);
  const retroPrimary = retroColors.teal;

  const btnBase = {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: theme.spacing.xl }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.xl }}>
          <View style={{ width: 40 }} />
          <AppText variant="small" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            {t('assistantTitle', 'NOMI AI')}
          </AppText>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 40, alignItems: 'flex-end' }}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </Pressable>
        </View>

        {/* Voice command - large quote */}
        <View style={{ marginBottom: theme.spacing.xl }}>
          <HighlightedQuote text={text} hint={t('hint')} highlightWords={highlightWords} theme={theme} />
        </View>

        {/* Quick expense chips */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.lg,
          }}
        >
          {['Kira', 'Elektrik', 'İnternet', 'Su', 'Doğalgaz', 'Telefon'].map((label) => (
            <Pressable
              key={label}
              onPress={() => {
                const v = label.toLowerCase();
                setText(`${v} `);
                setParsed(null);
                inputRef.current?.focus();
              }}
              style={{
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.surface2,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <Text style={{ ...theme.typography.small, color: theme.colors.textPrimary }}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Input + mic */}
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
          <TextInput
            ref={inputRef}
            style={{
              flex: 1,
              ...theme.typography.body,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.md,
              color: theme.colors.text,
              backgroundColor: theme.colors.surface,
            }}
            placeholder="e.g. Add gym on Thursday"
            value={text}
            onChangeText={(v) => { setText(v); setParsed(null); }}
            placeholderTextColor={theme.colors.textMuted}
          />
          <Pressable
            onPressIn={handleStartRecording}
            onPressOut={handleStopRecording}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: isRecording ? theme.colors.danger : theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="mic" size={24} color="#fff" />
          </Pressable>
        </View>

        {/* Central: Visualizer + Cards */}
        {(isProcessing || parsed) && (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
              {parsed && parsed.action === 'create_event' && (
                <>
                  <ParsedCard theme={theme} label="ACTIVITY" value={(parsed.data.title as string) ?? 'Event'} />
                  <ParsedCard theme={theme} label="SCHEDULE" value={parsed.data.startDate ? dayjs(parsed.data.startDate as string).format('ddd, MMM D') : '—'} />
                  <ParsedCard theme={theme} label="SUGGESTED TIME" value={(parsed.data.startTime as string) ?? '6:00 PM'} />
                </>
              )}
              {parsed && parsed.action === 'create_habit' && (
                <>
                  <ParsedCard theme={theme} label="ACTIVITY" value={(parsed.data.title as string) ?? 'Alışkanlık'} />
                  <ParsedCard
                    theme={theme}
                    label="FREQUENCY"
                    value={(() => {
                      const days = (parsed.data.schedule as { days?: number[] })?.days ?? [0, 1, 2, 3, 4, 5, 6];
                      return days.length === 7 ? 'Her gün' : days.length === 1 ? ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][days[0]] : `${days.length} gün`;
                    })()}
                  />
                  <ParsedCard theme={theme} label="TIME" value={((parsed.data.schedule as { time?: string })?.time ?? '09:00')} />
                </>
              )}
              {parsed && parsed.action === 'create_bill' && (
                <>
                  <ParsedCard theme={theme} label="FİRMA" value={(parsed.data.vendor as string) ?? 'Gider'} />
                  <ParsedCard
                    theme={theme}
                    label="VADE"
                    value={parsed.data.dueDate ? dayjs(parsed.data.dueDate as string).format('DD MMM YYYY') : '—'}
                  />
                  <View style={{ width: '100%', marginTop: theme.spacing.sm }}>
                    <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.xs }}>Tutar (₺)</AppText>
                    <TextInput
                      value={billAmount}
                      onChangeText={setBillAmount}
                      placeholder="Örn: 5000 veya 150.50"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="decimal-pad"
                      style={{
                        ...theme.typography.body,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.md,
                        padding: theme.spacing.md,
                        color: theme.colors.text,
                        backgroundColor: theme.colors.surface,
                      }}
                    />
                  </View>
                </>
              )}
              {parsed && parsed.action === 'create_subscription' && (
                <>
                  <ParsedCard theme={theme} label="ABONELİK" value={(parsed.data.vendor as string) ?? (parsed.data.title as string) ?? '—'} />
                  <ParsedCard
                    theme={theme}
                    label="SONRAKİ ÖDEME"
                    value={parsed.data.nextBillDate ? dayjs(parsed.data.nextBillDate as string).format('DD MMM YYYY') : '—'}
                  />
                  <View style={{ width: '100%', marginTop: theme.spacing.sm }}>
                    <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.xs }}>Aylık tutar (₺)</AppText>
                    <TextInput
                      value={subscriptionAmount}
                      onChangeText={setSubscriptionAmount}
                      placeholder="Örn: 34.99"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="decimal-pad"
                      style={{
                        ...theme.typography.body,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.md,
                        padding: theme.spacing.md,
                        color: theme.colors.text,
                        backgroundColor: theme.colors.surface,
                      }}
                    />
                  </View>
                </>
              )}
              {parsed && parsed.action === 'create_reminder' && (
                <>
                  <ParsedCard theme={theme} label="HATIRLATICI" value={(parsed.data.title as string) ?? '—'} />
                  <ParsedCard
                    theme={theme}
                    label="TARİH"
                    value={parsed.data.remindAt ? dayjs(parsed.data.remindAt as string).format('DD MMM HH:mm') : '—'}
                  />
                </>
              )}
              {parsed && (parsed.action === 'create_task' || parsed.action === 'create_appointment' || parsed.action === 'create_work_block' || parsed.action === 'create_goal' || parsed.action === 'create_travel' || parsed.action === 'create_journal') && (
                <>
                  <ParsedCard theme={theme} label="BAŞLIK" value={(parsed.data.title as string) ?? '—'} />
                  {parsed.data.dueDate && <ParsedCard theme={theme} label="TARİH" value={dayjs(parsed.data.dueDate as string).format('DD MMM YYYY')} />}
                  {parsed.data.startDate && <ParsedCard theme={theme} label="TARİH" value={dayjs(parsed.data.startDate as string).format('DD MMM YYYY')} />}
                  {parsed.data.targetDate && <ParsedCard theme={theme} label="HEDEF" value={dayjs(parsed.data.targetDate as string).format('DD MMM YYYY')} />}
                </>
              )}
            </View>
            <AudioVisualizer active={isProcessing} />
            {isProcessing && (
              <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    paddingVertical: theme.spacing.sm,
                    paddingHorizontal: theme.spacing.lg,
                    backgroundColor: theme.colors.surface2,
                    borderRadius: theme.radius.full,
                  }}
                >
                  <Ionicons name="sync" size={16} color={theme.colors.primary} />
                  <AppText variant="small" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                    {t('processing', 'AI analiz ediyor...')}
                  </AppText>
                </View>
                <AppText variant="small" color="muted" style={{ textAlign: 'center', marginTop: theme.spacing.sm }}>
                  Birkaç saniye sürebilir
                </AppText>
              </View>
            )}
          </>
        )}

        {/* Unknown - komut tanınmadı mesajı */}
        {parsed && parsed.action === 'unknown' && (
          <View
            style={{
              backgroundColor: theme.colors.surface2,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.xl,
            }}
          >
            <AppText variant="body" color="muted">
              {t('unknownHint', (parsed.data?.message as string) ?? 'Bu bir etkinlik komutu gibi görünmüyor. Örnek: "Yarın saat 3\'te toplantı ekle" veya "Add gym on Thursday"')}
            </AppText>
            <AppText variant="small" color="muted" style={{ marginTop: theme.spacing.sm }}>
              {t('tryAgain', 'Yeniden deneyin veya metin alanına yazın.')}
            </AppText>
            <Pressable
              onPress={() => {
                useChatStore.getState().setPendingQuery(text.trim());
                router.replace('/(tabs)/copilot' as never);
              }}
              style={{
                marginTop: theme.spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: theme.spacing.sm,
                paddingVertical: theme.spacing.md,
                paddingHorizontal: theme.spacing.lg,
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.lg,
              }}
            >
              <Ionicons name="chatbubbles" size={20} color="#fff" />
              <AppText variant="body" style={{ color: '#fff', fontWeight: '600' }}>
                {t('askNomi', 'NOMI\'ye sor')}
              </AppText>
            </Pressable>
          </View>
        )}

        {/* Spacer - butonlar altta sabit kalacak */}
        <View style={{ minHeight: theme.spacing.xxxl }} />
      </ScrollView>

      {/* Alt banner — 70s-80s retro + 2020 modern minimal */}
      <View
        style={{
          paddingHorizontal: theme.spacing.xl,
          paddingTop: theme.spacing.xl,
          paddingBottom: theme.spacing.xxl + 8,
          backgroundColor: retroColors.cream,
          borderTopLeftRadius: theme.radius.xxl,
          borderTopRightRadius: theme.radius.xxl,
          ...theme.elevations[2],
        }}
      >
        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          {hasParsedAction ? (
            <>
              <Pressable
                onPress={() => {
                  const d = parsed!.data;
                  if (parsed!.action === 'create_event') {
                    const startDate = (d.startDate as string) ?? dayjs().format('YYYY-MM-DD');
                    const startTime = (d.startTime as string) ?? '09:00';
                    const endTime = (d.endTime as string) ?? '10:00';
                    const startAt = `${startDate}T${startTime}:00`;
                    const endAt = `${startDate}T${endTime}:00`;
                    router.push({
                      pathname: '/(tabs)/event-create' as never,
                      params: {
                        title: (d.title as string) ?? '',
                        startAt: dayjs(startAt).format('YYYY-MM-DDTHH:mm'),
                        endAt: dayjs(endAt).format('YYYY-MM-DDTHH:mm'),
                        location: (d.location as string) ?? '',
                      },
                    } as never);
                  } else if (parsed!.action === 'create_habit') {
                    router.push({
                      pathname: '/(tabs)/habit-create' as never,
                      params: { title: (d.title as string) ?? '' },
                    } as never);
                  } else if (parsed!.action === 'create_bill') {
                    const raw = d.amount;
                    const amt =
                      typeof raw === 'number' ? raw : typeof raw === 'string' ? parseFloat(raw) : undefined;
                    router.push({
                      pathname: '/(tabs)/bill-create' as never,
                      params: {
                        vendor: (d.vendor as string) ?? '',
                        amount: amt != null ? String(amt) : '',
                        dueDate: (d.dueDate as string) ?? dayjs().endOf('month').format('YYYY-MM-DD'),
                      },
                    } as never);
                  }
                }}
                style={[btnBase, { backgroundColor: retroColors.slate, borderWidth: 0 }]}
              >
                <Ionicons name="pencil" size={18} color={retroColors.cream} />
                <AppText variant="body" style={{ color: retroColors.cream }}>{t('edit')}</AppText>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                disabled={
                  createEventMutation.isPending || createHabitMutation.isPending || createBillMutation.isPending
                }
                style={[btnBase, { backgroundColor: retroPrimary }]}
              >
                {createEventMutation.isPending || createHabitMutation.isPending || createBillMutation.isPending ? (
                  <AppText variant="body" style={{ color: retroColors.cream }}>...</AppText>
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color={retroColors.cream} />
                    <AppText variant="body" style={{ color: retroColors.cream }}>{t('confirm')}</AppText>
                  </>
                )}
              </Pressable>
            </>
          ) : parsed && parsed.action === 'unknown' ? (
            <>
              <Pressable
                onPress={() => { setParsed(null); inputRef.current?.focus(); }}
                style={[btnBase, { backgroundColor: retroColors.slate, borderWidth: 0 }]}
              >
                <Ionicons name="pencil" size={18} color={retroColors.cream} />
                <AppText variant="body" style={{ color: retroColors.cream }}>{t('edit')}</AppText>
              </Pressable>
              <Pressable
                onPress={() => { setParsed(null); if (text.trim()) parseMutation.mutate(text.trim()); }}
                style={[btnBase, { backgroundColor: retroPrimary }]}
              >
                <Ionicons name="refresh" size={18} color={retroColors.cream} />
                <AppText variant="body" style={{ color: retroColors.cream }}>{t('retryParse', 'Tekrar dene')}</AppText>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                onPress={handleParse}
                disabled={!text.trim() || isProcessing}
                style={[
                  btnBase,
                  {
                    backgroundColor: text.trim() && !isProcessing ? retroPrimary : retroColors.avocado + '40',
                    opacity: text.trim() && !isProcessing ? 1 : 0.8,
                  },
                ]}
              >
                <Ionicons
                  name="play"
                  size={18}
                  color={text.trim() && !isProcessing ? retroColors.cream : retroColors.slate}
                />
                <AppText
                  variant="body"
                  style={{
                    color: text.trim() && !isProcessing ? retroColors.cream : retroColors.slate,
                  }}
                >
                  {t('parse')}
                </AppText>
              </Pressable>
            </>
          )}
        </View>

        <Pressable onPress={() => router.back()} style={{ alignItems: 'center', marginTop: theme.spacing.lg }}>
          <AppText
            variant="small"
            style={{
              color: retroColors.burntSienna,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              fontWeight: '600',
            }}
          >
            {t('cancelRequest', 'CANCEL COMMAND')}
          </AppText>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
