import { query } from "../../config/db";

export interface PlatformSettingRow {
  key: string;
  value: unknown;
  updated_by: string | null;
  updated_at: string;
}

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const { rows } = await query<PlatformSettingRow>(`SELECT * FROM platform_settings WHERE key = $1`, [key]);
  if (!rows[0]) return null;
  return rows[0].value as T;
}

export async function getAllSettings(): Promise<PlatformSettingRow[]> {
  const { rows } = await query<PlatformSettingRow>(`SELECT * FROM platform_settings ORDER BY key ASC`);
  return rows;
}

export async function getPublicSettings(): Promise<{ platform_name: unknown; platform_logo_url: unknown }> {
  const { rows } = await query<PlatformSettingRow>(
    `SELECT * FROM platform_settings WHERE key IN ('platform_name', 'platform_logo_url')`
  );
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    platform_name: map.platform_name ?? null,
    platform_logo_url: map.platform_logo_url ?? null,
  };
}

export async function upsertSetting(key: string, value: unknown, updatedBy: string): Promise<PlatformSettingRow> {
  const { rows } = await query<PlatformSettingRow>(
    `INSERT INTO platform_settings (key, value, updated_by, updated_at)
     VALUES ($1, $2::jsonb, $3, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()
     RETURNING *`,
    [key, JSON.stringify(value), updatedBy]
  );
  return rows[0];
}
