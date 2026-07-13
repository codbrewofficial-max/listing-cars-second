import { query } from "../../config/db";

export type TransactionStatus =
  | "pending_payment"
  | "payment_verified"
  | "funds_held"
  | "released_to_seller"
  | "disputed"
  | "resolved"
  | "cancelled"
  | "refunded";

export interface TransactionRow {
  id: string;
  product_type: "vehicle" | "spare_part";
  product_id: string;
  quantity: number;
  buyer_id: string;
  seller_type: "admin" | "customer" | "toko";
  seller_id: string;
  amount: string;
  status: TransactionStatus;
  payment_proof_media_id: string | null;
  payment_verified_by: string | null;
  payment_verified_at: string | null;
  released_by: string | null;
  released_at: string | null;
  dispute_reason: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  payment_gateway_ref: string | null; // reserved Fase 2, selalu NULL di MVP
  created_at: string;
  updated_at: string;
}

export async function insertTransaction(params: {
  productType: string;
  productId: string;
  quantity: number;
  buyerId: string;
  sellerId: string;
  amount: number;
}): Promise<TransactionRow> {
  const { rows } = await query<TransactionRow>(
    `INSERT INTO transactions (product_type, product_id, quantity, buyer_id, seller_type, seller_id, amount)
     VALUES ($1, $2, $3, $4, 'admin', $5, $6)
     RETURNING *`,
    [params.productType, params.productId, params.quantity, params.buyerId, params.sellerId, params.amount]
  );
  return rows[0];
}

export async function findTransactionById(id: string): Promise<TransactionRow | null> {
  const { rows } = await query<TransactionRow>(`SELECT * FROM transactions WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function listTransactions(filters: {
  status?: string;
  productType?: string;
  buyerId?: string;
  limit: number;
  offset: number;
}): Promise<{ data: TransactionRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.status) {
    conditions.push(`status = $${idx++}`);
    params.push(filters.status);
  }
  if (filters.productType) {
    conditions.push(`product_type = $${idx++}`);
    params.push(filters.productType);
  }
  if (filters.buyerId) {
    conditions.push(`buyer_id = $${idx++}`);
    params.push(filters.buyerId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalRes = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM transactions ${where}`, params);
  const total = parseInt(totalRes.rows[0]?.count ?? "0", 10);

  const dataRes = await query<TransactionRow>(
    `SELECT * FROM transactions ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, filters.offset]
  );

  return { data: dataRes.rows, total };
}

export async function updateTransactionStatus(params: {
  id: string;
  status: TransactionStatus;
  fields?: Partial<{
    payment_proof_media_id: string | null;
    payment_verified_by: string | null;
    payment_verified_at: string | null;
    released_by: string | null;
    released_at: string | null;
    dispute_reason: string | null;
    resolved_by: string | null;
    resolved_at: string | null;
  }>;
}): Promise<TransactionRow | null> {
  const sets: string[] = [`status = $1`, `updated_at = now()`];
  const values: unknown[] = [params.status];
  let idx = 2;

  for (const [key, value] of Object.entries(params.fields ?? {})) {
    sets.push(`${key} = $${idx++}`);
    values.push(value);
  }

  values.push(params.id);

  const { rows } = await query<TransactionRow>(
    `UPDATE transactions SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function setPaymentProof(id: string, mediaAssetId: string): Promise<TransactionRow | null> {
  const { rows } = await query<TransactionRow>(
    `UPDATE transactions SET payment_proof_media_id = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [mediaAssetId, id]
  );
  return rows[0] ?? null;
}
