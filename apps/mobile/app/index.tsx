import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export default function Index() {
  const session = useAuthStore((s) => s.session);

  if (session) {
    return <Redirect href="/(tabs)/flow" />;
  }
  return <Redirect href="/(auth)/sign-in" />;
}
