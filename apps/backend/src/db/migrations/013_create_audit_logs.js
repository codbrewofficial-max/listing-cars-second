exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE audit_logs (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_id      UUID NOT NULL REFERENCES users(id),
      actor_role    VARCHAR(30) NOT NULL,
      action_type   VARCHAR(100) NOT NULL,
      target_entity VARCHAR(100) NOT NULL,
      target_id     UUID,
      metadata      JSONB,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
    CREATE INDEX idx_audit_logs_target ON audit_logs(target_entity, target_id);
    CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
    -- Index komposit untuk query cooldown H+1 (lihat 02c-addendum §8 dan 02b §13)
    CREATE INDEX idx_audit_logs_action_target ON audit_logs(action_type, target_entity, target_id, created_at DESC);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS audit_logs;`);
};
