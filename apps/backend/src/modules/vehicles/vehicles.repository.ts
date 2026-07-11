import { query } from "../../config/db";

export interface VehicleRow {
  id: string;
  seller_type: "admin" | "customer" | "toko";
  seller_id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number | null;
  license_plate: string | null;
  price: string;
  condition_notes: string | null;
  description: string | null;
  location: string | null;
  status: "draft" | "published" | "sold" | "archived";
  document_status: "not_verified" | "verified" | "rejected";
  document_verified_by: string | null;
  document_verified_at: string | null;
  verification_checklist: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface VehiclePhotoRow {
  id: string;
  vehicle_id: string;
  media_asset_id: string;
  is_cover: boolean;
  sort_order: number;
  created_at: string;
  // joined
  file_url?: string;
}

export interface VehicleFilters {
  brand?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  year?: number;
  location?: string;
  documentStatus?: string;
  status?: string; // untuk admin list; kalau tidak diisi & publicOnly true -> dipaksa 'published'
  publicOnly?: boolean;
  limit: number;
  offset: number;
  sortColumn: string;
  sortDirection: "ASC" | "DESC";
}

function buildFilterConditions(filters: VehicleFilters) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.publicOnly) {
    conditions.push(`status = 'published'`);
  } else if (filters.status) {
    conditions.push(`status = $${idx++}`);
    params.push(filters.status);
  }

  if (filters.brand) {
    conditions.push(`brand ILIKE $${idx++}`);
    params.push(`%${filters.brand}%`);
  }
  if (filters.model) {
    conditions.push(`model ILIKE $${idx++}`);
    params.push(`%${filters.model}%`);
  }
  if (filters.minPrice !== undefined) {
    conditions.push(`price >= $${idx++}`);
    params.push(filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(`price <= $${idx++}`);
    params.push(filters.maxPrice);
  }
  if (filters.year !== undefined) {
    conditions.push(`year = $${idx++}`);
    params.push(filters.year);
  }
  if (filters.location) {
    conditions.push(`location ILIKE $${idx++}`);
    params.push(`%${filters.location}%`);
  }
  if (filters.documentStatus) {
    conditions.push(`document_status = $${idx++}`);
    params.push(filters.documentStatus);
  }

  return { where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", params, nextIdx: idx };
}

export async function listVehicles(filters: VehicleFilters): Promise<{ data: VehicleRow[]; total: number }> {
  const { where, params, nextIdx } = buildFilterConditions(filters);

  const totalRes = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM vehicles ${where}`, params);
  const total = parseInt(totalRes.rows[0]?.count ?? "0", 10);

  const dataRes = await query<VehicleRow>(
    `SELECT * FROM vehicles ${where}
     ORDER BY ${filters.sortColumn} ${filters.sortDirection}
     LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
    [...params, filters.limit, filters.offset]
  );

  return { data: dataRes.rows, total };
}

export async function findVehicleById(id: string): Promise<VehicleRow | null> {
  const { rows } = await query<VehicleRow>(`SELECT * FROM vehicles WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function insertVehicle(params: {
  sellerId: string;
  brand: string;
  model: string;
  year: number;
  mileage?: number | null;
  licensePlate?: string | null;
  price: number;
  conditionNotes?: string | null;
  description?: string | null;
  location?: string | null;
}): Promise<VehicleRow> {
  const { rows } = await query<VehicleRow>(
    `INSERT INTO vehicles
       (seller_type, seller_id, brand, model, year, mileage, license_plate, price, condition_notes, description, location)
     VALUES ('admin', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      params.sellerId,
      params.brand,
      params.model,
      params.year,
      params.mileage ?? null,
      params.licensePlate ?? null,
      params.price,
      params.conditionNotes ?? null,
      params.description ?? null,
      params.location ?? null,
    ]
  );
  return rows[0];
}

export async function updateVehicle(
  id: string,
  fields: Partial<{
    brand: string;
    model: string;
    year: number;
    mileage: number | null;
    license_plate: string | null;
    price: number;
    condition_notes: string | null;
    description: string | null;
    location: string | null;
  }>
): Promise<VehicleRow | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      sets.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }
  if (sets.length === 0) return findVehicleById(id);

  sets.push(`updated_at = now()`);
  values.push(id);

  const { rows } = await query<VehicleRow>(
    `UPDATE vehicles SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function updateVehicleStatus(id: string, status: string): Promise<VehicleRow | null> {
  const { rows } = await query<VehicleRow>(
    `UPDATE vehicles SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0] ?? null;
}

export async function updateVehicleDocumentStatus(params: {
  id: string;
  documentStatus: string;
  verifiedBy: string;
  verificationChecklist?: Record<string, unknown> | null;
}): Promise<VehicleRow | null> {
  const { rows } = await query<VehicleRow>(
    `UPDATE vehicles
     SET document_status = $1,
         document_verified_by = $2,
         document_verified_at = now(),
         verification_checklist = COALESCE($3::jsonb, verification_checklist),
         updated_at = now()
     WHERE id = $4
     RETURNING *`,
    [
      params.documentStatus,
      params.verifiedBy,
      params.verificationChecklist ? JSON.stringify(params.verificationChecklist) : null,
      params.id,
    ]
  );
  return rows[0] ?? null;
}

export async function deleteVehicle(id: string): Promise<void> {
  await query(`DELETE FROM vehicles WHERE id = $1`, [id]);
}

// ---------- Vehicle Photos ----------

export async function listVehiclePhotos(vehicleId: string): Promise<VehiclePhotoRow[]> {
  const { rows } = await query<VehiclePhotoRow>(
    `SELECT vp.*, ma.file_url
     FROM vehicle_photos vp
     JOIN media_assets ma ON ma.id = vp.media_asset_id
     WHERE vp.vehicle_id = $1
     ORDER BY vp.sort_order ASC, vp.created_at ASC`,
    [vehicleId]
  );
  return rows;
}

export async function insertVehiclePhoto(params: {
  vehicleId: string;
  mediaAssetId: string;
  isCover?: boolean;
  sortOrder?: number;
}): Promise<VehiclePhotoRow> {
  const { rows } = await query<VehiclePhotoRow>(
    `INSERT INTO vehicle_photos (vehicle_id, media_asset_id, is_cover, sort_order)
     VALUES ($1, $2, COALESCE($3, false), COALESCE($4, 0))
     RETURNING *`,
    [params.vehicleId, params.mediaAssetId, params.isCover ?? null, params.sortOrder ?? null]
  );
  return rows[0];
}

export async function findVehiclePhotoById(vehicleId: string, photoId: string): Promise<VehiclePhotoRow | null> {
  const { rows } = await query<VehiclePhotoRow>(
    `SELECT * FROM vehicle_photos WHERE id = $1 AND vehicle_id = $2`,
    [photoId, vehicleId]
  );
  return rows[0] ?? null;
}

export async function updateVehiclePhoto(
  photoId: string,
  fields: { is_cover?: boolean; sort_order?: number }
): Promise<VehiclePhotoRow | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (fields.is_cover !== undefined) {
    sets.push(`is_cover = $${idx++}`);
    values.push(fields.is_cover);
  }
  if (fields.sort_order !== undefined) {
    sets.push(`sort_order = $${idx++}`);
    values.push(fields.sort_order);
  }
  if (sets.length === 0) {
    const { rows } = await query<VehiclePhotoRow>(`SELECT * FROM vehicle_photos WHERE id = $1`, [photoId]);
    return rows[0] ?? null;
  }
  values.push(photoId);
  const { rows } = await query<VehiclePhotoRow>(
    `UPDATE vehicle_photos SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function deleteVehiclePhoto(photoId: string): Promise<void> {
  await query(`DELETE FROM vehicle_photos WHERE id = $1`, [photoId]);
}

// ---------- Foto Hasil Kunjungan (published) — dibaca di detail kendaraan publik ----------

export interface PublishedVisitPhotoRow {
  id: string;
  vehicle_id: string;
  visit_request_id: string;
  file_url: string;
  created_at: string;
}

export async function listPublishedVisitPhotosForVehicle(vehicleId: string): Promise<PublishedVisitPhotoRow[]> {
  const { rows } = await query<PublishedVisitPhotoRow>(
    `SELECT vp.id, vp.vehicle_id, vp.visit_request_id, ma.file_url, vp.created_at
     FROM visit_photos vp
     JOIN media_assets ma ON ma.id = vp.media_asset_id
     WHERE vp.vehicle_id = $1 AND vp.moderation_status = 'published'
     ORDER BY vp.created_at DESC`,
    [vehicleId]
  );
  return rows;
}
