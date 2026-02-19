import { useState } from 'react';
import { View, TextInput, Pressable, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { api } from '@/lib/api';
import dayjs from 'dayjs';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function TravelCreateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [departureTime, setDepartureTime] = useState('09:00');
  const [arrivalDate, setArrivalDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [arrivalTime, setArrivalTime] = useState('18:00');

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api('/travel', { method: 'POST', body: JSON.stringify(data) }),
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
    if (!destination.trim()) {
      Alert.alert('Eksik', 'Varış noktası gerekli.');
      return;
    }
    const departureAt = dayjs(`${departureDate}T${departureTime}`).toISOString();
    const arrivalAt = dayjs(`${arrivalDate}T${arrivalTime}`).toISOString();
    createMutation.mutate({
      title: title.trim(),
      origin: origin.trim() || null,
      destination: destination.trim(),
      departureAt,
      arrivalAt,
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
      <ScreenHeader showBack title="New Travel" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
      >
        <TextInput
          style={[inputStyle, { marginBottom: theme.spacing.md }]}
          placeholder="Trip name"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={theme.colors.textMuted}
        />
        <TextInput
          style={[inputStyle, { marginBottom: theme.spacing.md }]}
          placeholder="Origin (optional)"
          value={origin}
          onChangeText={setOrigin}
          placeholderTextColor={theme.colors.textMuted}
        />
        <TextInput
          style={[inputStyle, { marginBottom: theme.spacing.md }]}
          placeholder="Destination *"
          value={destination}
          onChangeText={setDestination}
          placeholderTextColor={theme.colors.textMuted}
        />
        <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
          Departure
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
          <TextInput
            style={[inputStyle, { flex: 1 }]}
            placeholder="Date"
            value={departureDate}
            onChangeText={setDepartureDate}
            placeholderTextColor={theme.colors.textMuted}
          />
          <TextInput
            style={[inputStyle, { flex: 1 }]}
            placeholder="Time"
            value={departureTime}
            onChangeText={setDepartureTime}
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>
        <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, marginBottom: theme.spacing.sm }}>
          Arrival
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <TextInput
            style={[inputStyle, { flex: 1 }]}
            placeholder="Date"
            value={arrivalDate}
            onChangeText={setArrivalDate}
            placeholderTextColor={theme.colors.textMuted}
          />
          <TextInput
            style={[inputStyle, { flex: 1 }]}
            placeholder="Time"
            value={arrivalTime}
            onChangeText={setArrivalTime}
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
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', ...theme.typography.body, fontWeight: '600' }}>Create</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
