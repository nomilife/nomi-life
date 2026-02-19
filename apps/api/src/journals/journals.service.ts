import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { CreateJournalDto, UpdateJournalDto } from './dto/journals.dto';

@Injectable()
export class JournalsService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async create(userId: string, dto: CreateJournalDto) {
    const createdAt = dto.createdAt ? new Date(dto.createdAt).toISOString() : new Date().toISOString();
    const { data: ti, error: tiErr } = await this.supabase
      .from('timeline_items')
      .insert({
        user_id: userId,
        kind: 'journal',
        start_at: createdAt,
        end_at: null,
        title: dto.title,
        summary: dto.content.slice(0, 200),
        status: 'scheduled',
      })
      .select('id')
      .single();

    if (tiErr || !ti) throw new Error(tiErr?.message ?? 'Failed to create timeline item');

    const { error: jErr } = await this.supabase.from('journals').insert({
      timeline_item_id: ti.id,
      content: dto.content,
      mood: dto.mood ?? null,
    });

    if (jErr) throw new Error(jErr.message);
    return this.getOne(userId, ti.id);
  }

  async getOne(userId: string, id: string) {
    const { data: ti } = await this.supabase
      .from('timeline_items')
      .select('id, title, start_at, end_at, summary, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!ti) throw new NotFoundException('Journal not found');

    const { data: j, error } = await this.supabase
      .from('journals')
      .select('*')
      .eq('timeline_item_id', id)
      .single();

    if (error || !j) throw new NotFoundException('Journal not found');

    return {
      id: (j as Record<string, unknown>).timeline_item_id,
      title: ti.title,
      startAt: ti.start_at,
      endAt: ti.end_at,
      summary: ti.summary,
      status: ti.status,
      content: (j as Record<string, unknown>).content,
      mood: (j as Record<string, unknown>).mood,
    };
  }

  async getList(userId: string, start?: string, end?: string, date?: string) {
    let query = this.supabase
      .from('timeline_items')
      .select('id, title, start_at, end_at, summary, status')
      .eq('user_id', userId)
      .eq('kind', 'journal');

    if (start) query = query.gte('start_at', start);
    if (end) query = query.lte('start_at', end);
    if (date) {
      query = query.gte('start_at', `${date}T00:00:00.000Z`).lte('start_at', `${date}T23:59:59.999Z`);
    }

    const { data: items } = await query.order('start_at', { ascending: false });
    if (!items?.length) return [];

    const ids = items.map((r) => r.id);
    const { data: journals } = await this.supabase
      .from('journals')
      .select('timeline_item_id, content, mood')
      .in('timeline_item_id', ids);

    const jMap: Record<string, Record<string, unknown>> = {};
    for (const j of journals ?? []) {
      jMap[(j as Record<string, string>).timeline_item_id] = j as Record<string, unknown>;
    }

    return items.map((ti) => {
      const j = jMap[ti.id];
      return {
        id: ti.id,
        title: ti.title,
        startAt: ti.start_at,
        endAt: ti.end_at,
        summary: ti.summary,
        status: ti.status,
        content: j?.content ?? null,
        mood: j?.mood ?? null,
      };
    });
  }

  async update(userId: string, id: string, dto: UpdateJournalDto) {
    await this.ensureOwnership(userId, id);

    const tiUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.title !== undefined) tiUpdates.title = dto.title;
    if (dto.content !== undefined) tiUpdates.summary = dto.content.slice(0, 200);

    if (Object.keys(tiUpdates).length > 1) {
      await this.supabase.from('timeline_items').update(tiUpdates).eq('id', id).eq('user_id', userId);
    }

    if (dto.content !== undefined || dto.mood !== undefined) {
      const jUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (dto.content !== undefined) jUpdates.content = dto.content;
      if (dto.mood !== undefined) jUpdates.mood = dto.mood;
      await this.supabase.from('journals').update(jUpdates).eq('timeline_item_id', id);
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
    if (!data) throw new NotFoundException('Journal not found');
  }
}
