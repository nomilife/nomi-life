# LIFEOS_IMPLEMENTATION_GAPFIX.md
**Goal:** Current app runs, but UI/UX + feature depth is far below LifeOS spec + Stitch reference style.  
We must upgrade to a shippable MVP that matches the “premium calm human” design language and calendar-first behavior.

## 0) What we see now (current gaps)
### UI/Design gaps
- Screens are placeholder/basic: headings like “title”, “flow”, “network”, etc.
- No design system (tokens, typography scale, spacing, radii, shadows).
- No reusable component library: cards, chips, icon badges, sections, empty states, loaders.
- Forms are raw inputs; no consistent field components, validation, error states, keyboard handling.
- No polished navigation header treatment or tab iconography consistent with Stitch style.

### Product/Feature gaps
- Flow tab: basic list; no real day timeline structure (segments, time blocks, grouping).
- Network tab: basically empty; no invites list, shared events, conversation entry points.
- Vault tab: minimal bills list; no “amount capture” flows, autopay semantics UI, due/overdue states.
- Routine tab: no habit engine; no streaks, daily routine checklist, ring/progress UI.
- System tab: minimal settings; missing preferences and i18n switch behavior.
- No insights tab/weekly insights screen (or it’s not meaningful).
- No chat experience (event chat screen, message list, input, realtime subscription).
- No notification UX scaffold (in-app notification center, prompt cards, pending actions).
- AI not integrated (fine), but we need the **architecture scaffolding**: jobs, progress stages, non-blocking UX.

### Backend alignment gaps (from observed network)
- Requests exist, but feature endpoints aren’t fully used to build real flows:
  - /events, /timeline?date=..., /bills?range=...
- Missing “Network” endpoints usage: invites, RSVP, conversations.
- Missing rules/notifications endpoints usage in UI.

---

## 1) Non-negotiables for the next iteration
1) Build a **Design System** and **Reusable Component Library** first, then refactor screens to use them.
2) Screens must use **real app data** (from API), but sample texts from Stitch must NOT be copied literally.
3) Multi-user behavior must be represented in UI:
   - invite people
   - RSVP statuses
   - event chat per event
4) UX must be “premium calm human” (not crypto, not neon). Pastel gradients are ok but subtle.
5) Localization ready: all strings go through i18n keys (EN/TR minimal).
6) Must include proper: loading / empty / error states, optimistic UI where safe.

---

## 2) Design references input rules
We have 5 PNGs under `/designs` (Stitch outputs). They are **style references only**.
### Must extract from PNGs
- Card shapes: soft radius, layered surfaces, subtle shadows
- Chip/pill patterns
- Typography hierarchy: large title, subtle meta labels
- Timeline left rail + event cards pattern
- Social mode card + participant avatars row pattern
- Finance card pattern: due, amount, action
- Mic floating button pattern (later)
### Must NOT do
- Pixel-perfect copy
- Copy fake sample text
- Hardcode fake numbers/labels from PNG

---

## 3) Deliverable: Design System (create first)
Create folder: `apps/mobile/theme/` (if not already)
### 3.1 Tokens
- spacing: 4/8/12/16/20/24/32
- radius: 12/16/20/24
- typography: display, title, body, caption
- elevations/shadows: 1..3
- semantic colors:
  - background, surface, surface2, border
  - textPrimary, textSecondary, muted
  - accent, accent2, success, warning, danger
- support light/dark themes

### 3.2 Components (create reusable UI kit)
Create folder: `apps/mobile/components/ui/` with:
- `AppText` (typography variants)
- `AppCard` (surface + shadow + padding)
- `AppButton` (primary/secondary/ghost, loading)
- `AppInput` (label, error, helper)
- `AppChip` (tag/pill)
- `SectionHeader`
- `EmptyState`
- `LoadingState` (skeleton-like simple)
- `AvatarStack` (+count bubble)
- `IconBadge`
- `TopBar` (optional)
All screens must use these.

---

## 4) Screen rebuild requirements (MVP)
Use expo-router tabs. Tabs should be:
- Flow (timeline)
- Network (social/invites/chats)
- Vault (bills)
- Routine (habits)
- System (settings)
(Insights can be added as 6th or merged later, but implement at least a basic Weekly Insights screen either as Flow subpage or separate tab if already planned.)

### 4.1 Flow (Timeline Day View)
**Goal:** A day timeline that feels like Stitch “Today’s Flow / Main Timeline”.
Must include:
- Date header + day label
- “Quick add” entry point (button)
- Timeline rail (left) with time markers OR grouped sections (morning/afternoon/evening)
- Cards:
  - EventCard: title, time range, location, status
  - BillCard: vendor, due date, autopay badge, amount (or “amount missing” badge)
- Empty state: if no items, show friendly empty prompt (not robotic).
Data:
- GET `/timeline?date=YYYY-MM-DD`
Actions:
- Tap event -> Event Detail
- Tap bill -> Bill Detail / Amount input
- Quick add -> Add Event / Add Bill (simple chooser)

### 4.2 Event Create (Upgrade)
Current event-create is raw inputs.
Must become:
- Title
- Start/End pickers (proper datetime picker)
- Location
- Visibility (private/shared)
- Invite emails (optional multi input)
Validation:
- zod + react-hook-form
UX:
- Keyboard safe
- Save button disabled until valid
After create: navigate back + toast/snackbar “Added”.

### 4.3 Network (Invites + Shared Events + Chats)
This tab cannot be empty.
Must include:
- “Invites” section: pending invites list (event name, date, from, accept/decline buttons)
- “Shared Events” section: events where user is participant
- Tap event -> Event Detail -> Chat
Data:
- GET `/events/shared` OR reuse timeline items where visibility=shared (if API exists, implement).
- RSVP endpoint: POST `/events/:id/rsvp`
- Conversation:
  - GET `/events/:id/conversation`
  - Screen: message list + composer
Realtime:
- If Supabase realtime is already set up, subscribe. If not, implement simple polling and upgrade later.

### 4.4 Vault (Bills)
Must look like Stitch “Finance Insight” card pattern.
Features:
- Bills list (upcoming)
- Each bill card:
  - vendor
  - due in X days
  - autopay indicator
  - amount (if missing -> show “amount needed”)
- Add bill screen:
  - vendor, due date, recurrence, autopay toggle, optional amount
- Quick amount capture:
  - if amount null and due date soon -> show CTA “Add amount”
Rules:
- If autopay=true: never ask “paid?” only amount.
Data:
- GET `/bills?range=upcoming`
- PATCH `/bills/:id` for amount/autopay changes

### 4.5 Routine (Habits)
Currently empty.
Implement MVP habit engine UI:
- Daily routine header: a ring/progress indicator (simple circular progress component)
- Habit list for today: checkboxes
- Add habit screen:
  - name
  - schedule (daily or specific weekdays)
  - reminder time optional
Data:
- If backend has /habits endpoints use them; otherwise implement minimal:
  - GET `/habits/today`
  - POST `/habits`
  - PATCH `/habits/:id` (toggle done)
(If habits module exists in API folder, wire it.)

### 4.6 System (Settings)
Upgrade from basic to:
- Language switch (EN/TR) using i18n keys
- Notification preferences (toggles)
- Quiet hours start/end
- Sign out
Do not hardcode texts.

### 4.7 Weekly Insights (Basic)
Create a screen (tab or nested route):
- Show last 7 days metrics computed from API:
  - active days count
  - events count
  - social events count
  - bills totals (known)
- A simple “month overview” toggle (can be a calendar grid view placeholder)
No heavy AI required.

---

## 5) Data, state, and error handling standards
- Use `@tanstack/react-query` for all server state.
- Build `apiClient` with baseURL from `EXPO_PUBLIC_API_URL`.
- Standard query keys:
  - `timeline(date)`
  - `bills(range)`
  - `events.shared`
  - `events.invites`
  - `messages(conversationId)`
- Every screen must have:
  - loading state
  - empty state
  - error state with retry

---

## 6) Backend alignment tasks (small but required)
If any endpoints are missing, implement minimally in API:
- Shared events list for Network
- Invites list for user
- RSVP update
- Conversation create/get + message post
- Habits endpoints
Also confirm CORS and auth flow are correct.

---

## 7) Refactor plan (do in this order)
1) Build theme tokens + UI kit components
2) Refactor Flow screen to match reference patterns
3) Refactor Event Create to proper form + pickers
4) Implement Network: invites + shared events + chat
5) Implement Vault: bills cards + amount capture
6) Implement Routine: habits list + progress
7) Implement System: settings + i18n
8) Add Weekly Insights

---

## 8) Acceptance criteria (done = shippable MVP)
- App looks cohesive and “premium calm” using the new UI kit.
- Flow shows real timeline items with cards, not placeholder text.
- Network shows invites and allows RSVP.
- Event detail opens chat and messages work end-to-end.
- Bills flow supports autopay semantics + missing amount capture.
- Habits can be created + checked off; progress updates.
- i18n works (EN/TR minimal).
- No screen is “empty placeholder” without an empty state UX.

---

## 9) Cursor instructions (IMPORTANT)
- Do not recreate the project scaffold.
- Do not add random unrelated screens.
- Use `/designs` PNGs as **style reference only**.
- Create reusable components; do not duplicate styles in screens.
- Keep code review quality: types, zod validation, clean folder structure.
