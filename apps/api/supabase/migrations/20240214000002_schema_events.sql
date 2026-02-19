-- Events, participants, conversations, messages

-- 5. events
CREATE TABLE events (
  timeline_item_id uuid PRIMARY KEY REFERENCES timeline_items(id) ON DELETE CASCADE,
  location text,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared')),
  recurrence_rule_id uuid REFERENCES recurrence_rules(id) ON DELETE SET NULL
);

-- 6. event_participants
CREATE TABLE event_participants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid NOT NULL REFERENCES events(timeline_item_id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email text,
  role text NOT NULL DEFAULT 'guest' CHECK (role IN ('host', 'guest')),
  rsvp_status text NOT NULL DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_participant_identity CHECK (user_id IS NOT NULL OR invited_email IS NOT NULL)
);

CREATE INDEX idx_event_participants_event ON event_participants(event_id);

-- 7. conversations
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid NOT NULL REFERENCES events(timeline_item_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. messages
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
