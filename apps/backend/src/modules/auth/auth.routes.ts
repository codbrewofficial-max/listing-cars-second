import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { authenticate } from "./authenticate.middleware";
import {
  forgotPasswordRateLimiter,
  loginRateLimiter,
  resendVerificationRateLimiter,
} from "../../middlewares/rateLimiter";
import {
  changePasswordHandler,
  forgotPasswordHandler,
  getMeHandler,
  loginHandler,
  logoutHandler,
  refreshTokenHandler,
  registerHandler,
  resendVerificationHandler,
  resetPasswordHandler,
  updateMeHandler,
  verifyEmailHandler,
} from "./auth.controller";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  updateMeSchema,
  verifyEmailSchema,
} from "./auth.validation";

const router = Router();

router.post("/register", validate({ body: registerSchema }), registerHandler);
router.post("/login", loginRateLimiter, validate({ body: loginSchema }), loginHandler);
router.post("/refresh-token", validate({ body: refreshTokenSchema }), refreshTokenHandler);
router.post("/logout", authenticate, validate({ body: logoutSchema }), logoutHandler);
router.post(
  "/forgot-password",
  forgotPasswordRateLimiter,
  validate({ body: forgotPasswordSchema }),
  forgotPasswordHandler
);
router.post("/reset-password", validate({ body: resetPasswordSchema }), resetPasswordHandler);
router.post("/verify-email", validate({ body: verifyEmailSchema }), verifyEmailHandler);
router.post(
  "/resend-verification",
  resendVerificationRateLimiter,
  validate({ body: resendVerificationSchema }),
  resendVerificationHandler
);

router.get("/me", authenticate, getMeHandler);
router.patch("/me", authenticate, validate({ body: updateMeSchema }), updateMeHandler);
router.patch("/me/password", authenticate, validate({ body: changePasswordSchema }), changePasswordHandler);

export default router;
