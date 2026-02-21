-- ONBOARDING_V2: Onboarding tables for 4-6 step flow + WOW plan
-- Life areas: Social, Health, Finance, Mind, Relationships, Admin, Work (optional)

-- 1. onboarding_profiles: completion state
CREATE TABLE onboarding_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at timestamptz,
  current_step int DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. onboarding_life_areas
CREATE TABLE onboarding_life_areas (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  social boolean NOT NULL DEFAULT false,
  health boolean NOT NULL DEFAULT false,
  finance boolean NOT NULL DEFAULT false,
  mind boolean NOT NULL DEFAULT false,
  relationships boolean NOT NULL DEFAULT false,
  admin boolean NOT NULL DEFAULT false,
  work boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. onboarding_daily_rhythm
CREATE TABLE onboarding_daily_rhythm (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wake_time time,
  sleep_time time,
  work_start time,
  work_end time,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. onboarding_ai_preferences (expand from doc B1)
CREATE TABLE onboarding_ai_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  response_length text NOT NULL DEFAULT 'short' CHECK (response_length IN ('short', 'balanced', 'detailed')),
  emoji_level int NOT NULL DEFAULT 1 CHECK (emoji_level >= 0 AND emoji_level <= 2),
  checkin_preference text NOT NULL DEFAULT 'evening' CHECK (checkin_preference IN ('morning', 'evening', 'adaptive')),
  auto_categorize boolean NOT NULL DEFAULT true,
  weekly_insights boolean NOT NULL DEFAULT true,
  suggest_plans boolean NOT NULL DEFAULT true,
  use_data_preferences boolean NOT NULL DEFAULT true,
  tone text NOT NULL DEFAULT 'calm' CHECK (tone IN ('calm', 'neutral', 'strict')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Expand user_settings for synced preferences (optional; we can read from onboarding on complete)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS response_length text DEFAULT 'short';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS checkin_preference text DEFAULT 'evening';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS work_mode_enabled boolean DEFAULT false;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS life_areas jsonb DEFAULT '[]';

-- RLS
ALTER TABLE onboarding_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_life_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_daily_rhythm ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_ai_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY onboarding_profiles_own ON onboarding_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY onboarding_life_areas_own ON onboarding_life_areas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY onboarding_daily_rhythm_own ON onboarding_daily_rhythm FOR ALL USING (auth.uid() = user_id);
CREATE POLICY onboarding_ai_preferences_own ON onboarding_ai_preferences FOR ALL USING (auth.uid() = user_id);
