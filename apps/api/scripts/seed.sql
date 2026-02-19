-- LifeOS seed data (development)
-- Run after migrations. Creates sample data for testing.
-- Usage: psql $DATABASE_URL -f scripts/seed.sql

-- Note: Seed requires existing auth.users. In local Supabase, sign up a test user first.
-- This script inserts settings and sample data for the first user if exists.

-- Create default user_settings for any existing users (idempotent)
INSERT INTO user_settings (user_id, locale, timezone)
SELECT id, 'en', 'Europe/Istanbul'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Optional: Create default notification rules (run manually if needed)
-- INSERT INTO notification_rules (user_id, rule_type, schedule, enabled)
-- SELECT id, 'daily_checkin', '20:00-22:30', true FROM auth.users;
