import { View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
      }}
    >
      <AppText variant="h2">{title}</AppText>
      {action}
    </View>
  );
}
