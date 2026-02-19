import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export default function Index() {
  const session = useAuthStore((s) => s.session);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      const target = session ? '/(tabs)/flow' : '/(auth)/sign-in';
      router.replace(target as never);
    }, 50);
    return () => clearTimeout(t);
  }, [session, router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F5EDE4', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#E07C3C" />
      <Text style={{ color: '#2D3748', fontSize: 16, marginTop: 12 }}>Yükleniyor...</Text>
    </View>
  );
}
