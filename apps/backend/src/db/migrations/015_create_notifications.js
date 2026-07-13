exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE notifications (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type            notification_type NOT NULL,
      title           VARCHAR(255) NOT NULL,
      body            TEXT,
      related_entity  VARCHAR(100),
      related_id      UUID,
      is_read         BOOLEAN NOT NULL DEFAULT FALSE,
      read_at         TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS notifications;`);
};
