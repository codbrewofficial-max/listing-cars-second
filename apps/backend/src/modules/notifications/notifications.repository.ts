import { query } from "../../config/db";

export type NotificationType =
  | "chat_message"
  | "visit_status"
  | "transaction_status"
  | "document_status"
  | "system";

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  related_entity: string | null;
  related_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export async function insertNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  relatedEntity?: string | null;
  relatedId?: string | null;
}): Promise<NotificationRow> {
  const { rows } = await query<NotificationRow>(
    `INSERT INTO notifications (user_id, type, title, body, related_entity, related_id)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      params.userId,
      params.type,
      params.title,
      params.body ?? null,
      params.relatedEntity ?? null,
      params.relatedId ?? null,
    ]
  );
  return rows[0];
}

export async function listNotifications(params: {
  userId: string;
  isRead?: boolean;
  limit: number;
  offset: number;
}): Promise<{ data: NotificationRow[]; total: number; unreadCount: number }> {
  const conditions = [`user_id = $1`];
  const values: unknown[] = [params.userId];
  let idx = 2;

  if (params.isRead !== undefined) {
    conditions.push(`is_read = $${idx++}`);
    values.push(params.isRead);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;

  const totalRes = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM notifications ${where}`, values);
  const total = parseInt(totalRes.rows[0]?.count ?? "0", 10);

  const unreadRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM notifications WHERE user_id = $1 AND is_read = false`,
    [params.userId]
  );
  const unreadCount = parseInt(unreadRes.rows[0]?.count ?? "0", 10);

  const dataRes = await query<NotificationRow>(
    `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...values, params.limit, params.offset]
  );

  return { data: dataRes.rows, total, unreadCount };
}

export async function findNotificationById(id: string): Promise<NotificationRow | null> {
  const { rows } = await query<NotificationRow>(`SELECT * FROM notifications WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function markNotificationRead(id: string, userId: string): Promise<NotificationRow | null> {
  const { rows } = await query<NotificationRow>(
    `UPDATE notifications SET is_read = true, read_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId]
  );
  return rows[0] ?? null;
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const result = await query(
    `UPDATE notifications SET is_read = true, read_at = now() WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  return result.rowCount ?? 0;
}
