import bcrypt from "bcrypt";
import { ApiError } from "../../utils/ApiError";
import { env } from "../../config/env";
import {
  createUser,
  findUserByEmail,
  findUserById,
  findRefreshTokenByHash,
  insertRefreshToken,
  markEmailVerified,
  revokeAllRefreshTokensForUser,
  revokeRefreshTokenByHash,
  revokeRefreshTokenById,
  toPublicUser,
  updateUserPassword,
  updateUserProfile,
  type UserRow,
} from "./auth.repository";
import { signAccessToken, signEmailToken, verifyEmailToken } from "./jwt";
import { generateRawRefreshToken, hashToken } from "./token.util";
import { isRegistrationOpen } from "../platform-settings/settings.service";
import { sendEmail } from "../email/email.service";
import { resetPasswordEmailTemplate, verificationEmailTemplate } from "../email/templates";

const BCRYPT_ROUNDS = 10;

function buildVerifyUrl(token: string) {
  return `${env.FRONTEND_BASE_URL}/verify-email?token=${token}`;
}
function buildResetUrl(token: string) {
  return `${env.FRONTEND_BASE_URL}/reset-password?token=${token}`;
}

// ---------- Register ----------

export async function registerService(params: { name: string; email: string; password: string; phone?: string }) {
  const registrationOpen = await isRegistrationOpen();
  if (!registrationOpen) {
    throw ApiError.forbidden("Registrasi saat ini ditutup. Silakan coba lagi nanti.");
  }

  const existing = await findUserByEmail(params.email);
  if (existing) {
    throw ApiError.conflict("Email sudah terdaftar", "EMAIL_ALREADY_REGISTERED");
  }

  const passwordHash = await bcrypt.hash(params.password, BCRYPT_ROUNDS);
  const user = await createUser({
    name: params.name,
    email: params.email,
    passwordHash,
    phone: params.phone ?? null,
    role: "customer",
  });

  const token = signEmailToken(user.id, "email_verification");
  const tpl = verificationEmailTemplate(user.name, buildVerifyUrl(token));
  await sendEmail({
    to: user.email,
    purpose: "email_verification",
    subject: tpl.subject,
    html: tpl.html,
    relatedUserId: user.id,
  });

  return { user_id: user.id, message: "Registrasi berhasil. Silakan cek email untuk verifikasi." };
}

// ---------- Login ----------

export async function loginService(params: {
  email: string;
  password: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const user = await findUserByEmail(params.email);
  if (!user) throw ApiError.unauthorized("Email atau password salah");

  if (!user.is_active) throw ApiError.forbidden("Akun Anda telah dinonaktifkan. Hubungi Admin.");

  const passwordMatch = await bcrypt.compare(params.password, user.password_hash);
  if (!passwordMatch) throw ApiError.unauthorized("Email atau password salah");

  // Sesuai keputusan: user yang belum verifikasi email TIDAK BISA login,
  // dikembalikan/"dimentalkan" ke alur login dengan pesan jelas untuk verifikasi dulu.
  if (!user.email_verified_at) {
    throw new ApiError(
      403,
      "EMAIL_NOT_VERIFIED",
      "Email Anda belum diverifikasi. Silakan cek email verifikasi atau minta kirim ulang."
    );
  }

  const { accessToken, refreshToken } = await issueTokenPair(user, params.ip, params.userAgent);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: toPublicUser(user),
  };
}

async function issueTokenPair(user: UserRow, ip?: string | null, userAgent?: string | null) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });

  const rawRefreshToken = generateRawRefreshToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);
  await insertRefreshToken({
    userId: user.id,
    tokenHash: hashToken(rawRefreshToken),
    expiresAt,
    createdByIp: ip ?? null,
    userAgent: userAgent ?? null,
  });

  return { accessToken, refreshToken: rawRefreshToken };
}

// ---------- Refresh Token (dengan rotasi) ----------

export async function refreshTokenService(params: {
  refreshToken: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const tokenHash = hashToken(params.refreshToken);
  const existing = await findRefreshTokenByHash(tokenHash);
  if (!existing) throw ApiError.unauthorized("Refresh token tidak valid atau kedaluwarsa");

  const user = await findUserById(existing.user_id);
  if (!user || !user.is_active) throw ApiError.unauthorized("Akun tidak aktif");

  // Rotasi: revoke token lama, terbitkan baru (mencegah replay).
  await revokeRefreshTokenById(existing.id);
  const { accessToken, refreshToken } = await issueTokenPair(user, params.ip, params.userAgent);

  return { access_token: accessToken, refresh_token: refreshToken };
}

// ---------- Logout ----------

/**
 * Kontrak asli di 05-api-endpoints-mvp.md §1 tidak mensyaratkan body untuk logout.
 * Di sini kita dukung dua mode agar tetap kompatibel:
 * - refresh_token dikirim (opsional) -> revoke token spesifik itu saja (logout 1 device).
 * - tidak dikirim -> revoke SEMUA refresh token milik user (logout semua device).
 */
export async function logoutService(userId: string, refreshToken?: string) {
  if (refreshToken) {
    await revokeRefreshTokenByHash(hashToken(refreshToken));
  } else {
    await revokeAllRefreshTokensForUser(userId);
  }
  return { message: "Berhasil logout" };
}

// ---------- Forgot / Reset Password ----------

const GENERIC_FORGOT_MESSAGE =
  "Jika email terdaftar, instruksi reset password akan dikirim ke email tersebut.";

export async function forgotPasswordService(email: string) {
  const user = await findUserByEmail(email);

  // Anti email-enumeration: selalu return success + pesan generik meski email tidak ditemukan.
  if (!user) {
    return { message: GENERIC_FORGOT_MESSAGE };
  }

  const token = signEmailToken(user.id, "reset_password");
  const tpl = resetPasswordEmailTemplate(user.name, buildResetUrl(token));
  const result = await sendEmail({
    to: user.email,
    purpose: "reset_password",
    subject: tpl.subject,
    html: tpl.html,
    relatedUserId: user.id,
  });

  if (result.status === "skipped_limit") {
    // Sesuai 02c §6.1: kuota habis -> tetap success:true, arahkan hubungi Admin.
    return {
      message:
        "Jika email terdaftar, instruksi reset akan dikirim. Jika tidak menerima email dalam waktu singkat, hubungi Admin untuk bantuan reset manual.",
    };
  }

  return { message: GENERIC_FORGOT_MESSAGE };
}

export async function resetPasswordService(params: { token: string; newPassword: string }) {
  let payload;
  try {
    payload = verifyEmailToken(params.token);
  } catch {
    throw ApiError.badRequest("Token reset password tidak valid atau kedaluwarsa");
  }
  if (payload.purpose !== "reset_password") {
    throw ApiError.badRequest("Token tidak sesuai untuk aksi ini");
  }

  const user = await findUserById(payload.sub);
  if (!user) throw ApiError.badRequest("Token tidak valid");

  // Mitigasi single-use: jika users.updated_at > iat token, berarti sudah ada
  // perubahan pada baris user sejak token diterbitkan -> token ditolak (fail-safe),
  // sesuai 02c-addendum §5.
  const updatedAtMs = new Date(user.updated_at).getTime();
  const iatMs = payload.iat * 1000;
  if (updatedAtMs > iatMs) {
    throw ApiError.badRequest(
      "Token reset password sudah tidak berlaku (akun telah berubah sejak token diterbitkan). Silakan minta link reset baru."
    );
  }

  const passwordHash = await bcrypt.hash(params.newPassword, BCRYPT_ROUNDS);
  await updateUserPassword(user.id, passwordHash);

  return { message: "Password berhasil direset. Silakan login dengan password baru." };
}

// ---------- Email Verification ----------

export async function verifyEmailService(token: string) {
  let payload;
  try {
    payload = verifyEmailToken(token);
  } catch {
    throw ApiError.badRequest("Token verifikasi tidak valid atau kedaluwarsa");
  }
  if (payload.purpose !== "email_verification") {
    throw ApiError.badRequest("Token tidak sesuai untuk aksi ini");
  }

  const user = await findUserById(payload.sub);
  if (!user) throw ApiError.badRequest("Token tidak valid");

  // Single-use: jika sudah terverifikasi, tolak verifikasi ulang.
  if (user.email_verified_at) {
    return { message: "Email sudah terverifikasi sebelumnya." };
  }

  await markEmailVerified(user.id);
  return { message: "Email berhasil diverifikasi. Silakan login." };
}

export async function resendVerificationService(email: string) {
  const user = await findUserByEmail(email);
  // Anti enumeration: pesan generik meski user tidak ada.
  if (!user) {
    return { message: "Jika email terdaftar dan belum diverifikasi, email verifikasi akan dikirim." };
  }
  if (user.email_verified_at) {
    return { message: "Email sudah terverifikasi. Silakan login." };
  }

  const token = signEmailToken(user.id, "email_verification");
  const tpl = verificationEmailTemplate(user.name, buildVerifyUrl(token));
  await sendEmail({
    to: user.email,
    purpose: "email_verification",
    subject: tpl.subject,
    html: tpl.html,
    relatedUserId: user.id,
  });

  return { message: "Email verifikasi telah dikirim ulang." };
}

// ---------- Profile (me) ----------

export async function getMeService(userId: string) {
  const user = await findUserById(userId);
  if (!user) throw ApiError.notFound("User tidak ditemukan");
  return toPublicUser(user);
}

export async function updateMeService(userId: string, fields: { name?: string; phone?: string }) {
  const user = await updateUserProfile(userId, fields);
  if (!user) throw ApiError.notFound("User tidak ditemukan");
  return toPublicUser(user);
}

export async function changePasswordService(params: {
  userId: string;
  oldPassword: string;
  newPassword: string;
}) {
  const user = await findUserById(params.userId);
  if (!user) throw ApiError.notFound("User tidak ditemukan");

  const match = await bcrypt.compare(params.oldPassword, user.password_hash);
  if (!match) throw ApiError.badRequest("Password lama salah");

  const passwordHash = await bcrypt.hash(params.newPassword, BCRYPT_ROUNDS);
  await updateUserPassword(user.id, passwordHash);

  return { message: "Password berhasil diganti." };
}
