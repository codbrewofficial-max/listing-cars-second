exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE transactions (
      id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_type          product_type NOT NULL,
      product_id            UUID NOT NULL,
      quantity              INTEGER NOT NULL DEFAULT 1,
      buyer_id              UUID NOT NULL REFERENCES users(id),
      seller_type           seller_type NOT NULL DEFAULT 'admin',
      seller_id             UUID NOT NULL REFERENCES users(id),
      amount                NUMERIC(14,2) NOT NULL,
      status                transaction_status NOT NULL DEFAULT 'pending_payment',
      payment_proof_media_id UUID REFERENCES media_assets(id),
      payment_verified_by   UUID REFERENCES users(id),
      payment_verified_at   TIMESTAMPTZ,
      released_by           UUID REFERENCES users(id),
      released_at           TIMESTAMPTZ,
      dispute_reason        TEXT,
      resolved_by            UUID REFERENCES users(id),
      resolved_at            TIMESTAMPTZ,
      payment_gateway_ref    VARCHAR(100),
      created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_transactions_status ON transactions(status);
    CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
    CREATE INDEX idx_transactions_product ON transactions(product_type, product_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS transactions;`);
};
