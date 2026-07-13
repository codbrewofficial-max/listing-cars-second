import { query } from "../../config/db";

export interface AuditLogRow {
  id: string;
  actor_id: string;
  actor_role: string;
  action_type: string;
  target_entity: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  // Hasil LEFT JOIN ke users.name (lihat listAuditLogs/findAuditLogById) — nullable karena
  // akun aktor bisa saja sudah dihapus setelah aksi tercatat; audit log tetap immutable
  // walau user-nya sendiri sudah tidak ada.
  actor_name?: string | null;
}

export async function insertAuditLog(params: {
  actorId: string;
  actorRole: string;
  actionType: string;
  targetEntity: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<AuditLogRow> {
  const { rows } = await query<AuditLogRow>(
    `INSERT INTO audit_logs (actor_id, actor_role, action_type, target_entity, target_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      params.actorId,
      params.actorRole,
      params.actionType,
      params.targetEntity,
      params.targetId ?? null,
      params.metadata ? JSON.stringify(params.metadata) : null,
    ]
  );
  return rows[0];
}

/** Query list untuk GET /api/audit-logs (Super Admin only, 05-api-endpoints-mvp.md §12). */
export async function listAuditLogs(filters: {
  actorId?: string;
  targetEntity?: string;
  targetId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit: number;
  offset: number;
}): Promise<{ data: AuditLogRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.actorId) {
    conditions.push(`al.actor_id = $${idx++}`);
    params.push(filters.actorId);
  }
  if (filters.targetEntity) {
    conditions.push(`al.target_entity = $${idx++}`);
    params.push(filters.targetEntity);
  }
  if (filters.targetId) {
    conditions.push(`al.target_id = $${idx++}`);
    params.push(filters.targetId);
  }
  if (filters.dateFrom) {
    conditions.push(`al.created_at >= $${idx++}`);
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push(`al.created_at <= $${idx++}`);
    params.push(filters.dateTo);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM audit_logs al ${where}`,
    params
  );
  const total = parseInt(totalRes.rows[0]?.count ?? "0", 10);

  // LEFT JOIN (bukan INNER) karena akun aktor bisa saja sudah dihapus setelah aksi
  // tercatat — audit log tetap harus tampil (immutable), hanya actor_name jadi NULL
  // (fallback ke actor_id ditangani di frontend/consumer).
  const dataRes = await query<AuditLogRow>(
    `SELECT al.*, u.name AS actor_name
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.actor_id
     ${where}
     ORDER BY al.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, filters.offset]
  );
  return { data: dataRes.rows, total };
}

export async function findAuditLogById(id: string): Promise<AuditLogRow | null> {
  const { rows } = await query<AuditLogRow>(
    `SELECT al.*, u.name AS actor_name
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.actor_id
     WHERE al.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/** Cari entry audit log terbaru untuk action_type + target_entity + target_id tertentu. */
export async function findLatestAuditLog(params: {
  actionType: string;
  targetEntity: string;
  targetId: string;
}): Promise<AuditLogRow | null> {
  const { rows } = await query<AuditLogRow>(
    `SELECT * FROM audit_logs
     WHERE action_type = $1 AND target_entity = $2 AND target_id = $3
     ORDER BY created_at DESC
     LIMIT 1`,
    [params.actionType, params.targetEntity, params.targetId]
  );
  return rows[0] ?? null;
}
