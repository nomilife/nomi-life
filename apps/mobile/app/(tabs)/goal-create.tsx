import { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { AppText, AppInput, AppButton, SectionHeader } from '@/components/ui';
import { api } from '@/lib/api';

export default function GoalCreateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [lifeArea, setLifeArea] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api('/goals', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      router.back();
    },
    onError: (e) => {
      Alert.alert('Hata', (e as Error).message);
    },
  });

  const handleCreate = () => {
    const t = title.trim();
    if (!t) {
      Alert.alert('Required', 'Please enter a goal title.');
      return;
    }
    createMutation.mutate({
      title: t,
      targetDate: targetDate.trim() || null,
      lifeArea: lifeArea.trim() || null,
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
    >
      <SectionHeader title="New goal" />
      <AppText variant="body" color="muted" style={{ marginBottom: theme.spacing.lg }}>
        Set a goal and break it into milestones.
      </AppText>
      <AppInput
        label="Goal title"
        placeholder="e.g. Run a marathon"
        value={title}
        onChangeText={setTitle}
      />
      <AppInput
        label="Target date (YYYY-MM-DD, optional)"
        placeholder="e.g. 2025-12-31"
        value={targetDate}
        onChangeText={setTargetDate}
      />
      <AppInput
        label="Life area (optional)"
        placeholder="e.g. Health, Work"
        value={lifeArea}
        onChangeText={setLifeArea}
      />
      <AppButton
        variant="primary"
        onPress={handleCreate}
        disabled={createMutation.isPending}
        style={{ marginTop: theme.spacing.lg }}
      >
        Create goal
      </AppButton>
      <AppButton variant="ghost" onPress={() => router.back()} style={{ marginTop: theme.spacing.md }}>
        Cancel
      </AppButton>
    </ScrollView>
  );
}
