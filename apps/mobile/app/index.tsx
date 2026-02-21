import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

type OnboardingStatus = { completed: boolean; currentStep?: number };

export default function Index() {
  const session = useAuthStore((s) => s.session);
  const router = useRouter();

  const { data: onboarding, isLoading: onboardingLoading } = useQuery({
    queryKey: ['onboarding', 'status', session?.user?.id],
    queryFn: () => api<OnboardingStatus>('/onboarding/status'),
    enabled: !!session?.user?.id,
    retry: 1,
  });

  useEffect(() => {
    if (!session) {
      const t = setTimeout(() => {
        router.replace('/(auth)/sign-in' as never);
      }, 50);
      return () => clearTimeout(t);
    }
    if (!session.user?.id) return;
    if (onboardingLoading) return;
    const completed = onboarding?.completed ?? true;
    const target = completed ? '/(tabs)/flow' : '/onboarding';
    router.replace(target as never);
  }, [session, onboarding, onboardingLoading, router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F5EDE4', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#E07C3C" />
      <Text style={{ color: '#2D3748', fontSize: 16, marginTop: 12 }}>Yükleniyor...</Text>
    </View>
  );
}
