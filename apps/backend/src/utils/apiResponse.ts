import type { Response } from "express";

interface Meta {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
  [key: string]: unknown;
}

/**
 * Helper agar semua response sukses konsisten dengan format:
 * { success: true, data: {...}, meta: {...} }
 * sesuai 05-api-endpoints-mvp.md §0.
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200, meta?: Meta) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}
