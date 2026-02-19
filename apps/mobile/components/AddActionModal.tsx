import { Modal, View, Pressable, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

const SECTIONS = [
  {
    title: 'Hızlı giriş',
    items: [
      { key: 'voice', icon: 'mic' as const, label: 'Sesli', path: '/(modal)/voice' as const, color: '#6366F1' },
      { key: 'inbox', icon: 'mail-outline' as const, label: 'Inbox', path: '/(tabs)/inbox' as const, color: '#E9D5FF' },
    ],
  },
  {
    title: 'Takvim',
    items: [
      { key: 'event', icon: 'calendar-outline' as const, label: 'Etkinlik', path: '/(tabs)/event-create' as const, color: '#93C5FD' },
      { key: 'appointment', icon: 'people-outline' as const, label: 'Randevu', path: '/(tabs)/appointment-create' as const, color: '#A78BFA' },
      { key: 'reminder', icon: 'notifications-outline' as const, label: 'Hatırlatma', path: '/(tabs)/reminder-create' as const, color: '#FDE68A' },
    ],
  },
  {
    title: 'Görevler',
    items: [
      { key: 'task', icon: 'checkbox-outline' as const, label: 'Görev', path: '/(tabs)/task-create' as const, color: '#86EFAC' },
      { key: 'work', icon: 'briefcase-outline' as const, label: 'Çalışma', path: '/(tabs)/work-create' as const, color: '#67E8F9' },
      { key: 'habit', icon: 'repeat-outline' as const, label: 'Alışkanlık', path: '/(tabs)/habit-create' as const, color: '#FED7AA' },
    ],
  },
  {
    title: 'Finans',
    items: [
      { key: 'bill', icon: 'receipt-outline' as const, label: 'Fatura', path: '/(tabs)/bill-create' as const, color: '#DDD6FE' },
      { key: 'subscription', icon: 'repeat' as const, label: 'Abonelik', path: '/(tabs)/subscription-create' as const, color: '#F9A8D4' },
    ],
  },
  {
    title: 'Hayat',
    items: [
      { key: 'goal', icon: 'flag-outline' as const, label: 'Hedef', path: '/(tabs)/goal-create' as const, color: '#FCA5A5' },
      { key: 'travel', icon: 'airplane-outline' as const, label: 'Seyahat', path: '/(tabs)/travel-create' as const, color: '#C4B5FD' },
      { key: 'journal', icon: 'book-outline' as const, label: 'Günlük', path: '/(tabs)/journal-create' as const, color: '#FCD34D' },
    ],
  },
  {
    title: '',
    items: [{ key: 'copilot', icon: 'sparkles' as const, label: 'Copilot', path: '/(tabs)/copilot' as const, color: '#C4B5FD' }],
  },
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
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            maxHeight: '78%',
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius.xxl,
            borderTopRightRadius: theme.radius.xxl,
            paddingTop: theme.spacing.lg,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.xl,
            ...theme.elevations[3],
          }}
        >
          <Text style={{ ...theme.typography.title, color: theme.colors.textPrimary, textAlign: 'center' }}>
            Aklında ne var?
          </Text>
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, textAlign: 'center', marginTop: theme.spacing.xs }}>
            Yaz veya söyle — sesli komut veya hızlı ekle
          </Text>

          <ScrollView
            style={{ maxHeight: 420, marginTop: theme.spacing.lg }}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled
          >
            {SECTIONS.map((section) => (
              <View key={section.title || 'copilot'} style={{ marginBottom: theme.spacing.lg }}>
                {section.title ? (
                  <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, marginBottom: theme.spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {section.title}
                  </Text>
                ) : null}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
                  {section.items.map((action) => (
                    <Pressable
                      key={action.key}
                      onPress={() => handleAction(action.path)}
                      style={{
                        width: section.items.length >= 3 ? '31%' : section.items.length === 2 ? '48%' : '100%',
                        aspectRatio: 1,
                        backgroundColor: action.color,
                        borderRadius: theme.radius.lg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: theme.spacing.sm,
                      }}
                    >
                      <Ionicons name={action.icon} size={28} color="#374151" />
                      <Text
                        numberOfLines={1}
                        style={{ ...theme.typography.caption, color: '#374151', marginTop: theme.spacing.xs, fontWeight: '600', fontSize: 11 }}
                      >
                        {action.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginTop: theme.spacing.md,
            }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
