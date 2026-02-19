import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

interface AppCardProps extends ViewProps {
  elevation?: 1 | 2 | 3;
  padding?: keyof ReturnType<typeof useTheme>['spacing'];
}

export function AppCard({
  elevation = 1,
  padding = 'lg',
  style,
  children,
  ...props
}: AppCardProps) {
  const theme = useTheme();
  const p = theme.spacing[padding];
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          padding: p,
          ...theme.elevations[elevation],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
