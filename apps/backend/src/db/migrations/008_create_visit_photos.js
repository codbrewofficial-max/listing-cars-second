exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE visit_photos (
      id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      visit_request_id   UUID NOT NULL REFERENCES visit_requests(id) ON DELETE CASCADE,
      vehicle_id         UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      media_asset_id     UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
      uploaded_by        UUID NOT NULL REFERENCES users(id),
      uploaded_by_role   participant_type NOT NULL,
      moderation_status  photo_moderation_status NOT NULL DEFAULT 'pending_review',
      moderated_by       UUID REFERENCES users(id),
      moderated_at       TIMESTAMPTZ,
      created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_visit_photos_visit_request_id ON visit_photos(visit_request_id);
    CREATE INDEX idx_visit_photos_vehicle_id ON visit_photos(vehicle_id);
    CREATE INDEX idx_visit_photos_moderation_status ON visit_photos(moderation_status);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS visit_photos;`);
};
