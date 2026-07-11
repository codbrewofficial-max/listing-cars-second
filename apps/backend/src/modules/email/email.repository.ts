import { query } from "../../config/db";

export type EmailPurpose = "email_verification" | "reset_password" | "other";
export type EmailStatus = "sent" | "failed" | "skipped_limit";

export interface EmailLogRow {
  id: string;
  recipient_email: string;
  purpose: EmailPurpose;
  status: EmailStatus;
  provider: string;
  provider_message_id: string | null;
  error_message: string | null;
  related_user_id: string | null;
  created_at: string;
}

export async function countSentToday(): Promise<number> {
  const { rows } = await query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM email_logs
     WHERE status = 'sent' AND created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'`
  );
  return parseInt(rows[0]?.count ?? "0", 10);
}

export async function insertEmailLog(params: {
  recipientEmail: string;
  purpose: EmailPurpose;
  status: EmailStatus;
  provider?: string;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  relatedUserId?: string | null;
}): Promise<EmailLogRow> {
  const { rows } = await query<EmailLogRow>(
    `INSERT INTO email_logs
      (recipient_email, purpose, status, provider, provider_message_id, error_message, related_user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      params.recipientEmail,
      params.purpose,
      params.status,
      params.provider ?? "brevo",
      params.providerMessageId ?? null,
      params.errorMessage ?? null,
      params.relatedUserId ?? null,
    ]
  );
  return rows[0];
}

export async function listEmailLogs(filters: {
  purpose?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit: number;
  offset: number;
}) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.purpose) {
    conditions.push(`purpose = $${idx++}`);
    params.push(filters.purpose);
  }
  if (filters.status) {
    conditions.push(`status = $${idx++}`);
    params.push(filters.status);
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

  const totalRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM email_logs ${where}`,
    params
  );
  const total = parseInt(totalRes.rows[0]?.count ?? "0", 10);

  const dataRes = await query<EmailLogRow>(
    `SELECT * FROM email_logs ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, filters.offset]
  );

  return { data: dataRes.rows, total };
}
