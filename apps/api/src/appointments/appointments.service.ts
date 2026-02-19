import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointments.dto';

@Injectable()
export class AppointmentsService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async create(userId: string, dto: CreateAppointmentDto) {
    const { data: ti, error: tiErr } = await this.supabase
      .from('timeline_items')
      .insert({
        user_id: userId,
        kind: 'appointment',
        start_at: dto.startAt,
        end_at: dto.endAt,
        title: dto.title,
        summary: dto.summary ?? null,
        status: 'scheduled',
      })
      .select('id')
      .single();

    if (tiErr || !ti) throw new Error(tiErr?.message ?? 'Failed to create timeline item');

    const { error: apErr } = await this.supabase.from('appointments').insert({
      timeline_item_id: ti.id,
      location: dto.location ?? null,
      with_whom: dto.withWhom ?? null,
    });

    if (apErr) throw new Error(apErr.message);
    return this.getOne(userId, ti.id);
  }

  async getOne(userId: string, id: string) {
    const { data: ti } = await this.supabase
      .from('timeline_items')
      .select('id, title, start_at, end_at, summary, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!ti) throw new NotFoundException('Appointment not found');

    const { data: ap, error } = await this.supabase
      .from('appointments')
      .select('*')
      .eq('timeline_item_id', id)
      .single();

    if (error || !ap) throw new NotFoundException('Appointment not found');

    return {
      id: (ap as Record<string, unknown>).timeline_item_id,
      title: ti.title,
      startAt: ti.start_at,
      endAt: ti.end_at,
      summary: ti.summary,
      status: ti.status,
      location: (ap as Record<string, unknown>).location,
      withWhom: (ap as Record<string, unknown>).with_whom,
    };
  }

  async getList(userId: string, start?: string, end?: string, date?: string) {
    let query = this.supabase
      .from('timeline_items')
      .select('id, title, start_at, end_at, summary, status')
      .eq('user_id', userId)
      .eq('kind', 'appointment');

    if (start) query = query.gte('start_at', start);
    if (end) query = query.lte('start_at', end);
    if (date) {
      query = query.gte('start_at', `${date}T00:00:00.000Z`).lte('start_at', `${date}T23:59:59.999Z`);
    }

    const { data: items } = await query.order('start_at', { ascending: true });
    if (!items?.length) return [];

    const ids = items.map((r) => r.id);
    const { data: aps } = await this.supabase
      .from('appointments')
      .select('timeline_item_id, location, with_whom')
      .in('timeline_item_id', ids);

    const apMap: Record<string, Record<string, unknown>> = {};
    for (const a of aps ?? []) {
      apMap[(a as Record<string, string>).timeline_item_id] = a as Record<string, unknown>;
    }

    return items.map((ti) => {
      const ap = apMap[ti.id];
      return {
        id: ti.id,
        title: ti.title,
        startAt: ti.start_at,
        endAt: ti.end_at,
        summary: ti.summary,
        status: ti.status,
        location: ap?.location ?? null,
        withWhom: ap?.with_whom ?? null,
      };
    });
  }

  async update(userId: string, id: string, dto: UpdateAppointmentDto) {
    await this.ensureOwnership(userId, id);

    const tiUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.title !== undefined) tiUpdates.title = dto.title;
    if (dto.startAt !== undefined) tiUpdates.start_at = dto.startAt;
    if (dto.endAt !== undefined) tiUpdates.end_at = dto.endAt;
    if (dto.summary !== undefined) tiUpdates.summary = dto.summary;

    if (Object.keys(tiUpdates).length > 1) {
      await this.supabase.from('timeline_items').update(tiUpdates).eq('id', id).eq('user_id', userId);
    }

    if (dto.location !== undefined || dto.withWhom !== undefined) {
      const apUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (dto.location !== undefined) apUpdates.location = dto.location;
      if (dto.withWhom !== undefined) apUpdates.with_whom = dto.withWhom;
      await this.supabase.from('appointments').update(apUpdates).eq('timeline_item_id', id);
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
    if (!data) throw new NotFoundException('Appointment not found');
  }
}
