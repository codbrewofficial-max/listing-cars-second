exports.up = (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE users (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name              VARCHAR(150) NOT NULL,
      email             VARCHAR(255) NOT NULL UNIQUE,
      password_hash     VARCHAR(255) NOT NULL,
      phone             VARCHAR(20),
      role              user_role NOT NULL DEFAULT 'customer',
      email_verified_at TIMESTAMPTZ,
      is_active         BOOLEAN NOT NULL DEFAULT TRUE,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_users_role ON users(role);
    CREATE INDEX idx_users_email ON users(email);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS users;`);
};
