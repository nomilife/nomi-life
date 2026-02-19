import { useEffect, useRef } from 'react';
import { Modal, View, Pressable, Text, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';

const DRAWER_WIDTH = 280;

const MENU_ITEMS = [
  { key: 'inbox', icon: 'mail-unread-outline' as const, route: '/(tabs)/inbox' as const, labelKey: 'inbox', withDate: false },
  { key: 'events', icon: 'calendar-outline' as const, route: '/(tabs)/events' as const, labelKey: 'events', withDate: true },
  { key: 'goals', icon: 'flag-outline' as const, route: '/(tabs)/goals' as const, labelKey: 'goals', withDate: false },
  { key: 'insights', icon: 'analytics-outline' as const, route: '/(tabs)/insights' as const, labelKey: 'insights', withDate: false },
  { key: 'network', icon: 'people-outline' as const, route: '/(tabs)/network' as const, labelKey: 'network', withDate: false },
  { key: 'vault', icon: 'wallet-outline' as const, route: '/(tabs)/vault' as const, labelKey: 'vault', withDate: false },
] as const;

interface HomeMenuModalProps {
  visible: boolean;
  onClose: () => void;
  /** Current date (YYYY-MM-DD) – used for Events to show this month (Apple Calendar style) */
  currentDate?: string;
}

export function HomeMenuModal({ visible, onClose, currentDate }: HomeMenuModalProps) {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation('tabs');
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  const handleItem = (item: (typeof MENU_ITEMS)[number]) => {
    onClose();
    if (item.withDate && currentDate) {
      const d = new Date(currentDate);
      const year = d.getFullYear();
      const month = d.getMonth();
      router.push(`${item.route}?year=${year}&month=${month}` as never);
    } else {
      router.push(item.route as never);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: DRAWER_WIDTH,
            backgroundColor: theme.colors.surface,
            paddingTop: 60,
            paddingHorizontal: theme.spacing.md,
            transform: [{ translateX: slideAnim }],
            ...theme.elevations[3],
          }}
        >
        {MENU_ITEMS.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => handleItem(item)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: theme.spacing.lg,
              borderRadius: theme.radius.lg,
              marginBottom: theme.spacing.xs,
            }}
          >
            <Ionicons name={item.icon} size={24} color={theme.colors.primary} style={{ marginRight: theme.spacing.md }} />
            <Text style={{ ...theme.typography.body, color: theme.colors.textPrimary, fontWeight: '500' }}>
              {t(item.labelKey)}
            </Text>
          </Pressable>
        ))}
        </Animated.View>
      </View>
    </Modal>
  );
}
