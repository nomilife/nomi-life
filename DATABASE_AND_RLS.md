# DATABASE_AND_RLS.md
Supabase Postgres schema + RLS strategy for LifeOS MVP.

---

## 1) Tables (MVP)

### 1.1 user_settings
- user_id uuid pk references auth.users(id)
- locale text default 'en'
- timezone text default 'Europe/Istanbul' (or detected)
- quiet_hours_start time null
- quiet_hours_end time null
- assistant_tone text default 'calm'
- emoji_level int default 1
- created_at timestamptz default now()
- updated_at timestamptz default now()

### 1.2 user_profile_facts (hard facts; Phase 2 used heavily)
- id uuid pk
- user_id uuid fk
- key text  (relationship_status, autopay_electricity, pay_day, etc.)
- value text
- source text (user|ai|system)
- confidence numeric (0..1)
- updated_at timestamptz

### 1.3 timeline_items (core stream)
- id uuid pk
- user_id uuid fk
- kind text (event|bill|habit_block|journal|insight|system)
- start_at timestamptz null
- end_at timestamptz null
- title text
- summary text null
- status text default 'scheduled'
- metadata jsonb default '{}'
- source text default 'user'
- created_at timestamptz default now()
- updated_at timestamptz default now()

### 1.4 events
- timeline_item_id uuid pk fk timeline_items(id) on delete cascade
- location text null
- visibility text default 'private' (private|shared)
- recurrence_rule_id uuid null fk recurrence_rules(id)

### 1.5 recurrence_rules
- id uuid pk
- user_id uuid fk
- rrule text
- timezone text
- exceptions jsonb default '[]'
- created_at timestamptz default now()

### 1.6 event_participants
- id uuid pk
- event_id uuid fk events(timeline_item_id) on delete cascade
- user_id uuid null fk auth.users(id)
- invited_email text null
- role text default 'guest' (host|guest)
- rsvp_status text default 'pending'
- created_at timestamptz default now()

### 1.7 conversations
- id uuid pk
- event_id uuid fk events(timeline_item_id) on delete cascade
- created_at timestamptz default now()

### 1.8 messages
- id uuid pk
- conversation_id uuid fk conversations(id) on delete cascade
- sender_user_id uuid fk auth.users(id)
- text text
- metadata jsonb default '{}'
- created_at timestamptz default now()

### 1.9 bills
- timeline_item_id uuid pk fk timeline_items(id)
- vendor text
- amount numeric null
- currency text default 'TRY'
- due_date date
- recurrence text null (monthly|weekly|yearly)
- autopay boolean default false
- last_amount numeric null
- created_at timestamptz default now()
- updated_at timestamptz default now()

### 1.10 habits
(needed because Stitch shows Daily Routine + matrix)
- id uuid pk
- user_id uuid fk
- title text
- category text null (mind|work|health)
- schedule jsonb  (e.g., { "days":[1,2,3,4,5], "time":"07:30" })
- active boolean default true
- created_at timestamptz default now()

### 1.11 habit_entries
- id uuid pk
- habit_id uuid fk habits(id) on delete cascade
- user_id uuid fk
- date date
- status text (done|skipped|missed)
- note text null
- created_at timestamptz default now()

### 1.12 notifications + rules
notification_rules:
- id uuid pk
- user_id uuid fk
- rule_type text (daily_checkin|bill_amount_prompt|event_reminder)
- schedule text null
- conditions jsonb default '{}'
- enabled boolean default true
- created_at timestamptz default now()

notifications:
- id uuid pk
- user_id uuid fk
- type text
- payload jsonb default '{}'
- sent_at timestamptz null
- action_taken text null
- action_at timestamptz null

### 1.13 ai_jobs (scaffold)
- id uuid pk
- user_id uuid fk
- job_type text
- status text (queued|running|done|failed)
- input jsonb
- output jsonb null
- progress_stage text null
- error text null
- created_at timestamptz default now()
- updated_at timestamptz default now()

---

## 2) Indexes (minimum)
- timeline_items(user_id, start_at)
- bills(due_date)
- messages(conversation_id, created_at)
- habit_entries(user_id, date)
- event_participants(event_id)

---

## 3) RLS policies (high-level)
Enable RLS on all tables.
- user can CRUD own rows (user_id = auth.uid()).
- shared events:
  - participants can read event/timeline item/messages
  - only host can edit event details
- messages:
  - only participants can read/send

Implementation approach:
- Use SQL migrations committed in repo (/apps/api/supabase/migrations).
- Provide helper SQL functions for “is_participant(event_id, uid)”.

END
