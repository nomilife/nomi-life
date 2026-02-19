import { useState } from 'react';
import { View, TextInput, Pressable, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { api } from '@/lib/api';
import dayjs from 'dayjs';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function ReminderCreateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [time, setTime] = useState('09:00');
  const [recurrence, setRecurrence] = useState<'once' | 'daily' | 'weekly' | 'monthly'>('once');

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api('/reminders', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      router.back();
    },
    onError: (e) => {
      Alert.alert('Hata', (e as Error).message);
    },
  });

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Eksik', 'Başlık gerekli.');
      return;
    }
    const remindAt = dayjs(`${date}T${time}`).toISOString();
    createMutation.mutate({
      title: title.trim(),
      remindAt,
      recurrence,
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

  const RECURRENCE_OPTIONS = ['once', 'daily', 'weekly', 'monthly'] as const;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader showBack title="New Reminder" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
      >
        <TextInput
          style={[inputStyle, { marginBottom: theme.spacing.md }]}
          placeholder="Reminder"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={theme.colors.textMuted}
        />
        <TextInput
          style={[inputStyle, { marginBottom: theme.spacing.md }]}
          placeholder="Date (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
          placeholderTextColor={theme.colors.textMuted}
        />
        <TextInput
          style={[inputStyle, { marginBottom: theme.spacing.md }]}
          placeholder="Time (HH:mm)"
          value={time}
          onChangeText={setTime}
          placeholderTextColor={theme.colors.textMuted}
        />
        <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, marginBottom: theme.spacing.sm }}>
          Repeat
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
          {RECURRENCE_OPTIONS.map((r) => (
            <Pressable
              key={r}
              onPress={() => setRecurrence(r)}
              style={{
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.radius.full,
                backgroundColor: recurrence === r ? theme.colors.primary : theme.colors.surface2,
              }}
            >
              <Text style={{ ...theme.typography.small, color: recurrence === r ? '#fff' : theme.colors.text }}>
                {r}
              </Text>
            </Pressable>
          ))}
        </View>
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
          <Text style={{ color: '#fff', ...theme.typography.body, fontWeight: '600' }}>Create</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
