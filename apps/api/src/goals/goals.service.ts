import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { CreateGoalDto, UpdateGoalDto } from './dto/goals.dto';

@Injectable()
export class GoalsService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async create(userId: string, dto: CreateGoalDto) {
    const { data: ti, error: tiErr } = await this.supabase
      .from('timeline_items')
      .insert({
        user_id: userId,
        kind: 'goal',
        start_at: null,
        end_at: null,
        title: dto.title,
        summary: dto.summary ?? null,
        status: 'scheduled',
        life_area: dto.lifeArea ?? null,
      })
      .select('id')
      .single();

    if (tiErr || !ti) throw new Error(tiErr?.message ?? 'Failed to create timeline item');

    const { error: goalErr } = await this.supabase.from('goals').insert({
      timeline_item_id: ti.id,
      target_date: dto.targetDate ?? null,
      life_area: dto.lifeArea ?? null,
      progress: dto.progress ?? 0,
    });

    if (goalErr) throw new Error(goalErr.message);
    return this.getOne(userId, ti.id);
  }

  async getOne(userId: string, id: string) {
    const { data: ti } = await this.supabase
      .from('timeline_items')
      .select('id, title, start_at, end_at, summary, status, life_area')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!ti) throw new NotFoundException('Goal not found');

    const { data: g, error } = await this.supabase
      .from('goals')
      .select('*')
      .eq('timeline_item_id', id)
      .single();

    if (error || !g) throw new NotFoundException('Goal not found');

    return {
      id: (g as Record<string, unknown>).timeline_item_id,
      title: ti.title,
      summary: ti.summary,
      status: ti.status,
      lifeArea: (g as Record<string, unknown>).life_area ?? ti.life_area,
      targetDate: (g as Record<string, unknown>).target_date,
      progress: (g as Record<string, unknown>).progress ?? 0,
    };
  }

  async getList(userId: string, start?: string, end?: string, date?: string) {
    const { data: items } = await this.supabase
      .from('timeline_items')
      .select('id, title, summary, status')
      .eq('user_id', userId)
      .eq('kind', 'goal');

    if (!items?.length) return [];

    const ids = items.map((r) => r.id);
    let goalQuery = this.supabase
      .from('goals')
      .select('timeline_item_id, target_date, life_area, progress')
      .in('timeline_item_id', ids);

    if (start) goalQuery = goalQuery.gte('target_date', start.slice(0, 10));
    if (end) goalQuery = goalQuery.lte('target_date', end.slice(0, 10));
    if (date) goalQuery = goalQuery.eq('target_date', date.slice(0, 10));

    const { data: goals } = await goalQuery.order('target_date', { ascending: true, nullsFirst: true });
    const goalMap: Record<string, Record<string, unknown>> = {};
    for (const g of goals ?? []) {
      goalMap[(g as Record<string, string>).timeline_item_id] = g as Record<string, unknown>;
    }

    const filteredIds = (start || end || date) ? Object.keys(goalMap) : ids;
    return filteredIds
      .map((id) => {
        const ti = items.find((i) => i.id === id);
        const g = goalMap[id];
        if (!ti) return null;
        return {
          id: id,
          title: ti.title,
          summary: ti.summary,
          status: ti.status,
          lifeArea: g?.life_area ?? null,
          targetDate: g?.target_date ?? null,
          progress: g?.progress ?? 0,
        };
      })
      .filter(Boolean) as Array<Record<string, unknown>>;
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    await this.ensureOwnership(userId, id);

    const tiUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.title !== undefined) tiUpdates.title = dto.title;
    if (dto.summary !== undefined) tiUpdates.summary = dto.summary;
    if (dto.lifeArea !== undefined) tiUpdates.life_area = dto.lifeArea;

    if (Object.keys(tiUpdates).length > 1) {
      await this.supabase.from('timeline_items').update(tiUpdates).eq('id', id).eq('user_id', userId);
    }

    if (dto.targetDate !== undefined || dto.lifeArea !== undefined || dto.progress !== undefined) {
      const goalUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (dto.targetDate !== undefined) goalUpdates.target_date = dto.targetDate;
      if (dto.lifeArea !== undefined) goalUpdates.life_area = dto.lifeArea;
      if (dto.progress !== undefined) goalUpdates.progress = dto.progress;
      await this.supabase.from('goals').update(goalUpdates).eq('timeline_item_id', id);
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
    if (!data) throw new NotFoundException('Goal not found');
  }
}
