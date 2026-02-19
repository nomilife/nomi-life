import { View, Pressable, Alert } from 'react-native';
import { Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { AppText } from '@/components/ui';

interface ExternalAppShortcutProps {
  label: string;
  url: string;
  storeUrl?: string | null;
}

export function ExternalAppShortcut({ label, url, storeUrl }: ExternalAppShortcutProps) {
  const theme = useTheme();
  const { t } = useTranslation('event');

  const handleOpen = async () => {
    if (!url || !url.includes('://')) return;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        showFallbackAlert();
      }
    } catch {
      showFallbackAlert();
    }
  };

  const showFallbackAlert = () => {
    const copyLink = async () => {
      try {
        await Clipboard.setStringAsync(url);
        Alert.alert(t('copyLink'), t('linkCopied'));
      } catch {
        Alert.alert(t('appNotInstalled'), t('copyError'));
      }
    };
    Alert.alert(
      t('appNotInstalled'),
      t('appNotInstalledMessage', { label }),
      [
        { text: t('cancel'), style: 'cancel' as const },
        { text: t('copyLink'), onPress: copyLink },
        ...(storeUrl ? [{ text: t('openStore'), onPress: () => Linking.openURL(storeUrl) }] : []),
      ]
    );
  };

  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <Pressable
        onPress={handleOpen}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: theme.spacing.lg,
          paddingHorizontal: theme.spacing.xl,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.primary,
          ...theme.elevations[2],
        }}
      >
        <Ionicons name="open-outline" size={24} color="#fff" style={{ marginRight: theme.spacing.md }} />
        <AppText variant="h3" style={{ color: '#fff', fontWeight: '600' }}>
          {t('openApp')} — {label}
        </AppText>
      </Pressable>
      <AppText variant="small" color="muted" style={{ marginTop: theme.spacing.xs }}>
        {t('opensAutomatically', { label })}
      </AppText>
    </View>
  );
}
