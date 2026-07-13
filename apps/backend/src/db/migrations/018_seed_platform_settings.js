exports.up = (pgm) => {
  pgm.sql(`
    INSERT INTO platform_settings (key, value) VALUES
      ('registration_open', 'false'::jsonb),
      ('email_daily_limit', '250'::jsonb),
      ('platform_name', '"LCS"'::jsonb),
      ('platform_logo_url', 'null'::jsonb)
    ON CONFLICT (key) DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM platform_settings WHERE key IN
      ('registration_open', 'email_daily_limit', 'platform_name', 'platform_logo_url');
  `);
};
