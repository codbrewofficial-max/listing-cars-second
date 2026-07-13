exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE articles (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title            VARCHAR(255) NOT NULL,
      slug             VARCHAR(255) NOT NULL UNIQUE,
      content          TEXT NOT NULL,
      category         VARCHAR(100),
      status           article_status NOT NULL DEFAULT 'draft',
      cover_media_id   UUID REFERENCES media_assets(id),
      seo_title        VARCHAR(255),
      seo_description  TEXT,
      author_id        UUID NOT NULL REFERENCES users(id),
      published_at     TIMESTAMPTZ,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_articles_status ON articles(status);
    CREATE INDEX idx_articles_slug ON articles(slug);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS articles;`);
};
