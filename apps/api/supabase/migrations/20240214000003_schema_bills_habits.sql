-- Bills and habits

-- 9. bills
CREATE TABLE bills (
  timeline_item_id uuid PRIMARY KEY REFERENCES timeline_items(id) ON DELETE CASCADE,
  vendor text NOT NULL,
  amount numeric,
  currency text NOT NULL DEFAULT 'TRY',
  due_date date NOT NULL,
  recurrence text CHECK (recurrence IN ('monthly', 'weekly', 'yearly')),
  autopay boolean NOT NULL DEFAULT false,
  last_amount numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bills_due_date ON bills(due_date);

-- 10. habits
CREATE TABLE habits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text CHECK (category IN ('mind', 'work', 'health')),
  schedule jsonb NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 11. habit_entries
CREATE TABLE habit_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('done', 'skipped', 'missed')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(habit_id, user_id, date)
);

CREATE INDEX idx_habit_entries_user_date ON habit_entries(user_id, date);
