import 'react-native-url-polyfill/auto';
import { useEffect } from 'react';
import { LogBox, View } from 'react-native';
import { Stack } from 'expo-router';

// Expo Go limitasyonları + react-native-web resizeMode deprecation (bağımlılıktan geliyor)
LogBox.ignoreLogs([
  'SplashModule',
  'SplashScreen',
  'native splash screen',
  'Image: style.resizeMode',
]);
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import '../lib/i18n';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { useLifeAreasStore } from '@/store/lifeAreas';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 0 } },
});

export default function RootLayout() {
  const initAuth = useAuthStore((s) => s.init);
  const initTheme = useThemeStore((s) => s.init);
  const initLifeAreas = useLifeAreasStore((s) => s.init);
  useEffect(() => {
    initAuth();
    initTheme();
    initLifeAreas();
  }, [initAuth, initTheme, initLifeAreas]);

  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: '#F5EDE4' }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F5EDE4', flex: 1 },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(modal)/voice" options={{ presentation: 'modal' }} />
        </Stack>
        </View>
      </SafeAreaProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}
