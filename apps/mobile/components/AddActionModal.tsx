import { Modal, View, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

const ACTIONS = [
  { key: 'task', icon: 'checkbox-outline' as const, label: 'Task', path: '/(tabs)/task-create' as const, color: '#86EFAC' },
  { key: 'event', icon: 'calendar-outline' as const, label: 'Event', path: '/(tabs)/event-create' as const, color: '#93C5FD' },
  { key: 'events', icon: 'calendar' as const, label: 'Takvim', path: '/(tabs)/events' as const, color: '#A78BFA' },
  { key: 'copilot', icon: 'sparkles' as const, label: 'Copilot', path: '/(tabs)/copilot' as const, color: '#A78BFA' },
  { key: 'voice', icon: 'mic-outline' as const, label: 'Voice', path: '/(modal)/voice' as const, color: '#FDE68A' },
  { key: 'bill', icon: 'receipt-outline' as const, label: 'Bill', path: '/(tabs)/bill-create' as const, color: '#DDD6FE' },
  { key: 'habit', icon: 'repeat-outline' as const, label: 'Habit', path: '/(tabs)/habit-create' as const, color: '#FED7AA' },
  { key: 'inbox', icon: 'mail-outline' as const, label: 'Inbox', path: '/(tabs)/inbox' as const, color: '#E9D5FF' },
] as const;

interface AddActionModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddActionModal({ visible, onClose }: AddActionModalProps) {
  const router = useRouter();
  const theme = useTheme();

  const handleAction = (path: string) => {
    onClose();
    router.push(path as never);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            position: 'absolute',
            left: theme.spacing.xl,
            right: theme.spacing.xl,
            bottom: 120,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.xxl,
            padding: theme.spacing.xl,
            ...theme.elevations[3],
          }}
        >
          <Text style={{ ...theme.typography.title, color: theme.colors.textPrimary, textAlign: 'center' }}>
            Aklında ne var?
          </Text>
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, textAlign: 'center', marginTop: theme.spacing.xs }}>
            Yaz veya söyle — not ve sesli komut tek yerde
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, marginTop: theme.spacing.xl, justifyContent: 'space-between' }}>
            {ACTIONS.map((action) => (
              <Pressable
                key={action.key}
                onPress={() => handleAction(action.path)}
                style={{
                  width: '47%',
                  aspectRatio: 1.3,
                  backgroundColor: action.color,
                  borderRadius: theme.radius.xl,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={action.icon} size={36} color="#374151" />
                <Text style={{ ...theme.typography.caption, color: '#374151', marginTop: theme.spacing.sm, fontWeight: '600' }}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={onClose}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginTop: theme.spacing.xl,
            }}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
