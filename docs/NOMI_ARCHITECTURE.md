# Nomi — Product Architecture

AI-powered personal operating system combining tasks, habits, events, bills, goals, and life analytics.

---

## Updated Screen List

| Screen | Route | Tab | Description |
|--------|-------|-----|-------------|
| Home | `/(tabs)/flow` | ✓ | AI Brief, Progress Ring, Focus, Timeline |
| AI Copilot | `/(tabs)/copilot` | ✓ | Chat + Quick actions |
| Inbox | `/(tabs)/inbox` | ✓ | Unified captures, convert to Task/Event/Habit/Bill |
| Tasks/Routine | `/(tabs)/routine` | ✓ | Habits, tasks, consistency, streaks |
| Calendar | `/(tabs)/events` | hidden | Today / Week / Month views |
| Goals | `/(tabs)/goals` | hidden | Goals → Milestones → Tasks |
| Insights | `/(tabs)/insights` | ✓ | Life analytics |
| Vault | `/(tabs)/vault` | hidden | Bills, finance |
| Network | `/(tabs)/network` | hidden | Social, invites |
| Settings | `/(tabs)/system` | ✓ | Theme, Life Areas, account |
| Event Create | `/(tabs)/event-create` | modal | New event |
| Bill Create | `/(tabs)/bill-create` | modal | New bill |
| Habit Create | `/(tabs)/habit-create` | modal | New habit |
| Voice | `/(modal)/voice` | modal | Voice capture |
| Sign In | `/(auth)/sign-in` | — | Auth |
| Sign Up | `/(auth)/sign-up` | — | Auth |
| Reset Password | `/(auth)/reset-password` | — | Auth |

---

## Navigation Map

```
(index) → session? (tabs)/flow : (auth)/sign-in

(tabs)
├── flow (Home)     [tab]
├── copilot (AI)    [tab]
├── inbox           [tab]
├── routine         [tab]
├── insights        [tab]
├── system          [tab]
├── events          [from menu]
├── goals           [from menu]
├── vault           [from menu]
├── network         [from menu]
├── event-create    [FAB / Add]
├── bill-create
├── habit-create
├── event/[id]
├── habit/[id]
└── bill/[id]

(modal) voice       [mic FAB]
```

---

## Component Breakdown

### Home (flow)
- `DailyBriefCard` — AI-generated daily summary, quick actions
- `ProgressRing` — Daily progress (tasks/events completed)
- `FocusMetricCard` — Focus state %
- `MetricCard` — Reusable metric (existing)
- `TimelineRail` + `EventCard` + `BillCard` (existing)
- Date chip strip (Today/Week nav)

### AI Copilot
- `CopilotChat` — Message list + input
- `QuickActionChip` — Plan my day, Reschedule, Summarize, Add task

### Inbox
- `InboxItem` — Raw capture card
- `ConvertActionSheet` — Task | Event | Habit | Bill

### Advanced Task
- `TaskCard` — Priority, energy, duration, life area
- `SubtaskChecklist` — Nested subtasks

### Goals
- `GoalCard` — Title, progress bar
- `MilestoneRow` — Linked milestones
- `GoalDetailScreen` — Goal → Milestones → Tasks tree

### Life Areas
- Default: Health, Career, Learning, Finance, Relationships, Mind
- Editable in Settings
- `LifeAreaChip` — Filter / tag

### Habits
- `HabitStreakBadge` — Fire icon + count
- `HabitCard` — Title, streak, today status

### Shared
- `AppCard`, `AppButton`, `AppText`, `AppInput`
- `SectionHeader`, `EmptyState`, `LoadingState`
- `MetricCard`, `AppChip`, `IconBadge`

---

## UX Copy Suggestions

| Context | Copy |
|---------|------|
| Home title | "Today's Flow" / "Bugünün Akışı" |
| AI Brief header | "Your day at a glance" |
| Quick actions | "Plan my day" / "Reschedule" / "Summarize" / "Add task" |
| Inbox empty | "Capture anything here. Convert to task, event, or habit." |
| Progress ring | "4 of 8 done" |
| Focus | "Focus 84%" |
| Goals empty | "Set a goal. Break it into milestones. Track progress." |
| Life Areas | "Health · Career · Learning · Finance · Relationships · Mind" |

---

## 8pt Spacing System

Base unit: 8px
- xs: 4  | sm: 8  | md: 16 | lg: 24 | xl: 32 | xxl: 40 | xxxl: 48

Typography (strong scale):
- display: 32 / 700
- title: 24 / 600
- h1: 22 / 600
- h2: 18 / 600
- h3: 16 / 600
- body: 16 / 400
- caption: 14 / 400
- small: 12 / 400

---

## File Structure (Expo / app router)

```
apps/mobile/
├── app/
│   ├── (auth)/ sign-in, sign-up, reset-password
│   ├── (tabs)/
│   │   ├── flow.tsx         # Home
│   │   ├── copilot.tsx      # AI chat (new)
│   │   ├── inbox.tsx        # Unified inbox (new)
│   │   ├── routine.tsx
│   │   ├── events.tsx
│   │   ├── goals.tsx        # (new)
│   │   ├── insights.tsx
│   │   ├── vault.tsx
│   │   ├── network.tsx
│   │   ├── system.tsx
│   │   ├── event-create.tsx, bill-create, habit-create
│   │   ├── event/[id], habit/[id], bill/[id]
│   │   └── _layout.tsx
│   └── (modal)/ voice.tsx
├── components/
│   ├── home/
│   │   ├── DailyBriefCard.tsx
│   │   ├── ProgressRing.tsx
│   │   └── FocusMetricCard.tsx
│   ├── copilot/
│   ├── inbox/
│   ├── goals/
│   ├── timeline/
│   └── ui/
├── store/
│   ├── theme.ts
│   ├── auth.ts
│   └── lifeAreas.ts        # (new)
├── theme/
└── lib/
```
