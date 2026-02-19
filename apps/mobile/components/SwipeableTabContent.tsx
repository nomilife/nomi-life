import { useRef } from 'react';
import { View, PanResponder } from 'react-native';
import { useRouter } from 'expo-router';

const TAB_ORDER = ['flow', 'insights', 'inbox', 'system'] as const;
const TAB_ROUTES = ['/(tabs)/flow', '/(tabs)/insights', '/(tabs)/inbox', '/(tabs)/system'] as const;

interface SwipeableTabContentProps {
  children: React.ReactNode;
  /** Mevcut sekme anahtarı (flow, insights, inbox, system) */
  currentTab: (typeof TAB_ORDER)[number];
}

/** Ana sekmeler arasında yatay kaydırma ile geçiş sağlar */
export function SwipeableTabContent({ children, currentTab }: SwipeableTabContentProps) {
  const router = useRouter();
  const startX = useRef(0);

  const idx = TAB_ORDER.indexOf(currentTab);
  const canSwipe = idx >= 0;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        const dx = Math.abs(g.dx);
        const dy = Math.abs(g.dy);
        return canSwipe && dx > 20 && dx > dy * 1.5;
      },
      onPanResponderGrant: (_, g) => {
        startX.current = g.moveX;
      },
      onPanResponderRelease: (_, g) => {
        const dx = g.moveX - startX.current;
        const threshold = 60;
        if (dx > threshold) {
          const prevIdx = idx <= 0 ? TAB_ORDER.length - 1 : idx - 1;
          router.push(TAB_ROUTES[prevIdx] as never);
        } else if (dx < -threshold) {
          const nextIdx = idx >= TAB_ORDER.length - 1 ? 0 : idx + 1;
          router.push(TAB_ROUTES[nextIdx] as never);
        }
      },
    })
  ).current;

  if (!canSwipe) return <>{children}</>;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}
