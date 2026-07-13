import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { parsePagination, buildMeta } from "../../utils/pagination";
import {
  adminResetPasswordService,
  createUserService,
  deleteUserService,
  getUserService,
  listUsersService,
  updateUserService,
} from "./users.service";

export const listUsersHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, perPage, offset } = parsePagination(req, ["created_at", "name", "email"]);
  const { role, is_active, search } = req.query as { role?: string; is_active?: string; search?: string };
  const { data, total } = await listUsersService({
    role,
    isActive: is_active === undefined ? undefined : is_active === "true",
    search,
    limit: perPage,
    offset,
  });
  return sendSuccess(res, data, 200, buildMeta(page, perPage, total));
});

export const getUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserService(req.params.id);
  return sendSuccess(res, { user });
});

export const createUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await createUserService({ ...req.body, actorId: req.user!.id, actorRole: req.user!.role });
  return sendSuccess(res, { user }, 201);
});

export const updateUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await updateUserService(req.params.id, req.body, { id: req.user!.id, role: req.user!.role });
  return sendSuccess(res, { user });
});

export const deleteUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await deleteUserService(req.params.id, { id: req.user!.id, role: req.user!.role });
  return sendSuccess(res, result);
});

export const adminResetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminResetPasswordService({
    targetUserId: req.params.id,
    newPassword: req.body.new_password,
    actorId: req.user!.id,
    actorRole: req.user!.role,
  });
  return sendSuccess(res, result);
});
