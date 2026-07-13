import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import { verifyAccessToken } from "./jwt";

/**
 * Middleware autentikasi: verifikasi JWT access token dari header
 * `Authorization: Bearer <token>` dan mengisi req.user.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Token akses tidak ditemukan"));
  }
  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch {
    next(ApiError.unauthorized("Token akses tidak valid atau kedaluwarsa"));
  }
}

/** Sama seperti authenticate, tapi tidak error kalau tidak ada token (opsional). */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return next();
  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
  } catch {
    // abaikan token invalid untuk optional auth
  }
  next();
}
