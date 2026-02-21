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
import { useThemeStore } from '@/store/theme';
import { useTheme } from '@/theme';

export default function SignUp() {
  const { t } = useTranslation('auth');
  const theme = useTheme();
  const signUp = useAuthStore((s) => s.signUp);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await signUp(email, password, fullName || undefined);
      router.replace('/');
    } catch (e) {
      Alert.alert(t('error'), (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const screenMode = useThemeStore((s) => s.screenMode);
  const isDark = screenMode === 'dark';
  const authBtn = isDark ? theme.colors.primary : (theme.colors.authPrimary ?? theme.colors.primary);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: theme.spacing.xxl,
          paddingTop: theme.spacing.xxxl,
          paddingBottom: theme.spacing.xxxl,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'flex-start', marginBottom: theme.spacing.xxl }}>
          <Image
            source={require('@/assets/logo.png')}
            style={{ width: 48, height: 48, marginBottom: theme.spacing.md }}
            resizeMode="contain"
          />
          <Text style={{ ...theme.typography.title, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
            {t('createAccount')}
          </Text>
          <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
            {t('createAccountSubtitle')}
          </Text>
        </View>

        <Text style={{ ...theme.typography.caption, color: theme.colors.textMuted, marginBottom: theme.spacing.sm }}>
          {t('fullName')}
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
            marginBottom: theme.spacing.md,
          }}
          placeholder={t('fullNamePlaceholder')}
          placeholderTextColor={theme.colors.textMuted}
          value={fullName}
          onChangeText={setFullName}
        />

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
            marginBottom: theme.spacing.md,
          }}
          placeholder={t('emailPlaceholderAlt')}
          placeholderTextColor={theme.colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={{ ...theme.typography.caption, color: theme.colors.textMuted, marginBottom: theme.spacing.sm }}>
          {t('createPassword')}
        </Text>
        <View style={{ position: 'relative', marginBottom: theme.spacing.xl }}>
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

        <Pressable
          onPress={handleSignUp}
          disabled={loading}
          style={{
            backgroundColor: isDark ? theme.colors.primary : (authBtn ?? theme.colors.primary),
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            borderRadius: theme.radius.lg,
            alignItems: 'center',
            marginBottom: theme.spacing.xl,
          }}
        >
          {loading ? (
            <ActivityIndicator color={isDark ? '#1a1d24' : '#fff'} />
          ) : (
            <Text
              style={{
                ...theme.typography.h3,
                color: isDark ? '#1a1d24' : '#fff',
              }}
            >
              {t('createAccount')}
            </Text>
          )}
        </Pressable>

        <Text style={{ ...theme.typography.caption, color: theme.colors.textMuted, textAlign: 'center', marginBottom: theme.spacing.md }}>
          {t('orSignUpWith')}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.xl }}>
          <Pressable
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.sm,
              paddingVertical: theme.spacing.md,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Text style={{ ...theme.typography.body, color: theme.colors.text }}> Apple</Text>
          </Pressable>
          <Pressable
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.sm,
              paddingVertical: theme.spacing.md,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Text style={{ ...theme.typography.body, color: theme.colors.text }}>G Google</Text>
          </Pressable>
        </View>

        <Link href="/(auth)/sign-in" asChild>
          <Pressable style={{ alignItems: 'center' }}>
            <Text style={{ ...theme.typography.body, color: theme.colors.primary }}>{t('alreadyMember')}</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
