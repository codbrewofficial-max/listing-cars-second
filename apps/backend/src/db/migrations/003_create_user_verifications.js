exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE user_verifications (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      doc_type      doc_type NOT NULL,
      file_url      TEXT NOT NULL,
      status        verification_status NOT NULL DEFAULT 'pending',
      reviewed_by   UUID REFERENCES users(id),
      reviewed_at   TIMESTAMPTZ,
      notes         TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_user_verifications_user_id ON user_verifications(user_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS user_verifications;`);
};
