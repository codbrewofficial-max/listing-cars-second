import { query } from "../../config/db";

export interface MediaAssetRow {
  id: string;
  file_url: string;
  file_key: string;
  mime_type: string;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export async function insertMediaAsset(params: {
  fileUrl: string;
  fileKey: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  uploadedBy: string;
}): Promise<MediaAssetRow> {
  const { rows } = await query<MediaAssetRow>(
    `INSERT INTO media_assets (file_url, file_key, mime_type, size_bytes, width, height, uploaded_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [params.fileUrl, params.fileKey, params.mimeType, params.sizeBytes, params.width, params.height, params.uploadedBy]
  );
  return rows[0];
}

export async function findMediaAssetById(id: string): Promise<MediaAssetRow | null> {
  const { rows } = await query<MediaAssetRow>(`SELECT * FROM media_assets WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

/** Batch lookup untuk menghindari N+1 query saat meng-enrich list (mis. artikel) dengan URL media. */
export async function findMediaAssetsByIds(ids: string[]): Promise<MediaAssetRow[]> {
  if (ids.length === 0) return [];
  const { rows } = await query<MediaAssetRow>(`SELECT * FROM media_assets WHERE id = ANY($1::uuid[])`, [ids]);
  return rows;
}

export async function deleteMediaAssetById(id: string): Promise<void> {
  await query(`DELETE FROM media_assets WHERE id = $1`, [id]);
}

/** Cek apakah media_asset masih direferensikan tabel lain sebelum boleh dihapus. */
export async function isMediaAssetReferenced(id: string): Promise<boolean> {
  const { rows } = await query<{ used: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM vehicle_photos WHERE media_asset_id = $1
       UNION ALL SELECT 1 FROM spare_part_photos WHERE media_asset_id = $1
       UNION ALL SELECT 1 FROM visit_photos WHERE media_asset_id = $1
       UNION ALL SELECT 1 FROM messages WHERE media_asset_id = $1
       UNION ALL SELECT 1 FROM transactions WHERE payment_proof_media_id = $1
       UNION ALL SELECT 1 FROM articles WHERE cover_media_id = $1
     ) as used`,
    [id]
  );
  return rows[0]?.used ?? false;
}

export async function getTotalStorageUsedBytes(): Promise<number> {
  const { rows } = await query<{ total: string }>(
    `SELECT COALESCE(SUM(size_bytes), 0)::text as total FROM media_assets`
  );
  return parseInt(rows[0]?.total ?? "0", 10);
}
