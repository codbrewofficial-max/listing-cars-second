exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE email_logs (
      id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      recipient_email       VARCHAR(255) NOT NULL,
      purpose               email_purpose NOT NULL,
      status                email_status NOT NULL,
      provider              VARCHAR(50) NOT NULL DEFAULT 'brevo',
      provider_message_id   VARCHAR(255),
      error_message         TEXT,
      related_user_id       UUID REFERENCES users(id),
      created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);
    CREATE INDEX idx_email_logs_status ON email_logs(status);
    CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_email);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS email_logs;`);
};
