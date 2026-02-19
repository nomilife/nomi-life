import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useTheme } from '@/theme';
import { AppText, AppInput, AppButton, SectionHeader } from '@/components/ui';

export default function HabitCreateScreen() {
  const { t } = useTranslation('routine');
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ title?: string }>();
  const [title, setTitle] = useState(params.title ?? '');

  useEffect(() => {
    if (params.title) setTitle(params.title);
  }, [params.title]);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api('/habits', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routine'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      router.back();
    },
  });

  const handleCreate = () => {
    if (!title.trim()) return;
    createMutation.mutate({
      title: title.trim(),
      schedule: {},
    });
  };

  return (
    <View style={{ flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.background }}>
      <SectionHeader title={t('addHabit', 'Add habit')} />
      <AppInput
        label={t('habitName', 'Habit name')}
        placeholder="e.g. Morning walk"
        value={title}
        onChangeText={setTitle}
      />
      <AppButton
        variant="primary"
        onPress={handleCreate}
        loading={createMutation.isPending}
        disabled={!title.trim()}
      >
        {t('create', 'Create')}
      </AppButton>
      <AppButton variant="ghost" onPress={() => router.back()} style={{ marginTop: theme.spacing.md }}>
        {t('cancel', 'Cancel')}
      </AppButton>
    </View>
  );
}
