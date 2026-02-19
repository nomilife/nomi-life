import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { CreateBillDto, UpdateBillDto, AmountDto } from './dto/bills.dto';

@Injectable()
export class BillsService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async create(userId: string, dto: CreateBillDto) {
    const { data: ti, error: tiErr } = await this.supabase
      .from('timeline_items')
      .insert({
        user_id: userId,
        kind: 'bill',
        start_at: null,
        end_at: null,
        title: dto.vendor,
        summary: null,
        status: 'scheduled',
      })
      .select('id')
      .single();

    if (tiErr || !ti) throw new Error(tiErr?.message ?? 'Failed to create timeline item');

    const { error: billErr } = await this.supabase.from('bills').insert({
      timeline_item_id: ti.id,
      vendor: dto.vendor,
      amount: dto.amount ?? null,
      due_date: dto.dueDate,
      recurrence: dto.recurrence ?? null,
      autopay: dto.autopay ?? false,
    });

    if (billErr) throw new Error(billErr.message);

    return this.getBill(userId, ti.id);
  }

  async getBills(userId: string, range?: 'month' | 'upcoming') {
    const { data: items } = await this.supabase
      .from('timeline_items')
      .select('id')
      .eq('user_id', userId)
      .eq('kind', 'bill');

    if (!items?.length) return [];

    const ids = items.map((r) => r.id);
    let query = this.supabase.from('bills').select('*').in('timeline_item_id', ids);

    if (range === 'month') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
      query = query.gte('due_date', start).lte('due_date', end);
    } else if (range === 'upcoming') {
      const today = new Date().toISOString().slice(0, 10);
      query = query.gte('due_date', today);
    }

    const { data } = await query.order('due_date', { ascending: true });
    return (data ?? []).map((b: Record<string, unknown>) => ({
      id: b.timeline_item_id,
      vendor: b.vendor,
      amount: b.amount,
      currency: b.currency,
      dueDate: b.due_date,
      recurrence: b.recurrence,
      autopay: b.autopay,
      lastAmount: b.last_amount,
    }));
  }

  async getBill(userId: string, id: string) {
    const { data: ti } = await this.supabase
      .from('timeline_items')
      .select('id, metadata')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!ti) throw new NotFoundException('Bill not found');

    const { data: b, error } = await this.supabase
      .from('bills')
      .select('*')
      .eq('timeline_item_id', id)
      .single();

    if (error || !b) throw new NotFoundException('Bill not found');

    const metadata = (ti as Record<string, unknown>).metadata as Record<string, unknown> | null;
    const appLink = (metadata?.appLink as string) ?? null;

    return {
      id: (b as Record<string, unknown>).timeline_item_id,
      vendor: (b as Record<string, unknown>).vendor,
      amount: (b as Record<string, unknown>).amount,
      currency: (b as Record<string, unknown>).currency,
      dueDate: (b as Record<string, unknown>).due_date,
      recurrence: (b as Record<string, unknown>).recurrence,
      autopay: (b as Record<string, unknown>).autopay,
      lastAmount: (b as Record<string, unknown>).last_amount,
      appLink,
    };
  }

  async update(userId: string, id: string, dto: UpdateBillDto) {
    await this.ensureOwnership(userId, id);

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (dto.vendor !== undefined) updates.vendor = dto.vendor;
    if (dto.dueDate !== undefined) updates.due_date = dto.dueDate;
    if (dto.recurrence !== undefined) updates.recurrence = dto.recurrence;
    if (dto.autopay !== undefined) updates.autopay = dto.autopay;
    if (dto.amount !== undefined) updates.amount = dto.amount;

    await this.supabase.from('bills').update(updates).eq('timeline_item_id', id);

    const tiUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.vendor) tiUpdates.title = dto.vendor;
    if (dto.appLink !== undefined) {
      const { data: ti } = await this.supabase.from('timeline_items').select('metadata').eq('id', id).single();
      const meta = ((ti as Record<string, unknown>)?.metadata as Record<string, unknown>) ?? {};
      tiUpdates.metadata = { ...meta, appLink: dto.appLink };
    }
    if (dto.vendor || dto.appLink !== undefined) {
      await this.supabase.from('timeline_items').update(tiUpdates).eq('id', id);
    }

    return this.getBill(userId, id);
  }

  async updateAmount(userId: string, id: string, dto: AmountDto) {
    await this.ensureOwnership(userId, id);

    const { data: b } = await this.supabase
      .from('bills')
      .select('amount')
      .eq('timeline_item_id', id)
      .single();

    await this.supabase
      .from('bills')
      .update({
        amount: dto.amount,
        last_amount: (b as Record<string, unknown>)?.amount ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('timeline_item_id', id);

    return this.getBill(userId, id);
  }

  private async ensureOwnership(userId: string, timelineItemId: string) {
    const { data } = await this.supabase
      .from('timeline_items')
      .select('id')
      .eq('id', timelineItemId)
      .eq('user_id', userId)
      .single();

    if (!data) throw new NotFoundException('Bill not found');
  }
}
