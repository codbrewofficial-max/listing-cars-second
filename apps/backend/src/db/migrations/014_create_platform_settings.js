exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE platform_settings (
      key         VARCHAR(100) PRIMARY KEY,
      value       JSONB NOT NULL,
      updated_by  UUID REFERENCES users(id),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS platform_settings;`);
};
