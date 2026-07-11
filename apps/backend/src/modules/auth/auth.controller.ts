import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import {
  changePasswordService,
  forgotPasswordService,
  getMeService,
  loginService,
  logoutService,
  refreshTokenService,
  registerService,
  resendVerificationService,
  resetPasswordService,
  updateMeService,
  verifyEmailService,
} from "./auth.service";

function clientMeta(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers["user-agent"] ?? null };
}

export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await registerService(req.body);
  return sendSuccess(res, result, 201);
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { ip, userAgent } = clientMeta(req);
  const result = await loginService({ ...req.body, ip, userAgent: userAgent as string | null });
  return sendSuccess(res, result);
});

export const refreshTokenHandler = asyncHandler(async (req: Request, res: Response) => {
  const { ip, userAgent } = clientMeta(req);
  const result = await refreshTokenService({
    refreshToken: req.body.refresh_token,
    ip,
    userAgent: userAgent as string | null,
  });
  return sendSuccess(res, result);
});

export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await logoutService(req.user!.id, req.body?.refresh_token);
  return sendSuccess(res, result);
});

export const forgotPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await forgotPasswordService(req.body.email);
  return sendSuccess(res, result);
});

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await resetPasswordService({ token: req.body.token, newPassword: req.body.new_password });
  return sendSuccess(res, result);
});

export const verifyEmailHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await verifyEmailService(req.body.token);
  return sendSuccess(res, result);
});

export const resendVerificationHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await resendVerificationService(req.body.email);
  return sendSuccess(res, result);
});

export const getMeHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await getMeService(req.user!.id);
  return sendSuccess(res, { user });
});

export const updateMeHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await updateMeService(req.user!.id, req.body);
  return sendSuccess(res, { user });
});

export const changePasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await changePasswordService({
    userId: req.user!.id,
    oldPassword: req.body.old_password,
    newPassword: req.body.new_password,
  });
  return sendSuccess(res, result);
});
