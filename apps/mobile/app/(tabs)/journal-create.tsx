import { useState } from 'react';
import { View, TextInput, Pressable, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { api } from '@/lib/api';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function JournalCreateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api('/journals', { method: 'POST', body: JSON.stringify(data) }),
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
    if (!content.trim()) {
      Alert.alert('Eksik', 'İçerik gerekli.');
      return;
    }
    createMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      mood: mood.trim() || null,
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
      <ScreenHeader showBack title="New Journal Entry" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
      >
        <TextInput
          style={[inputStyle, { marginBottom: theme.spacing.md }]}
          placeholder="Entry title"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={theme.colors.textMuted}
        />
        <TextInput
          style={[inputStyle, { minHeight: 120, textAlignVertical: 'top', marginBottom: theme.spacing.md }]}
          placeholder="What's on your mind?"
          value={content}
          onChangeText={setContent}
          placeholderTextColor={theme.colors.textMuted}
          multiline
        />
        <TextInput
          style={[inputStyle, { marginBottom: theme.spacing.lg }]}
          placeholder="Mood (optional)"
          value={mood}
          onChangeText={setMood}
          placeholderTextColor={theme.colors.textMuted}
        />
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
