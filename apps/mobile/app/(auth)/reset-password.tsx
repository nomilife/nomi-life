import { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth';
import { useTheme } from '@/theme';

export default function ResetPassword() {
  const { t } = useTranslation('auth');
  const theme = useTheme();
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setSent(false);
    try {
      await resetPassword(email.trim());
      setSent(true);
      Alert.alert(
        'Email Sent',
        "We've sent a reset link to your email. Check your inbox and follow the link to reset your password."
      );
    } catch (e) {
      Alert.alert(t('error'), (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const authReset = theme.colors.authReset ?? '#fb7185';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: theme.spacing.xxl,
          paddingTop: theme.spacing.xxxl * 2,
          paddingBottom: theme.spacing.xxxl,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.xxl }}>
          <Image
            source={require('@/assets/logo.png')}
            style={{ width: 56, height: 56, marginBottom: theme.spacing.md }}
            resizeMode="contain"
          />
          <Text style={{ ...theme.typography.title, color: theme.colors.text, textAlign: 'center', marginBottom: theme.spacing.sm }}>
            {t('resetAccess')}
          </Text>
          <Text style={{ ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center' }}>
            {t('resetAccessSubtitle')}
          </Text>
        </View>

        <Text style={{ ...theme.typography.caption, color: theme.colors.textMuted, marginBottom: theme.spacing.sm }}>
          {t('registeredEmail')}
        </Text>
        <TextInput
          style={{
            ...theme.typography.body,
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.xl,
          }}
          placeholder={t('emailPlaceholder')}
          placeholderTextColor={theme.colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Pressable
          onPress={handleReset}
          disabled={loading || !email.trim()}
          style={{
            backgroundColor: authReset,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            borderRadius: theme.radius.lg,
            alignItems: 'center',
            opacity: !email.trim() ? 0.6 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ ...theme.typography.h3, color: '#fff' }}>{t('sendResetLink')}</Text>
          )}
        </Pressable>

        <Link href="/(auth)/sign-in" asChild>
          <Pressable style={{ alignItems: 'center', marginTop: theme.spacing.xxl }}>
            <Text style={{ ...theme.typography.body, color: theme.colors.primary }}>{t('backToLogin')}</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
