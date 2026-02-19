import { View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';
import { AppButton } from './AppButton';

interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xxl,
      }}
    >
      <AppText variant="h2" color="secondary" style={{ textAlign: 'center', marginBottom: theme.spacing.sm }}>
        {title}
      </AppText>
      {message ? (
        <AppText variant="body" color="muted" style={{ textAlign: 'center', marginBottom: theme.spacing.lg }}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <AppButton variant="primary" onPress={onAction}>
          {actionLabel}
        </AppButton>
      ) : null}
    </View>
  );
}
