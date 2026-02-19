-- App Shortcuts: user-curated app links for events/routines
-- Links: passolig://, ziraatmobil://, fitnessapp://, https://...

CREATE TABLE app_shortcuts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  url text NOT NULL CHECK (url <> ''),
  kind text NOT NULL CHECK (kind IN ('fitness', 'bank', 'ticket', 'transport', 'other')) DEFAULT 'other',
  store_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_shortcuts_user ON app_shortcuts(user_id);

-- Link shortcuts to timeline_items (events, bills)
ALTER TABLE timeline_items ADD COLUMN IF NOT EXISTS shortcut_id uuid REFERENCES app_shortcuts(id) ON DELETE SET NULL;
CREATE INDEX idx_timeline_items_shortcut ON timeline_items(shortcut_id) WHERE shortcut_id IS NOT NULL;

-- Link shortcuts to habits (routines)
ALTER TABLE habits ADD COLUMN IF NOT EXISTS app_shortcut_id uuid REFERENCES app_shortcuts(id) ON DELETE SET NULL;
CREATE INDEX idx_habits_app_shortcut ON habits(app_shortcut_id) WHERE app_shortcut_id IS NOT NULL;

-- RLS
ALTER TABLE app_shortcuts ENABLE ROW LEVEL SECURITY;

CREATE POLICY app_shortcuts_own ON app_shortcuts
  FOR ALL USING (user_id = auth.uid());
