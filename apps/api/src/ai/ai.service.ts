import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { TimelineService } from '../timeline/timeline.service';
import { HabitsService } from '../habits/habits.service';

// Runtime check - NOT top-level (ConfigModule loads .env after this file is imported)
function isAiEnabled(): boolean {
  return (process.env.OPENAI_API_KEY?.length ?? 0) > 0;
}

export interface ParsedAction {
  action:
    | 'create_event'
    | 'create_bill'
    | 'update_bill_amount'
    | 'create_journal'
    | 'create_habit'
    | 'create_work_block'
    | 'create_task'
    | 'create_appointment'
    | 'create_reminder'
    | 'create_subscription'
    | 'create_goal'
    | 'create_travel'
    | 'unknown';
  data: Record<string, unknown>;
  facts_to_upsert: Array<{ key: string; value: string; confidence: number }>;
}

@Injectable()
export class AiService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private timelineService: TimelineService,
    private habitsService: HabitsService,
  ) {
    const key = process.env.OPENAI_API_KEY;
    const hasKey = !!key && key.length > 10;
    console.log('[AI] OpenAI durumu:', hasKey ? `AKTİF ✓ (key uzunluk: ${key?.length})` : 'KAPALI - OPENAI_API_KEY yok veya geçersiz');
  }

  async parseCommand(text: string): Promise<ParsedAction> {
    try {
      return await this._parseCommandImpl(text);
    } catch (e) {
      console.error('[AI] parseCommand beklenmeyen hata:', e);
      return this.fallbackParse(text);
    }
  }

  private static readonly PARSE_PROMPT = `Türkçe/İngilizce kullanıcı metnini action JSON'a dönüştür. Sadece JSON çıktı ver. TODAY CONTEXT verilir.
ÖNCELİK SIRASI: 1) SUBSCRIPTION (Netflix/Spotify/abonelik/ödeme günü) 2) BILL (kira/elektrik/ödendi+amount) 3) HABIT (her sabah) 4) APPOINTMENT (randevu/görüşme) 5) REMINDER (hatırlat) 6) TASK (görev/yapılacak) 7) EVENT 8) WORK_BLOCK 9) GOAL 10) TRAVEL 11) JOURNAL.

SUBSCRIPTION: data: { title, vendor, amount?, billingCycle?, nextBillDate? } — "Spotify son günü", "Netflix 99 lira" → vendor+amount+nextBillDate
BILL: data: { vendor, amount, dueDate } — "kira 5000 ödendi", "elektrik 300 lira" → vendor+amount. Tutar ZORUNLU.
HABIT (her/every/daily): action: create_habit, data: { title, schedule: { days: [0-6], time: "HH:mm" } } — 0=pazar
- "her sabah 8'de meditasyon" = habit 08:00, days [0-6]
- "her pazartesi 10'da toplantı" = habit, days [1]

EVENT (one-time + time): action: create_event, data: { title, startDate, startTime, endTime, location }
- "akşam 20.00'de maç" = today 20:00
- "çarşamba akşamı buluşma" = that Wednesday 20:00

BILL (ödendi/ödedim/fatura): action: create_bill, data: { vendor, amount, dueDate }
- "kira 5000 ödendi", "elektrik 300 lira" → vendor + amount

TASK (görev/task/yapılacak): action: create_task, data: { title, dueDate, dueTime?, priority? }
- "yarın doktora gitme" = task with dueDate tomorrow
- "bu hafta rapor yaz" = task

APPOINTMENT (randevu, görüşme, doktor + tarih): data: { title, startDate, startTime, endTime, location?, withWhom? }
REMINDER (hatırlat, hatırlatıcı, unutma): data: { title, remindAt, recurrence?: "once"|"daily"|"weekly" } — Abonelik DEĞİL

SUBSCRIPTION (abonelik - streaming, üyelik): action: create_subscription, data: { title, vendor, amount?, billingCycle?, nextBillDate? }
- Netflix, Spotify, Disney+, YouTube Premium, Apple Music, beIN, Digiturk, EnerjiSA abonelik vb. → ALWAYS create_subscription
- "Netflix ödeme günü", "Spotify yarın kesilecek", "yarın Netflix ücreti" → create_subscription with vendor=Netflix, nextBillDate=tomorrow
- ÖDEME GÜNÜ + bilinen hizmet adı = subscription, NOT reminder

WORK_BLOCK (çalışma bloku/deep work): action: create_work_block, data: { title, startAt, endAt, project? }

GOAL (hedef): action: create_goal, data: { title, targetDate?, lifeArea? }

TRAVEL (seyahat/uçuş): action: create_travel, data: { title, origin?, destination, departureAt?, arrivalAt? }

JOURNAL (günlük/journal): action: create_journal, data: { title, content, mood? }

TR TIME: akşam=20, sabah=09, öğlen=12. "akşam 8"=20:00, "saat 20"=20:00
TR DAYS: pazartesi..pazar. "çarşamba" = next Wed from today.
Never 09:00 for "akşam". Never today when user said "çarşamba".

Output: { "action": "create_event"|"create_bill"|"create_habit"|"create_task"|"create_appointment"|"create_reminder"|"create_work_block"|"create_subscription"|"create_goal"|"create_travel"|"create_journal"|"unknown", "data": {...}, "facts_to_upsert": [] }
`;

  private async _parseCommandImpl(text: string): Promise<ParsedAction> {
    const prompt = AiService.PARSE_PROMPT;

    if (isAiEnabled()) {
      console.log('[AI] 🤖 OpenAI aktif – parse-command çağrılıyor:', JSON.stringify(text));
      try {
        const { default: OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const dayNames = ['pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi'];
        const todayLabel = `${dayNames[now.getDay()]} ${todayStr}`;
        const userMsg = `Today is ${todayLabel}. User said: "${text}"`;
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: userMsg },
          ],
          temperature: 0.2,
        });
        const raw = completion.choices[0]?.message?.content?.trim() ?? '{}';
        const json = this.extractJson(raw);
        let parsed = this.normalizeParsedAction(json);
        // Post-process: "her sabah X" should be create_habit, not create_event
        parsed = this.ensureHabitForRecurring(parsed, text);
        // Post-process: Netflix/Spotify/ödeme günü → subscription, not reminder
        parsed = this.ensureSubscriptionForStreaming(parsed, text);
        // Post-process: fix date/time using Turkish extraction (AI sometimes ignores TR)
        let result = parsed.action === 'create_event'
          ? this.correctParsedWithTurkish(parsed, text)
          : parsed;
        result = this.correctParsedDatesForAll(result, text);
        console.log('[AI] ✅ OpenAI cevap verdi:', JSON.stringify(result.data));
        return result;
      } catch (e) {
        console.error('[AI] ❌ OpenAI hata, fallback kullanılıyor:', e);
        return this.ensureSubscriptionForStreaming(this.fallbackParse(text), text);
      }
    }
    console.log('[AI] ⚠️ OpenAI key yok (.env OPENAI_API_KEY), fallback parser kullanılıyor:', JSON.stringify(text));
    return this.ensureSubscriptionForStreaming(this.fallbackParse(text), text);
  }

  async chat(userId: string, messages: Array<{ role: string; content: string }>): Promise<{ content: string }> {
    let calendarContext = '';
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [timeline, routine] = await Promise.all([
        this.timelineService.getTimeline(userId, today),
        this.habitsService.getRoutine(userId, today),
      ]);
      const items = timeline.items ?? [];
      const habits = (routine as { activeHabits?: Array<{ id: string; title: string; todayStatus?: string | null }> }).activeHabits ?? [];
      const lines: string[] = [];
      if (items.length > 0) {
        lines.push('Bugünkü takvim:');
        for (const it of items) {
          const kind = it.kind ?? 'event';
          const title = (it.title as string) ?? '?';
          if (kind === 'event' || kind === 'habit_block') {
            const start = it.startAt ? new Date(it.startAt as string).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '?';
            const status = kind === 'habit_block' ? habits.find((h) => h.id === (it.metadata?.habitId ?? it.id))?.todayStatus : null;
            lines.push(`  - ${start} ${title}${status ? ` [${status}]` : ''}`);
          } else if (kind === 'bill') {
            const billIt = it as Record<string, unknown>;
            const due = (billIt.dueDate as string) ?? '?';
            const amt = billIt.amount != null ? `${billIt.amount} ₺` : '';
            lines.push(`  - Fatura: ${title} (vade: ${due})${amt ? ` ${amt}` : ''}`);
          }
        }
      }
      if (habits.length > 0) {
        lines.push('\nBugünkü alışkanlıklar:');
        for (const h of habits) {
          lines.push(`  - ${h.title}: ${h.todayStatus ?? 'henüz işaretlenmedi'}`);
        }
      }
      if (lines.length > 0) {
        calendarContext = '\n\nKullanıcının takvimine ERİŞİMİN VAR. Aşağıdaki veriler güncel:\n' + lines.join('\n');
      }
    } catch (e) {
      console.warn('[AI] Takvim context alınamadı:', e);
    }

    const systemPrompt = `Sen Nomi, kullanıcının günlük yaşamını planlamasına yardımcı olan samimi bir AI asistanısın. 
Kısa, anlaşılır ve Türkçe yanıt ver. Plan my day, reschedule, summarize gibi konularda yardımcı ol.
"Takvimim nasıl", "çalışmalarım nasıl gidiyor", "bugün ne var" gibi sorularda TAKVİM VERİLERİNİ KULLAN ve analiz et.
Uzun paragraflardan kaçın; 1-3 cümle yeterli.${calendarContext}`;

    if (isAiEnabled()) {
      try {
        const { default: OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
          ],
          temperature: 0.7,
          max_tokens: 256,
        });
        const content = completion.choices[0]?.message?.content?.trim() ?? 'Bir yanıt oluşturamadım.';
        return { content };
      } catch (e) {
        console.error('[AI] Chat hata:', e);
        return {
          content: 'Üzgünüm, şu an yanıt veremiyorum. Bağlantınızı kontrol edip tekrar deneyin.',
        };
      }
    }
    return {
      content: 'AI şu an kapalı. OPENAI_API_KEY ile API\'yi başlatın.',
    };
  }

  private extractJson(raw: string): Record<string, unknown> {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as Record<string, unknown>;
      } catch {
        // fall through
      }
    }
    return {};
  }

  private ensureHabitForRecurring(parsed: ParsedAction, text: string): ParsedAction {
    const hasRecurring = /\b(her\s+(?:sabah|akşam|gün|gece)|every\s+(?:day|morning|evening)|daily|haftalık|günlük)\b/i.test(text);
    if (!hasRecurring || parsed.action !== 'create_event') return parsed;
    const d = parsed.data;
    const trTime = this.extractTurkishTime(text);
    const time = trTime
      ? `${String(trTime.hour).padStart(2, '0')}:${String(trTime.min).padStart(2, '0')}`
      : ((d.startTime as string) ?? '09:00');
    const dayMap: Record<string, number> = {
      pazartesi: 1, salı: 2, çarşamba: 3, perşembe: 4, cuma: 5, cumartesi: 6, pazar: 0,
      monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0,
    };
    let days: number[] = [0, 1, 2, 3, 4, 5, 6]; // default: every day
    for (const [name, dow] of Object.entries(dayMap)) {
      if (new RegExp(`her\\s+${name}`, 'i').test(text) || new RegExp(`every\\s+${name}`, 'i').test(text)) {
        days = [dow];
        break;
      }
    }
    return {
      action: 'create_habit',
      data: { title: d.title ?? 'Alışkanlık', schedule: { days, time } },
      facts_to_upsert: parsed.facts_to_upsert,
    };
  }

  /** Netflix, Spotify, ödeme günü vb. → subscription, not reminder */
  private ensureSubscriptionForStreaming(parsed: ParsedAction, text: string): ParsedAction {
    const subKeywords = /\b(netflix|spotify|disney\+?|youtube\s*premium|apple\s*music|bein|digiturk|abonelik|ödeme\s*günü|ücret\s*kesilecek)\b/i;
    const shouldBeSubscription = subKeywords.test(text);
    if (!shouldBeSubscription) return parsed;
    if (parsed.action !== 'create_reminder' && parsed.action !== 'unknown') return parsed;
    const d = parsed.data;
    const vendorMatch = text.match(/\b(netflix|spotify|disney\+?|youtube\s*premium|apple\s*music|bein|digiturk)\b/i);
    const vendor = vendorMatch
      ? vendorMatch[1].charAt(0).toUpperCase() + vendorMatch[1].slice(1).toLowerCase().replace(/\s+/g, ' ')
      : ((d.title as string) ?? 'Abonelik').split(/\s+/)[0] ?? 'Abonelik';
    const title = (d.title as string) ?? `${vendor} aboneliği`;
    let dateStr = (d.remindAt as string) ?? (d.startDate as string);
    if (!dateStr && /\b(yarın|tomorrow)\b/i.test(text)) {
      const t = new Date();
      t.setDate(t.getDate() + 1);
      dateStr = t.toISOString().slice(0, 10);
    }
    const nextBillDate = dateStr ? String(dateStr).slice(0, 10) : new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const amountMatch = text.match(/(\d[\d.,]*)\s*(?:tl|lira|₺|try)?/i) ?? text.match(/(\d+)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/\s/g, '').replace(',', '.')) : (d.amount as number) ?? null;
    return {
      action: 'create_subscription',
      data: { title, vendor, amount: Number.isNaN(amount) ? null : amount, billingCycle: 'monthly', nextBillDate },
      facts_to_upsert: parsed.facts_to_upsert,
    };
  }

  private correctParsedWithTurkish(parsed: ParsedAction, text: string): ParsedAction {
    const d = this.extractTurkishDate(text);
    const t = this.extractTurkishTime(text);
    if (!d && !t) return parsed;
    const data = { ...parsed.data };
    if (d) {
      data.startDate = d;
      const end = new Date(d + 'T' + (data.startTime as string || '09:00'));
      end.setHours(end.getHours() + 1, 0, 0, 0);
      data.endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
    }
    if (t) {
      data.startTime = `${String(t.hour).padStart(2, '0')}:${String(t.min).padStart(2, '0')}`;
      const endHour = t.hour + 1;
      data.endTime = `${String(endHour > 23 ? 23 : endHour).padStart(2, '0')}:${String(t.min).padStart(2, '0')}`;
    }
    return { ...parsed, data };
  }

  /** Apply Turkish date/time extraction to parsed data when AI missed it */
  private correctParsedDatesForAll(parsed: ParsedAction, text: string): ParsedAction {
    const trDate = this.extractTurkishDate(text);
    const trTime = this.extractTurkishTime(text);
    if (!trDate && !trTime) return parsed;
    const data = { ...parsed.data };
    const timeStr = trTime ? `${String(trTime.hour).padStart(2, '0')}:${String(trTime.min).padStart(2, '0')}` : '09:00';
    const dateStr = trDate ?? new Date().toISOString().slice(0, 10);
    if (parsed.action === 'create_bill' && !data.dueDate) data.dueDate = dateStr;
    if (parsed.action === 'create_task' && !data.dueDate) data.dueDate = dateStr;
    if (parsed.action === 'create_reminder' && !data.remindAt) data.remindAt = `${dateStr}T${timeStr}:00`;
    if (parsed.action === 'create_subscription' && !data.nextBillDate) data.nextBillDate = dateStr;
    if (parsed.action === 'create_goal' && !data.targetDate) data.targetDate = dateStr;
    if ((parsed.action === 'create_appointment' || parsed.action === 'create_work_block' || parsed.action === 'create_event') && !data.startDate) {
      data.startDate = dateStr;
      if (trTime) data.startTime = timeStr;
    }
    return { ...parsed, data };
  }

  private extractTurkishDate(text: string): string | null {
    const dayMap: Record<string, number> = {
      pazar: 0, pazartesi: 1, salı: 2, çarşamba: 3, perşembe: 4, cuma: 5, cumartesi: 6,
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
    };
    const today = new Date();
    const todayDow = today.getDay();
    for (const [name, dow] of Object.entries(dayMap)) {
      if (new RegExp(`\\b${name}\\b`, 'i').test(text)) {
        let diff = dow - todayDow;
        if (diff <= 0) diff += 7;
        const target = new Date(today);
        target.setDate(today.getDate() + diff);
        return target.toISOString().slice(0, 10);
      }
    }
    if (/\b(?:yarın|tomorrow)\b/i.test(text)) {
      const t = new Date(today);
      t.setDate(t.getDate() + 1);
      return t.toISOString().slice(0, 10);
    }
    return null;
  }

  private normalizeParsedAction(json: Record<string, unknown>): ParsedAction {
    const action = (json.action as string) ?? 'unknown';
    const valid = [
      'create_event', 'create_bill', 'update_bill_amount', 'create_journal', 'create_habit',
      'create_work_block', 'create_task', 'create_appointment', 'create_reminder',
      'create_subscription', 'create_goal', 'create_travel', 'unknown',
    ];
    const normalizedAction = valid.includes(action) ? action : 'unknown';
    return {
      action: normalizedAction as ParsedAction['action'],
      data: (json.data as Record<string, unknown>) ?? {},
      facts_to_upsert: Array.isArray(json.facts_to_upsert) ? json.facts_to_upsert as ParsedAction['facts_to_upsert'] : [],
    };
  }

  private fallbackParse(text: string): ParsedAction {
    const lower = text.toLowerCase().trim();
    const hasRecurring = /\b(her\s+(?:sabah|akşam|gün|gece)|every\s+(?:day|morning|evening)|daily|haftalık|günlük)\b/i.test(text);
    if (hasRecurring) {
      const trTime = this.extractTurkishTime(text);
      const time = trTime
        ? `${String(trTime.hour).padStart(2, '0')}:${String(trTime.min).padStart(2, '0')}`
        : '09:00';
      const title = this.extractTitle(text) || 'Alışkanlık';
      const dayMap: Record<string, number> = {
        pazartesi: 1, salı: 2, çarşamba: 3, perşembe: 4, cuma: 5, cumartesi: 6, pazar: 0,
        monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0,
      };
      let days: number[] = [0, 1, 2, 3, 4, 5, 6];
      for (const [name, dow] of Object.entries(dayMap)) {
        if (new RegExp(`her\\s+${name}`, 'i').test(text) || new RegExp(`every\\s+${name}`, 'i').test(text)) {
          days = [dow];
          break;
        }
      }
      return { action: 'create_habit', data: { title, schedule: { days, time } }, facts_to_upsert: [] };
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Extract time: 20.00, 20:00, akşam 8, akşamı (->20:00), saat 20, 8'de (with akşam/sabah context)
    const trTime = this.extractTurkishTime(text);
    const trDate = this.extractTurkishDate(text);
    const isTomorrow = /\b(?:tomorrow|yarın)\b/i.test(text);
    const dateStr = trDate ?? (isTomorrow ? tomorrow.toISOString().slice(0, 10) : today.toISOString().slice(0, 10));
    const d = new Date(dateStr + 'T12:00:00');
    const hour = trTime?.hour ?? 20; // default evening (akşam) not morning
    const min = trTime?.min ?? 0;
    d.setHours(hour, min, 0, 0);
    const end = new Date(d);
    end.setHours(end.getHours() + 1, 0, 0, 0);

    // Event intent: add/ekle/var/meeting/etc OR (activity + time)
    const hasAddVerb = /\b(add|create|schedule|plan|ekle|oluştur|planla|kaydet)\b/i.test(text);
    const hasVar = /\b(var|var mı|olacak|gelecek)\b/i.test(text); // "maç var", "toplantı olacak"
    const hasTime = trTime !== null || /\b\d{1,2}(?:\.\d{2}|:\d{2})?\s*(?:'de|'da)?\b|\b(?:akşam|sabah|öğlen)\s*\d{1,2}\b/i.test(text);
    const hasDay = /(?:tomorrow|yarın|monday|pazartesi|tuesday|salı|wednesday|çarşamba|thursday|perşembe|cuma|saturday|cumartesi|sunday|pazar|bugün|today)/i.test(text);
    const hasEventIntent = hasAddVerb || hasVar || (hasTime && hasDay);

    // Extract title: remove time words, get the activity
    const title = this.extractTitle(text);

    if (hasEventIntent && (hasTime || hasDay)) {
      return {
        action: 'create_event',
        data: {
          title: title || 'Etkinlik',
          startDate: d.toISOString().slice(0, 10),
          startTime: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
          endTime: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
          location: null,
        },
        facts_to_upsert: [],
      };
    }

    // create_reminder: hatırlat, remind
    if (/\b(hatırlat|remind|reminder)\b/i.test(text)) {
      const d = new Date(dateStr + 'T12:00:00');
      d.setHours(trTime?.hour ?? 9, trTime?.min ?? 0, 0, 0);
      return {
        action: 'create_reminder',
        data: { title: title || 'Hatırlatıcı', remindAt: d.toISOString(), recurrence: 'once' },
        facts_to_upsert: [],
      };
    }

    // create_task: görev, task
    if (/\b(görev|task|yapılacak|todo)\b/i.test(text) && title) {
      return {
        action: 'create_task',
        data: {
          title: title || 'Görev',
          dueDate: dateStr,
          dueTime: trTime ? `${String(trTime.hour).padStart(2, '0')}:${String(trTime.min).padStart(2, '0')}` : null,
          priority: 'normal',
        },
        facts_to_upsert: [],
      };
    }

    // create_goal: hedef
    if (/\b(hedef|goal)\b/i.test(text) && title) {
      return { action: 'create_goal', data: { title: title || 'Hedef', targetDate: dateStr }, facts_to_upsert: [] };
    }

    // create_journal: günlük, journal
    if (/\b(günlük|journal|günlük yaz)\b/i.test(text)) {
      return { action: 'create_journal', data: { title: title || 'Günlük', content: text }, facts_to_upsert: [] };
    }

    // create_bill: ödendi, ödedim, fatura + amount
    const billVendors: Record<string, string> = {
      kira: 'Kira',
      elektrik: 'Elektrik',
      internet: 'İnternet',
      su: 'Su',
      doğalgaz: 'Doğalgaz',
      dogalgaz: 'Doğalgaz',
      telefon: 'Telefon',
      market: 'Market',
      veteriner: 'Veteriner',
      ulaşım: 'Ulaşım',
      ulasim: 'Ulaşım',
    };
    const hasBillVerb = /\b(ödendi|ödedim|ödeme|fatura|faturalar|harcama)\b/i.test(text);
    const amountMatch = text.match(/(\d[\d.,\s]*)\s*(?:tl|lira|₺|try)?/i) ?? text.match(/(\d+)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/[\s.,]/g, '').replace(',', '.')) : 0;

    if ((hasBillVerb || amount > 0) && amount > 0) {
      let vendor = 'Gider';
      const lower = text.toLowerCase();
      for (const [key, label] of Object.entries(billVendors)) {
        if (lower.includes(key)) {
          vendor = label;
          break;
        }
      }
      if (vendor === 'Gider' && title && title !== 'Etkinlik') {
        vendor = title.charAt(0).toUpperCase() + title.slice(1);
      }
      const dueDate = new Date();
      dueDate.setDate(1);
      dueDate.setMonth(dueDate.getMonth() + 1);
      dueDate.setDate(0);
      return {
        action: 'create_bill',
        data: {
          vendor,
          amount,
          dueDate: dueDate.toISOString().slice(0, 10),
          recurrence: 'monthly',
        },
        facts_to_upsert: [],
      };
    }

    return {
      action: 'unknown',
      data: { message: 'Saat veya tarih belirtin. Örnek: "akşam 8\'de Beşiktaş maçı" veya "Kira 5000 ödendi"' },
      facts_to_upsert: [],
    };
  }

  private extractTurkishTime(text: string): { hour: number; min: number } | null {
    // akşamı, akşam (evening) without number -> 20:00
    if (/\bakşamı?\b/i.test(text) && !/\d{1,2}/.test(text.replace(/akşam\s*\d+/gi, ''))) {
      return { hour: 20, min: 0 };
    }
    // öğlen without number -> 12:00
    if (/\böğlen\b/i.test(text) && !/\d{1,2}/.test(text.replace(/öğlen\s*\d+/gi, ''))) {
      return { hour: 12, min: 0 };
    }
    // 20.00 or 20:00
    const m1 = text.match(/(\d{1,2})[.:](\d{2})\s*'?de?/i) ?? text.match(/\b(\d{1,2})[.:](\d{2})\b/);
    if (m1) {
      let h = parseInt(m1[1], 10);
      const m = parseInt(m1[2], 10);
      if (h <= 12 && /akşam|pm|öğleden sonra/i.test(text)) h += 12;
      return { hour: h, min: m };
    }
    // akşam 8, akşam 20, sabah 9, saat 20
    const m2 = text.match(/(?:akşam|sabah|öğlen|saat)\s*(\d{1,2})(?:\s*[.:]\s*(\d{2}))?\s*'?de?/i);
    if (m2) {
      let h = parseInt(m2[1], 10);
      const m = parseInt(m2[2] ?? '0', 10);
      if ((/akşam|pm/i.test(text) && h < 12) || (/öğleden sonra/i.test(text))) h += 12;
      if (/sabah|morning|am\b/i.test(text) && h === 12) h = 0;
      return { hour: h, min: m };
    }
    // 8'de, 20'de (at 8, at 20) - assume 24h if >= 12, else check context
    const m3 = text.match(/(\d{1,2})\s*'?(?:de|da)\b/i);
    if (m3) {
      let h = parseInt(m3[1], 10);
      if (h <= 12 && /akşam|gece|pm/i.test(text)) h += 12;
      return { hour: h, min: 0 };
    }
    // 3pm, 3 am
    const m4 = text.match(/(\d{1,2})\s*(am|pm)/i);
    if (m4) {
      let h = parseInt(m4[1], 10);
      if (m4[2].toLowerCase() === 'pm' && h < 12) h += 12;
      if (m4[2].toLowerCase() === 'am' && h === 12) h = 0;
      return { hour: h, min: 0 };
    }
    return null;
  }

  private extractTitle(text: string): string {
    return text
      .replace(/\b(?:add|create|schedule|ekle|oluştur|planla|kaydet|var)\b/gi, '')
      .replace(/\b(?:her|every)\s+(?:sabah|akşam|gün|gece|day|morning|evening)\b/gi, '')
      .replace(/(?:akşam|sabah|öğlen|saat)\s*\d{1,2}(?:[.:]\d{2})?\s*'?de?/gi, '')
      .replace(/\d{1,2}[.:]\d{2}\s*'?de?/g, '')
      .replace(/\b(?:yarın|tomorrow|bugün|today)\b/gi, '')
      .replace(/\b(?:daily|haftalık|günlük)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim() || 'Etkinlik';
  }

  async createJob(userId: string, jobType: string, input: Record<string, unknown> = {}) {
    const { data, error } = await this.supabase
      .from('ai_jobs')
      .insert({
        user_id: userId,
        job_type: jobType,
        status: 'queued',
        input,
      })
      .select('id, job_type, status, created_at')
      .single();

    if (error) throw new Error(error.message);

    if (isAiEnabled()) {
      // In-process job runner stub: would pick up job and process
      void this.runJobStub(data.id);
    }

    return data;
  }

  async getJob(userId: string, id: string) {
    const { data, error } = await this.supabase
      .from('ai_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Job not found');
    return {
      id: data.id,
      jobType: data.job_type,
      status: data.status,
      input: data.input,
      output: data.output,
      progressStage: data.progress_stage,
      error: data.error,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private async runJobStub(jobId: string) {
    // Stub: simulate async processing. Real impl would call OpenAI.
    await this.supabase
      .from('ai_jobs')
      .update({
        status: 'running',
        progress_stage: 'collecting',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    await new Promise((r) => setTimeout(r, 500));

    await this.supabase
      .from('ai_jobs')
      .update({
        status: isAiEnabled() ? 'done' : 'failed',
        progress_stage: null,
        output: isAiEnabled() ? {} : null,
        error: isAiEnabled() ? null : 'AI not configured',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }
}
