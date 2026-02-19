import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { AppText, SectionHeader, EmptyState } from '@/components/ui';

/** Goals → Milestones → Tasks */
export default function GoalsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const goals: Array<{ id: string; title: string; progress: number }> = []; // TODO: API

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
    >
      <SectionHeader
        title="Goals"
        action={
          <Pressable
            onPress={() => router.push('/(tabs)/goal-create')}
            style={{
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.primary,
            }}
          >
            <AppText variant="body" style={{ color: '#fff', fontWeight: '600' }}>New goal</AppText>
          </Pressable>
        }
      />
      <AppText variant="body" color="muted" style={{ marginBottom: theme.spacing.lg }}>
        Set a goal. Break it into milestones. Track progress.
      </AppText>

      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          message="Goals help you break big visions into milestones and tasks."
          actionLabel="Create your first goal"
          onAction={() => router.push('/(tabs)/goal-create')}
        />
      ) : (
        goals.map((g) => (
          <Pressable
            key={g.id}
            style={{
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.surface2,
              borderRadius: theme.radius.lg,
              marginBottom: theme.spacing.sm,
            }}
          >
            <AppText variant="h3" style={{ color: theme.colors.textPrimary, marginBottom: theme.spacing.xs }}>{g.title}</AppText>
            <View
              style={{
                height: 6,
                backgroundColor: theme.colors.border,
                borderRadius: 3,
                overflow: 'hidden',
                marginTop: theme.spacing.sm,
              }}
            >
              <View
                style={{
                  width: `${g.progress}%`,
                  height: '100%',
                  backgroundColor: theme.colors.primary,
                  borderRadius: 3,
                }}
              />
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
