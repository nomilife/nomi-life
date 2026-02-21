import { View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

interface TimeInputProps {
  value: string;
  onChangeText: (v: string) => void;
  label?: string;
  placeholder?: string;
  style?: object;
}

/** Web: native <input type="time"> - tarayıcı time picker açar */
export function TimeInput({ value, onChangeText, label, placeholder = '07:00' }: TimeInputProps) {
  const theme = useTheme();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeText(e.target.value || placeholder);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    boxSizing: 'border-box',
  };

  return (
    <View>
      {label ? (
        <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.xs }}>
          {label}
        </AppText>
      ) : null}
      <input
        type="time"
        value={value || '07:00'}
        onChange={handleChange}
        style={inputStyle}
      />
    </View>
  );
}
