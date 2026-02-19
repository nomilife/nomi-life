import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateEventDto,
  UpdateEventDto,
  InviteDto,
  RsvpDto,
  MessageDto,
} from './dto/events.dto';

@Injectable()
export class EventsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private notifications: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateEventDto) {
    let recurrenceRuleId: string | null = null;

    if (dto.recurrenceRrule) {
      const { data: rr } = await this.supabase
        .from('recurrence_rules')
        .insert({
          user_id: userId,
          rrule: dto.recurrenceRrule,
          timezone: 'UTC',
        })
        .select('id')
        .single();
      recurrenceRuleId = rr?.id ?? null;
    }

    const { data: ti, error: tiErr } = await this.supabase
      .from('timeline_items')
      .insert({
        user_id: userId,
        kind: 'event',
        start_at: dto.startAt,
        end_at: dto.endAt,
        title: dto.title,
        summary: null,
        status: 'scheduled',
      })
      .select('id')
      .single();

    if (tiErr || !ti) throw new Error(tiErr?.message ?? 'Failed to create timeline item');

    const { data: ev, error: evErr } = await this.supabase
      .from('events')
      .insert({
        timeline_item_id: ti.id,
        location: dto.location ?? null,
        visibility: dto.visibility,
        recurrence_rule_id: recurrenceRuleId,
      })
      .select('timeline_item_id')
      .single();

    if (evErr || !ev) throw new Error(evErr?.message ?? 'Failed to create event');

    await this.supabase.from('event_participants').insert({
      event_id: ev.timeline_item_id,
      user_id: userId,
      role: 'host',
      rsvp_status: 'accepted',
    });

    const { data: conv } = await this.supabase
      .from('conversations')
      .insert({ event_id: ev.timeline_item_id })
      .select('id')
      .single();

    const hostName = await this.getDisplayName(userId);
    const eventTitle = dto.title;

    for (const email of dto.participantsEmails ?? []) {
      const norm = email.trim().toLowerCase();
      const invitee = await this.findUserByEmail(norm);
      if (invitee) {
        await this.supabase.from('event_participants').insert({
          event_id: ev.timeline_item_id,
          user_id: invitee.user_id,
          invited_email: norm,
          role: 'guest',
          rsvp_status: 'pending',
        });
        await this.notifications.sendEventInvite(invitee.user_id, eventTitle, ev.timeline_item_id, hostName);
      } else {
        await this.supabase.from('event_participants').insert({
          event_id: ev.timeline_item_id,
          invited_email: norm,
          role: 'guest',
          rsvp_status: 'pending',
        });
      }
    }

    return this.getEvent(userId, ev.timeline_item_id);
  }

  async getInvites(userId: string) {
    const { data: { user } } = await this.supabase.auth.admin.getUserById(userId);
    const userEmail = user?.email;

    let participants: { event_id: string }[] = [];
    const { data: byUserId } = await this.supabase
      .from('event_participants')
      .select('event_id')
      .eq('user_id', userId)
      .eq('rsvp_status', 'pending');
    participants = byUserId ?? [];

    if (userEmail) {
      const normEmail = userEmail.trim().toLowerCase();
      const { data: byEmail } = await this.supabase
        .from('event_participants')
        .select('event_id')
        .or(`invited_email.eq.${normEmail},invited_email.eq.${userEmail.trim()}`)
        .eq('rsvp_status', 'pending');
      const ids = new Set(participants.map((p) => p.event_id));
      for (const p of byEmail ?? []) {
        if (!ids.has(p.event_id)) {
          participants.push(p);
          ids.add(p.event_id);
        }
      }
    }

    if (!participants.length) return [];

    const eventIds = participants.map((p) => p.event_id);
    const { data: events } = await this.supabase
      .from('events')
      .select(`
        timeline_item_id,
        location,
        visibility,
        timeline_items!inner (id, title, start_at, end_at, summary, status)
      `)
      .in('timeline_item_id', eventIds);

    const { data: hosts } = await this.supabase
      .from('event_participants')
      .select('event_id, user_id')
      .eq('role', 'host')
      .in('event_id', eventIds);

    const hostByEvent: Record<string, string> = {};
    for (const h of hosts ?? []) {
      hostByEvent[h.event_id] = h.user_id;
    }

    return (events ?? []).map((ev: Record<string, unknown>) => {
      const ti = ev.timeline_items as Record<string, unknown>;
      return {
        id: ev.timeline_item_id,
        title: ti?.title,
        startAt: ti?.start_at,
        endAt: ti?.end_at,
        location: ev.location,
        hostId: hostByEvent[ev.timeline_item_id as string],
      };
    });
  }

  async getShared(userId: string) {
    const { data: participants } = await this.supabase
      .from('event_participants')
      .select('event_id')
      .eq('user_id', userId)
      .eq('rsvp_status', 'accepted');

    if (!participants?.length) return [];

    const eventIds = participants.map((p) => p.event_id);
    const { data: events } = await this.supabase
      .from('events')
      .select(`
        timeline_item_id,
        location,
        visibility,
        timeline_items!inner (id, title, start_at, end_at, summary, status)
      `)
      .in('timeline_item_id', eventIds)
      .eq('visibility', 'shared');

    return (events ?? []).map((ev: Record<string, unknown>) => {
      const ti = ev.timeline_items as Record<string, unknown>;
      return {
        id: ev.timeline_item_id,
        title: ti?.title,
        startAt: ti?.start_at,
        endAt: ti?.end_at,
        location: ev.location,
        status: ti?.status,
      };
    });
  }

  async getCoplanners(userId: string) {
    const { data: myParticipants } = await this.supabase
      .from('event_participants')
      .select('event_id')
      .eq('user_id', userId)
      .eq('rsvp_status', 'accepted');

    if (!myParticipants?.length) return { friends: [], sharedPlans: [] };

    const eventIds = myParticipants.map((p) => p.event_id);
    const { data: sharedEvents } = await this.supabase
      .from('events')
      .select(`
        timeline_item_id,
        location,
        timeline_items!inner (id, title, start_at, end_at, summary, status)
      `)
      .in('timeline_item_id', eventIds)
      .eq('visibility', 'shared');

    if (!sharedEvents?.length) return { friends: [], sharedPlans: [] };

    const allEventIds = sharedEvents.map((e) => e.timeline_item_id);
    const { data: allParticipants } = await this.supabase
      .from('event_participants')
      .select('event_id, user_id, invited_email')
      .in('event_id', allEventIds);

    const profilesByUserId: Record<string, { email?: string; displayName?: string }> = {};
    const userIds = [...new Set((allParticipants ?? []).map((p) => p.user_id).filter(Boolean))];
    if (userIds.length > 0) {
      const { data: profiles } = await this.supabase
        .from('profiles')
        .select('user_id, email, display_name')
        .in('user_id', userIds);
      for (const p of profiles ?? []) {
        const u = p as { user_id: string; email?: string; display_name?: string };
        profilesByUserId[u.user_id] = {
          email: u.email,
          displayName: (u.display_name as string) || u.email?.split('@')[0],
        };
      }
    }

    const friendMap = new Map<
      string,
      { email: string; displayName?: string; lastEventAt: string; eventCount: number }
    >();
    const plansWithParticipants: Array<{
      id: string;
      title: string;
      startAt: string;
      endAt: string;
      location?: string;
      participants: Array<{ email: string; displayName?: string }>;
    }> = [];

    for (const ev of sharedEvents) {
      const evRecord = ev as Record<string, unknown>;
      const ti = evRecord.timeline_items as Record<string, unknown>;
      const eventId = evRecord.timeline_item_id as string;
      const others = (allParticipants ?? []).filter(
        (p) => p.event_id === eventId && p.user_id !== userId
      );

      const participants: Array<{ email: string; displayName?: string }> = [];
      for (const o of others) {
        const email = (o.invited_email as string) || profilesByUserId[o.user_id as string]?.email || '';
        const displayName =
          profilesByUserId[o.user_id as string]?.displayName || email?.split('@')[0] || 'Arkadaş';
        if (email) participants.push({ email, displayName });

        const key = o.user_id || o.invited_email;
        if (key && key !== userId) {
          const existing = friendMap.get(key);
          const startAt = (ti?.start_at as string) ?? '';
          const eventCount = (existing?.eventCount ?? 0) + 1;
          const lastEventAt =
            !existing || startAt > existing.lastEventAt ? startAt : existing.lastEventAt;
          friendMap.set(key, {
            email: email || key,
            displayName,
            lastEventAt,
            eventCount,
          });
        }
      }

      plansWithParticipants.push({
        id: eventId,
        title: (ti?.title as string) ?? '',
        startAt: (ti?.start_at as string) ?? '',
        endAt: (ti?.end_at as string) ?? '',
        location: evRecord.location as string | undefined,
        participants,
      });
    }

    const friends = [...friendMap.values()]
      .filter((f) => f.email)
      .sort((a, b) => (b.lastEventAt > a.lastEventAt ? 1 : -1));

    const sharedPlans = plansWithParticipants.sort(
      (a, b) => (b.startAt > a.startAt ? 1 : -1)
    );

    return { friends, sharedPlans };
  }

  async getEvent(userId: string, id: string) {
    const { data: ev, error } = await this.supabase
      .from('events')
      .select(`
        timeline_item_id,
        location,
        visibility,
        recurrence_rule_id,
        timeline_items!inner (
          id,
          title,
          start_at,
          end_at,
          summary,
          status,
          metadata,
          shortcut_id
        )
      `)
      .eq('timeline_item_id', id)
      .single();

    if (error || !ev) throw new NotFoundException('Event not found');

    const ti = (ev as Record<string, unknown>).timeline_items as Record<string, unknown>;
    const participants = await this.supabase
      .from('event_participants')
      .select('id, user_id, invited_email, role, rsvp_status')
      .eq('event_id', id);

    const metadata = (ti?.metadata as Record<string, unknown>) ?? {};
    const shortcutId = ti?.shortcut_id as string | null | undefined;

    let shortcut: { id: string; title: string | null; url: string; kind: string; storeUrl: string | null } | null = null;
    if (shortcutId) {
      const { data: sc } = await this.supabase
        .from('app_shortcuts')
        .select('id, title, url, kind, store_url')
        .eq('id', shortcutId)
        .single();
      if (sc) {
        shortcut = {
          id: (sc as Record<string, unknown>).id as string,
          title: (sc as Record<string, unknown>).title as string | null,
          url: (sc as Record<string, unknown>).url as string,
          kind: (sc as Record<string, unknown>).kind as string,
          storeUrl: (sc as Record<string, unknown>).store_url as string | null,
        };
      }
    }

    const externalApp = metadata?.externalApp as Record<string, unknown> | null | undefined;
    const legacyApp = externalApp?.deepLink
      ? { id: null, label: (externalApp.label as string) ?? 'App', url: externalApp.deepLink as string, storeUrl: (externalApp.storeUrl as string) ?? '' }
      : null;

    const appShortcut = shortcut
      ? { id: shortcut.id, label: shortcut.title || 'App', url: shortcut.url, storeUrl: shortcut.storeUrl ?? '' }
      : legacyApp;

    return {
      id: (ev as Record<string, unknown>).timeline_item_id,
      title: ti?.title,
      startAt: ti?.start_at,
      endAt: ti?.end_at,
      summary: ti?.summary,
      status: ti?.status,
      location: (ev as Record<string, unknown>).location,
      visibility: (ev as Record<string, unknown>).visibility,
      participants: participants.data ?? [],
      metadata,
      shortcut: appShortcut,
    };
  }

  async update(userId: string, id: string, dto: UpdateEventDto) {
    await this.ensureHost(userId, id);

    const updates: Record<string, unknown> = {};
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.startAt !== undefined) updates.start_at = dto.startAt;
    if (dto.endAt !== undefined) updates.end_at = dto.endAt;
    if (dto.location !== undefined) updates.location = dto.location;
    if (dto.visibility !== undefined) updates.visibility = dto.visibility;
    if (dto.appLink !== undefined || dto.metadata !== undefined) {
      const { data: ti } = await this.supabase.from('timeline_items').select('metadata').eq('id', id).single();
      const meta = ((ti as Record<string, unknown>)?.metadata as Record<string, unknown>) ?? {};
      if (dto.appLink !== undefined) meta.appLink = dto.appLink;
      if (dto.metadata) Object.assign(meta, dto.metadata);
      updates.metadata = meta;
    }
    if (dto.shortcutId !== undefined) {
      updates.shortcut_id = dto.shortcutId;
    }
    updates.updated_at = new Date().toISOString();

    await this.supabase
      .from('timeline_items')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId);

    return this.getEvent(userId, id);
  }

  async invite(userId: string, eventId: string, dto: InviteDto) {
    await this.ensureHost(userId, eventId);

    const hostName = await this.getDisplayName(userId);
    const event = await this.supabase
      .from('timeline_items')
      .select('title')
      .eq('id', eventId)
      .single();
    const eventTitle = (event.data as { title?: string })?.title ?? 'Etkinlik';

    const normEmail = dto.email.trim().toLowerCase();
    const invitee = await this.findUserByEmail(normEmail);
    if (invitee) {
      await this.supabase.from('event_participants').insert({
        event_id: eventId,
        user_id: invitee.user_id,
        invited_email: normEmail,
        role: 'guest',
        rsvp_status: 'pending',
      });
      await this.notifications.sendEventInvite(invitee.user_id, eventTitle, eventId, hostName);
    } else {
      await this.supabase.from('event_participants').insert({
        event_id: eventId,
        invited_email: normEmail,
        role: 'guest',
        rsvp_status: 'pending',
      });
    }

    return { ok: true };
  }

  async rsvp(userId: string, eventId: string, dto: RsvpDto) {
    const { data } = await this.supabase.auth.admin.getUserById(userId);
    const userEmail = data?.user?.email;

    const { data: byUserId } = await this.supabase
      .from('event_participants')
      .update({ rsvp_status: dto.status })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .select()
      .single();

    if (byUserId) return { ok: true };

    if (userEmail) {
      const normEmail = userEmail.trim().toLowerCase();
      // Try lowercase first (new invites), then original (legacy data)
      for (const em of [normEmail, userEmail.trim()]) {
        if (!em) continue;
        const { data: byEmail } = await this.supabase
          .from('event_participants')
          .update({ rsvp_status: dto.status, user_id: userId })
          .eq('event_id', eventId)
          .is('user_id', null)
          .eq('invited_email', em)
          .select()
          .single();
        if (byEmail) return { ok: true };
      }
    }

    throw new NotFoundException('Participant not found');
  }

  async getConversation(userId: string, eventId: string) {
    await this.ensureParticipant(userId, eventId);

    const { data: conv } = await this.supabase
      .from('conversations')
      .select('id')
      .eq('event_id', eventId)
      .single();

    if (!conv) throw new NotFoundException('Conversation not found');

    const { data: messages } = await this.supabase
      .from('messages')
      .select('id, sender_user_id, text, created_at')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });

    const rows = messages ?? [];
    const senderIds = [...new Set(rows.map((m) => m.sender_user_id).filter(Boolean))];
    const usernameByUserId: Record<string, string> = {};
    if (senderIds.length) {
      const { data: profiles } = await this.supabase
        .from('profiles')
        .select('user_id, username, display_name, email')
        .in('user_id', senderIds);
      for (const p of profiles ?? []) {
        const u = p as { user_id: string; username?: string; display_name?: string; email?: string };
        usernameByUserId[u.user_id] =
          u.username ?? u.display_name ?? (u.email ? u.email.split('@')[0] : 'Anonim');
      }
    }

    const enriched = rows.map((m) => ({
      ...m,
      sender_username: usernameByUserId[m.sender_user_id] ?? 'Anonim',
    }));

    return {
      conversationId: conv.id,
      messages: enriched,
    };
  }

  async postMessage(userId: string, eventId: string, dto: MessageDto) {
    await this.ensureParticipant(userId, eventId);

    const { data: conv } = await this.supabase
      .from('conversations')
      .select('id')
      .eq('event_id', eventId)
      .single();

    if (!conv) throw new NotFoundException('Conversation not found');

    const { data: msg, error } = await this.supabase
      .from('messages')
      .insert({
        conversation_id: conv.id,
        sender_user_id: userId,
        text: dto.text,
      })
      .select('id, sender_user_id, text, created_at')
      .single();

    if (error) throw new Error(error.message);
    return msg;
  }

  private async ensureHost(userId: string, eventId: string) {
    const { data } = await this.supabase
      .from('event_participants')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('role', 'host')
      .single();

    if (!data) throw new NotFoundException('Not authorized to modify this event');
  }

  private async ensureParticipant(userId: string, eventId: string) {
    const { data } = await this.supabase
      .from('event_participants')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (!data) throw new NotFoundException('Not a participant of this event');
  }

  private async getDisplayName(userId: string): Promise<string> {
    try {
      const { data } = await this.supabase
        .from('profiles')
        .select('display_name, email')
        .eq('user_id', userId)
        .single();
      return (data?.display_name as string) || (data?.email as string)?.split('@')[0] || 'Birisi';
    } catch {
      return 'Birisi';
    }
  }

  private async findUserByEmail(email: string): Promise<{ user_id: string } | null> {
    try {
      const { data } = await this.supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email.toLowerCase())
        .single();
      return data as { user_id: string } | null;
    } catch {
      return null; // profiles table may not exist yet
    }
  }
}
