import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { AppText } from './ui';

export interface ScreenHeaderProps {
  /** Hamburger tıklandığında çağrılır. Sağlanmazsa varsayılan HomeMenuModal tetiklenir. */
  onMenuPress?: () => void;
  /** Geri butonu göster (hamburger yerine). Genelde nested ekranlarda. */
  showBack?: boolean;
  /** Başlık */
  title?: string;
  /** Alt başlık (örn. LIFEOS 2.4) */
  subtitle?: string;
  /** Sağ köşe (avatar, ikon vb.) */
  rightElement?: React.ReactNode;
  /** Arka plan rengi - theme ile tutarlı */
  backgroundColor?: string;
}

/** Tüm ana ekranlarda tutarlı header: hamburger menü + başlık */
export function ScreenHeader({
  onMenuPress,
  showBack,
  title,
  subtitle,
  rightElement,
  backgroundColor,
}: ScreenHeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  const bg = backgroundColor ?? theme.colors.background;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 48,
        paddingBottom: theme.spacing.md,
        backgroundColor: bg,
      }}
    >
      <Pressable
        onPress={showBack ? () => router.back() : onMenuPress}
        style={{ padding: theme.spacing.xs }}
        hitSlop={12}
      >
        <Ionicons
          name={showBack ? 'arrow-back' : 'menu'}
          size={24}
          color={theme.colors.textPrimary}
        />
      </Pressable>

      {(title || subtitle) && (
        <View style={{ flex: 1, alignItems: 'center' }}>
          {subtitle && (
            <AppText
              variant="small"
              style={{
                color: theme.colors.primary,
                letterSpacing: 3,
                fontWeight: '700',
                opacity: 0.8,
                marginBottom: 2,
              }}
            >
              {subtitle}
            </AppText>
          )}
          {title && (
            <AppText
              variant="title"
              style={{ color: theme.colors.textPrimary, fontWeight: '700' }}
            >
              {title}
            </AppText>
          )}
        </View>
      )}

      {rightElement ?? <View style={{ width: 44 }} />}
    </View>
  );
}
