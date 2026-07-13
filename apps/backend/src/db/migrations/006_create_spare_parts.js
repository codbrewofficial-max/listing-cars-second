exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE spare_parts (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      seller_type  seller_type NOT NULL DEFAULT 'admin',
      seller_id    UUID NOT NULL REFERENCES users(id),
      name         VARCHAR(150) NOT NULL,
      category     VARCHAR(100) NOT NULL,
      condition    part_condition NOT NULL,
      price        NUMERIC(14,2) NOT NULL,
      description  TEXT,
      status       listing_status NOT NULL DEFAULT 'draft',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_spare_parts_category ON spare_parts(category);
    CREATE INDEX idx_spare_parts_price ON spare_parts(price);
    CREATE INDEX idx_spare_parts_seller ON spare_parts(seller_type, seller_id);

    CREATE TABLE spare_part_photos (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      spare_part_id  UUID NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
      media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
      is_cover       BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order     INTEGER NOT NULL DEFAULT 0,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_spare_part_photos_spare_part_id ON spare_part_photos(spare_part_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS spare_part_photos;
    DROP TABLE IF EXISTS spare_parts;
  `);
};
