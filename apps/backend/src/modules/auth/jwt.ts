import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";

export type UserRole = "super_admin" | "owner" | "admin" | "customer" | "toko";

export interface AccessTokenPayload {
  sub: string; // user id
  role: UserRole;
  email: string;
}

export interface EmailTokenPayload {
  sub: string;
  purpose: "email_verification" | "reset_password";
  iat: number;
}

/** Access token: pendek umurnya, dipakai untuk otorisasi tiap request. */
export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

/**
 * Token email verification & reset password: JWT stateless dengan secret
 * TERPISAH dari access/refresh token, sesuai 02c-addendum §5.
 */
export function signEmailToken(userId: string, purpose: "email_verification" | "reset_password"): string {
  const expiresIn =
    purpose === "email_verification" ? env.JWT_EMAIL_VERIFICATION_EXPIRES_IN : env.JWT_RESET_PASSWORD_EXPIRES_IN;
  const options: SignOptions = { expiresIn: expiresIn as SignOptions["expiresIn"] };
  return jwt.sign({ sub: userId, purpose }, env.JWT_EMAIL_SECRET, options);
}

export function verifyEmailToken(token: string): EmailTokenPayload {
  return jwt.verify(token, env.JWT_EMAIL_SECRET) as EmailTokenPayload;
}
