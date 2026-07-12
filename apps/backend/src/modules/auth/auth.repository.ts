import { query } from "../../config/db";
import type { UserRole } from "./jwt";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  role: UserRole;
  email_verified_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function toPublicUser(user: UserRow) {
  const { password_hash, ...publicUser } = user;
  return publicUser;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await query<UserRow>(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()]);
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const { rows } = await query<UserRow>(`SELECT * FROM users WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function createUser(params: {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string | null;
  role?: UserRole;
}): Promise<UserRow> {
  const { rows } = await query<UserRow>(
    `INSERT INTO users (name, email, password_hash, phone, role, email_verified_at)
     VALUES ($1, $2, $3, $4, COALESCE($5, 'customer')::user_role, now)
     RETURNING *`,
    [params.name, params.email.toLowerCase(), params.passwordHash, params.phone ?? null, params.role ?? null]
  );
  return rows[0];
}

export async function updateUserProfile(
  id: string,
  fields: { name?: string; phone?: string }
): Promise<UserRow | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (fields.name !== undefined) {
    sets.push(`name = $${idx++}`);
    values.push(fields.name);
  }
  if (fields.phone !== undefined) {
    sets.push(`phone = $${idx++}`);
    values.push(fields.phone);
  }
  if (sets.length === 0) return findUserById(id);

  sets.push(`updated_at = now()`);
  values.push(id);

  const { rows } = await query<UserRow>(
    `UPDATE users SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function updateUserPassword(id: string, passwordHash: string): Promise<void> {
  await query(`UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`, [passwordHash, id]);
}

export async function markEmailVerified(id: string): Promise<void> {
  await query(`UPDATE users SET email_verified_at = now(), updated_at = now() WHERE id = $1`, [id]);
}

export async function updateUserRoleStatus(
  id: string,
  fields: { role?: UserRole; is_active?: boolean }
): Promise<UserRow | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (fields.role !== undefined) {
    sets.push(`role = $${idx++}::user_role`);
    values.push(fields.role);
  }
  if (fields.is_active !== undefined) {
    sets.push(`is_active = $${idx++}`);
    values.push(fields.is_active);
  }
  if (sets.length === 0) return findUserById(id);

  sets.push(`updated_at = now()`);
  values.push(id);

  const { rows } = await query<UserRow>(
    `UPDATE users SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function softDeleteUser(id: string): Promise<void> {
  await query(`UPDATE users SET is_active = false, updated_at = now() WHERE id = $1`, [id]);
}

export async function listUsers(filters: {
  role?: string;
  isActive?: boolean;
  search?: string;
  limit: number;
  offset: number;
}) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.role) {
    conditions.push(`role = $${idx++}`);
    params.push(filters.role);
  }
  if (filters.isActive !== undefined) {
    conditions.push(`is_active = $${idx++}`);
    params.push(filters.isActive);
  }
  if (filters.search) {
    conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx})`);
    params.push(`%${filters.search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalRes = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM users ${where}`, params);
  const total = parseInt(totalRes.rows[0]?.count ?? "0", 10);

  const dataRes = await query<UserRow>(
    `SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, filters.offset]
  );

  return { data: dataRes.rows, total };
}

// ---------- Refresh Tokens ----------

export interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
  created_by_ip: string | null;
  user_agent: string | null;
  created_at: string;
}

export async function insertRefreshToken(params: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdByIp?: string | null;
  userAgent?: string | null;
}): Promise<RefreshTokenRow> {
  const { rows } = await query<RefreshTokenRow>(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_by_ip, user_agent)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [params.userId, params.tokenHash, params.expiresAt, params.createdByIp ?? null, params.userAgent ?? null]
  );
  return rows[0];
}

export async function findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRow | null> {
  const { rows } = await query<RefreshTokenRow>(
    `SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [tokenHash]
  );
  return rows[0] ?? null;
}

export async function revokeRefreshTokenById(id: string): Promise<void> {
  await query(`UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1`, [id]);
}

export async function revokeRefreshTokenByHash(tokenHash: string): Promise<void> {
  await query(`UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1`, [tokenHash]);
}

export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  await query(`UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [userId]);
}
