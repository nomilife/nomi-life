import { useState, useMemo } from 'react';
import { View, Pressable, Modal, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from '@/components/ui';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const RECURRENCE = [
  { key: 'once', label: 'Tek seferlik' },
  { key: 'daily', label: 'Günlük' },
  { key: 'weekly', label: 'Haftalık' },
  { key: 'monthly', label: 'Aylık' },
  { key: 'yearly', label: 'Yıllık' },
] as const;

function DropdownPicker<T>({
  items,
  value,
  onSelect,
  theme,
  format,
  label,
}: {
  items: T[];
  value: T;
  onSelect: (v: T) => void;
  theme: ReturnType<typeof useTheme>;
  format?: (v: T) => string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const str = format ? format(value) : String(value);

  return (
    <View style={{ flex: 1 }}>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.colors.surface2,
          borderRadius: theme.radius.lg,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <AppText variant="body" style={{ color: theme.colors.textPrimary }}>{str}</AppText>
        <Ionicons name="chevron-down" size={20} color={theme.colors.textMuted} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
              maxHeight: 280,
              paddingBottom: theme.spacing.xl,
            }}
            onStartShouldSetResponder={() => true}
          >
            {label && (
              <AppText variant="small" color="muted" style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, marginBottom: theme.spacing.sm }}>
                {label}
              </AppText>
            )}
            <FlatList
              data={items}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => {
                const s = format ? format(item) : String(item);
                const isSelected = s === str;
                return (
                  <Pressable
                    onPress={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                    style={{
                      paddingVertical: theme.spacing.md,
                      paddingHorizontal: theme.spacing.lg,
                      backgroundColor: isSelected ? theme.colors.primaryMuted : 'transparent',
                    }}
                  >
                    <AppText
                      variant="body"
                      style={{
                        color: isSelected ? theme.colors.primary : theme.colors.textPrimary,
                        fontWeight: isSelected ? '600' : '400',
                      }}
                    >
                      {s}
                    </AppText>
                  </Pressable>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export interface DateTimeRecurrenceValue {
  date: string;
  startTime: string;
  endTime: string;
  recurrence: (typeof RECURRENCE)[number]['key'];
}

interface DateTimeRecurrencePickerProps {
  value: DateTimeRecurrenceValue;
  onChange: (v: DateTimeRecurrenceValue) => void;
}

export function DateTimeRecurrencePicker({ value, onChange }: DateTimeRecurrencePickerProps) {
  const theme = useTheme();

  const dateObj = dayjs(value.date);
  const year = dateObj.year();
  const month = dateObj.month();
  const day = dateObj.date();

  const years = useMemo(
    () => Array.from({ length: 5 }, (_, i) => dayjs().year() + i),
    []
  );
  const daysInMonth = dayjs().year(year).month(month).daysInMonth();
  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [year, month, daysInMonth]
  );

  const updateDate = (y?: number, m?: number, d?: number) => {
    const ny = y ?? year;
    const nm = m ?? month;
    let nd = d ?? day;
    const maxDay = dayjs().year(ny).month(nm).daysInMonth();
    if (nd > maxDay) nd = maxDay;
    const next = dayjs(value.date).year(ny).month(nm).date(nd);
    onChange({ ...value, date: next.format('YYYY-MM-DD') });
  };

  const times = useMemo(() => {
    const arr: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        arr.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return arr;
  }, []);

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <View>
        <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>
          Tarih
        </AppText>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <DropdownPicker
            items={years}
            value={year}
            onSelect={(y) => updateDate(y)}
            theme={theme}
            label="Yıl"
          />
          <DropdownPicker
            items={MONTHS.map((_, i) => i)}
            value={month}
            onSelect={(m) => updateDate(undefined, m)}
            theme={theme}
            format={(m) => MONTHS[m]}
            label="Ay"
          />
          <DropdownPicker
            items={days}
            value={day}
            onSelect={(d) => updateDate(undefined, undefined, d)}
            theme={theme}
            label="Gün"
          />
        </View>
      </View>

      <View>
        <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>
          Başlangıç saati
        </AppText>
        <DropdownPicker
          items={times}
          value={value.startTime}
          onSelect={(t) => onChange({ ...value, startTime: t })}
          theme={theme}
        />
      </View>

      <View>
        <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>
          Bitiş saati
        </AppText>
        <DropdownPicker
          items={times}
          value={value.endTime}
          onSelect={(t) => onChange({ ...value, endTime: t })}
          theme={theme}
        />
      </View>

      <View>
        <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>
          Tekrarlama
        </AppText>
        <DropdownPicker
          items={RECURRENCE}
          value={RECURRENCE.find((r) => r.key === value.recurrence) ?? RECURRENCE[0]}
          onSelect={(r) => onChange({ ...value, recurrence: r.key })}
          theme={theme}
          format={(r) => r.label}
        />
      </View>
    </View>
  );
}
