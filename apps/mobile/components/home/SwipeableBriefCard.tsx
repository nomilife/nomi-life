import { useRef } from 'react';
import { View, Animated, PanResponder, Pressable } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { DailyBriefCard } from './DailyBriefCard';

interface SwipeableBriefCardProps {
  brief?: string | null;
  onPlanDay?: () => void;
  onReschedule?: () => void;
  onSummarize?: () => void;
  onAddTask?: () => void;
  onHide: () => void;
}

const SWIPE_THRESHOLD = 80;

export function SwipeableBriefCard(props: SwipeableBriefCardProps) {
  const theme = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) {
          translateX.setValue(Math.max(g.dx, -SWIPE_THRESHOLD));
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -SWIPE_THRESHOLD / 2 || g.vx < -0.3) {
          props.onHide();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={{ width: '100%', position: 'relative' }}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          backgroundColor: theme.colors.border,
          borderRadius: theme.radius.xl,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: theme.spacing.lg,
        }}
      >
        <Ionicons name="eye-off-outline" size={20} color="#fff" style={{ marginRight: theme.spacing.xs }} />
        <AppText variant="small" style={{ color: '#fff', fontWeight: '600' }}>Gizle</AppText>
      </View>
      <Animated.View
        style={{ transform: [{ translateX }], width: '100%' }}
        {...panResponder.panHandlers}
      >
        <DailyBriefCard {...props} onHide={props.onHide} />
      </Animated.View>
    </View>
  );
}
