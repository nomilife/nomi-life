import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/subscriptions.dto';

@Injectable()
export class SubscriptionsService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async create(userId: string, dto: CreateSubscriptionDto) {
    const { data: ti, error: tiErr } = await this.supabase
      .from('timeline_items')
      .insert({
        user_id: userId,
        kind: 'subscription',
        start_at: null,
        end_at: null,
        title: dto.title,
        summary: dto.summary ?? null,
        status: 'scheduled',
      })
      .select('id')
      .single();

    if (tiErr || !ti) throw new Error(tiErr?.message ?? 'Failed to create timeline item');

    const { error: subErr } = await this.supabase.from('subscriptions').insert({
      timeline_item_id: ti.id,
      vendor: dto.vendor,
      amount: dto.amount ?? null,
      currency: dto.currency ?? 'TRY',
      billing_cycle: dto.billingCycle,
      next_bill_date: dto.nextBillDate,
      autopay: dto.autopay ?? false,
    });

    if (subErr) throw new Error(subErr.message);
    return this.getOne(userId, ti.id);
  }

  async getOne(userId: string, id: string) {
    const { data: ti } = await this.supabase
      .from('timeline_items')
      .select('id, title, start_at, end_at, summary, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!ti) throw new NotFoundException('Subscription not found');

    const { data: s, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('timeline_item_id', id)
      .single();

    if (error || !s) throw new NotFoundException('Subscription not found');

    return {
      id: (s as Record<string, unknown>).timeline_item_id,
      title: ti.title,
      summary: ti.summary,
      status: ti.status,
      vendor: (s as Record<string, unknown>).vendor,
      amount: (s as Record<string, unknown>).amount,
      currency: (s as Record<string, unknown>).currency,
      billingCycle: (s as Record<string, unknown>).billing_cycle,
      nextBillDate: (s as Record<string, unknown>).next_bill_date,
      autopay: (s as Record<string, unknown>).autopay,
    };
  }

  async getList(userId: string, start?: string, end?: string, date?: string) {
    const { data: items } = await this.supabase
      .from('timeline_items')
      .select('id, title, summary, status')
      .eq('user_id', userId)
      .eq('kind', 'subscription');

    if (!items?.length) return [];

    const ids = items.map((r) => r.id);
    let subQuery = this.supabase
      .from('subscriptions')
      .select('timeline_item_id, vendor, amount, currency, billing_cycle, next_bill_date, autopay')
      .in('timeline_item_id', ids);

    if (start) subQuery = subQuery.gte('next_bill_date', start.slice(0, 10));
    if (end) subQuery = subQuery.lte('next_bill_date', end.slice(0, 10));
    if (date) subQuery = subQuery.eq('next_bill_date', date.slice(0, 10));

    const { data: subs } = await subQuery.order('next_bill_date', { ascending: true });
    const subMap: Record<string, Record<string, unknown>> = {};
    for (const s of subs ?? []) {
      subMap[(s as Record<string, string>).timeline_item_id] = s as Record<string, unknown>;
    }

    const filteredIds = (start || end || date) ? Object.keys(subMap) : ids;
    return filteredIds
      .map((id) => {
        const ti = items.find((i) => i.id === id);
        const s = subMap[id];
        if (!ti || !s) return null;
        return {
          id: s.timeline_item_id,
          title: ti.title,
          summary: ti.summary,
          status: ti.status,
          vendor: s.vendor,
          amount: s.amount,
          currency: s.currency,
          billingCycle: s.billing_cycle,
          nextBillDate: s.next_bill_date,
          autopay: s.autopay,
        };
      })
      .filter(Boolean) as Array<Record<string, unknown>>;
  }

  async update(userId: string, id: string, dto: UpdateSubscriptionDto) {
    await this.ensureOwnership(userId, id);

    const tiUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.title !== undefined) tiUpdates.title = dto.title;
    if (dto.summary !== undefined) tiUpdates.summary = dto.summary;

    if (Object.keys(tiUpdates).length > 1) {
      await this.supabase.from('timeline_items').update(tiUpdates).eq('id', id).eq('user_id', userId);
    }

    const subUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.vendor !== undefined) subUpdates.vendor = dto.vendor;
    if (dto.amount !== undefined) subUpdates.amount = dto.amount;
    if (dto.currency !== undefined) subUpdates.currency = dto.currency;
    if (dto.billingCycle !== undefined) subUpdates.billing_cycle = dto.billingCycle;
    if (dto.nextBillDate !== undefined) subUpdates.next_bill_date = dto.nextBillDate;
    if (dto.autopay !== undefined) subUpdates.autopay = dto.autopay;

    if (Object.keys(subUpdates).length > 1) {
      await this.supabase.from('subscriptions').update(subUpdates).eq('timeline_item_id', id);
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
    if (!data) throw new NotFoundException('Subscription not found');
  }
}
