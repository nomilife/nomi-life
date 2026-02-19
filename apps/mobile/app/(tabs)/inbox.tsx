import { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { HomeMenuModal } from '@/components/HomeMenuModal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SwipeableTabContent } from '@/components/SwipeableTabContent';
import { AppText, EmptyState } from '@/components/ui';
import { InboxCard } from '@/components/nomi';
import { useInboxStore } from '@/store/inbox';
import { nomiAppColors } from '@/theme/tokens';

const TABS = [
  { key: 'all' as const, label: 'All Items' },
  { key: 'voice' as const, label: 'Voice Notes' },
  { key: 'notes' as const, label: 'Quick Notes' },
];

export default function InboxScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const primary = nomiAppColors.primary;

  const { items, activeTab, setActiveTab, convertToTask, convertToEvent, convertToHabit, convertToBill, keepAsNote } = useInboxStore();

  const filteredItems = activeTab === 'all'
    ? items
    : activeTab === 'voice'
      ? items.filter((i) => i.type === 'voice')
      : items.filter((i) => i.type === 'note');

  const getActions = (item: (typeof items)[0]) => {
    const base = [];
    if (item.type === 'voice') {
      base.push({ label: 'To Task', onPress: () => convertToTask(item.id) });
      base.push({ label: 'To Event', onPress: () => convertToEvent(item.id) });
      base.push({ label: 'To Habit', onPress: () => convertToHabit(item.id) });
    } else if (item.type === 'note') {
      base.push({ label: 'To Habit', onPress: () => convertToHabit(item.id) });
      base.push({ label: 'Keep as Note', onPress: () => keepAsNote(item.id) });
    } else if (item.type === 'imported_email') {
      base.push({ label: 'To Task', onPress: () => convertToTask(item.id) });
      base.push({ label: 'To Event', onPress: () => convertToEvent(item.id) });
      base.push({ label: 'To Bill', onPress: () => convertToBill(item.id) });
    }
    return base;
  };

  return (
    <SwipeableTabContent currentTab="inbox">
      <View style={{ flex: 1, backgroundColor: nomiAppColors.background }}>
        <HomeMenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />
        <ScreenHeader onMenuPress={() => setMenuVisible(true)} title="Inbox" />
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 4 }}>
          <Pressable
            onPress={() => router.push('/(modal)/voice' as never)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: primary + '25',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="sparkles" size={20} color={primary} />
          </Pressable>
        </View>
        <AppText variant="small" style={{ color: '#718096', marginBottom: theme.spacing.lg }}>
          Capture your thoughts, NOMI handles the rest.
        </AppText>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  paddingVertical: theme.spacing.sm,
                  paddingHorizontal: theme.spacing.md,
                  borderRadius: theme.radius.full,
                  backgroundColor: isActive ? primary : 'transparent',
                  borderWidth: 1,
                  borderColor: isActive ? primary : 'rgba(224, 124, 60, 0.4)',
                }}
              >
                <AppText variant="small" style={{ color: isActive ? '#fff' : primary, fontWeight: '600' }}>
                  {tab.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length === 0 ? (
          <EmptyState
            title="Inbox zero"
            message="Capture anything here. Convert to task, event, or habit."
            actionLabel="Add with voice"
            onAction={() => router.push('/(modal)/voice' as never)}
          />
        ) : (
          filteredItems.map((item) => (
            <View key={item.id} style={{ marginBottom: theme.spacing.lg }}>
              <InboxCard item={item} actions={getActions(item)} />
            </View>
          ))
        )}
      </ScrollView>
      </View>
    </SwipeableTabContent>
  );
}
