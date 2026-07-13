import { query } from "../../config/db";

export interface VisitRequestRow {
  id: string;
  vehicle_id: string;
  customer_id: string;
  admin_id: string | null;
  status: "requested" | "scheduled" | "completed" | "cancelled";
  scheduled_at: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisitPhotoRow {
  id: string;
  visit_request_id: string;
  vehicle_id: string;
  media_asset_id: string;
  uploaded_by: string;
  uploaded_by_role: "customer" | "admin" | "toko";
  moderation_status: "pending_review" | "published" | "rejected";
  moderated_by: string | null;
  moderated_at: string | null;
  created_at: string;
  file_url?: string;
}

export async function insertVisitRequest(params: {
  vehicleId: string;
  customerId: string;
  notes?: string | null;
}): Promise<VisitRequestRow> {
  const { rows } = await query<VisitRequestRow>(
    `INSERT INTO visit_requests (vehicle_id, customer_id, notes)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [params.vehicleId, params.customerId, params.notes ?? null]
  );
  return rows[0];
}

export async function findVisitRequestById(id: string): Promise<VisitRequestRow | null> {
  const { rows } = await query<VisitRequestRow>(`SELECT * FROM visit_requests WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function listVisitRequests(filters: {
  status?: string;
  vehicleId?: string;
  customerId?: string;
  limit: number;
  offset: number;
}): Promise<{ data: VisitRequestRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.status) {
    conditions.push(`status = $${idx++}`);
    params.push(filters.status);
  }
  if (filters.vehicleId) {
    conditions.push(`vehicle_id = $${idx++}`);
    params.push(filters.vehicleId);
  }
  if (filters.customerId) {
    conditions.push(`customer_id = $${idx++}`);
    params.push(filters.customerId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM visit_requests ${where}`,
    params
  );
  const total = parseInt(totalRes.rows[0]?.count ?? "0", 10);

  const dataRes = await query<VisitRequestRow>(
    `SELECT * FROM visit_requests ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, filters.offset]
  );

  return { data: dataRes.rows, total };
}

export async function scheduleVisitRequest(params: {
  id: string;
  scheduledAt: string;
  location: string;
  adminId: string;
}): Promise<VisitRequestRow | null> {
  const { rows } = await query<VisitRequestRow>(
    `UPDATE visit_requests
     SET status = 'scheduled', scheduled_at = $1, location = $2, admin_id = $3, updated_at = now()
     WHERE id = $4
     RETURNING *`,
    [params.scheduledAt, params.location, params.adminId, params.id]
  );
  return rows[0] ?? null;
}

export async function updateVisitRequestStatus(params: {
  id: string;
  status: string;
  notes?: string | null;
}): Promise<VisitRequestRow | null> {
  const { rows } = await query<VisitRequestRow>(
    `UPDATE visit_requests
     SET status = $1, notes = COALESCE($2, notes), updated_at = now()
     WHERE id = $3
     RETURNING *`,
    [params.status, params.notes ?? null, params.id]
  );
  return rows[0] ?? null;
}

// ---------- Visit Photos ----------

export async function insertVisitPhoto(params: {
  visitRequestId: string;
  vehicleId: string;
  mediaAssetId: string;
  uploadedBy: string;
  uploadedByRole: string;
}): Promise<VisitPhotoRow> {
  const { rows } = await query<VisitPhotoRow>(
    `INSERT INTO visit_photos (visit_request_id, vehicle_id, media_asset_id, uploaded_by, uploaded_by_role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [params.visitRequestId, params.vehicleId, params.mediaAssetId, params.uploadedBy, params.uploadedByRole]
  );
  return rows[0];
}

export async function listVisitPhotosByRequest(visitRequestId: string): Promise<VisitPhotoRow[]> {
  const { rows } = await query<VisitPhotoRow>(
    `SELECT vp.*, ma.file_url
     FROM visit_photos vp
     JOIN media_assets ma ON ma.id = vp.media_asset_id
     WHERE vp.visit_request_id = $1
     ORDER BY vp.created_at ASC`,
    [visitRequestId]
  );
  return rows;
}

export async function findVisitPhotoById(photoId: string): Promise<VisitPhotoRow | null> {
  const { rows } = await query<VisitPhotoRow>(`SELECT * FROM visit_photos WHERE id = $1`, [photoId]);
  return rows[0] ?? null;
}

/**
 * Dipakai oleh trigger notifikasi document_status (lihat vehicles.service.ts):
 * cari customer yang punya visit_request aktif (requested/scheduled) untuk kendaraan
 * tertentu, supaya bisa diberi tahu saat status dokumen kendaraan tersebut berubah.
 */
export async function listDistinctActiveCustomerIdsForVehicle(vehicleId: string): Promise<string[]> {
  const { rows } = await query<{ customer_id: string }>(
    `SELECT DISTINCT customer_id FROM visit_requests
     WHERE vehicle_id = $1 AND status IN ('requested', 'scheduled')`,
    [vehicleId]
  );
  return rows.map((r) => r.customer_id);
}

export async function moderateVisitPhoto(params: {
  photoId: string;
  moderationStatus: string;
  moderatedBy: string;
}): Promise<VisitPhotoRow | null> {
  const { rows } = await query<VisitPhotoRow>(
    `UPDATE visit_photos
     SET moderation_status = $1, moderated_by = $2, moderated_at = now()
     WHERE id = $3
     RETURNING *`,
    [params.moderationStatus, params.moderatedBy, params.photoId]
  );
  return rows[0] ?? null;
}
