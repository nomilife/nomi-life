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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { useTheme } from '@/theme';

export default function SignIn() {
  const { t } = useTranslation('auth');
  const theme = useTheme();
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (e) {
      const err = e as Error & { status?: number };
      const msg = err.message?.toLowerCase() ?? '';
      let userMsg = err.message;
      if (msg.includes('email not confirmed') || msg.includes('invalid_grant')) {
        userMsg =
          'E-posta doğrulanmamış veya geçersiz giriş. Önce Sign Up ile kayıt olun, ardından e-postanızdaki onay linkine tıklayın.';
      } else if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
        userMsg = 'E-posta veya şifre hatalı. Lütfen kontrol edin.';
      }
      Alert.alert(t('error'), userMsg);
    } finally {
      setLoading(false);
    }
  };

  const screenMode = useThemeStore((s) => s.screenMode);
  const isDark = screenMode === 'dark';
  const authBtn = theme.colors.authPrimary ?? '#facc15';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: theme.spacing.xxl,
          paddingTop: theme.spacing.xl,
          paddingBottom: theme.spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <Text
            style={{
              fontSize: 11,
              color: theme.colors.textMuted,
              marginBottom: theme.spacing.sm,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            {t('tagline')}
          </Text>
          <Image
            source={require('@/assets/logo-auth.png')}
            style={{ width: 185, height: 185 }}
            resizeMode="contain"
          />
        </View>

        <Text style={{ ...theme.typography.title, color: theme.colors.text, marginBottom: theme.spacing.lg }}>
          {t('welcomeBack')}
        </Text>

        <Text style={{ ...theme.typography.caption, color: theme.colors.textMuted, marginBottom: theme.spacing.sm }}>
          {t('email')}
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
            marginBottom: theme.spacing.sm,
          }}
          placeholder={t('emailPlaceholder')}
          placeholderTextColor={theme.colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={{ ...theme.typography.caption, color: theme.colors.textMuted, marginBottom: theme.spacing.xs }}>
          {t('password')}
        </Text>
        <View style={{ position: 'relative', marginBottom: theme.spacing.md }}>
          <TextInput
            style={{
              ...theme.typography.body,
              color: theme.colors.text,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.md,
              paddingRight: 48,
            }}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: theme.spacing.md, top: 0, bottom: 0, justifyContent: 'center' }}
          >
            <Text style={{ ...theme.typography.caption, color: theme.colors.textMuted }}>{showPassword ? '🙈' : '👁'}</Text>
          </Pressable>
        </View>

        <Link href="/(auth)/reset-password" asChild>
          <Pressable style={{ alignSelf: 'flex-end', marginBottom: theme.spacing.lg }}>
            <Text style={{ ...theme.typography.caption, color: theme.colors.primary }}>{t('forgotPassword')}</Text>
          </Pressable>
        </Link>

        <Pressable
          onPress={handleSignIn}
          disabled={loading}
          style={{
            backgroundColor: authBtn ?? '#facc15',
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            borderRadius: theme.radius.lg,
            alignItems: 'center',
          }}
        >
          {loading ? (
            <ActivityIndicator color={isDark ? '#1a1d24' : '#1a1d24'} />
          ) : (
            <Text style={{ ...theme.typography.h3, color: '#1a1d24' }}>{t('signIn')}</Text>
          )}
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: theme.spacing.lg, gap: theme.spacing.md }}>
          <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
          <Text style={{ ...theme.typography.caption, color: theme.colors.textMuted, fontSize: 12 }}>or</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
        </View>
        <Text style={{ ...theme.typography.caption, color: theme.colors.textMuted, textAlign: 'center', marginBottom: theme.spacing.md, fontSize: 12 }}>
          {t('orContinueWith')}
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <Pressable
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.sm,
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <MaterialCommunityIcons name="google" size={20} color={isDark ? '#fff' : '#1a1d24'} />
            <Text style={{ ...theme.typography.body, color: theme.colors.text, fontWeight: '500' }}>Google</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.sm,
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <MaterialCommunityIcons name="apple" size={22} color={theme.colors.text} />
            <Text style={{ ...theme.typography.body, color: theme.colors.text, fontWeight: '500' }}>Apple</Text>
          </Pressable>
        </View>

        <Link href="/(auth)/sign-up" asChild>
          <Pressable style={{ alignItems: 'center', paddingVertical: theme.spacing.sm }}>
            <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
              {t('dontHaveAccountPrefix')}{' '}
              <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>{t('dontHaveAccountLink')}</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
