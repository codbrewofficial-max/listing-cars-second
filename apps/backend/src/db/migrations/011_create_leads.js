exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE leads (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source              lead_source NOT NULL,
      name                VARCHAR(150),
      email               VARCHAR(255),
      phone               VARCHAR(20),
      message             TEXT,
      related_product_type product_type,
      related_product_id  UUID,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_leads_source ON leads(source);
    CREATE INDEX idx_leads_created_at ON leads(created_at);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS leads;`);
};
