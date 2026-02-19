# LIFEOS_MASTER_SPEC.md
**LifeOS** — Calendar-first Social Life Engine (multi-user)  
React Native (Expo) + Supabase + OpenAI (Responses API)  
Goal: MVP that is actually shippable + extensible “LifeOS” superapp foundation.

---

## 0) Non-negotiables
1) **Calendar/Timeline engine first** (Flow tab is the core).  
2) **Multi-user from day 1** (auth, invites, RSVP, chat).  
3) Design PNGs are **style references only** (component language).  
4) App stays usable while long ops run: **no blocking** UI.  
5) Clean architecture, code review-ready, localization-ready.  
6) Everything runs end-to-end: mobile + api + supabase locally.

---

## 1) Design input rules (IMPORTANT)
You have **5 Stitch PNGs** in `/designs` + a Stitch ZIP with `screen.png` and `code.html`. These visuals include:
- **Main Timeline / Today’s Flow** (timeline rail + cards + top metric pills + voice FAB)
- **Social Mode** (event card + group avatars + group activity preview + invite CTA + finance insight snippet)
- **Finance Layer** (monthly flow overview + “intelligence alert” + upcoming obligations + statuses like AUTO-PAY / PAY NOW)
- **Daily Routine** (flow state ring, assistant nudge card, active habits list, consistency matrix, streak)
- **Voice Command UI** (speech -> parsed suggestions -> edit/confirm)

### Cursor MUST NOT
- Pixel-perfect copy every detail
- Copy sample text literally
- Hardcode fake data that doesn’t map to schema
- Add random extra unrelated screens
- Go “crypto/neon” look (you explicitly disliked that)

### Cursor MUST DO
- Extract reusable component patterns: cards, chips, icons, tab bar, time-rail, rings, list rows
- Build a cohesive **Design System**: tokens + semantic colors + light/dark themes
- Use realistic in-app data & actions (events, invites, bills, habits)
- Keep UI premium/calm/human (soft shadows, spacious layout, friendly microcopy)

---

## 2) Product scope (MVP)
### 2.1 Primary outcomes
User can:
- Sign in -> see Flow timeline -> create/edit events -> invite people -> chat in event thread  
- Add bills + mark autopay + store “amount this month” + reminders  
- Add habits/routines and track daily completion + see weekly consistency matrix  
- Get gentle “friend-like” notifications (daily check-in + bill amount prompts)  
- See **Insights** screen (simple computed stats now, AI generated later)

### 2.2 Tabs (MVP)
- **Flow**: calendar timeline day view (core)
- **Network**: invites, shared events, chats
- **Vault**: bills/subscriptions/obligations
- **Routine**: habits + daily routine + consistency matrix
- **System**: settings, profile, notification prefs, language

(If you must reduce to 4 tabs: merge System into Routine or Insights; but keep routing modular.)

---

## 3) Phase plan
### Phase 1 (Ship MVP)
- Calendar/timeline engine
- Event CRUD + invite + RSVP + chat
- Bills: variable amount capture + autopay semantics
- Habits/routines: daily list + completion + streak + consistency matrix
- Notifications: daily check-in + bill amount prompt + event reminder
- Insights: basic metrics (no heavy AI)
- AI scaffolding: jobs table + endpoints + prompt templates (feature-flagged)

### Phase 2 (AI add-on)
- Voice/text command parsing -> structured actions
- Friendly check-in copy generation
- Weekly insight generation async (non-blocking)
- Hybrid memory extraction (facts + soft patterns)
- Optional STT/TTS (voice to text, read aloud)

---

## 4) Tech stack
### Monorepo
pnpm workspaces

### Mobile (Expo)
- Expo SDK latest stable (pin exact versions)
- TypeScript strict
- expo-router
- @tanstack/react-query
- zustand
- zod + react-hook-form
- i18next (en/tr)
- @shopify/flash-list (timeline performance)
- date library: dayjs (preferred) or date-fns (pick one)

### API
- Node LTS pinned (.nvmrc)
- NestJS preferred (clear modules/services). Express acceptable if you keep modules clean.
- Supabase service role (server-side)
- OpenAI Responses API (Phase 2)
- zod validation at boundaries

---

## 5) Setup: accounts & keys
Required now:
1) Supabase project (DB + Auth + RLS)
2) OpenAI API key (Phase 2; still set up now)
3) Expo + EAS (build + push tokens later)

Env examples:
- /apps/api/.env.example
- /apps/mobile/.env.example

Models (recommended routing):
- FAST: `gpt-5-nano` (cheap & quick extraction/parse)
- CHAT: `gpt-5-mini` (friendly short copy)
- INSIGHT: `gpt-5.2` (weekly summaries, heavier reasoning)

---

## 6) Data model principles (scalable)
**Everything becomes a TimelineItem** with typed detail tables.  
Habits also generate timeline items optionally (for “today schedule”), but core habit data is separate.

(Full schema + RLS in DATABASE_AND_RLS.md)

---

## 7) UX behavior rules (human, not robotic)
### 7.1 Assistant tone
- Short, warm, non-judgmental
- No “robot checklist” questions
- Avoid corporate phrasing
- Ask 1 question at a time
- Use the user’s habits & facts to adapt (Phase 2)

### 7.2 Notifications
- If user had zero interaction today: send evening check-in
- Bill due soon and amount unknown: ask “how much arrived?”
- If bill is autopay: NEVER ask “did you pay?”
- Event reminders: no “confirm” flows in MVP

(Details in NOTIFICATIONS_AND_CHECKINS.md)

---

## 8) Performance
- Flow timeline uses FlashList + stable keys
- Avoid heavy re-renders; keep cards pure
- API queries indexed (timeline_items by user_id + start_at)

---

## 9) MVP deliverables checklist
Backend:
- Supabase migrations + RLS
- Auth verify middleware
- Timeline endpoints
- Events + invites + RSVP
- Conversations + messages
- Bills + autopay + amount updates
- Habits + completion + matrix endpoints
- Notification token registry + dev rule runner
- AI scaffolding endpoints + jobs table

Mobile:
- Auth screens
- Tabs working
- Flow timeline + create/edit event
- Network: invite list + event detail + chat
- Vault: bills list + bill detail + quick amount input
- Routine: daily routine ring + habits list + matrix view
- System: language switch + notification prefs + timezone

AI (scaffold):
- job runner skeleton, prompts stored, endpoints feature-flagged

END
