import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import {
  CreateHabitDto,
  UpdateHabitDto,
  HabitEntryDto,
} from './dto/habits.dto';

@Injectable()
export class HabitsService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async create(userId: string, dto: CreateHabitDto) {
    const { data, error } = await this.supabase
      .from('habits')
      .insert({
        user_id: userId,
        title: dto.title,
        schedule: dto.schedule ?? {},
        category: dto.category ?? null,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return this.toHabitDto(data);
  }

  async getHabits(userId: string, active?: boolean) {
    let query = this.supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (active !== undefined) query = query.eq('active', active);

    const { data } = await query;
    return (data ?? []).map(this.toHabitDto);
  }

  async update(userId: string, id: string, dto: UpdateHabitDto) {
    await this.ensureOwnership(userId, id);

    const updates: Record<string, unknown> = {};
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.schedule !== undefined) updates.schedule = dto.schedule;
    if (dto.category !== undefined) updates.category = dto.category;
    if (dto.active !== undefined) updates.active = dto.active;
    if (dto.appLink !== undefined) updates.app_link = dto.appLink;
    if (dto.appShortcutId !== undefined) updates.app_shortcut_id = dto.appShortcutId;

    const { data, error } = await this.supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return this.toHabitDto(data);
  }

  async addEntry(userId: string, habitId: string, dto: HabitEntryDto) {
    await this.ensureOwnership(userId, habitId);

    const { data, error } = await this.supabase
      .from('habit_entries')
      .upsert(
        {
          habit_id: habitId,
          user_id: userId,
          date: dto.date,
          status: dto.status,
          note: dto.note ?? null,
        },
        {
          onConflict: 'habit_id,user_id,date',
        },
      )
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getRoutine(userId: string, date: string) {
    const habits = await this.getHabits(userId, true);

    const entries: Record<string, { status: string; note?: string }> = {};
    if (habits.length) {
      const { data } = await this.supabase
        .from('habit_entries')
        .select('habit_id, status, note')
        .eq('user_id', userId)
        .eq('date', date);

      for (const e of data ?? []) {
        entries[(e as Record<string, unknown>).habit_id as string] = {
          status: (e as Record<string, unknown>).status as string,
          note: (e as Record<string, unknown>).note as string | undefined,
        };
      }
    }

    const daysBack = 14;
    const matrix: { habitId: string; habitTitle: string; days: { date: string; status: string | null }[] }[] = [];
    const dates: string[] = [];
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(date);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }

    for (const h of habits) {
      const habitId = h.id as string;
      const habitTitle = h.title as string;
      const { data: matrixEntries } = await this.supabase
        .from('habit_entries')
        .select('date, status')
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .in('date', dates);

      const byDate: Record<string, string> = {};
      for (const e of matrixEntries ?? []) {
        byDate[(e as Record<string, unknown>).date as string] = (
          e as Record<string, unknown>
        ).status as string;
      }

      matrix.push({
        habitId,
        habitTitle,
        days: dates.map((d) => ({ date: d, status: byDate[d] ?? null })),
      });
    }

    const activeHabitsWithToday = habits.map((h) => ({
      ...h,
      todayStatus: entries[h.id as string]?.status ?? null,
    }));

    return {
      flowState: 0.75,
      activeHabits: activeHabitsWithToday,
      consistencyMatrix: matrix,
    };
  }

  private toHabitDto(row: Record<string, unknown>) {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      schedule: row.schedule ?? {},
      active: row.active ?? true,
      appLink: row.app_link ?? null,
    };
  }

  async getHabit(userId: string, id: string) {
    const { data, error } = await this.supabase
      .from('habits')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Habit not found');

    const dto = this.toHabitDto(data) as Record<string, unknown>;
    const shortcutId = (data as Record<string, unknown>).app_shortcut_id as string | null | undefined;

    if (shortcutId) {
      const { data: sc } = await this.supabase
        .from('app_shortcuts')
        .select('id, title, url, store_url')
        .eq('id', shortcutId)
        .single();
      if (sc) {
        dto.shortcut = {
          id: (sc as Record<string, unknown>).id,
          label: ((sc as Record<string, unknown>).title as string) ?? 'App',
          url: (sc as Record<string, unknown>).url as string,
          storeUrl: ((sc as Record<string, unknown>).store_url as string) ?? '',
        };
      }
    } else if ((data as Record<string, unknown>).app_link) {
      dto.shortcut = {
        id: null,
        label: 'App',
        url: (data as Record<string, unknown>).app_link as string,
        storeUrl: '',
      };
    }
    return dto;
  }

  private async ensureOwnership(userId: string, habitId: string) {
    const { data } = await this.supabase
      .from('habits')
      .select('id')
      .eq('id', habitId)
      .eq('user_id', userId)
      .single();

    if (!data) throw new NotFoundException('Habit not found');
  }
}
