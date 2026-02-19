import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { AppText } from './AppText';
import { AppButton } from './AppButton';

interface ErrorStateProps {
  title?: string;
  message: string;
  /** İsteğe bağlı retry butonu */
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Bir hata oluştu',
  message,
  onRetry,
  retryLabel = 'Tekrar dene',
}: ErrorStateProps) {
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
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: theme.colors.financeAlert ?? theme.colors.danger + '20',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing.lg,
        }}
      >
        <Ionicons name="alert-circle-outline" size={32} color={theme.colors.danger} />
      </View>
      <AppText variant="h2" style={{ color: theme.colors.textPrimary, textAlign: 'center', marginBottom: theme.spacing.sm }}>
        {title}
      </AppText>
      <AppText variant="body" color="muted" style={{ textAlign: 'center', marginBottom: theme.spacing.lg }}>
        {message}
      </AppText>
      {onRetry && (
        <AppButton variant="primary" onPress={onRetry}>
          {retryLabel}
        </AppButton>
      )}
    </View>
  );
}
