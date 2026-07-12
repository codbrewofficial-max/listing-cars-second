import { query } from "../../config/db";

function dateConditions(column: string, dateFrom?: string, dateTo?: string) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (dateFrom) {
    conditions.push(`${column} >= $${idx++}`);
    params.push(dateFrom);
  }
  if (dateTo) {
    conditions.push(`${column} <= $${idx++}`);
    params.push(dateTo);
  }
  return { where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", params, nextIdx: idx };
}

export async function countLeadsTotal(dateFrom?: string, dateTo?: string): Promise<number> {
  const { where, params } = dateConditions("created_at", dateFrom, dateTo);
  const { rows } = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM leads ${where}`, params);
  return parseInt(rows[0]?.count ?? "0", 10);
}

export async function countLeadsBySource(
  dateFrom?: string,
  dateTo?: string
): Promise<{ source: string; count: number }[]> {
  const { where, params } = dateConditions("created_at", dateFrom, dateTo);
  const { rows } = await query<{ source: string; count: string }>(
    `SELECT source, COUNT(*)::text as count FROM leads ${where} GROUP BY source`,
    params
  );
  return rows.map((r) => ({ source: r.source, count: parseInt(r.count, 10) }));
}

export async function countTransactionsByStatus(
  dateFrom?: string,
  dateTo?: string
): Promise<{ status: string; count: number; total_amount: number }[]> {
  const { where, params } = dateConditions("created_at", dateFrom, dateTo);
  const { rows } = await query<{ status: string; count: string; total_amount: string }>(
    `SELECT status, COUNT(*)::text as count, COALESCE(SUM(amount), 0)::text as total_amount
     FROM transactions ${where} GROUP BY status`,
    params
  );
  return rows.map((r) => ({
    status: r.status,
    count: parseInt(r.count, 10),
    total_amount: parseFloat(r.total_amount),
  }));
}

export async function countArticlesByStatus(): Promise<{ status: string; count: number }[]> {
  const { rows } = await query<{ status: string; count: string }>(
    `SELECT status, COUNT(*)::text as count FROM articles GROUP BY status`
  );
  return rows.map((r) => ({ status: r.status, count: parseInt(r.count, 10) }));
}

/**
 * "Artikel terpopuler" TIDAK bisa dihitung murni dari database internal (lihat catatan
 * di insights.service.ts) karena tracking pageview ada di GTM/GA4 (client-side, di luar
 * scope backend MVP — 05-api-endpoints-mvp.md §11). Sebagai proxy sementara, endpoint
 * ini mengembalikan artikel published terbaru.
 */
export async function listRecentPublishedArticles(limit: number): Promise<
  { id: string; title: string; slug: string; published_at: string | null }[]
> {
  const { rows } = await query<{ id: string; title: string; slug: string; published_at: string | null }>(
    `SELECT id, title, slug, published_at FROM articles
     WHERE status = 'published'
     ORDER BY published_at DESC NULLS LAST, created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

export async function leadsReportGroupedByDay(
  dateFrom?: string,
  dateTo?: string
): Promise<{ period: string; source: string; count: number }[]> {
  const { where, params } = dateConditions("created_at", dateFrom, dateTo);
  const { rows } = await query<{ period: string; source: string; count: string }>(
    `SELECT to_char(created_at, 'YYYY-MM-DD') as period, source, COUNT(*)::text as count
     FROM leads ${where}
     GROUP BY period, source
     ORDER BY period ASC`,
    params
  );
  return rows.map((r) => ({ period: r.period, source: r.source, count: parseInt(r.count, 10) }));
}

export async function leadsReportGroupedBySource(
  dateFrom?: string,
  dateTo?: string
): Promise<{ source: string; count: number }[]> {
  return countLeadsBySource(dateFrom, dateTo);
}

export async function transactionsReportGroupedByDay(
  dateFrom?: string,
  dateTo?: string
): Promise<{ period: string; status: string; count: number; total_amount: number }[]> {
  const { where, params } = dateConditions("created_at", dateFrom, dateTo);
  const { rows } = await query<{ period: string; status: string; count: string; total_amount: string }>(
    `SELECT to_char(created_at, 'YYYY-MM-DD') as period, status, COUNT(*)::text as count,
            COALESCE(SUM(amount), 0)::text as total_amount
     FROM transactions ${where}
     GROUP BY period, status
     ORDER BY period ASC`,
    params
  );
  return rows.map((r) => ({
    period: r.period,
    status: r.status,
    count: parseInt(r.count, 10),
    total_amount: parseFloat(r.total_amount),
  }));
}

export async function transactionsReportGroupedByStatus(
  dateFrom?: string,
  dateTo?: string
): Promise<{ status: string; count: number; total_amount: number }[]> {
  return countTransactionsByStatus(dateFrom, dateTo);
}
