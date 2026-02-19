import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

interface IconBadgeProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  backgroundColor?: string;
}

export function IconBadge({
  name,
  size = 20,
  backgroundColor,
}: IconBadgeProps) {
  const theme = useTheme();
  const bg = backgroundColor ?? theme.colors.primaryMuted;
  return (
    <View
      style={{
        width: size + 12,
        height: size + 12,
        borderRadius: (size + 12) / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={name} size={size} color={theme.colors.primary} />
    </View>
  );
}
