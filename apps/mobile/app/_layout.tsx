import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { Stack } from 'expo-router';

// Expo Go limitasyonları: SplashModule/SplashScreen API'leri modal vb. context'te hata verebilir
LogBox.ignoreLogs(['SplashModule', 'SplashScreen', 'native splash screen']);
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(modal)/voice" options={{ presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
