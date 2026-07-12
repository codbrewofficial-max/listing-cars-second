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
    conditions.push(`actor_id = $${idx++}`);
    params.push(filters.actorId);
  }
  if (filters.targetEntity) {
    conditions.push(`target_entity = $${idx++}`);
    params.push(filters.targetEntity);
  }
  if (filters.targetId) {
    conditions.push(`target_id = $${idx++}`);
    params.push(filters.targetId);
  }
  if (filters.dateFrom) {
    conditions.push(`created_at >= $${idx++}`);
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push(`created_at <= $${idx++}`);
    params.push(filters.dateTo);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalRes = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM audit_logs ${where}`, params);
  const total = parseInt(totalRes.rows[0]?.count ?? "0", 10);

  const dataRes = await query<AuditLogRow>(
    `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, filters.offset]
  );
  return { data: dataRes.rows, total };
}

export async function findAuditLogById(id: string): Promise<AuditLogRow | null> {
  const { rows } = await query<AuditLogRow>(`SELECT * FROM audit_logs WHERE id = $1`, [id]);
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
