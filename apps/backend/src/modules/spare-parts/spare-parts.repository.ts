import { query } from "../../config/db";

export interface SparePartRow {
  id: string;
  seller_type: "admin" | "customer" | "toko";
  seller_id: string;
  name: string;
  category: string;
  condition: "baru" | "bekas";
  price: string;
  description: string | null;
  status: "draft" | "published" | "sold" | "archived";
  created_at: string;
  updated_at: string;
  // Hanya diisi di query list (public & admin) via LEFT JOIN LATERAL — 1 foto cover saja,
  // demi payload list tetap ringan (prinsip optimasi jaringan H+). TIDAK ada di findSparePartById.
  cover_photo_url?: string | null;
}

export interface SparePartPhotoRow {
  id: string;
  spare_part_id: string;
  media_asset_id: string;
  is_cover: boolean;
  sort_order: number;
  created_at: string;
  file_url?: string;
}

export interface SparePartFilters {
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  publicOnly?: boolean;
  // Pencarian bebas di nama produk (kotak search frontend admin/katalog)
  search?: string;
  limit: number;
  offset: number;
  sortColumn: string;
  sortDirection: "ASC" | "DESC";
}

function buildFilterConditions(filters: SparePartFilters) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.publicOnly) {
    conditions.push(`s.status = 'published'`);
  } else if (filters.status) {
    conditions.push(`s.status = $${idx++}`);
    params.push(filters.status);
  }

  if (filters.category) {
    conditions.push(`s.category ILIKE $${idx++}`);
    params.push(`%${filters.category}%`);
  }
  if (filters.condition) {
    conditions.push(`s.condition = $${idx++}`);
    params.push(filters.condition);
  }
  if (filters.minPrice !== undefined) {
    conditions.push(`s.price >= $${idx++}`);
    params.push(filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(`s.price <= $${idx++}`);
    params.push(filters.maxPrice);
  }
  if (filters.search) {
    conditions.push(`s.name ILIKE $${idx++}`);
    params.push(`%${filters.search}%`);
  }

  return { where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", params, nextIdx: idx };
}

export async function listSpareParts(filters: SparePartFilters): Promise<{ data: SparePartRow[]; total: number }> {
  const { where, params, nextIdx } = buildFilterConditions(filters);

  const totalRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM spare_parts s ${where}`,
    params
  );
  const total = parseInt(totalRes.rows[0]?.count ?? "0", 10);

  // LEFT JOIN LATERAL: ambil 1 foto cover saja per suku cadang (bukan seluruh array foto),
  // supaya payload list tetap ringan (prinsip optimasi jaringan H+). Prioritas: is_cover=true,
  // fallback ke sort_order terkecil kalau belum ada cover. Index
  // idx_spare_part_photos_spare_part_id sudah cukup untuk subquery per-baris ini.
  const dataRes = await query<SparePartRow>(
    `SELECT s.*, cover_photo.file_url AS cover_photo_url
     FROM spare_parts s
     LEFT JOIN LATERAL (
       SELECT ma.file_url
       FROM spare_part_photos spp
       JOIN media_assets ma ON ma.id = spp.media_asset_id
       WHERE spp.spare_part_id = s.id
       ORDER BY spp.is_cover DESC, spp.sort_order ASC, spp.created_at ASC
       LIMIT 1
     ) cover_photo ON true
     ${where}
     ORDER BY s.${filters.sortColumn} ${filters.sortDirection}
     LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
    [...params, filters.limit, filters.offset]
  );

  return { data: dataRes.rows, total };
}

export async function findSparePartById(id: string): Promise<SparePartRow | null> {
  const { rows } = await query<SparePartRow>(`SELECT * FROM spare_parts WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function insertSparePart(params: {
  sellerId: string;
  name: string;
  category: string;
  condition: string;
  price: number;
  description?: string | null;
}): Promise<SparePartRow> {
  const { rows } = await query<SparePartRow>(
    `INSERT INTO spare_parts (seller_type, seller_id, name, category, condition, price, description)
     VALUES ('admin', $1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [params.sellerId, params.name, params.category, params.condition, params.price, params.description ?? null]
  );
  return rows[0];
}

export async function updateSparePart(
  id: string,
  fields: Partial<{
    name: string;
    category: string;
    condition: string;
    price: number;
    description: string | null;
  }>
): Promise<SparePartRow | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      sets.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }
  if (sets.length === 0) return findSparePartById(id);

  sets.push(`updated_at = now()`);
  values.push(id);

  const { rows } = await query<SparePartRow>(
    `UPDATE spare_parts SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function updateSparePartStatus(id: string, status: string): Promise<SparePartRow | null> {
  const { rows } = await query<SparePartRow>(
    `UPDATE spare_parts SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0] ?? null;
}

export async function deleteSparePart(id: string): Promise<void> {
  await query(`DELETE FROM spare_parts WHERE id = $1`, [id]);
}

// ---------- Photos ----------

export async function listSparePartPhotos(sparePartId: string): Promise<SparePartPhotoRow[]> {
  const { rows } = await query<SparePartPhotoRow>(
    `SELECT sp.*, ma.file_url
     FROM spare_part_photos sp
     JOIN media_assets ma ON ma.id = sp.media_asset_id
     WHERE sp.spare_part_id = $1
     ORDER BY sp.sort_order ASC, sp.created_at ASC`,
    [sparePartId]
  );
  return rows;
}

export async function insertSparePartPhoto(params: {
  sparePartId: string;
  mediaAssetId: string;
  isCover?: boolean;
  sortOrder?: number;
}): Promise<SparePartPhotoRow> {
  const { rows } = await query<SparePartPhotoRow>(
    `INSERT INTO spare_part_photos (spare_part_id, media_asset_id, is_cover, sort_order)
     VALUES ($1, $2, COALESCE($3, false), COALESCE($4, 0))
     RETURNING *`,
    [params.sparePartId, params.mediaAssetId, params.isCover ?? null, params.sortOrder ?? null]
  );
  return rows[0];
}

export async function findSparePartPhotoById(
  sparePartId: string,
  photoId: string
): Promise<SparePartPhotoRow | null> {
  const { rows } = await query<SparePartPhotoRow>(
    `SELECT * FROM spare_part_photos WHERE id = $1 AND spare_part_id = $2`,
    [photoId, sparePartId]
  );
  return rows[0] ?? null;
}

export async function deleteSparePartPhoto(photoId: string): Promise<void> {
  await query(`DELETE FROM spare_part_photos WHERE id = $1`, [photoId]);
}
