import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { UpdateSettingsDto, UpdateNotificationRuleDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async getSettings(userId: string) {
    const [settingsRes, profileRes] = await Promise.all([
      this.supabase
        .from('user_settings')
        .select('locale, timezone, quiet_hours_start, quiet_hours_end')
        .eq('user_id', userId)
        .single(),
      this.supabase.from('profiles').select('username, display_name, email').eq('user_id', userId).single(),
    ]);

    const { data: settingsData, error: settingsError } = settingsRes;
    if (settingsError && settingsError.code !== 'PGRST116') throw new Error(settingsError.message);

    let settings = settingsData as Record<string, unknown>;
    if (!settings) {
      const { data: inserted } = await this.supabase
        .from('user_settings')
        .insert({ user_id: userId })
        .select('locale, timezone, quiet_hours_start, quiet_hours_end')
        .single();
      settings = inserted ?? {};
    }

    const profile = (profileRes.data ?? {}) as { username?: string; display_name?: string; email?: string };
    return this.formatSettings(settings, profile);
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    if (dto.username !== undefined) {
      const norm = dto.username.trim().toLowerCase();
      const { data: existing } = await this.supabase
        .from('profiles')
        .select('user_id')
        .eq('username', norm)
        .single();
      if (existing && (existing as { user_id: string }).user_id !== userId) {
        throw new Error('Bu kullanıcı adı zaten alınmış. Başka bir tane seçin.');
      }
      const { error: profileErr } = await this.supabase
        .from('profiles')
        .update({ username: norm })
        .eq('user_id', userId);
      if (profileErr) {
        if (profileErr.code === '23505') throw new Error('Bu kullanıcı adı zaten alınmış.');
        throw new Error(profileErr.message);
      }
    }

    const updates: Record<string, unknown> = {};
    if (dto.locale !== undefined) updates.locale = dto.locale;
    if (dto.timezone !== undefined) updates.timezone = dto.timezone;
    if (dto.quiet_hours_start !== undefined) updates.quiet_hours_start = dto.quiet_hours_start;
    if (dto.quiet_hours_end !== undefined) updates.quiet_hours_end = dto.quiet_hours_end;

    if (Object.keys(updates).length === 0) return this.getSettings(userId);

    updates.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('user_settings')
      .upsert(
        { user_id: userId, ...updates },
        { onConflict: 'user_id' },
      )
      .select('locale, timezone, quiet_hours_start, quiet_hours_end')
      .single();

    if (error) throw new Error(error.message);
    const profile = (await this.supabase.from('profiles').select('username, display_name, email').eq('user_id', userId).single()).data as Record<string, unknown> | null;
    return this.formatSettings(data as Record<string, unknown>, profile ?? {});
  }

  async getNotificationRules(userId: string) {
    const { data, error } = await this.supabase
      .from('notification_rules')
      .select('id, rule_type, enabled')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    const rules = (data ?? []) as { id: string; rule_type: string; enabled: boolean }[];
    if (rules.length === 0) {
      const defaults = [
        { rule_type: 'daily_checkin', enabled: true },
        { rule_type: 'bill_amount_prompt', enabled: true },
        { rule_type: 'event_reminder', enabled: true },
      ];
      for (const r of defaults) {
        const { data: ins } = await this.supabase
          .from('notification_rules')
          .insert({ user_id: userId, rule_type: r.rule_type, enabled: r.enabled })
          .select('id, rule_type, enabled')
          .single();
        if (ins) rules.push(ins as { id: string; rule_type: string; enabled: boolean });
      }
    }
    return rules;
  }

  async updateNotificationRule(
    userId: string,
    ruleId: string,
    dto: UpdateNotificationRuleDto,
  ) {
    const { data, error } = await this.supabase
      .from('notification_rules')
      .update({ enabled: dto.enabled })
      .eq('id', ruleId)
      .eq('user_id', userId)
      .select('id, rule_type, enabled')
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException('Notification rule not found');
    return data;
  }

  private formatSettings(
    row: Record<string, unknown>,
    profile?: { username?: string; display_name?: string; email?: string } | null,
  ) {
    const uname = profile?.username ?? profile?.display_name ?? (profile?.email ? profile.email.split('@')[0] : null);
    return {
      locale: row.locale ?? 'en',
      timezone: row.timezone ?? 'Europe/Istanbul',
      quiet_hours_start: row.quiet_hours_start ?? null,
      quiet_hours_end: row.quiet_hours_end ?? null,
      username: uname ?? null,
    };
  }
}
