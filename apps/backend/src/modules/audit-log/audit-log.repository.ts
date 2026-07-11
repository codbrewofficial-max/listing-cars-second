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
