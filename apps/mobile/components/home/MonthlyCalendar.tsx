import { View, Pressable } from 'react-native';
import dayjs from 'dayjs';
import { useTheme } from '@/theme';
import { AppText } from '@/components/ui';

const CALENDAR_BLUE = '#60a5fa';
const CALENDAR_BLUE_LIGHT = '#dbeafe';

interface MonthlyCalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function MonthlyCalendar({ selectedDate, onSelectDate }: MonthlyCalendarProps) {
  const theme = useTheme();
  const monthStart = dayjs(selectedDate).startOf('month');
  const monthEnd = dayjs(selectedDate).endOf('month');
  const startPadding = monthStart.day();
  const daysInMonth = monthEnd.date();
  const today = dayjs().format('YYYY-MM-DD');

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const weeks: (string | null)[][] = [];
  let week: (string | null)[] = [];

  for (let i = 0; i < startPadding; i++) {
    week.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(dayjs(monthStart).date(d).format('YYYY-MM-DD'));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return (
    <View style={{ backgroundColor: CALENDAR_BLUE_LIGHT, borderRadius: theme.radius.xl, padding: theme.spacing.md, ...theme.elevations[2] }}>
      <AppText
        variant="h3"
        style={{
          color: CALENDAR_BLUE,
          textAlign: 'center',
          marginBottom: theme.spacing.md,
          textTransform: 'capitalize',
        }}
      >
        {monthStart.format('MMMM YYYY')}
      </AppText>
      <View style={{ flexDirection: 'row', marginBottom: theme.spacing.xs }}>
        {weekDays.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <AppText variant="small" style={{ color: CALENDAR_BLUE, fontWeight: '600', fontSize: 10 }}>
              {d}
            </AppText>
          </View>
        ))}
      </View>
      {weeks.map((w, wi) => (
        <View key={wi} style={{ flexDirection: 'row', marginBottom: theme.spacing.xs }}>
          {w.map((dateStr, di) => (
            <Pressable
              key={di}
              onPress={() => dateStr && onSelectDate(dateStr)}
              style={{
                flex: 1,
                aspectRatio: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                marginHorizontal: 2,
                backgroundColor: !dateStr
                  ? 'transparent'
                  : dateStr === selectedDate
                    ? CALENDAR_BLUE
                    : dateStr === today
                      ? 'rgba(96, 165, 250, 0.3)'
                      : 'transparent',
              }}
            >
              {dateStr ? (
                <AppText
                  variant="small"
                  style={{
                    color: dateStr === selectedDate ? '#fff' : theme.colors.textPrimary,
                    fontWeight: dateStr === today ? '700' : '400',
                  }}
                >
                  {dayjs(dateStr).format('D')}
                </AppText>
              ) : null}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}
