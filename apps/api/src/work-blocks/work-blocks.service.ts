import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { CreateWorkBlockDto, UpdateWorkBlockDto } from './dto/work-blocks.dto';

@Injectable()
export class WorkBlocksService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async create(userId: string, dto: CreateWorkBlockDto) {
    const { data: ti, error: tiErr } = await this.supabase
      .from('timeline_items')
      .insert({
        user_id: userId,
        kind: 'work_block',
        start_at: dto.startAt,
        end_at: dto.endAt,
        title: dto.title,
        summary: dto.summary ?? null,
        status: 'scheduled',
      })
      .select('id')
      .single();

    if (tiErr || !ti) throw new Error(tiErr?.message ?? 'Failed to create timeline item');

    const { error: wbErr } = await this.supabase.from('work_blocks').insert({
      timeline_item_id: ti.id,
      project: dto.project ?? null,
    });

    if (wbErr) throw new Error(wbErr.message);
    return this.getOne(userId, ti.id);
  }

  async getOne(userId: string, id: string) {
    const { data: ti } = await this.supabase
      .from('timeline_items')
      .select('id, title, start_at, end_at, summary, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!ti) throw new NotFoundException('Work block not found');

    const { data: wb, error } = await this.supabase
      .from('work_blocks')
      .select('*')
      .eq('timeline_item_id', id)
      .single();

    if (error || !wb) throw new NotFoundException('Work block not found');

    return {
      id: (wb as Record<string, unknown>).timeline_item_id,
      title: ti.title,
      startAt: ti.start_at,
      endAt: ti.end_at,
      summary: ti.summary,
      status: ti.status,
      project: (wb as Record<string, unknown>).project,
    };
  }

  async getList(userId: string, start?: string, end?: string) {
    let query = this.supabase
      .from('timeline_items')
      .select('id, title, start_at, end_at, summary, status')
      .eq('user_id', userId)
      .eq('kind', 'work_block');

    if (start) query = query.gte('start_at', start);
    if (end) query = query.lte('start_at', end);

    const { data: items } = await query.order('start_at', { ascending: true });
    if (!items?.length) return [];

    const ids = items.map((r) => r.id);
    const { data: wbs } = await this.supabase
      .from('work_blocks')
      .select('timeline_item_id, project')
      .in('timeline_item_id', ids);

    const wbMap: Record<string, Record<string, unknown>> = {};
    for (const w of wbs ?? []) {
      wbMap[(w as Record<string, string>).timeline_item_id] = w as Record<string, unknown>;
    }

    return items.map((ti) => {
      const wb = wbMap[ti.id];
      return {
        id: ti.id,
        title: ti.title,
        startAt: ti.start_at,
        endAt: ti.end_at,
        summary: ti.summary,
        status: ti.status,
        project: wb?.project ?? null,
      };
    });
  }

  async update(userId: string, id: string, dto: UpdateWorkBlockDto) {
    await this.ensureOwnership(userId, id);

    const tiUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.title !== undefined) tiUpdates.title = dto.title;
    if (dto.startAt !== undefined) tiUpdates.start_at = dto.startAt;
    if (dto.endAt !== undefined) tiUpdates.end_at = dto.endAt;
    if (dto.summary !== undefined) tiUpdates.summary = dto.summary;

    if (Object.keys(tiUpdates).length > 1) {
      await this.supabase.from('timeline_items').update(tiUpdates).eq('id', id).eq('user_id', userId);
    }

    if (dto.project !== undefined) {
      await this.supabase
        .from('work_blocks')
        .update({ project: dto.project, updated_at: new Date().toISOString() })
        .eq('timeline_item_id', id);
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
    if (!data) throw new NotFoundException('Work block not found');
  }
}
