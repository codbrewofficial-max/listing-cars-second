import { query } from "../../config/db";

export interface LeadRow {
  id: string;
  source: "contact_form" | "whatsapp_modal";
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  related_product_type: "vehicle" | "spare_part" | null;
  related_product_id: string | null;
  created_at: string;
}

export async function insertLead(params: {
  source: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  relatedProductType?: string;
  relatedProductId?: string;
}): Promise<LeadRow> {
  const { rows } = await query<LeadRow>(
    `INSERT INTO leads (source, name, email, phone, message, related_product_type, related_product_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      params.source,
      params.name ?? null,
      params.email ?? null,
      params.phone ?? null,
      params.message ?? null,
      params.relatedProductType ?? null,
      params.relatedProductId ?? null,
    ]
  );
  return rows[0];
}

export async function findLeadById(id: string): Promise<LeadRow | null> {
  const { rows } = await query<LeadRow>(`SELECT * FROM leads WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function listLeads(filters: {
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit: number;
  offset: number;
}): Promise<{ data: LeadRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.source) {
    conditions.push(`source = $${idx++}`);
    params.push(filters.source);
  }
  if (filters.dateFrom) {
    conditions.push(`created_at >= $${idx++}`);
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push(`created_at <= $${idx++}`);
    params.push(filters.dateTo);
  }
  if (filters.search) {
    conditions.push(`(name ILIKE $${idx} OR phone ILIKE $${idx} OR email ILIKE $${idx})`);
    params.push(`%${filters.search}%`);
    idx++;
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalRes = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM leads ${where}`, params);
  const total = parseInt(totalRes.rows[0]?.count ?? "0", 10);

  const dataRes = await query<LeadRow>(
    `SELECT * FROM leads ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, filters.offset]
  );
  return { data: dataRes.rows, total };
}
