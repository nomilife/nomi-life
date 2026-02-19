import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { AppText } from '@/components/ui';
import { nomiColors } from '@/theme/tokens';
import { FlowTimelineItem } from '@/types/nomi';

function getKindIcon(item: FlowTimelineItem): keyof typeof Ionicons.glyphMap {
  if (item.kind === 'bill') return 'warning';
  if (item.kind === 'habit') return 'book';
  if (item.kind === 'task') return 'checkbox';
  if (item.event?.iconType === 'gym') return 'barbell';
  if (item.event?.iconType === 'coffee') return 'cafe';
  if (item.event?.iconType === 'meeting') return 'people';
  return 'cafe';
}

const KIND_COLORS: Record<string, string> = {
  bill: '#E53E3E',
  event: '#718096',
  habit: '#38A169',
  task: '#E07C3C',
};

interface FlowTimelineItemCardProps {
  item: FlowTimelineItem;
  onPress?: () => void;
}

export function FlowTimelineItemCard({ item, onPress }: FlowTimelineItemCardProps) {
  const theme = useTheme();
  const primary = (theme.colors as { primary?: string }).primary ?? nomiColors.primary;

  const getContent = () => {
    if (item.bill) {
      return (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="body" style={{ color: '#2D3748', fontWeight: '600' }}>{item.bill.vendor}</AppText>
            {item.bill.status === 'overdue' && (
              <View style={{ backgroundColor: '#E53E3E', paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.radius.full }}>
                <AppText variant="small" style={{ color: '#fff', fontWeight: '700', fontSize: 10 }}>OVERDUE</AppText>
              </View>
            )}
          </View>
          <AppText variant="small" style={{ color: '#718096', marginTop: 2 }}>
            ${item.bill.amount} • {item.bill.dueDate}
          </AppText>
        </>
      );
    }
    if (item.event) {
      return (
        <>
          <AppText variant="body" style={{ color: '#2D3748', fontWeight: '600' }}>{item.event.title}</AppText>
          {item.timeRange && (
            <AppText variant="small" style={{ color: '#718096', marginTop: 2 }}>{item.timeRange}</AppText>
          )}
        </>
      );
    }
    if (item.habit) {
      return (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="body" style={{ color: '#2D3748', fontWeight: '600' }}>{item.habit.title}</AppText>
            {item.habit.completedToday && <Ionicons name="checkmark-circle" size={22} color="#38A169" />}
          </View>
        </>
      );
    }
    if (item.task) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText variant="body" style={{ color: '#2D3748', fontWeight: '600' }}>{item.task.title}</AppText>
          {item.task.completed && <Ionicons name="checkmark-circle" size={22} color="#38A169" />}
        </View>
      );
    }
    return null;
  };

  const iconName = getKindIcon(item);
  const iconColor = KIND_COLORS[item.kind] ?? primary;
  const isWorkout = item.event?.iconType === 'gym';

  const card = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.md,
        backgroundColor: isWorkout ? 'rgba(224, 124, 60, 0.08)' : '#fff',
        borderRadius: theme.radius.xl,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: isWorkout ? 'rgba(224, 124, 60, 0.2)' : '#E8D5C4',
        ...theme.elevations[1],
      }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: iconColor + '25', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={iconName} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>{getContent()}</View>
    </View>
  );

  if (onPress) return <Pressable onPress={onPress}>{card}</Pressable>;
  return card;
}
