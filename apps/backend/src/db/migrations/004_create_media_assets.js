exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE media_assets (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      file_url     TEXT NOT NULL,
      file_key     TEXT NOT NULL,
      mime_type    VARCHAR(50) NOT NULL DEFAULT 'image/webp',
      size_bytes   INTEGER,
      width        INTEGER,
      height       INTEGER,
      uploaded_by  UUID REFERENCES users(id),
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS media_assets;`);
};
