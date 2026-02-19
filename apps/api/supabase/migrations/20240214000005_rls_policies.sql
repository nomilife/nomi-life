-- RLS policies for LifeOS MVP

-- Helper: check if user is participant of an event
CREATE OR REPLACE FUNCTION is_participant(p_event_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM event_participants
    WHERE event_id = p_event_id
      AND (user_id = p_user_id OR invited_email IN (
        SELECT email FROM auth.users WHERE id = p_user_id
      ))
  );
$$;

-- Helper: check if user is host of an event
CREATE OR REPLACE FUNCTION is_event_host(p_event_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM event_participants
    WHERE event_id = p_event_id AND user_id = p_user_id AND role = 'host'
  );
$$;

-- Enable RLS on all tables
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrence_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;

-- user_settings: own rows only
CREATE POLICY user_settings_own ON user_settings
  FOR ALL USING (user_id = auth.uid());

-- user_profile_facts: own rows only
CREATE POLICY user_profile_facts_own ON user_profile_facts
  FOR ALL USING (user_id = auth.uid());

-- recurrence_rules: own rows only
CREATE POLICY recurrence_rules_own ON recurrence_rules
  FOR ALL USING (user_id = auth.uid());

-- timeline_items: own rows OR participant in linked event (read-only for participants)
CREATE POLICY timeline_items_select ON timeline_items
  FOR SELECT USING (
    user_id = auth.uid()
    OR (
      kind = 'event' AND id IN (
        SELECT timeline_item_id FROM events e
        WHERE is_participant(e.timeline_item_id, auth.uid())
      )
    )
  );

CREATE POLICY timeline_items_insert ON timeline_items
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY timeline_items_update ON timeline_items
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY timeline_items_delete ON timeline_items
  FOR DELETE USING (user_id = auth.uid());

-- events: participant can read, host can edit
CREATE POLICY events_read ON events
  FOR SELECT USING (is_participant(timeline_item_id, auth.uid()));

CREATE POLICY events_insert ON events
  FOR INSERT WITH CHECK (
    timeline_item_id IN (SELECT id FROM timeline_items WHERE user_id = auth.uid())
  );

CREATE POLICY events_update ON events
  FOR UPDATE USING (is_event_host(timeline_item_id, auth.uid()));

CREATE POLICY events_delete ON events
  FOR DELETE USING (is_event_host(timeline_item_id, auth.uid()));

-- event_participants: participants can read, host can manage
CREATE POLICY event_participants_read ON event_participants
  FOR SELECT USING (is_participant(event_id, auth.uid()));

CREATE POLICY event_participants_insert ON event_participants
  FOR INSERT WITH CHECK (is_event_host(event_id, auth.uid()));

CREATE POLICY event_participants_update ON event_participants
  FOR UPDATE USING (
    is_event_host(event_id, auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY event_participants_delete ON event_participants
  FOR DELETE USING (is_event_host(event_id, auth.uid()));

-- conversations: participants of event can access
CREATE POLICY conversations_read ON conversations
  FOR SELECT USING (is_participant(event_id, auth.uid()));

CREATE POLICY conversations_insert ON conversations
  FOR INSERT WITH CHECK (is_event_host(event_id, auth.uid()));

-- messages: participants can read and send
CREATE POLICY messages_read ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      WHERE is_participant(c.event_id, auth.uid())
    )
  );

CREATE POLICY messages_insert ON messages
  FOR INSERT WITH CHECK (
    sender_user_id = auth.uid()
    AND conversation_id IN (
      SELECT c.id FROM conversations c
      WHERE is_participant(c.event_id, auth.uid())
    )
  );

-- bills: own rows (bills reference timeline_items, user_id via timeline_items)
CREATE POLICY bills_own ON bills
  FOR ALL USING (
    timeline_item_id IN (SELECT id FROM timeline_items WHERE user_id = auth.uid())
  );

-- habits: own rows only
CREATE POLICY habits_own ON habits
  FOR ALL USING (user_id = auth.uid());

-- habit_entries: own rows only
CREATE POLICY habit_entries_own ON habit_entries
  FOR ALL USING (user_id = auth.uid());

-- notification_rules: own rows only
CREATE POLICY notification_rules_own ON notification_rules
  FOR ALL USING (user_id = auth.uid());

-- push_tokens: own rows only
CREATE POLICY push_tokens_own ON push_tokens
  FOR ALL USING (user_id = auth.uid());

-- notifications: own rows only
CREATE POLICY notifications_own ON notifications
  FOR ALL USING (user_id = auth.uid());

-- ai_jobs: own rows only
CREATE POLICY ai_jobs_own ON ai_jobs
  FOR ALL USING (user_id = auth.uid());
