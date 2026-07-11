import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import type { UserRole } from "./jwt";

/**
 * Role guard. Contoh: authorize('super_admin'), authorize('admin', 'super_admin').
 * Harus dipasang SETELAH authenticate.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden("Anda tidak memiliki akses untuk aksi ini"));
    }
    next();
  };
}
