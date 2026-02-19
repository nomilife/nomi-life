import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { CreateShortcutDto, UpdateShortcutDto } from './dto/shortcuts.dto';

@Injectable()
export class ShortcutsService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async create(userId: string, dto: CreateShortcutDto) {
    const { data, error } = await this.supabase
      .from('app_shortcuts')
      .insert({
        user_id: userId,
        title: dto.title ?? null,
        url: dto.url,
        kind: dto.kind ?? 'other',
        store_url: dto.storeUrl ?? null,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return this.toDto(data);
  }

  async list(userId: string) {
    const { data, error } = await this.supabase
      .from('app_shortcuts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(this.toDto);
  }

  async get(userId: string, id: string) {
    const { data, error } = await this.supabase
      .from('app_shortcuts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Shortcut not found');
    return this.toDto(data);
  }

  async update(userId: string, id: string, dto: UpdateShortcutDto) {
    await this.get(userId, id);

    const updates: Record<string, unknown> = {};
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.url !== undefined) updates.url = dto.url;
    if (dto.kind !== undefined) updates.kind = dto.kind;
    if (dto.storeUrl !== undefined) updates.store_url = dto.storeUrl;

    const { data, error } = await this.supabase
      .from('app_shortcuts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return this.toDto(data);
  }

  async delete(userId: string, id: string) {
    const { error } = await this.supabase
      .from('app_shortcuts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  }

  private toDto(row: Record<string, unknown>) {
    return {
      id: row.id,
      title: row.title ?? null,
      url: row.url,
      kind: row.kind ?? 'other',
      storeUrl: row.store_url ?? null,
      createdAt: row.created_at,
    };
  }
}
