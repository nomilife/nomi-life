import { View, TextInput, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: ViewStyle;
}

export function AppInput({
  label,
  error,
  helper,
  style,
  containerStyle,
  placeholderTextColor,
  ...props
}: AppInputProps) {
  const theme = useTheme();

  return (
    <View style={[{ marginBottom: theme.spacing.lg }, containerStyle]}>
      {label ? (
        <AppText variant="caption" color="secondary" style={{ marginBottom: theme.spacing.xs }}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={placeholderTextColor ?? theme.colors.muted}
        style={[
          theme.typography.body,
          {
            color: theme.colors.textPrimary,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <AppText variant="small" color="danger" style={{ marginTop: theme.spacing.xs }}>
          {error}
        </AppText>
      ) : helper ? (
        <AppText variant="small" color="muted" style={{ marginTop: theme.spacing.xs }}>
          {helper}
        </AppText>
      ) : null}
    </View>
  );
}
