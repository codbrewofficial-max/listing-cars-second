exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE vehicles (
      id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      seller_type            seller_type NOT NULL DEFAULT 'admin',
      seller_id              UUID NOT NULL REFERENCES users(id),
      brand                  VARCHAR(100) NOT NULL,
      model                  VARCHAR(100) NOT NULL,
      year                   SMALLINT NOT NULL,
      mileage                INTEGER,
      license_plate          VARCHAR(20),
      price                  NUMERIC(14,2) NOT NULL,
      condition_notes        TEXT,
      description            TEXT,
      location               VARCHAR(150),
      status                 listing_status NOT NULL DEFAULT 'draft',
      document_status        document_status NOT NULL DEFAULT 'not_verified',
      document_verified_by   UUID REFERENCES users(id),
      document_verified_at   TIMESTAMPTZ,
      verification_checklist JSONB,
      created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_vehicles_brand_model ON vehicles(brand, model);
    CREATE INDEX idx_vehicles_price ON vehicles(price);
    CREATE INDEX idx_vehicles_location ON vehicles(location);
    CREATE INDEX idx_vehicles_status ON vehicles(status);
    CREATE INDEX idx_vehicles_seller ON vehicles(seller_type, seller_id);

    CREATE TABLE vehicle_photos (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vehicle_id     UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
      is_cover       BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order     INTEGER NOT NULL DEFAULT 0,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_vehicle_photos_vehicle_id ON vehicle_photos(vehicle_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS vehicle_photos;
    DROP TABLE IF EXISTS vehicles;
  `);
};
