import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { AppText } from '@/components/ui';

interface TimelineRailProps {
  time: string; // HH:mm
  isNow?: boolean;
  isSelected?: boolean;
  isLast?: boolean;
  /** Stitch: gradient timeline line */
  gradient?: boolean;
}

export function TimelineRail({ time, isNow, isSelected, isLast, gradient }: TimelineRailProps) {
  const theme = useTheme();
  const lineColor = theme.colors.border;
  const accentViolet = (theme.colors as { accent?: string }).accent ?? theme.colors.primary;
  const isHighlighted = isNow || isSelected;

  const dotSize = isHighlighted ? 16 : 8;
  const lineTop = 14 + dotSize + theme.spacing.xs;
  const lineLeft = 21;

  const LineSegment = !isLast ? (
    gradient ? (
      <LinearGradient
        colors={['rgba(109, 40, 217, 0)', 'rgba(109, 40, 217, 0.3)', 'rgba(109, 40, 217, 0.3)', 'rgba(109, 40, 217, 0)']}
        locations={[0, 0.2, 0.8, 1]}
        style={{
          position: 'absolute',
          top: lineTop,
          left: lineLeft,
          width: 2,
          height: 150,
        }}
      />
    ) : (
      <View
        style={{
          position: 'absolute',
          top: lineTop,
          left: lineLeft,
          width: 2,
          height: 150,
          backgroundColor: lineColor,
        }}
      />
    )
  ) : null;

  return (
    <View style={{ width: 44, flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <AppText
        variant="small"
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: isHighlighted ? accentViolet : '#94a3b8',
          marginBottom: theme.spacing.xs,
        }}
      >
        {time}
      </AppText>
      <View
        style={{
          width: isHighlighted ? 16 : 8,
          height: isHighlighted ? 16 : 8,
          borderRadius: isHighlighted ? 8 : 4,
          backgroundColor: isHighlighted ? '#fff' : lineColor,
          borderWidth: isHighlighted ? 2 : 0,
          borderColor: isHighlighted ? accentViolet : 'transparent',
          marginBottom: theme.spacing.xs,
        }}
      />
      {LineSegment}
    </View>
  );
}
