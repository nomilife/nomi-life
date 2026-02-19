import { useState } from 'react';
import { View, Pressable, Platform, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme';
import { nomiAppColors, darkColors } from '@/theme/tokens';
import { AddActionModal } from './AddActionModal';

// Flow, Nexus, [gap], Vault, Core — orijinal Stitch tasarım
const VISIBLE_TABS = ['flow', 'insights', 'inbox', 'system'] as const;

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  flow: 'pulse-outline',
  copilot: 'sparkles',
  inbox: 'wallet-outline',
  routine: 'checkbox',
  insights: 'git-network-outline',
  system: 'settings-outline',
};

const TAB_LABELS: Record<string, string> = {
  flow: 'Flow',
  copilot: 'Copilot',
  inbox: 'Vault',
  routine: 'Tasks',
  insights: 'Nexus',
  system: 'Core',
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const screenMode = useThemeStore((s) => s.screenMode);
  const isWarm = screenMode === 'warm';
  const isDark = screenMode === 'dark';
  const [modalVisible, setModalVisible] = useState(false);

  const visibleRoutes = state.routes.filter((r) => VISIBLE_TABS.includes(r.name as (typeof VISIBLE_TABS)[number]));
  const leftTabs = visibleRoutes.slice(0, 2);
  const rightTabs = visibleRoutes.slice(2);

  const activeColor = isDark ? darkColors.tabBarActive : isWarm ? nomiAppColors.tabBarActive : '#3b82f6';
  const inactiveColor = isDark ? darkColors.tabBarInactive : isWarm ? nomiAppColors.tabBarInactive : '#9ca3af';
  const bgColor = isDark ? darkColors.tabBarBg : isWarm ? nomiAppColors.tabBarBg : '#1a1f26';

  const renderTab = (route: (typeof state.routes)[0], index: number) => {
    const routeIndex = state.routes.findIndex((r) => r.key === route.key);
    const isFocused = state.index === routeIndex;
    const iconName = TAB_ICONS[route.name] ?? 'ellipse';
    const label = TAB_LABELS[route.name] ?? route.name;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 8,
        }}
      >
        <View
          style={
            isFocused && (isWarm || isDark)
              ? {
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 16,
                  backgroundColor: isDark ? darkColors.surface2 : nomiAppColors.surface2,
                  alignItems: 'center',
                }
              : { alignItems: 'center' as const }
          }
        >
          <Ionicons name={iconName} size={22} color={isFocused ? activeColor : inactiveColor} />
          {(isWarm || isDark) && (
            <Text
              style={{
                fontSize: 10,
                fontWeight: '600',
                color: isFocused ? activeColor : inactiveColor,
                marginTop: 2,
                textTransform: 'uppercase',
              }}
            >
              {label}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <>
      <AddActionModal visible={modalVisible} onClose={() => setModalVisible(false)} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: 4,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          backgroundColor: bgColor,
          borderTopLeftRadius: isWarm || isDark ? 24 : 0,
          borderTopRightRadius: isWarm || isDark ? 24 : 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isWarm ? 0.06 : 0.12,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {leftTabs.map((route, i) => renderTab(route, i))}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4 }}>
          <Pressable
            onPress={() => setModalVisible(true)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: activeColor,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: -20,
              shadowColor: nomiAppColors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
        {rightTabs.map((route, i) => renderTab(route, i + 2))}
      </View>
    </>
  );
}
