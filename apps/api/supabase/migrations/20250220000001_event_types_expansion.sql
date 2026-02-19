-- EVENT_TYPES_EXPANSION: Expand timeline_items kinds and add detail tables
-- Run with: supabase db push (or supabase migration up)

-- 1. Alter timeline_items: drop old CHECK, add new CHECK for kind
ALTER TABLE timeline_items DROP CONSTRAINT IF EXISTS timeline_items_kind_check;
ALTER TABLE timeline_items ADD CONSTRAINT timeline_items_kind_check CHECK (
  kind IN (
    'event', 'bill', 'habit_block', 'work_block', 'task', 'appointment',
    'reminder', 'subscription', 'goal', 'travel', 'journal', 'insight', 'system'
  )
);

-- 2. Add columns to timeline_items (only if not exists)
ALTER TABLE timeline_items ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';
ALTER TABLE timeline_items ADD COLUMN IF NOT EXISTS life_area text;
ALTER TABLE timeline_items ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'private';

-- 3. Create detail tables (each PK = timeline_item_id references timeline_items)

-- work_blocks: focused work time blocks
CREATE TABLE work_blocks (
  timeline_item_id uuid PRIMARY KEY REFERENCES timeline_items(id) ON DELETE CASCADE,
  project text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- appointments: simple scheduled meetings (no participants)
CREATE TABLE appointments (
  timeline_item_id uuid PRIMARY KEY REFERENCES timeline_items(id) ON DELETE CASCADE,
  location text,
  with_whom text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- reminders: one-off or recurring reminders
CREATE TABLE reminders (
  timeline_item_id uuid PRIMARY KEY REFERENCES timeline_items(id) ON DELETE CASCADE,
  remind_at timestamptz NOT NULL,
  recurrence text CHECK (recurrence IN ('once', 'daily', 'weekly', 'monthly')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reminders_remind_at ON reminders(remind_at);

-- subscriptions: recurring payments (Netflix, Spotify, etc.)
CREATE TABLE subscriptions (
  timeline_item_id uuid PRIMARY KEY REFERENCES timeline_items(id) ON DELETE CASCADE,
  vendor text NOT NULL,
  amount numeric,
  currency text NOT NULL DEFAULT 'TRY',
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'weekly')),
  next_bill_date date NOT NULL,
  autopay boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_next_bill ON subscriptions(next_bill_date);

-- goals: life goals with target date and progress
CREATE TABLE goals (
  timeline_item_id uuid PRIMARY KEY REFERENCES timeline_items(id) ON DELETE CASCADE,
  target_date date,
  life_area text,
  progress numeric DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_goals_target_date ON goals(target_date) WHERE target_date IS NOT NULL;

-- tasks: todo items with due date and completion
CREATE TABLE tasks (
  timeline_item_id uuid PRIMARY KEY REFERENCES timeline_items(id) ON DELETE CASCADE,
  due_date date,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  completed_at timestamptz,
  life_area text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_completed ON tasks(completed_at) WHERE completed_at IS NULL;

-- travel: trips with origin/destination
CREATE TABLE travel (
  timeline_item_id uuid PRIMARY KEY REFERENCES timeline_items(id) ON DELETE CASCADE,
  origin text,
  destination text NOT NULL,
  departure_at timestamptz,
  arrival_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_travel_departure ON travel(departure_at) WHERE departure_at IS NOT NULL;

-- journals: diary entries with content and mood
CREATE TABLE journals (
  timeline_item_id uuid PRIMARY KEY REFERENCES timeline_items(id) ON DELETE CASCADE,
  content text NOT NULL,
  mood text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_journals_created ON journals(created_at DESC);

-- 4. RLS: FOR ALL USING (timeline_item_id IN (SELECT id FROM timeline_items WHERE user_id = auth.uid()))
ALTER TABLE work_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY work_blocks_own ON work_blocks
  FOR ALL USING (timeline_item_id IN (SELECT id FROM timeline_items WHERE user_id = auth.uid()));

CREATE POLICY appointments_own ON appointments
  FOR ALL USING (timeline_item_id IN (SELECT id FROM timeline_items WHERE user_id = auth.uid()));

CREATE POLICY reminders_own ON reminders
  FOR ALL USING (timeline_item_id IN (SELECT id FROM timeline_items WHERE user_id = auth.uid()));

CREATE POLICY subscriptions_own ON subscriptions
  FOR ALL USING (timeline_item_id IN (SELECT id FROM timeline_items WHERE user_id = auth.uid()));

CREATE POLICY goals_own ON goals
  FOR ALL USING (timeline_item_id IN (SELECT id FROM timeline_items WHERE user_id = auth.uid()));

CREATE POLICY tasks_own ON tasks
  FOR ALL USING (timeline_item_id IN (SELECT id FROM timeline_items WHERE user_id = auth.uid()));

CREATE POLICY travel_own ON travel
  FOR ALL USING (timeline_item_id IN (SELECT id FROM timeline_items WHERE user_id = auth.uid()));

CREATE POLICY journals_own ON journals
  FOR ALL USING (timeline_item_id IN (SELECT id FROM timeline_items WHERE user_id = auth.uid()));
