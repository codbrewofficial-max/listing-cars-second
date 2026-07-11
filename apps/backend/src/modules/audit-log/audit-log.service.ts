import { insertAuditLog, findLatestAuditLog } from "./audit-log.repository";

/**
 * Helper terpusat untuk mencatat aksi krusial ke audit_logs.
 * Dipakai lintas modul (auth, users, transactions, product, dll) sesuai
 * daftar aksi wajib di 03-rbac-alur-admin.md §4.
 *
 * Tabel audit_logs bersifat immutable by design: hanya INSERT, tidak pernah
 * di-UPDATE/DELETE dari sisi aplikasi.
 */
export async function recordAuditLog(params: {
  actorId: string;
  actorRole: string;
  actionType: string;
  targetEntity: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  return insertAuditLog(params);
}

/**
 * Dipakai untuk mengecek cooldown H+1 (24 jam) pada aksi tertentu,
 * misal PATCH /api/users/:id/reset-password (lihat 02c-addendum §8).
 * Mengembalikan sisa waktu tunggu dalam ms jika masih dalam cooldown, atau null jika boleh.
 */
export async function checkCooldown(params: {
  actionType: string;
  targetEntity: string;
  targetId: string;
  cooldownMs: number;
}): Promise<{ blocked: boolean; retryAt?: Date }> {
  const last = await findLatestAuditLog({
    actionType: params.actionType,
    targetEntity: params.targetEntity,
    targetId: params.targetId,
  });
  if (!last) return { blocked: false };

  const lastTime = new Date(last.created_at).getTime();
  const elapsed = Date.now() - lastTime;
  if (elapsed < params.cooldownMs) {
    return { blocked: true, retryAt: new Date(lastTime + params.cooldownMs) };
  }
  return { blocked: false };
}
