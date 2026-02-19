-- LifeOS MVP Schema - Core tables
-- Run with: supabase db push (or supabase migration up)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. user_settings
CREATE TABLE user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  locale text NOT NULL DEFAULT 'en',
  timezone text NOT NULL DEFAULT 'Europe/Istanbul',
  quiet_hours_start time,
  quiet_hours_end time,
  assistant_tone text NOT NULL DEFAULT 'calm',
  emoji_level int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. user_profile_facts (Phase 2)
CREATE TABLE user_profile_facts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key text NOT NULL,
  value text NOT NULL,
  source text NOT NULL DEFAULT 'user',
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);

-- 3. recurrence_rules (before events, FK)
CREATE TABLE recurrence_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rrule text NOT NULL,
  timezone text NOT NULL,
  exceptions jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. timeline_items (core stream)
CREATE TABLE timeline_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('event', 'bill', 'habit_block', 'journal', 'insight', 'system')),
  start_at timestamptz,
  end_at timestamptz,
  title text NOT NULL,
  summary text,
  status text NOT NULL DEFAULT 'scheduled',
  metadata jsonb NOT NULL DEFAULT '{}',
  source text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_timeline_items_user_start ON timeline_items(user_id, start_at);
