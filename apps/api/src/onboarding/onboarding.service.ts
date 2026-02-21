import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';

const LIFE_AREAS = ['social', 'health', 'finance', 'mind', 'relationships', 'admin', 'work'] as const;
const BILL_DEFAULTS: Record<string, { dueDay: number }> = {
  Rent: { dueDay: 1 },
  Electricity: { dueDay: 10 },
  Water: { dueDay: 10 },
  Internet: { dueDay: 10 },
  Phone: { dueDay: 10 },
  'Credit card': { dueDay: 20 },
};

@Injectable()
export class OnboardingService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async getStatus(userId: string): Promise<{ completed: boolean; currentStep?: number }> {
    const { data } = await this.supabase
      .from('onboarding_profiles')
      .select('completed_at, current_step')
      .eq('user_id', userId)
      .single();

    const completed = !!(data as { completed_at?: string } | null)?.completed_at;
    const currentStep = (data as { current_step?: number } | null)?.current_step ?? 1;
    return { completed, currentStep: completed ? undefined : currentStep };
  }

  async saveStep(userId: string, step: number, payload: Record<string, unknown>): Promise<void> {
    await this.ensureProfile(userId);

    if (step === 1) {
      await this.supabase
        .from('onboarding_profiles')
        .update({ current_step: 2, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      return;
    }

    if (step === 2) {
      const areas = this.parseLifeAreas(payload);
      if (Object.values(areas).filter(Boolean).length < 1) {
        throw new Error('En az bir yaşam alanı seçilmeli');
      }
      await this.supabase.from('onboarding_life_areas').upsert(
        { user_id: userId, ...areas, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      const order = payload.lifeAreasOrder as string[] | undefined;
      const orderedKeys = Array.isArray(order) ? order.filter((k) => areas[k]) : LIFE_AREAS.filter((k) => areas[k]);
      await this.supabase.from('user_settings').update({ life_areas: orderedKeys, updated_at: new Date().toISOString() }).eq('user_id', userId);
    }

    if (step === 3) {
      const rhythm = this.parseDailyRhythm(payload);
      await this.supabase.from('onboarding_daily_rhythm').upsert(
        { user_id: userId, ...rhythm, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    }

    if (step === 4) {
      const prefs = this.parseAiPreferences(payload);
      await this.supabase.from('onboarding_ai_preferences').upsert(
        { user_id: userId, ...prefs, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    }

    if (step === 5) {
      await this.seedBills(userId, payload);
    }

    await this.supabase
      .from('onboarding_profiles')
      .update({ current_step: Math.min(step + 1, 6), updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  }

  async complete(userId: string, triggerWow: boolean): Promise<{ jobId?: string }> {
    const { data: profile } = await this.supabase
      .from('onboarding_profiles')
      .select('completed_at')
      .eq('user_id', userId)
      .single();

    if ((profile as { completed_at?: string } | null)?.completed_at) {
      return {};
    }

    const [areas, rhythm, prefs] = await Promise.all([
      this.supabase.from('onboarding_life_areas').select('*').eq('user_id', userId).single(),
      this.supabase.from('onboarding_daily_rhythm').select('*').eq('user_id', userId).single(),
      this.supabase.from('onboarding_ai_preferences').select('*').eq('user_id', userId).single(),
    ]);

    const lifeAreasArr = areas.data
      ? LIFE_AREAS.filter((k) => (areas.data as Record<string, boolean>)[k])
      : ['health'];
    const workEnabled = lifeAreasArr.includes('work');

    await this.supabase.from('onboarding_profiles').upsert(
      {
        user_id: userId,
        completed_at: new Date().toISOString(),
        current_step: 6,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    await this.syncToUserSettings(userId, {
      lifeAreas: lifeAreasArr,
      workModeEnabled: workEnabled,
      checkinPreference: (prefs.data as { checkin_preference?: string })?.checkin_preference ?? 'evening',
      responseLength: (prefs.data as { response_length?: string })?.response_length ?? 'short',
      tone: (prefs.data as { tone?: string })?.tone ?? 'calm',
      emojiLevel: (prefs.data as { emoji_level?: number })?.emoji_level ?? 1,
    });

    await this.createCheckinNotification(userId, (prefs.data as { checkin_preference?: string })?.checkin_preference ?? 'evening');

    await this.createWelcomeInsight(userId);

    if (triggerWow) {
      const jobId = await this.createWowJob(userId, {
        lifeAreas: lifeAreasArr,
        workEnabled,
        rhythm: rhythm.data as Record<string, unknown> | null,
        prefs: prefs.data as Record<string, unknown> | null,
      });
      return { jobId };
    }
    return {};
  }

  private async ensureProfile(userId: string): Promise<void> {
    const { data } = await this.supabase
      .from('onboarding_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();
    if (!data) {
      await this.supabase.from('onboarding_profiles').insert({
        user_id: userId,
        current_step: 1,
      });
    }
  }

  private parseLifeAreas(p: Record<string, unknown>): Record<string, boolean> {
    const out: Record<string, boolean> = {};
    for (const k of LIFE_AREAS) {
      const v = p[k];
      out[k] = !!v;
    }
    return out;
  }

  private parseDailyRhythm(p: Record<string, unknown>): Record<string, string | null> {
    const wakeTime = (p.wakeTime as string) || null;
    const sleepTime = (p.sleepTime as string) || null;
    const workStart = (p.workStart as string) || null;
    const workEnd = (p.workEnd as string) || null;
    return {
      wake_time: wakeTime,
      sleep_time: sleepTime,
      work_start: workStart,
      work_end: workEnd,
    };
  }

  private parseAiPreferences(p: Record<string, unknown>): Record<string, unknown> {
    return {
      auto_categorize: p.autoCategorize ?? true,
      suggest_plans: p.suggestPlans ?? true,
      weekly_insights: p.weeklyInsights ?? true,
      use_data_preferences: p.useDataPreferences ?? true,
      tone: p.tone ?? 'calm',
      response_length: p.responseLength ?? 'short',
      emoji_level: p.emojiLevel ?? 1,
      checkin_preference: p.checkinPreference ?? 'evening',
    };
  }

  private async seedBills(userId: string, payload: Record<string, unknown>): Promise<void> {
    const templates = (payload.billTemplates as Array<{ vendor: string; dueDay: number; autopay: boolean }>) ?? [];
    if (templates.length === 0) return;

    const now = new Date();
    for (const t of templates) {
      const dueDay = t.dueDay ?? BILL_DEFAULTS[t.vendor]?.dueDay ?? 1;
      const dueDate = new Date(now.getFullYear(), now.getMonth(), Math.min(dueDay, 28));
      const dueStr = dueDate.toISOString().slice(0, 10);

      const { data: ti } = await this.supabase
        .from('timeline_items')
        .insert({
          user_id: userId,
          kind: 'bill',
          title: t.vendor,
          status: 'scheduled',
          source: 'onboarding',
        })
        .select('id')
        .single();

      if (ti) {
        await this.supabase.from('bills').insert({
          timeline_item_id: (ti as { id: string }).id,
          vendor: t.vendor,
          amount: null,
          due_date: dueStr,
          recurrence: 'monthly',
          autopay: t.autopay ?? true,
        });
      }
    }
  }

  private async syncToUserSettings(
    userId: string,
    data: {
      lifeAreas: string[];
      workModeEnabled: boolean;
      checkinPreference: string;
      responseLength: string;
      tone: string;
      emojiLevel: number;
    }
  ): Promise<void> {
    const updates: Record<string, unknown> = {
      onboarding_completed: true,
      life_areas: data.lifeAreas,
      work_mode_enabled: data.workModeEnabled,
      checkin_preference: data.checkinPreference,
      response_length: data.responseLength,
      assistant_tone: data.tone,
      emoji_level: data.emojiLevel,
      updated_at: new Date().toISOString(),
    };
    await this.supabase
      .from('user_settings')
      .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' });
  }

  private async createCheckinNotification(userId: string, preference: string): Promise<void> {
    const schedule = preference === 'morning' ? '09:00' : preference === 'evening' ? '20:00' : '12:00';
    const { data: existing } = await this.supabase
      .from('notification_rules')
      .select('id')
      .eq('user_id', userId)
      .eq('rule_type', 'daily_checkin')
      .single();
    if (!existing) {
      await this.supabase.from('notification_rules').insert({
        user_id: userId,
        rule_type: 'daily_checkin',
        schedule,
        enabled: true,
      });
    }
  }

  private async createWelcomeInsight(userId: string): Promise<void> {
    await this.supabase.from('timeline_items').insert({
      user_id: userId,
      kind: 'insight',
      title: 'Welcome to Nomi',
      summary: "Your life, organized. Calm. Smart. Let's get started.",
      status: 'scheduled',
      source: 'onboarding',
    });
  }

  private async createWowJob(userId: string, input: Record<string, unknown>): Promise<string> {
    const { data, error } = await this.supabase
      .from('ai_jobs')
      .insert({
        user_id: userId,
        job_type: 'onboarding_wow_plan',
        status: 'queued',
        input,
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    const id = (data as { id: string }).id;
    void this.runOnboardingWowJob(id, userId);
    return id;
  }

  private async runOnboardingWowJob(jobId: string, userId: string): Promise<void> {
    await this.supabase
      .from('ai_jobs')
      .update({ status: 'running', progress_stage: 'collecting', updated_at: new Date().toISOString() })
      .eq('id', jobId);

    const { data: job } = await this.supabase
      .from('ai_jobs')
      .select('input')
      .eq('id', jobId)
      .single();

    const input = (job as { input?: Record<string, unknown> } | null)?.input ?? {};
    const lifeAreas = (input.lifeAreas as string[]) ?? ['health'];
    const workEnabled = lifeAreas.includes('work');

    await this.supabase
      .from('ai_jobs')
      .update({ progress_stage: 'suggesting', updated_at: new Date().toISOString() })
      .eq('id', jobId);

    const wowOutput = await this.generateWowPlan(input);

    await this.supabase
      .from('ai_jobs')
      .update({ progress_stage: 'finalizing', updated_at: new Date().toISOString() })
      .eq('id', jobId);

    await this.createWowItems(userId, wowOutput, workEnabled);

    await this.supabase
      .from('ai_jobs')
      .update({
        status: 'done',
        output: wowOutput,
        progress_stage: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }

  private async generateWowPlan(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const lifeAreas = (input.lifeAreas as string[]) ?? ['health'];
    const workEnabled = lifeAreas.includes('work');
    const rhythm = input.rhythm as Record<string, unknown> | null;
    const prefs = input.prefs as Record<string, unknown> | null;
    const tone = (prefs?.tone as string) ?? 'calm';
    const emojiLevel = (prefs?.emoji_level as number) ?? 1;

    const hasOpenAI = (process.env.OPENAI_API_KEY?.length ?? 0) > 0;
    if (!hasOpenAI) {
      return this.getDefaultWowPlan(lifeAreas, workEnabled, tone, emojiLevel, rhythm);
    }

    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const prompt = `Generate a personalized first-day plan for a life organization app. User focus areas: ${lifeAreas.join(', ')}. Work enabled: ${workEnabled}. Tone: ${tone}. Emoji level: ${emojiLevel}.
Wake: ${(rhythm?.wake_time as string) ?? '07:00'}, Sleep: ${(rhythm?.sleep_time as string) ?? '23:00'}.
Return JSON only:
{
  "welcome_text": "short friendly greeting (1 sentence)",
  "suggested_items": [
    { "kind": "habit|task|reminder|work_block", "title": "string", "life_area": "health|finance|mind|social|admin|work", "metadata": {} }
  ],
  "today_ordering": ["health","finance",...]
}
Max 5 suggested_items. No work_block if work disabled. No guilt. Be warm and supportive.`;

      const res = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });
      const raw = res.choices[0]?.message?.content?.trim() ?? '{}';
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]) as Record<string, unknown>;
      }
    } catch (e) {
      console.error('[Onboarding] OpenAI WOW plan failed:', e);
    }
    return this.getDefaultWowPlan(lifeAreas, workEnabled, tone, emojiLevel, rhythm);
  }

  private getDefaultWowPlan(
    lifeAreas: string[],
    workEnabled: boolean,
    tone: string,
    emojiLevel: number,
    rhythm: Record<string, unknown> | null
  ): Record<string, unknown> {
    const items: Array<{ kind: string; title: string; life_area: string }> = [];
    if (lifeAreas.includes('health') || lifeAreas.includes('mind')) {
      items.push({ kind: 'habit', title: '5 dakikalık sabah meditasyonu', life_area: 'mind' });
    }
    items.push({ kind: 'reminder', title: 'Bugünün özetini paylaş', life_area: 'admin' });
    if (workEnabled) {
      items.push({ kind: 'task', title: 'Sesli komutla ilk etkinliğini ekle', life_area: 'work' });
    }
    return {
      welcome_text: 'Hoş geldin! İşte bugün için kişiselleştirilmiş planın.',
      suggested_items: items,
      today_ordering: lifeAreas,
    };
  }

  private async createWowItems(
    userId: string,
    wow: Record<string, unknown>,
    workEnabled: boolean
  ): Promise<void> {
    const items = (wow.suggested_items as Array<{ kind: string; title: string; life_area?: string }>) ?? [];
    const today = new Date().toISOString().slice(0, 10);

    for (const it of items) {
      if (it.kind === 'work_block' && !workEnabled) continue;

      if (it.kind === 'habit') {
        await this.supabase.from('habits').insert({
          user_id: userId,
          title: it.title,
          schedule: { days: [0, 1, 2, 3, 4, 5, 6], time: '08:00' },
          active: true,
          category: ['mind', 'work', 'health'].includes(it.life_area as string) ? it.life_area : 'mind',
        });
        continue;
      }

      const kind = it.kind === 'task' ? 'task' : it.kind === 'reminder' ? 'reminder' : it.kind === 'work_block' ? 'work_block' : 'task';
      const { data: ti } = await this.supabase
        .from('timeline_items')
        .insert({
          user_id: userId,
          kind,
          title: it.title,
          status: 'scheduled',
          source: 'onboarding_wow',
          life_area: it.life_area ?? null,
        })
        .select('id')
        .single();

      if (!ti) continue;

      if (it.kind === 'reminder') {
        const remindAt = new Date();
        remindAt.setHours(20, 0, 0, 0);
        await this.supabase.from('reminders').insert({
          timeline_item_id: (ti as { id: string }).id,
          remind_at: remindAt.toISOString(),
          recurrence: 'daily',
        });
      } else if (it.kind === 'task' || kind === 'task') {
        await this.supabase.from('tasks').insert({
          timeline_item_id: (ti as { id: string }).id,
          due_date: today,
          priority: 'normal',
        });
      } else if (it.kind === 'work_block') {
        const now = new Date();
        const start = new Date(now);
        start.setHours(9, 0, 0, 0);
        const end = new Date(now);
        end.setHours(12, 0, 0, 0);
        await this.supabase.from('work_blocks').insert({
          timeline_item_id: (ti as { id: string }).id,
          project: 'Focus time',
        });
        await this.supabase
          .from('timeline_items')
          .update({ start_at: start.toISOString(), end_at: end.toISOString() })
          .eq('id', (ti as { id: string }).id);
      }
    }
  }

  async updatePreferences(userId: string, payload: Record<string, unknown>): Promise<void> {
    if (Object.keys(payload).length === 0) return;
    let lifeAreasArr: string[] = [];
    let workEnabled = false;

    if (payload.lifeAreas) {
      const areas = this.parseLifeAreas(payload.lifeAreas as Record<string, boolean>);
      lifeAreasArr = LIFE_AREAS.filter((k) => areas[k]);
      workEnabled = areas.work ?? false;
      await this.supabase.from('onboarding_life_areas').upsert(
        { user_id: userId, ...areas, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    }
    if (payload.tone || payload.responseLength || payload.emojiLevel || payload.checkinPreference !== undefined) {
      const prefs: Record<string, unknown> = {};
      if (payload.tone !== undefined) prefs.tone = payload.tone;
      if (payload.responseLength !== undefined) prefs.response_length = payload.responseLength;
      if (payload.emojiLevel !== undefined) prefs.emoji_level = payload.emojiLevel;
      if (payload.checkinPreference !== undefined) prefs.checkin_preference = payload.checkinPreference;
      if (Object.keys(prefs).length > 0) {
        prefs.updated_at = new Date().toISOString();
        await this.supabase.from('onboarding_ai_preferences').upsert(
          { user_id: userId, ...prefs },
          { onConflict: 'user_id' }
        );
      }
    }
    if (lifeAreasArr.length > 0 || payload.tone !== undefined || payload.responseLength !== undefined || payload.emojiLevel !== undefined || payload.checkinPreference !== undefined) {
      const { data: existing } = await this.supabase.from('user_settings').select('life_areas, work_mode_enabled, checkin_preference, response_length, assistant_tone, emoji_level').eq('user_id', userId).single();
      const la = lifeAreasArr.length > 0 ? lifeAreasArr : ((existing as { life_areas?: string[] } | null)?.life_areas ?? []);
      const wm = payload.lifeAreas !== undefined ? workEnabled : ((existing as { work_mode_enabled?: boolean } | null)?.work_mode_enabled ?? false);
      const cp: string = typeof payload.checkinPreference === 'string' ? payload.checkinPreference : ((existing as { checkin_preference?: string } | null)?.checkin_preference ?? 'evening');
      const rl: string = typeof payload.responseLength === 'string' ? payload.responseLength : ((existing as { response_length?: string } | null)?.response_length ?? 'short');
      const tn: string = typeof payload.tone === 'string' ? payload.tone : ((existing as { assistant_tone?: string } | null)?.assistant_tone ?? 'calm');
      const el = payload.emojiLevel ?? (existing as { emoji_level?: number } | null)?.emoji_level ?? 1;
      await this.syncToUserSettings(userId, {
        lifeAreas: la,
        workModeEnabled: wm,
        checkinPreference: cp,
        responseLength: rl,
        tone: tn,
        emojiLevel: typeof el === 'number' ? el : 1,
      });
    }
  }

  /** Dev/test: Sıfırla — mevcut kullanıcıyla onboarding'i yeniden test etmek için */
  async reset(userId: string): Promise<void> {
    await this.supabase
      .from('onboarding_profiles')
      .update({ completed_at: null, current_step: 1, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    await this.supabase.from('user_settings').update({ onboarding_completed: false, updated_at: new Date().toISOString() }).eq('user_id', userId);
  }

  async getAggregatedOnboarding(userId: string): Promise<Record<string, unknown>> {
    const [profile, areas, rhythm, prefs, userSettings] = await Promise.all([
      this.supabase.from('onboarding_profiles').select('*').eq('user_id', userId).single(),
      this.supabase.from('onboarding_life_areas').select('*').eq('user_id', userId).single(),
      this.supabase.from('onboarding_daily_rhythm').select('*').eq('user_id', userId).single(),
      this.supabase.from('onboarding_ai_preferences').select('*').eq('user_id', userId).single(),
      this.supabase.from('user_settings').select('life_areas, work_mode_enabled, checkin_preference, response_length, assistant_tone, emoji_level').eq('user_id', userId).single(),
    ]);
    const settings = userSettings.data as { life_areas?: string[]; work_mode_enabled?: boolean; checkin_preference?: string; response_length?: string; assistant_tone?: string; emoji_level?: number } | null;
    let lifeAreasData = areas.data as Record<string, boolean> | null;
    if (!lifeAreasData && Array.isArray(settings?.life_areas) && settings.life_areas.length > 0) {
      lifeAreasData = {} as Record<string, boolean>;
      for (const k of LIFE_AREAS) {
        lifeAreasData[k] = settings.life_areas.includes(k);
      }
      if (settings.work_mode_enabled) lifeAreasData.work = true;
    }
    let aiPrefsData = prefs.data as Record<string, unknown> | null;
    if (!aiPrefsData && settings) {
      aiPrefsData = {
        tone: settings.assistant_tone ?? 'calm',
        response_length: settings.response_length ?? 'short',
        emoji_level: settings.emoji_level ?? 1,
        checkin_preference: settings.checkin_preference ?? 'evening',
      };
    }
    return {
      profile: profile.data,
      lifeAreas: lifeAreasData ?? {},
      dailyRhythm: rhythm.data ?? {},
      aiPreferences: aiPrefsData ?? {},
    };
  }
}
