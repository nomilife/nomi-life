import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { CreateTravelDto, UpdateTravelDto } from './dto/travel.dto';

@Injectable()
export class TravelService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async create(userId: string, dto: CreateTravelDto) {
    const { data: ti, error: tiErr } = await this.supabase
      .from('timeline_items')
      .insert({
        user_id: userId,
        kind: 'travel',
        start_at: dto.departureAt ?? null,
        end_at: dto.arrivalAt ?? null,
        title: dto.title,
        summary: dto.summary ?? null,
        status: 'scheduled',
      })
      .select('id')
      .single();

    if (tiErr || !ti) throw new Error(tiErr?.message ?? 'Failed to create timeline item');

    const { error: trErr } = await this.supabase.from('travel').insert({
      timeline_item_id: ti.id,
      origin: dto.origin ?? null,
      destination: dto.destination,
      departure_at: dto.departureAt ?? null,
      arrival_at: dto.arrivalAt ?? null,
    });

    if (trErr) throw new Error(trErr.message);
    return this.getOne(userId, ti.id);
  }

  async getOne(userId: string, id: string) {
    const { data: ti } = await this.supabase
      .from('timeline_items')
      .select('id, title, start_at, end_at, summary, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!ti) throw new NotFoundException('Travel not found');

    const { data: tr, error } = await this.supabase
      .from('travel')
      .select('*')
      .eq('timeline_item_id', id)
      .single();

    if (error || !tr) throw new NotFoundException('Travel not found');

    return {
      id: (tr as Record<string, unknown>).timeline_item_id,
      title: ti.title,
      startAt: ti.start_at,
      endAt: ti.end_at,
      summary: ti.summary,
      status: ti.status,
      origin: (tr as Record<string, unknown>).origin,
      destination: (tr as Record<string, unknown>).destination,
      departureAt: (tr as Record<string, unknown>).departure_at,
      arrivalAt: (tr as Record<string, unknown>).arrival_at,
    };
  }

  async getList(userId: string, start?: string, end?: string, date?: string) {
    let query = this.supabase
      .from('timeline_items')
      .select('id, title, start_at, end_at, summary, status')
      .eq('user_id', userId)
      .eq('kind', 'travel');

    if (start) query = query.gte('start_at', start);
    if (end) query = query.lte('start_at', end);
    if (date) {
      query = query.gte('start_at', `${date}T00:00:00.000Z`).lte('start_at', `${date}T23:59:59.999Z`);
    }

    const { data: items } = await query.order('start_at', { ascending: true, nullsFirst: true });
    if (!items?.length) return [];

    const ids = items.map((r) => r.id);
    const { data: trs } = await this.supabase
      .from('travel')
      .select('timeline_item_id, origin, destination, departure_at, arrival_at')
      .in('timeline_item_id', ids);

    const trMap: Record<string, Record<string, unknown>> = {};
    for (const t of trs ?? []) {
      trMap[(t as Record<string, string>).timeline_item_id] = t as Record<string, unknown>;
    }

    return items.map((ti) => {
      const tr = trMap[ti.id];
      return {
        id: ti.id,
        title: ti.title,
        startAt: ti.start_at,
        endAt: ti.end_at,
        summary: ti.summary,
        status: ti.status,
        origin: tr?.origin ?? null,
        destination: tr?.destination ?? null,
        departureAt: tr?.departure_at ?? null,
        arrivalAt: tr?.arrival_at ?? null,
      };
    });
  }

  async update(userId: string, id: string, dto: UpdateTravelDto) {
    await this.ensureOwnership(userId, id);

    const tiUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.title !== undefined) tiUpdates.title = dto.title;
    if (dto.summary !== undefined) tiUpdates.summary = dto.summary;
    if (dto.departureAt !== undefined) tiUpdates.start_at = dto.departureAt;
    if (dto.arrivalAt !== undefined) tiUpdates.end_at = dto.arrivalAt;

    if (Object.keys(tiUpdates).length > 1) {
      await this.supabase.from('timeline_items').update(tiUpdates).eq('id', id).eq('user_id', userId);
    }

    if (dto.origin !== undefined || dto.destination !== undefined || dto.departureAt !== undefined || dto.arrivalAt !== undefined) {
      const trUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (dto.origin !== undefined) trUpdates.origin = dto.origin;
      if (dto.destination !== undefined) trUpdates.destination = dto.destination;
      if (dto.departureAt !== undefined) trUpdates.departure_at = dto.departureAt;
      if (dto.arrivalAt !== undefined) trUpdates.arrival_at = dto.arrivalAt;
      await this.supabase.from('travel').update(trUpdates).eq('timeline_item_id', id);
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
    if (!data) throw new NotFoundException('Travel not found');
  }
}
