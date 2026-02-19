import { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { AppText, AppInput, AppButton, SectionHeader } from '@/components/ui';

/** Create new goal — MVP: local form, API integration later */
export default function GoalCreateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [title, setTitle] = useState('');

  const handleCreate = () => {
    const t = title.trim();
    if (!t) {
      Alert.alert('Required', 'Please enter a goal title.');
      return;
    }
    // TODO: API POST /goals when backend ready
    Alert.alert('Coming soon', 'Goals API integration will be added. Your goal: ' + t);
    router.back();
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
      <AppButton variant="primary" onPress={handleCreate} style={{ marginTop: theme.spacing.lg }}>
        Create goal
      </AppButton>
      <AppButton variant="ghost" onPress={() => router.back()} style={{ marginTop: theme.spacing.md }}>
        Cancel
      </AppButton>
    </ScrollView>
  );
}
