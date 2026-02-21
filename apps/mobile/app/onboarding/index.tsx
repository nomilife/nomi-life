import { useState } from 'react';
import {
  View,
  Pressable,
  ScrollView,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { api } from '@/lib/api';
import { AppText, TimeInput } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { nomiAppColors } from '@/theme/tokens';

const LIFE_AREAS = [
  { key: 'social', label: 'Social', desc: 'Family, friends, community', icon: 'people' as const },
  { key: 'health', label: 'Health', desc: 'Wellness, sleep, fitness', icon: 'heart' as const },
  { key: 'finance', label: 'Finance', desc: 'Bills, budgets, savings', icon: 'wallet' as const },
  { key: 'mind', label: 'Mind', desc: 'Learning, growth, mindfulness', icon: 'sparkles' as const },
  { key: 'relationships', label: 'Relationships', desc: 'Connections, communication', icon: 'chatbubbles' as const },
  { key: 'admin', label: 'Admin', desc: 'Tasks, errands, life logistics', icon: 'checkbox' as const },
  { key: 'work', label: 'Work', desc: 'Career, productivity', icon: 'briefcase' as const },
];

const TONE_OPTIONS = [
  { value: 'calm', label: 'Calm & Friendly', desc: 'Take a deep breath. We can tackle this together.' },
  { value: 'neutral', label: 'Neutral', desc: 'Clear, factual, no fluff.' },
  { value: 'strict', label: 'Strict', desc: 'Direct, accountability-focused.' },
];

const BILL_TEMPLATES = [
  { vendor: 'Rent', defaultDueDay: 1 },
  { vendor: 'Electricity', defaultDueDay: 10 },
  { vendor: 'Water', defaultDueDay: 10 },
  { vendor: 'Internet', defaultDueDay: 10 },
  { vendor: 'Phone', defaultDueDay: 10 },
  { vendor: 'Credit card', defaultDueDay: 20 },
];

const TOTAL_STEPS = 6;

export default function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);

  const [step, setStep] = useState(1);
  /** Tüm alanlar listede, drag ile sıralanır (native'de) */
  type LifeAreaItem = { key: string; label: string; desc: string; icon: typeof LIFE_AREAS[0]['icon'] };
  const [lifeAreasData, setLifeAreasData] = useState<LifeAreaItem[]>(() =>
    LIFE_AREAS.map((a) => ({ key: a.key, label: a.label, desc: a.desc, icon: a.icon }))
  );
  const lifeAreas = Object.fromEntries(LIFE_AREAS.map((a) => [a.key, true])) as Record<string, boolean>;
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [checkinPref, setCheckinPref] = useState<'morning' | 'evening' | 'adaptive'>('evening');
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [autoCategorize, setAutoCategorize] = useState(true);
  const [suggestPlans, setSuggestPlans] = useState(true);
  const [weeklyInsights, setWeeklyInsights] = useState(true);
  const [useDataPrefs, setUseDataPrefs] = useState(true);
  const [tone, setTone] = useState<'calm' | 'neutral' | 'strict'>('calm');
  const [responseLength, setResponseLength] = useState<'short' | 'balanced' | 'detailed'>('short');
  const [emojiLevel, setEmojiLevel] = useState(1);
  const [billTemplates, setBillTemplates] = useState<Record<string, { enabled: boolean; dueDay: number; autopay: boolean }>>(
    Object.fromEntries(BILL_TEMPLATES.map((b) => [b.vendor, { enabled: false, dueDay: b.defaultDueDay, autopay: true }]))
  );

  const saveStepMutation = useMutation({
    mutationFn: async ({ s, payload }: { s: number; payload: Record<string, unknown> }) =>
      api('/onboarding/save-step', { method: 'POST', body: JSON.stringify({ step: s, payload }) }),
    onError: (e) => Alert.alert('Hata', (e as Error).message),
  });

  const completeMutation = useMutation({
    mutationFn: async (triggerWow: boolean) =>
      api<{ jobId?: string }>('/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify({ triggerWow }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      if (data.jobId) {
        router.replace({ pathname: '/(tabs)/flow', params: { wowJobId: data.jobId } } as never);
      } else {
        router.replace('/(tabs)/flow' as never);
      }
    },
    onError: (e) => Alert.alert('Hata', (e as Error).message),
  });


  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      const lifeAreasOrder = lifeAreasData.map((a) => a.key);
      await saveStepMutation.mutateAsync({
        s: 2,
        payload: { ...lifeAreas, lifeAreasOrder },
      });
      setStep(3);
      return;
    }

    if (step === 3) {
      await saveStepMutation.mutateAsync({
        s: 3,
        payload: {
          wakeTime,
          sleepTime,
          checkinPreference: checkinPref,
          workStart: lifeAreas.work ? workStart : null,
          workEnd: lifeAreas.work ? workEnd : null,
        },
      });
      setStep(4);
      return;
    }

    if (step === 4) {
      await saveStepMutation.mutateAsync({
        s: 4,
        payload: {
          autoCategorize,
          suggestPlans,
          weeklyInsights,
          useDataPreferences: useDataPrefs,
          tone,
          responseLength,
          emojiLevel,
          checkinPreference: checkinPref,
        },
      });
      setStep(lifeAreas.finance ? 5 : 6);
      return;
    }

    if (step === 5) {
      const templates = Object.entries(billTemplates)
        .filter(([, v]) => v.enabled)
        .map(([vendor, v]) => ({ vendor, dueDay: v.dueDay, autopay: v.autopay }));
      await saveStepMutation.mutateAsync({
        s: 5,
        payload: { billTemplates: templates },
      });
      setStep(6);
      return;
    }

    if (step === 6) {
      completeMutation.mutate(true);
    }
  };

  const handleSkip = () => {
    if (step === 1 || isLastStep) {
      completeMutation.mutate(false);
    } else {
      setStep(Math.min(step + 1, TOTAL_STEPS));
    }
  };

  const canGoBack = step > 1;
  const isLastStep = step === TOTAL_STEPS;

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: nomiAppColors.background }}>
      {/* Fixed header: progress + back */}
      <View style={{ paddingHorizontal: theme.spacing.xl, paddingTop: 60, paddingBottom: theme.spacing.md }}>
        {canGoBack && (
          <Pressable
            onPress={handleBack}
            style={{
              position: 'absolute',
              top: 12,
              left: theme.spacing.xl,
              zIndex: 10,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.surface2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={22} color={nomiAppColors.primary} />
          </Pressable>
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.xs }}>
          <AppText variant="small" style={{ color: nomiAppColors.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Step {step} of {TOTAL_STEPS}
          </AppText>
          <AppText variant="small" color="muted">{Math.round((step / TOTAL_STEPS) * 100)}% Complete</AppText>
        </View>
        <View style={{ height: 4, backgroundColor: theme.colors.surface2, borderRadius: 2, marginBottom: theme.spacing.xl }}>
          <View
            style={{
              width: `${(step / TOTAL_STEPS) * 100}%`,
              height: '100%',
              backgroundColor: nomiAppColors.primary,
              borderRadius: 2,
            }}
          />
        </View>
      </View>

      {/* Step 1: Fixed title + subtitle (only Start at bottom, no Skip) */}
      {step === 1 && (
        <View style={{ paddingHorizontal: theme.spacing.xl, marginBottom: theme.spacing.sm }}>
          <AppText variant="display" style={{ color: theme.colors.textPrimary, textAlign: 'center', marginBottom: theme.spacing.sm }}>
            Meet NOMI
          </AppText>
          <AppText variant="body" color="muted" style={{ textAlign: 'center', marginBottom: theme.spacing.lg }}>
            Your life, organized. Calm. Smart.
          </AppText>
        </View>
      )}

      {/* Steps 2–6: Fixed title + Skip (top right) + subtitle */}
      {step === 2 && (
        <View style={{ paddingHorizontal: theme.spacing.xl, marginBottom: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs }}>
            <AppText variant="h2" style={{ color: theme.colors.textPrimary, flex: 1, fontSize: 24 }}>
              What matters most right now?
            </AppText>
            <Pressable onPress={handleSkip} disabled={completeMutation.isPending} style={{ padding: theme.spacing.sm }}>
              <AppText variant="body" color="muted">Skip</AppText>
            </Pressable>
          </View>
          <AppText variant="body" color="muted" style={{ marginBottom: theme.spacing.lg }}>
            Press and hold to drag & reorder by priority.
          </AppText>
        </View>
      )}
      {step === 3 && (
        <View style={{ paddingHorizontal: theme.spacing.xl, marginBottom: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs }}>
            <AppText variant="h2" style={{ color: theme.colors.textPrimary, flex: 1 }}>
              Daily Rhythm
            </AppText>
            <Pressable onPress={handleSkip} disabled={completeMutation.isPending} style={{ padding: theme.spacing.sm }}>
              <AppText variant="body" color="muted">Skip</AppText>
            </Pressable>
          </View>
          <AppText variant="body" color="muted" style={{ marginBottom: theme.spacing.lg }}>
            When you wake, sleep, and prefer check-ins.
          </AppText>
        </View>
      )}
      {step === 4 && (
        <View style={{ paddingHorizontal: theme.spacing.xl, marginBottom: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs }}>
            <AppText variant="h2" style={{ color: theme.colors.textPrimary, flex: 1 }}>
              What do you want Nomi to do?
            </AppText>
            <Pressable onPress={handleSkip} disabled={completeMutation.isPending} style={{ padding: theme.spacing.sm }}>
              <AppText variant="body" color="muted">Skip</AppText>
            </Pressable>
          </View>
          <AppText variant="body" color="muted" style={{ marginBottom: theme.spacing.lg }}>
            AI behavior and preferences. You can change these later.
          </AppText>
        </View>
      )}
      {step === 5 && (
        <View style={{ paddingHorizontal: theme.spacing.xl, marginBottom: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs }}>
            <AppText variant="h2" style={{ color: theme.colors.textPrimary, flex: 1 }}>
              Track these monthly bills?
            </AppText>
            <Pressable onPress={handleSkip} disabled={completeMutation.isPending} style={{ padding: theme.spacing.sm }}>
              <AppText variant="body" color="muted">Skip</AppText>
            </Pressable>
          </View>
          <AppText variant="body" color="muted" style={{ marginBottom: theme.spacing.lg }}>
            Toggle to add. Set due day and autopay. Amounts can be added later.
          </AppText>
        </View>
      )}
      {step === 6 && (
        <View style={{ paddingHorizontal: theme.spacing.xl, marginBottom: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs }}>
            <AppText variant="h2" style={{ color: theme.colors.textPrimary, flex: 1 }}>
              You're all set
            </AppText>
            <Pressable onPress={handleSkip} disabled={completeMutation.isPending} style={{ padding: theme.spacing.sm }}>
              <AppText variant="small" color="muted">Finish without plan</AppText>
            </Pressable>
          </View>
          <AppText variant="body" color="muted" style={{ marginBottom: theme.spacing.lg }}>
            Here's a quick look at your profile before we begin.
          </AppText>
        </View>
      )}

      {step === 2 ? (
        <View style={{ flex: 1, paddingHorizontal: theme.spacing.xl }}>
          <DraggableFlatList
            data={lifeAreasData}
            onDragEnd={({ data }) => setLifeAreasData(data)}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
            renderItem={({ item, drag, getIndex, isActive }) => {
              const idx = getIndex() ?? 0;
              const isFirst = idx === 0;
              return (
                <ScaleDecorator>
                  <Pressable
                    onLongPress={drag}
                    delayLongPress={200}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: theme.colors.surface,
                      borderWidth: isFirst ? 2 : 1,
                      borderColor: isFirst ? nomiAppColors.primary : theme.colors.border,
                      borderRadius: theme.radius.lg,
                      padding: theme.spacing.md,
                      marginBottom: theme.spacing.sm,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: isActive ? 0.15 : 0.05,
                      shadowRadius: isActive ? 4 : 2,
                      elevation: isActive ? 4 : 1,
                    }}
                  >
                    <View style={{ width: 32, alignItems: 'center', marginRight: theme.spacing.sm }}>
                      <AppText variant="body" style={{ fontWeight: '700', color: isFirst ? nomiAppColors.primary : theme.colors.textMuted }}>
                        {idx + 1}
                      </AppText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: theme.spacing.md }}>
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: theme.radius.md,
                          backgroundColor: isFirst ? nomiAppColors.primary : theme.colors.surface2,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name={item.icon} size={24} color={isFirst ? '#fff' : theme.colors.textMuted} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText variant="body" style={{ fontWeight: '600', color: theme.colors.textPrimary }}>{item.label}</AppText>
                        <AppText variant="small" color="muted" style={{ marginTop: 2 }}>{item.desc}</AppText>
                      </View>
                    </View>
                    <View style={{ padding: theme.spacing.sm }}>
                      <Ionicons name="reorder-three" size={24} color={theme.colors.textMuted} />
                    </View>
                  </Pressable>
                </ScaleDecorator>
              );
            }}
          />
        </View>
      ) : (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View style={{ alignItems: 'center', paddingBottom: theme.spacing.xl }}>
            <Image source={require('@/assets/nomi-logo.png')} style={{ width: 160, height: 160 }} resizeMode="contain" />
          </View>
        )}

        {step === 3 && (
          <View style={{ gap: theme.spacing.md }}>
              <TimeInput label="Wake time" value={wakeTime} onChangeText={setWakeTime} placeholder="07:00" />
              <TimeInput label="Sleep time" value={sleepTime} onChangeText={setSleepTime} placeholder="23:00" />
              <View>
                <AppText variant="small" color="muted">Check-in preference</AppText>
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
                  {(['evening', 'morning', 'adaptive'] as const).map((v) => (
                    <Pressable
                      key={v}
                      onPress={() => setCheckinPref(v)}
                      style={{
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.sm,
                        borderRadius: theme.radius.md,
                        backgroundColor: checkinPref === v ? nomiAppColors.primary : theme.colors.surface,
                      }}
                    >
                      <AppText variant="small" style={{ color: checkinPref === v ? '#fff' : theme.colors.text }}>{v}</AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
              {lifeAreas.work && (
                <View style={{ gap: theme.spacing.md }}>
                  <TimeInput label="Work start" value={workStart} onChangeText={setWorkStart} placeholder="09:00" />
                  <TimeInput label="Work end" value={workEnd} onChangeText={setWorkEnd} placeholder="17:00" />
                </View>
              )}
            </View>
        )}

        {step === 4 && (
          <View style={{ gap: theme.spacing.md }}>
              {[
                { label: 'Auto-categorize what I say', value: autoCategorize, set: setAutoCategorize },
                { label: 'Suggest plans automatically', value: suggestPlans, set: setSuggestPlans },
                { label: 'Weekly insights summary', value: weeklyInsights, set: setWeeklyInsights },
                { label: 'Use my data to learn preferences', value: useDataPrefs, set: setUseDataPrefs },
              ].map(({ label, value, set }) => (
                <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.sm }}>
                  <AppText variant="body" style={{ color: theme.colors.text }}>{label}</AppText>
                  <Switch value={value} onValueChange={set} trackColor={{ true: nomiAppColors.primary }} />
                </View>
              ))}
              <View style={{ marginTop: theme.spacing.lg }}>
                <AppText variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>Tone</AppText>
                {TONE_OPTIONS.map((o) => (
                  <Pressable
                    key={o.value}
                    onPress={() => setTone(o.value as 'calm' | 'neutral' | 'strict')}
                    style={{
                      padding: theme.spacing.md,
                      borderRadius: theme.radius.md,
                      borderWidth: tone === o.value ? 2 : 1,
                      borderColor: tone === o.value ? nomiAppColors.primary : theme.colors.border,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    <AppText variant="body" style={{ color: theme.colors.text }}>{o.label}</AppText>
                    <AppText variant="small" color="muted">{o.desc}</AppText>
                  </Pressable>
                ))}
              </View>
              <View>
                <AppText variant="small" color="muted">Response length</AppText>
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
                  {(['short', 'balanced', 'detailed'] as const).map((v) => (
                    <Pressable key={v} onPress={() => setResponseLength(v)} style={{ paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.radius.md, backgroundColor: responseLength === v ? nomiAppColors.primary : theme.colors.surface }}>
                      <AppText variant="small" style={{ color: responseLength === v ? '#fff' : theme.colors.text }}>{v}</AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View>
                <AppText variant="small" color="muted">Emoji level (0-2)</AppText>
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
                  {[0, 1, 2].map((v) => (
                    <Pressable key={v} onPress={() => setEmojiLevel(v)} style={{ paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.radius.md, backgroundColor: emojiLevel === v ? nomiAppColors.primary : theme.colors.surface }}>
                      <AppText variant="small" style={{ color: emojiLevel === v ? '#fff' : theme.colors.text }}>{v}</AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
        )}

        {step === 5 && (
          <View style={{ gap: theme.spacing.sm }}>
              {BILL_TEMPLATES.map((b) => {
                const enabled = billTemplates[b.vendor]?.enabled ?? false;
                const dueDay = billTemplates[b.vendor]?.dueDay ?? b.defaultDueDay;
                const autopay = billTemplates[b.vendor]?.autopay ?? true;
                return (
                  <View
                    key={b.vendor}
                    style={{
                      padding: theme.spacing.md,
                      borderRadius: theme.radius.lg,
                      backgroundColor: theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: enabled ? theme.spacing.sm : 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: nomiAppColors.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="wallet-outline" size={18} color={nomiAppColors.primary} />
                        </View>
                        <View>
                          <AppText variant="body" style={{ color: theme.colors.text }}>{b.vendor}</AppText>
                          {enabled && (
                            <AppText variant="small" color="muted">Day {dueDay} · {autopay ? 'Autopay on' : 'Manual'}</AppText>
                          )}
                        </View>
                      </View>
                      <Switch
                        value={enabled}
                        onValueChange={(v) => setBillTemplates((prev) => ({ ...prev, [b.vendor]: { ...prev[b.vendor], enabled: v, dueDay: prev[b.vendor]?.dueDay ?? b.defaultDueDay, autopay: prev[b.vendor]?.autopay ?? true } }))}
                        trackColor={{ true: nomiAppColors.primary }}
                      />
                    </View>
                    {enabled && (
                      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.sm, paddingTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                        <View style={{ flex: 1 }}>
                          <AppText variant="small" color="muted">Due day (1-31)</AppText>
                          <TextInput
                            value={String(dueDay)}
                            onChangeText={(t) => {
                              const n = parseInt(t, 10);
                              if (t === '' || (!isNaN(n) && n >= 1 && n <= 31)) {
                                setBillTemplates((prev) => ({ ...prev, [b.vendor]: { enabled: true, dueDay: t === '' ? 1 : n, autopay: prev[b.vendor]?.autopay ?? true } }));
                              }
                            }}
                            keyboardType="number-pad"
                            style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: theme.spacing.sm, ...theme.typography.body, color: theme.colors.text }}
                          />
                        </View>
                        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                          <AppText variant="small" color="muted">Autopay</AppText>
                          <Switch
                            value={autopay}
                            onValueChange={(v) => setBillTemplates((prev) => ({ ...prev, [b.vendor]: { ...prev[b.vendor]!, autopay: v } }))}
                            trackColor={{ true: nomiAppColors.primary }}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
        )}

        {step === 6 && (
          <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border }}>
                <Ionicons name="person-outline" size={20} color={nomiAppColors.primary} />
                <View>
                  <AppText variant="small" color="muted">FOCUS AREAS</AppText>
                  <AppText variant="body" style={{ color: theme.colors.text }}>
                    {LIFE_AREAS.filter((a) => lifeAreas[a.key]).map((a) => a.label).join(', ')}
                  </AppText>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border }}>
                <Ionicons name="time-outline" size={20} color={nomiAppColors.primary} />
                <View>
                  <AppText variant="small" color="muted">RHYTHM & CHECK-IN</AppText>
                  <AppText variant="body" style={{ color: theme.colors.text }}>
                    Wake {wakeTime} · Sleep {sleepTime} · Check-in {checkinPref}
                  </AppText>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border }}>
                <Ionicons name="sparkles-outline" size={20} color={nomiAppColors.primary} />
                <View>
                  <AppText variant="small" color="muted">AI PREFERENCES</AppText>
                  <AppText variant="body" style={{ color: theme.colors.text }}>
                    {TONE_OPTIONS.find((o) => o.value === tone)?.label ?? tone} · {responseLength} · Emoji {emojiLevel}
                  </AppText>
                </View>
              </View>
              {lifeAreas.finance && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border }}>
                  <Ionicons name="wallet-outline" size={20} color={nomiAppColors.primary} />
                  <View>
                    <AppText variant="small" color="muted">BILLS TO TRACK</AppText>
                    <AppText variant="body" style={{ color: theme.colors.text }}>
                      {Object.entries(billTemplates).filter(([, v]) => v.enabled).length > 0
                        ? Object.entries(billTemplates).filter(([, v]) => v.enabled).map(([k]) => k).join(', ')
                        : 'None selected'}
                    </AppText>
                  </View>
                </View>
              )}
            </View>
        )}

      </ScrollView>
      )}
      {/* Bottom button - fixed at bottom, safe area aware */}
      <View style={{ padding: theme.spacing.xl, paddingBottom: Math.max(insets.bottom, 16) + theme.spacing.sm, backgroundColor: nomiAppColors.background }}>
        {step === 1 ? (
          <Pressable
            onPress={handleNext}
            disabled={completeMutation.isPending}
            style={{
              width: '100%',
              backgroundColor: nomiAppColors.primary,
              paddingVertical: theme.spacing.md,
              borderRadius: 9999,
              alignItems: 'center',
              shadowColor: nomiAppColors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {completeMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <AppText variant="body" style={{ color: '#fff', fontWeight: '700' }}>Start</AppText>
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={handleNext}
            disabled={saveStepMutation.isPending || completeMutation.isPending}
            style={{
              width: '100%',
              backgroundColor: nomiAppColors.primary,
              paddingVertical: theme.spacing.md,
              borderRadius: 9999,
              alignItems: 'center',
              shadowColor: nomiAppColors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {saveStepMutation.isPending || completeMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <AppText variant="body" style={{ color: '#fff', fontWeight: '700' }}>
                {isLastStep ? 'Generate my plan' : 'Continue'}
              </AppText>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}
