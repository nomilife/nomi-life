import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';

const expo = new Expo();

@Injectable()
export class NotificationsService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async registerToken(userId: string, expoPushToken: string) {
    await this.supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        expo_push_token: expoPushToken,
      },
      {
        onConflict: 'user_id,expo_push_token',
      },
    );
    return { ok: true };
  }

  /** Push notification when user is invited to an event */
  async sendEventInvite(toUserId: string, eventTitle: string, eventId: string, hostDisplayName: string) {
    const { data: tokens } = await this.supabase
      .from('push_tokens')
      .select('expo_push_token')
      .eq('user_id', toUserId);
    if (!tokens?.length) return;

    const messages: ExpoPushMessage[] = tokens
      .map((t) => t.expo_push_token)
      .filter((t): t is string => Expo.isExpoPushToken(t))
      .map((token) => ({
        to: token,
        sound: 'default',
        title: 'Etkinlik daveti',
        body: `${hostDisplayName} seni "${eventTitle}" etkinliğine davet etti.`,
        data: { type: 'event_invite', eventId },
      }));

    if (messages.length) {
      try {
        await expo.sendPushNotificationsAsync(messages);
      } catch (err) {
        console.warn('[Notifications] Push send failed:', err);
      }
    }
  }

  async runRules() {
    // Dev-only: iterate notification_rules and evaluate conditions.
    // For MVP: stub that logs intent. Real implementation would:
    // - Check daily_checkin (evening window, no activity)
    // - Check bill_amount_prompt (due in 1-2 days, amount null)
    // - Check event_reminder (30-60 min before)
    // Then send via Expo push API.
    return { message: 'Notification rules run (stub)', triggered: 0 };
  }
}
