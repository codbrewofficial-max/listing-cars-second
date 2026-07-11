import bcrypt from "bcrypt";
import { ApiError } from "../../utils/ApiError";
import {
  createUser,
  findUserByEmail,
  findUserById,
  listUsers,
  softDeleteUser,
  toPublicUser,
  updateUserPassword,
  updateUserRoleStatus,
  type UserRow,
} from "../auth/auth.repository";
import type { UserRole } from "../auth/jwt";
import { recordAuditLog, checkCooldown } from "../audit-log/audit-log.service";

const BCRYPT_ROUNDS = 10;
const RESET_PASSWORD_COOLDOWN_MS = 24 * 60 * 60 * 1000; // H+1 (24 jam), lihat 02c-addendum §8

export async function listUsersService(filters: {
  role?: string;
  isActive?: boolean;
  search?: string;
  limit: number;
  offset: number;
}) {
  const { data, total } = await listUsers(filters);
  return { data: data.map(toPublicUser), total };
}

export async function getUserService(id: string) {
  const user = await findUserById(id);
  if (!user) throw ApiError.notFound("User tidak ditemukan");
  return toPublicUser(user);
}

export async function createUserService(params: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}) {
  const existing = await findUserByEmail(params.email);
  if (existing) throw ApiError.conflict("Email sudah terdaftar", "EMAIL_ALREADY_REGISTERED");

  const passwordHash = await bcrypt.hash(params.password, BCRYPT_ROUNDS);
  const user = await createUser({
    name: params.name,
    email: params.email,
    passwordHash,
    phone: params.phone ?? null,
    role: params.role,
  });
  return toPublicUser(user);
}

export async function updateUserService(
  id: string,
  fields: { role?: UserRole; is_active?: boolean }
) {
  const user = await updateUserRoleStatus(id, fields);
  if (!user) throw ApiError.notFound("User tidak ditemukan");
  return toPublicUser(user);
}

export async function deleteUserService(id: string) {
  const user = await findUserById(id);
  if (!user) throw ApiError.notFound("User tidak ditemukan");
  await softDeleteUser(id);
  return { message: "User berhasil dinonaktifkan" };
}

/**
 * Reset password manual oleh Super Admin, dipakai saat kuota email harian habis
 * (lihat 02c-addendum-auth-email-brevo.md §6.1 & §8).
 *
 * Cooldown H+1 (24 jam) per user, dicek dari audit_logs (bukan tabel/kolom baru),
 * mencari entry terakhir action_type='admin_reset_password' target_entity='users' target_id=id.
 */
export async function adminResetPasswordService(params: {
  targetUserId: string;
  newPassword: string;
  actorId: string;
  actorRole: string;
}) {
  const targetUser = await findUserById(params.targetUserId);
  if (!targetUser) throw ApiError.notFound("User tidak ditemukan");

  const cooldown = await checkCooldown({
    actionType: "admin_reset_password",
    targetEntity: "users",
    targetId: params.targetUserId,
    cooldownMs: RESET_PASSWORD_COOLDOWN_MS,
  });

  if (cooldown.blocked) {
    throw new ApiError(
      409,
      "COOLDOWN_ACTIVE",
      `Reset password manual untuk user ini baru bisa dilakukan lagi setelah ${cooldown.retryAt?.toISOString()}.`
    );
  }

  const passwordHash = await bcrypt.hash(params.newPassword, BCRYPT_ROUNDS);
  await updateUserPassword(params.targetUserId, passwordHash);

  await recordAuditLog({
    actorId: params.actorId,
    actorRole: params.actorRole,
    actionType: "admin_reset_password",
    targetEntity: "users",
    targetId: params.targetUserId,
    metadata: { reason: "email_quota_exceeded_or_manual" },
  });

  return {
    user: toPublicUser({ ...targetUser } as UserRow),
    message:
      "Password berhasil direset. Sampaikan password baru ke user secara manual di luar sistem (WhatsApp/telepon).",
  };
}
