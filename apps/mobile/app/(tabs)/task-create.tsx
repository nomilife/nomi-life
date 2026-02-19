import { useState } from 'react';
import { View, TextInput, Pressable, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { nomiAppColors } from '@/theme/tokens';
import { AppText, AppButton } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { api } from '@/lib/api';

const TASK_TYPES = [
  'Deep Work',
  'Quick Task',
  'Call / Message',
  'Admin',
  'Learning',
  'Errand',
  'Health',
  'Financial',
] as const;

const LIFE_AREAS = ['Work', 'Health', 'Social', 'Personal'] as const;
const PRIORITIES = ['Low', 'Medium', 'High'] as const;
const DURATIONS = ['15m', '30m', '45m', '1h', 'Custom'] as const;
const ENERGY_LEVELS = ['Low Energy', 'Deep Focus'] as const;

export default function TaskCreateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<(typeof TASK_TYPES)[number] | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [lifeArea, setLifeArea] = useState<(typeof LIFE_AREAS)[number] | null>(null);
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number] | null>(null);
  const [duration, setDuration] = useState<(typeof DURATIONS)[number] | null>(null);
  const [energyLevel, setEnergyLevel] = useState<(typeof ENERGY_LEVELS)[number] | null>(null);
  const [primaryAction, setPrimaryAction] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [notes, setNotes] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const colors = { ...theme.colors, ...nomiAppColors };

  const addSubtask = () => {
    const v = subtaskInput.trim();
    if (v && !subtasks.includes(v)) {
      setSubtasks((prev) => [...prev, v]);
      setSubtaskInput('');
    }
  };

  const removeSubtask = (i: number) => {
    setSubtasks((prev) => prev.filter((_, idx) => idx !== i));
  };

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      router.back();
    },
    onError: (e) => {
      Alert.alert('Hata', (e as Error).message);
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Eksik', 'Görev başlığı gerekli.');
      return;
    }
    const priorityMap: Record<string, string> = { Low: 'low', Medium: 'normal', High: 'high' };
    createMutation.mutate({
      title: title.trim(),
      dueDate: dueDate.trim() || null,
      dueTime: dueTime.trim() || null,
      priority: (priority && priorityMap[priority]) || 'normal',
      lifeArea: lifeArea ?? null,
    });
  };

  const cardStyle = {
    backgroundColor: colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  };

  const inputStyle = {
    ...theme.typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    color: colors.text,
    backgroundColor: colors.surface2,
  };

  const chip = (label: string, selected: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={{
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.full,
        backgroundColor: selected ? colors.primary : colors.surface2,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
      }}
    >
      <AppText variant="small" style={{ color: selected ? '#fff' : colors.textPrimary, fontWeight: '500' }}>
        {label}
      </AppText>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader showBack title="New Task" rightElement={
        <Pressable onPress={handleSave} disabled={createMutation.isPending}>
          <AppText variant="body" style={{ color: colors.primary, fontWeight: '600' }}>Save</AppText>
        </Pressable>
      } />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
      >
        <View style={cardStyle}>
          <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.xs }}>Basic Info</AppText>
          <TextInput
            style={[inputStyle, { marginBottom: theme.spacing.md }]}
            placeholder="What needs to be done?"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={colors.textMuted}
          />
          <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>Task Type</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {TASK_TYPES.map((t) => chip(t, taskType === t, () => setTaskType(taskType === t ? null : t)))}
          </View>
        </View>

        <View style={cardStyle}>
          <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>Schedule</AppText>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <TextInput
              style={[inputStyle, { flex: 1 }]}
              placeholder="Due Date (YYYY-MM-DD)"
              value={dueDate}
              onChangeText={setDueDate}
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={[inputStyle, { flex: 1 }]}
              placeholder="Due Time"
              value={dueTime}
              onChangeText={setDueTime}
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={cardStyle}>
          <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>Context</AppText>
          <AppText variant="caption" color="muted" style={{ marginBottom: theme.spacing.xs }}>Life Area</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
            {LIFE_AREAS.map((a) => chip(a, lifeArea === a, () => setLifeArea(lifeArea === a ? null : a)))}
          </View>
          <AppText variant="caption" color="muted" style={{ marginBottom: theme.spacing.xs }}>Priority</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
            {PRIORITIES.map((p) => chip(p, priority === p, () => setPriority(priority === p ? null : p)))}
          </View>
          <AppText variant="caption" color="muted" style={{ marginBottom: theme.spacing.xs }}>Estimated Duration</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
            {DURATIONS.map((d) => chip(d, duration === d, () => setDuration(duration === d ? null : d)))}
          </View>
          <AppText variant="caption" color="muted" style={{ marginBottom: theme.spacing.xs }}>Energy Level</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {ENERGY_LEVELS.map((e) => chip(e, energyLevel === e, () => setEnergyLevel(energyLevel === e ? null : e)))}
          </View>
        </View>

        <View style={cardStyle}>
          <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>Primary Action</AppText>
          <Pressable
            onPress={() => {}}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: theme.spacing.md,
              backgroundColor: primaryAction ? colors.surface2 : 'transparent',
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              borderStyle: 'dashed',
            }}
          >
            {primaryAction ? (
              <>
                <Ionicons name="link" size={20} color={colors.primary} style={{ marginRight: theme.spacing.sm }} />
                <AppText variant="body" style={{ flex: 1 }}>{primaryAction}</AppText>
                <AppText variant="small" style={{ color: colors.primary }}>Change</AppText>
              </>
            ) : (
              <>
                <Ionicons name="add" size={20} color={colors.textMuted} style={{ marginRight: theme.spacing.sm }} />
                <AppText variant="body" color="muted">Add Action</AppText>
              </>
            )}
          </Pressable>
        </View>

        <View style={cardStyle}>
          <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>Subtasks</AppText>
          {subtasks.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.textMuted} style={{ marginRight: theme.spacing.sm }} />
              <AppText variant="body" style={{ flex: 1 }}>{s}</AppText>
              <Pressable onPress={() => removeSubtask(i)} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={colors.muted} />
              </Pressable>
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <TextInput
              style={[inputStyle, { flex: 1 }]}
              placeholder="Add subtask"
              value={subtaskInput}
              onChangeText={setSubtaskInput}
              onSubmitEditing={addSubtask}
              placeholderTextColor={colors.textMuted}
            />
            <Pressable onPress={addSubtask} style={{ backgroundColor: colors.primary, padding: theme.spacing.md, borderRadius: theme.radius.md, justifyContent: 'center' }}>
              <Ionicons name="add" size={24} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View style={cardStyle}>
          <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>Notes</AppText>
          <TextInput
            style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]}
            placeholder="Notes..."
            value={notes}
            onChangeText={setNotes}
            placeholderTextColor={colors.textMuted}
            multiline
          />
        </View>

        <Pressable
          onPress={() => setAdvancedOpen((o) => !o)}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md }}
        >
          <Ionicons name={advancedOpen ? 'chevron-down' : 'chevron-forward'} size={18} color={colors.textMuted} />
          <AppText variant="small" color="muted" style={{ marginLeft: theme.spacing.sm }}>Advanced (Recurrence, Reminder, Attachments, Tags, Linked Goal/Event)</AppText>
        </Pressable>
        {advancedOpen && (
          <View style={cardStyle}>
            <AppText variant="caption" color="muted">Recurrence, Reminder, Attachments, Tags, Linked Goal, Linked Event — UI placeholder</AppText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
