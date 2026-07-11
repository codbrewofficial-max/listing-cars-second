import rateLimit from "express-rate-limit";

/**
 * Rate limiter untuk endpoint sensitif (login, forgot-password, resend-verification)
 * guna mencegah brute-force & spam email. Nilainya cukup longgar untuk MVP 100 user,
 * bisa diperketat belakangan tanpa mengubah kontrak API.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Terlalu banyak percobaan login, coba lagi nanti." },
  },
});

export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Terlalu banyak permintaan reset password, coba lagi nanti." },
  },
});

export const resendVerificationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Terlalu banyak permintaan kirim ulang verifikasi, coba lagi nanti." },
  },
});

/** Rate limiter umum untuk seluruh API, jaring pengaman tambahan. */
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
