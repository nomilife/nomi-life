import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { EventsService } from '../events/events.service';
import {
  TimelineResponseDto,
  TimelineItemDto,
  CreateTimelineItemDto,
  UpdateTimelineItemDto,
} from './dto/timeline.dto';

@Injectable()
export class TimelineService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private eventsService: EventsService,
  ) {}

  async getTimeline(userId: string, date: string): Promise<TimelineResponseDto> {
    const start = `${date}T00:00:00.000Z`;
    const end = `${date}T23:59:59.999Z`;
    const dateStr = date.slice(0, 10);

    const { data, error } = await this.supabase
      .from('timeline_items')
      .select('*')
      .eq('user_id', userId)
      .or(`and(start_at.gte.${start},start_at.lte.${end}),start_at.is.null`)
      .order('start_at', { ascending: true, nullsFirst: true });

    if (error) throw new Error(error.message);

    const rows = data ?? [];

    // Include accepted shared events (invites user accepted)
    const sharedEvents = await this.eventsService.getShared(userId);
    const sharedIds = new Set(rows.map((r) => r.id));
    for (const ev of sharedEvents) {
      const evStart = (ev as { startAt?: string }).startAt;
      if (!evStart || evStart < start || evStart > end) continue;
      const tiId = (ev as { id: string }).id;
      if (sharedIds.has(tiId)) continue;
      sharedIds.add(tiId);
      rows.push({
        id: tiId,
        kind: 'event',
        user_id: userId,
        start_at: evStart,
        end_at: (ev as { endAt?: string }).endAt ?? null,
        title: (ev as { title?: string }).title ?? '',
        summary: null,
        status: (ev as { status?: string }).status ?? 'scheduled',
        metadata: { source: 'shared' },
      });
    }
    const billIds = rows.filter((r) => r.kind === 'bill').map((r) => r.id);
    const eventIds = rows.filter((r) => r.kind === 'event').map((r) => r.id);

    let billsMap: Record<string, Record<string, unknown>> = {};
    if (billIds.length) {
      const { data: bills } = await this.supabase
        .from('bills')
        .select('timeline_item_id, vendor, amount, due_date, autopay, currency')
        .in('timeline_item_id', billIds);
      for (const b of bills ?? []) {
        billsMap[(b as Record<string, unknown>).timeline_item_id as string] = b as Record<string, unknown>;
      }
    }

    let eventsMap: Record<string, Record<string, unknown>> = {};
    const participantsByEvent: Record<string, Array<{ email?: string; displayName?: string }>> = {};
    if (eventIds.length) {
      const { data: evs } = await this.supabase
        .from('events')
        .select('timeline_item_id, location, visibility')
        .in('timeline_item_id', eventIds);
      for (const e of evs ?? []) {
        eventsMap[(e as Record<string, unknown>).timeline_item_id as string] = e as Record<string, unknown>;
      }
      const { data: parts } = await this.supabase
        .from('event_participants')
        .select('event_id, user_id, invited_email')
        .in('event_id', eventIds);
      if (parts?.length) {
        const userIds = [...new Set((parts as Array<{ user_id?: string }>).map((p) => p.user_id).filter(Boolean))] as string[];
        let profilesMap: Record<string, { display_name?: string; email: string }> = {};
        if (userIds.length) {
          const { data: profiles } = await this.supabase
            .from('profiles')
            .select('user_id, display_name, email')
            .in('user_id', userIds);
          for (const pr of profiles ?? []) {
            const pid = (pr as Record<string, string>).user_id;
            profilesMap[pid] = {
              display_name: (pr as Record<string, string>).display_name,
              email: (pr as Record<string, string>).email,
            };
          }
        }
        for (const p of parts as Array<{ event_id: string; user_id?: string; invited_email?: string }>) {
          if (!participantsByEvent[p.event_id]) participantsByEvent[p.event_id] = [];
          const prof = p.user_id ? profilesMap[p.user_id] : null;
          const email = p.invited_email ?? prof?.email;
          const displayName = prof?.display_name;
          participantsByEvent[p.event_id].push({ email, displayName });
        }
      }
    }

    const dow = new Date(dateStr + 'T12:00:00').getDay(); // 0=pazar, 6=cumartesi

    // Habit blocks: habits with schedule.days including today's weekday
    const { data: habitsRows } = await this.supabase
      .from('habits')
      .select('id, title, schedule')
      .eq('user_id', userId)
      .eq('active', true);

    const habitBlocks: TimelineItemDto[] = [];
    for (const h of habitsRows ?? []) {
      const sched = (h.schedule as { days?: number[]; time?: string }) ?? {};
      const days = Array.isArray(sched.days) ? sched.days : [0, 1, 2, 3, 4, 5, 6];
      if (!days.includes(dow)) continue;
      const time = (sched.time as string) ?? '09:00';
      const [th, tm] = time.split(':').map(Number);
      const startAt = `${dateStr}T${String(th).padStart(2, '0')}:${String(tm ?? 0).padStart(2, '0')}:00.000Z`;
      const endAt = `${dateStr}T${String((th + 1) % 24).padStart(2, '0')}:${String(tm ?? 0).padStart(2, '0')}:00.000Z`;
      habitBlocks.push({
        id: h.id as string,
        kind: 'habit_block',
        startAt,
        endAt,
        title: h.title as string,
        summary: null,
        status: 'scheduled',
        metadata: { habitId: h.id },
      });
    }

    const items = rows
      .map((row) => {
        const base = {
          id: row.id,
          kind: row.kind,
          startAt: row.start_at,
          endAt: row.end_at,
          title: row.title,
          summary: row.summary,
          status: row.status,
          metadata: row.metadata ?? {},
        };
        if (row.kind === 'bill' && billsMap[row.id]) {
          const b = billsMap[row.id];
          return { ...base, vendor: b.vendor, amount: b.amount, dueDate: b.due_date, autopay: b.autopay, currency: b.currency };
        }
        if (row.kind === 'event' && eventsMap[row.id]) {
          const e = eventsMap[row.id];
          const participants = participantsByEvent[row.id] ?? [];
          return {
            ...base,
            location: e.location,
            visibility: e.visibility,
            metadata: {
              ...(base.metadata as Record<string, unknown>),
              participantCount: participants.length,
              participants: participants.map((p) => ({ email: p.email, displayName: p.displayName })),
            },
          };
        }
        return base;
      })
      .filter((item) => {
        if (item.kind === 'bill' && (item as Record<string, unknown>).dueDate) {
          return String((item as Record<string, unknown>).dueDate).slice(0, 10) === dateStr;
        }
        return true;
      });

    const merged: TimelineItemDto[] = [...(items as TimelineItemDto[]), ...habitBlocks].sort((a, b) => {
      const aT = (a.startAt as string) ?? '';
      const bT = (b.startAt as string) ?? '';
      return aT.localeCompare(bT);
    });

    return {
      date,
      items: merged,
      highlights: {
        focusState: 0.84,
        netLiquid: 1240,
        bioSync: 'optimal',
      },
    };
  }

  /** Batch fetch timeline for date range (max 42 days). Reduces N requests to 1. */
  async getTimelineRange(
    userId: string,
    start: string,
    end: string,
  ): Promise<{ dates: Record<string, TimelineResponseDto> }> {
    const startDate = new Date(start.slice(0, 10) + 'T12:00:00Z');
    const endDate = new Date(end.slice(0, 10) + 'T12:00:00Z');
    const days = Math.min(42, Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1));
    const dates: Record<string, TimelineResponseDto> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      if (dateStr > end.slice(0, 10)) break;
      dates[dateStr] = await this.getTimeline(userId, dateStr);
    }
    return { dates };
  }

  async createItem(userId: string, dto: CreateTimelineItemDto) {
    const { data, error } = await this.supabase
      .from('timeline_items')
      .insert({
        user_id: userId,
        kind: dto.kind,
        start_at: dto.startAt ?? null,
        end_at: dto.endAt ?? null,
        title: dto.title,
        summary: dto.summary ?? null,
        status: dto.status ?? 'scheduled',
        metadata: dto.metadata ?? {},
      })
      .select('id, kind, start_at, end_at, title, summary, status, metadata')
      .single();

    if (error) throw new Error(error.message);
    return this.toItemDto(data);
  }

  async updateItem(userId: string, id: string, dto: UpdateTimelineItemDto) {
    const { data, error } = await this.supabase
      .from('timeline_items')
      .update({
        ...(dto.startAt !== undefined && { start_at: dto.startAt }),
        ...(dto.endAt !== undefined && { end_at: dto.endAt }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.summary !== undefined && { summary: dto.summary }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, kind, start_at, end_at, title, summary, status, metadata')
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException('Timeline item not found');
    return this.toItemDto(data);
  }

  async getWeeklyInsights(userId: string) {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }

    let activeDaysCount = 0;
    let eventsCount = 0;
    let socialEventsCount = 0;
    let billsTotal = 0;

    for (const dateStr of dates) {
      const start = `${dateStr}T00:00:00.000Z`;
      const end = `${dateStr}T23:59:59.999Z`;

      const { data: items } = await this.supabase
        .from('timeline_items')
        .select('id, kind')
        .eq('user_id', userId)
        .or(`and(start_at.gte.${start},start_at.lte.${end}),start_at.is.null`);

      const rows = (items ?? []) as { id: string; kind: string }[];
      const eventIds = rows.filter((r) => r.kind === 'event').map((r) => r.id);
      const billIds = rows.filter((r) => r.kind === 'bill').map((r) => r.id);

      let dayHasItems = false;

      if (eventIds.length) {
        const { data: evs } = await this.supabase
          .from('events')
          .select('timeline_item_id, visibility')
          .in('timeline_item_id', eventIds);
        for (const e of evs ?? []) {
          const ev = e as { timeline_item_id: string; visibility: string };
          eventsCount++;
          if (ev.visibility === 'shared') socialEventsCount++;
          dayHasItems = true;
        }
      }

      if (billIds.length) {
        const { data: bills } = await this.supabase
          .from('bills')
          .select('timeline_item_id, amount, due_date')
          .in('timeline_item_id', billIds);
        for (const b of bills ?? []) {
          const bill = b as { amount: number | null; due_date: string };
          const due = String(bill.due_date).slice(0, 10);
          if (due === dateStr && bill.amount != null) {
            billsTotal += bill.amount;
          }
          dayHasItems = true;
        }
      }

      if (dayHasItems) activeDaysCount++;
    }

    return {
      period: { start: dates[0], end: dates[dates.length - 1] },
      activeDaysCount,
      eventsCount,
      socialEventsCount,
      billsTotal,
    };
  }

  private toItemDto(row: Record<string, unknown>) {
    return {
      id: row.id,
      kind: row.kind,
      startAt: row.start_at,
      endAt: row.end_at,
      title: row.title,
      summary: row.summary,
      status: row.status,
      metadata: row.metadata ?? {},
    };
  }
}
