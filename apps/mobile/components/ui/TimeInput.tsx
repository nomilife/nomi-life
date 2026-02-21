import { View, TextInput, Platform } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

const HH_MM_REGEX = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

function isValidTime(s: string): boolean {
  return HH_MM_REGEX.test(s);
}

function formatTimeInput(text: string): string {
  const digits = text.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length === 1) return digits.padStart(2, '0');
  if (digits.length === 2) return digits;
  if (digits.length === 3) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  const h = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const hour = Math.min(23, parseInt(h, 10));
  const min = Math.min(59, parseInt(m, 10));
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function toDisplayValue(s: string): string {
  if (!s || s.length < 5) return s;
  if (HH_MM_REGEX.test(s)) return s;
  const [h, m] = s.split(':');
  const hour = Math.min(23, parseInt(h || '0', 10));
  const min = Math.min(59, parseInt(m || '0', 10));
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

interface TimeInputProps {
  value: string;
  onChangeText: (v: string) => void;
  label?: string;
  placeholder?: string;
  style?: object;
}

export function TimeInput({ value, onChangeText, label, placeholder = '07:00' }: TimeInputProps) {
  const theme = useTheme();

  const handleChange = (text: string) => {
    const formatted = formatTimeInput(text);
    onChangeText(formatted);
  };

  const handleBlur = () => {
    if (!value) {
      onChangeText(placeholder);
      return;
    }
    const fixed = toDisplayValue(value);
    if (!isValidTime(fixed)) {
      onChangeText(placeholder);
      return;
    }
    if (fixed !== value) onChangeText(fixed);
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
  };

  return (
    <View>
      {label ? (
        <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.xs }}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        value={value}
        onChangeText={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'number-pad'}
        maxLength={5}
        style={inputStyle}
      />
    </View>
  );
}
