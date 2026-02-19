import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { CreateTaskDto, UpdateTaskDto } from './dto/tasks.dto';

@Injectable()
export class TasksService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async create(userId: string, dto: CreateTaskDto) {
    const startAt = dto.dueDate && dto.dueTime
      ? `${dto.dueDate}T${dto.dueTime}:00.000Z`
      : dto.dueDate
        ? `${dto.dueDate}T23:59:59.999Z`
        : null;

    const { data: ti, error: tiErr } = await this.supabase
      .from('timeline_items')
      .insert({
        user_id: userId,
        kind: 'task',
        start_at: startAt,
        end_at: null,
        title: dto.title,
        summary: dto.summary ?? null,
        status: 'scheduled',
        priority: dto.priority ?? 'normal',
        life_area: dto.lifeArea ?? null,
      })
      .select('id')
      .single();

    if (tiErr || !ti) throw new Error(tiErr?.message ?? 'Failed to create timeline item');

    const { error: taskErr } = await this.supabase.from('tasks').insert({
      timeline_item_id: ti.id,
      due_date: dto.dueDate ?? null,
      priority: dto.priority ?? 'normal',
      life_area: dto.lifeArea ?? null,
    });

    if (taskErr) throw new Error(taskErr.message);
    return this.getOne(userId, ti.id);
  }

  async getOne(userId: string, id: string) {
    const { data: ti } = await this.supabase
      .from('timeline_items')
      .select('id, title, start_at, end_at, summary, status, priority, life_area')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!ti) throw new NotFoundException('Task not found');

    const { data: t, error } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('timeline_item_id', id)
      .single();

    if (error || !t) throw new NotFoundException('Task not found');

    const task = t as Record<string, unknown>;
    return {
      id: task.timeline_item_id,
      title: ti.title,
      startAt: ti.start_at,
      endAt: ti.end_at,
      summary: ti.summary,
      status: ti.status,
      priority: task.priority ?? ti.priority,
      lifeArea: task.life_area ?? ti.life_area,
      dueDate: task.due_date,
      completedAt: task.completed_at,
    };
  }

  async getList(userId: string, start?: string, end?: string, date?: string) {
    const { data: items } = await this.supabase
      .from('timeline_items')
      .select('id, title, start_at, end_at, summary, status')
      .eq('user_id', userId)
      .eq('kind', 'task')
      .order('start_at', { ascending: true, nullsFirst: true });

    if (!items?.length) return [];

    const ids = items.map((r) => r.id);
    const { data: tasks } = await this.supabase
      .from('tasks')
      .select('timeline_item_id, due_date, priority, completed_at, life_area')
      .in('timeline_item_id', ids);

    const taskMap: Record<string, Record<string, unknown>> = {};
    for (const t of tasks ?? []) {
      taskMap[(t as Record<string, string>).timeline_item_id] = t as Record<string, unknown>;
    }

    const startVal = start?.slice(0, 10);
    const endVal = end?.slice(0, 10);
    const dateVal = date?.slice(0, 10);

    const filteredItems = items.filter((i) => {
      if (!startVal && !endVal && !dateVal) return true;
      const t = taskMap[i.id];
      const due = (t?.due_date as string | null) ?? null;
      if (!due) return !dateVal;
      if (dateVal) return due.slice(0, 10) === dateVal;
      if (startVal && due < startVal) return false;
      if (endVal && due > endVal) return false;
      return true;
    });

    return filteredItems.map((ti) => {
      const t = taskMap[ti.id];
      return {
        id: ti.id,
        title: ti.title,
        startAt: ti.start_at,
        endAt: ti.end_at,
        summary: ti.summary,
        status: ti.status,
        priority: t?.priority ?? 'normal',
        lifeArea: t?.life_area ?? null,
        dueDate: t?.due_date ?? null,
        completedAt: t?.completed_at ?? null,
      };
    });
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    await this.ensureOwnership(userId, id);

    const startAt = dto.dueDate !== undefined && (dto.dueTime !== undefined || dto.dueDate)
      ? dto.dueDate && dto.dueTime
        ? `${dto.dueDate}T${dto.dueTime}:00.000Z`
        : dto.dueDate
          ? `${dto.dueDate}T23:59:59.999Z`
          : null
      : undefined;

    const tiUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.title !== undefined) tiUpdates.title = dto.title;
    if (dto.summary !== undefined) tiUpdates.summary = dto.summary;
    if (dto.priority !== undefined) tiUpdates.priority = dto.priority;
    if (dto.lifeArea !== undefined) tiUpdates.life_area = dto.lifeArea;
    if (startAt !== undefined) tiUpdates.start_at = startAt;

    if (Object.keys(tiUpdates).length > 1) {
      await this.supabase.from('timeline_items').update(tiUpdates).eq('id', id).eq('user_id', userId);
    }

    const taskUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.dueDate !== undefined) taskUpdates.due_date = dto.dueDate;
    if (dto.priority !== undefined) taskUpdates.priority = dto.priority;
    if (dto.lifeArea !== undefined) taskUpdates.life_area = dto.lifeArea;
    if (dto.completedAt !== undefined) taskUpdates.completed_at = dto.completedAt;

    if (Object.keys(taskUpdates).length > 1) {
      await this.supabase.from('tasks').update(taskUpdates).eq('timeline_item_id', id);
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
    if (!data) throw new NotFoundException('Task not found');
  }
}
