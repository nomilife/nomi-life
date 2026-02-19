import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { CreateReminderDto, UpdateReminderDto } from './dto/reminders.dto';

@Injectable()
export class RemindersService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async create(userId: string, dto: CreateReminderDto) {
    const { data: ti, error: tiErr } = await this.supabase
      .from('timeline_items')
      .insert({
        user_id: userId,
        kind: 'reminder',
        start_at: dto.remindAt,
        end_at: dto.remindAt,
        title: dto.title,
        summary: dto.summary ?? null,
        status: 'scheduled',
      })
      .select('id')
      .single();

    if (tiErr || !ti) throw new Error(tiErr?.message ?? 'Failed to create timeline item');

    const { error: remErr } = await this.supabase.from('reminders').insert({
      timeline_item_id: ti.id,
      remind_at: dto.remindAt,
      recurrence: dto.recurrence ?? 'once',
    });

    if (remErr) throw new Error(remErr.message);
    return this.getOne(userId, ti.id);
  }

  async getOne(userId: string, id: string) {
    const { data: ti } = await this.supabase
      .from('timeline_items')
      .select('id, title, start_at, end_at, summary, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!ti) throw new NotFoundException('Reminder not found');

    const { data: r, error } = await this.supabase
      .from('reminders')
      .select('*')
      .eq('timeline_item_id', id)
      .single();

    if (error || !r) throw new NotFoundException('Reminder not found');

    return {
      id: (r as Record<string, unknown>).timeline_item_id,
      title: ti.title,
      startAt: ti.start_at,
      endAt: ti.end_at,
      summary: ti.summary,
      status: ti.status,
      remindAt: (r as Record<string, unknown>).remind_at,
      recurrence: (r as Record<string, unknown>).recurrence,
    };
  }

  async getList(userId: string, start?: string, end?: string, date?: string) {
    let query = this.supabase
      .from('timeline_items')
      .select('id, title, start_at, end_at, summary, status')
      .eq('user_id', userId)
      .eq('kind', 'reminder');

    if (start) query = query.gte('start_at', start);
    if (end) query = query.lte('start_at', end);
    if (date) {
      query = query.gte('start_at', `${date}T00:00:00.000Z`).lte('start_at', `${date}T23:59:59.999Z`);
    }

    const { data: items } = await query.order('start_at', { ascending: true });
    if (!items?.length) return [];

    const ids = items.map((r) => r.id);
    const { data: rems } = await this.supabase
      .from('reminders')
      .select('timeline_item_id, remind_at, recurrence')
      .in('timeline_item_id', ids);

    const remMap: Record<string, Record<string, unknown>> = {};
    for (const r of rems ?? []) {
      remMap[(r as Record<string, string>).timeline_item_id] = r as Record<string, unknown>;
    }

    return items.map((ti) => {
      const r = remMap[ti.id];
      return {
        id: ti.id,
        title: ti.title,
        startAt: ti.start_at,
        endAt: ti.end_at,
        summary: ti.summary,
        status: ti.status,
        remindAt: r?.remind_at ?? ti.start_at,
        recurrence: r?.recurrence ?? 'once',
      };
    });
  }

  async update(userId: string, id: string, dto: UpdateReminderDto) {
    await this.ensureOwnership(userId, id);

    const tiUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.title !== undefined) tiUpdates.title = dto.title;
    if (dto.summary !== undefined) tiUpdates.summary = dto.summary;
    if (dto.remindAt !== undefined) {
      tiUpdates.start_at = dto.remindAt;
      tiUpdates.end_at = dto.remindAt;
    }

    if (Object.keys(tiUpdates).length > 1) {
      await this.supabase.from('timeline_items').update(tiUpdates).eq('id', id).eq('user_id', userId);
    }

    if (dto.remindAt !== undefined || dto.recurrence !== undefined) {
      const remUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (dto.remindAt !== undefined) remUpdates.remind_at = dto.remindAt;
      if (dto.recurrence !== undefined) remUpdates.recurrence = dto.recurrence;
      await this.supabase.from('reminders').update(remUpdates).eq('timeline_item_id', id);
    }

    return this.getOne(userId, id);
  }

  private async ensureOwnership(userId: string, id: string) {
    const { data } = await this.supabase
      .from('timeline_items')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (!data) throw new NotFoundException('Reminder not found');
  }
}
