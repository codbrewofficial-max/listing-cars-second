import crypto from "node:crypto";

/** Generate random refresh token mentah (bukan JWT) yang dikirim ke client. */
export function generateRawRefreshToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

/** Refresh token disimpan di DB dalam bentuk hash (sha256), bukan plaintext. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
