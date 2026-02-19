import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  let token: string | null = null;
  try {
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } catch {
    // projectId yok (EAS bağlı değil) - push bildirimleri devre dışı
    return null;
  }
  if (token) {
    await api('/notifications/register-token', {
      method: 'POST',
      body: JSON.stringify({ expoPushToken: token }),
    });
  }
  return token;
}
