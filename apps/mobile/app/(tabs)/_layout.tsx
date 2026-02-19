import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme';
import { CustomTabBar } from '@/components/CustomTabBar';
import { warmColors } from '@/theme/tokens';

export default function TabsLayout() {
  const { t } = useTranslation('tabs');
  const screenMode = useThemeStore((s) => s.screenMode);
  const isWarm = screenMode === 'warm';

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: isWarm ? warmColors.tabBarActive : '#3b82f6',
        tabBarInactiveTintColor: isWarm ? warmColors.tabBarInactive : '#9ca3af',
        tabBarStyle: {
          backgroundColor: isWarm ? warmColors.tabBarBg : '#1a1f26',
          borderTopWidth: 0,
        },
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="flow"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, size }) => <Ionicons name="mail-unread" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="routine"
        options={{
          title: t('tasks'),
          tabBarIcon: ({ color, size }) => <Ionicons name="checkbox" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: t('insights'),
          tabBarIcon: ({ color, size }) => <Ionicons name="analytics" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="copilot"
        options={{
          title: 'Copilot',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="system"
        options={{
          title: t('settings'),
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="events" options={{ href: null }} />
      <Tabs.Screen name="goals" options={{ href: null }} />
      <Tabs.Screen name="goal-create" options={{ href: null, title: 'New goal' }} />
      <Tabs.Screen name="network" options={{ href: null }} />
      <Tabs.Screen name="vault" options={{ href: null }} />
      <Tabs.Screen name="event-create" options={{ href: null, title: t('newEvent') }} />
      <Tabs.Screen name="task-create" options={{ href: null, title: 'New Task' }} />
      <Tabs.Screen name="bill-create" options={{ href: null, title: t('newBill') }} />
      <Tabs.Screen name="event/[id]" options={{ href: null }} />
      <Tabs.Screen name="event/[id]/chat" options={{ href: null }} />
      <Tabs.Screen name="bill/[id]" options={{ href: null }} />
      <Tabs.Screen name="habit-create" options={{ href: null, title: t('newHabit') }} />
      <Tabs.Screen name="habit/[id]" options={{ href: null }} />
      <Tabs.Screen name="work-create" options={{ href: null, title: 'New Work Block' }} />
      <Tabs.Screen name="appointment-create" options={{ href: null, title: 'New Appointment' }} />
      <Tabs.Screen name="reminder-create" options={{ href: null, title: 'New Reminder' }} />
      <Tabs.Screen name="subscription-create" options={{ href: null, title: 'New Subscription' }} />
      <Tabs.Screen name="travel-create" options={{ href: null, title: 'New Travel' }} />
      <Tabs.Screen name="journal-create" options={{ href: null, title: 'New Journal' }} />
      <Tabs.Screen name="item/[id]" options={{ href: null, title: 'Detay' }} />
    </Tabs>
  );
}
