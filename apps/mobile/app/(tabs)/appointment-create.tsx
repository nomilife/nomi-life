import { useState } from 'react';
import { View, TextInput, Pressable, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { api } from '@/lib/api';
import dayjs from 'dayjs';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function AppointmentCreateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [withWhom, setWithWhom] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:00');

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api('/appointments', { method: 'POST', body: JSON.stringify(data) }),
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
    const startAt = dayjs(`${date}T${startTime}`).toISOString();
    const endAt = dayjs(`${date}T${endTime}`).toISOString();
    createMutation.mutate({
      title: title.trim(),
      startAt,
      endAt,
      location: location.trim() || null,
      withWhom: withWhom.trim() || null,
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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader showBack title="New Appointment" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
      >
        <TextInput
          style={[inputStyle, { marginBottom: theme.spacing.md }]}
          placeholder="Appointment name"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={theme.colors.textMuted}
        />
        <TextInput
          style={[inputStyle, { marginBottom: theme.spacing.md }]}
          placeholder="Location (optional)"
          value={location}
          onChangeText={setLocation}
          placeholderTextColor={theme.colors.textMuted}
        />
        <TextInput
          style={[inputStyle, { marginBottom: theme.spacing.md }]}
          placeholder="With whom (optional)"
          value={withWhom}
          onChangeText={setWithWhom}
          placeholderTextColor={theme.colors.textMuted}
        />
        <TextInput
          style={[inputStyle, { marginBottom: theme.spacing.md }]}
          placeholder="Date (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
          placeholderTextColor={theme.colors.textMuted}
        />
        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          <TextInput
            style={[inputStyle, { flex: 1 }]}
            placeholder="Start (HH:mm)"
            value={startTime}
            onChangeText={setStartTime}
            placeholderTextColor={theme.colors.textMuted}
          />
          <TextInput
            style={[inputStyle, { flex: 1 }]}
            placeholder="End (HH:mm)"
            value={endTime}
            onChangeText={setEndTime}
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>
        <Pressable
          onPress={handleCreate}
          disabled={createMutation.isPending}
          style={{
            backgroundColor: theme.colors.primary,
            padding: theme.spacing.lg,
            borderRadius: theme.radius.lg,
            marginTop: theme.spacing.xl,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', ...theme.typography.body, fontWeight: '600' }}>Create</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
