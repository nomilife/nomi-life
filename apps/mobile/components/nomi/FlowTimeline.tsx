import { View } from 'react-native';
import { useTheme } from '@/theme';
import { nomiColors } from '@/theme/tokens';
import { FlowTimelineItem } from '@/types/nomi';
import { FlowTimelineItemCard } from './FlowTimelineItemCard';

interface FlowTimelineProps {
  items: FlowTimelineItem[];
  onItemPress?: (item: FlowTimelineItem) => void;
}

export function FlowTimeline({ items, onItemPress }: FlowTimelineProps) {
  const theme = useTheme();
  const primary = (theme.colors as { primary?: string }).primary ?? nomiColors.primary;

  return (
    <View style={{ position: 'relative', paddingLeft: 8 }}>
      {items.length > 1 && (
        <View
          style={{
            position: 'absolute',
            left: 19,
            top: 18,
            bottom: 18,
            width: 2,
            backgroundColor: '#E8D5C4',
          }}
        />
      )}
      {items.map((item) => (
        <View key={item.id} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.lg }}>
          <View style={{ width: 40, alignItems: 'center', zIndex: 1 }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: primary,
                borderWidth: 2,
                borderColor: '#fff',
                ...theme.elevations[1],
              }}
            />
          </View>
          <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
            <FlowTimelineItemCard item={item} onPress={onItemPress ? () => onItemPress(item) : undefined} />
          </View>
        </View>
      ))}
    </View>
  );
}
