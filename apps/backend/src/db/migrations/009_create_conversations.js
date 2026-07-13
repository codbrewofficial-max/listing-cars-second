exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE conversations (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subject_type product_type,
      subject_id   UUID,
      status       conversation_status NOT NULL DEFAULT 'open',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE conversation_participants (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id         UUID NOT NULL REFERENCES users(id),
      participant_type participant_type NOT NULL,
      joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (conversation_id, user_id)
    );

    CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);

    CREATE TABLE messages (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id       UUID NOT NULL REFERENCES users(id),
      message_type    message_type NOT NULL DEFAULT 'text',
      content         TEXT NOT NULL,
      media_asset_id  UUID REFERENCES media_assets(id),
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_messages_conversation_id ON messages(conversation_id, created_at);

    CREATE TABLE message_reads (
      message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      read_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (message_id, user_id)
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS message_reads;
    DROP TABLE IF EXISTS messages;
    DROP TABLE IF EXISTS conversation_participants;
    DROP TABLE IF EXISTS conversations;
  `);
};
