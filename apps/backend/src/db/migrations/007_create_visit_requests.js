exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE visit_requests (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vehicle_id    UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      customer_id   UUID NOT NULL REFERENCES users(id),
      admin_id      UUID REFERENCES users(id),
      status        visit_request_status NOT NULL DEFAULT 'requested',
      scheduled_at  TIMESTAMPTZ,
      location      TEXT,
      notes         TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_visit_requests_vehicle_id ON visit_requests(vehicle_id);
    CREATE INDEX idx_visit_requests_customer_id ON visit_requests(customer_id);
    CREATE INDEX idx_visit_requests_status ON visit_requests(status);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS visit_requests;`);
};
