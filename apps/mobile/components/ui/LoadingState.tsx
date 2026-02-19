import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message }: LoadingStateProps) {
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
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {message ? (
        <AppText variant="body" color="muted" style={{ marginTop: theme.spacing.md }}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}
