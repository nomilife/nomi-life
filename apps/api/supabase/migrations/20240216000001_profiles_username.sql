-- Add unique username to profiles (for chat display; set in Settings)
-- Nullable: fallback to display_name or email prefix if not set
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text;

-- Unique constraint: lowercase, no duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON profiles (LOWER(username)) WHERE username IS NOT NULL AND username != '';
