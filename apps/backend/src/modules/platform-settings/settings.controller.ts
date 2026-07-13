import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import {
  getAllSettingsService,
  getPublicSettingsService,
  toggleRegistrationService,
  updateSettingService,
} from "./settings.service";

export const getPublicSettingsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getPublicSettingsService();
  return sendSuccess(res, data);
});

export const getAllSettingsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getAllSettingsService();
  return sendSuccess(res, { data });
});

export const updateSettingHandler = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;
  const { value } = req.body;
  const setting = await updateSettingService({
    key,
    value,
    actorId: req.user!.id,
    actorRole: req.user!.role,
  });
  return sendSuccess(res, { setting });
});

export const toggleRegistrationHandler = asyncHandler(async (req: Request, res: Response) => {
  const { registration_open } = req.body;
  const setting = await toggleRegistrationService({
    registrationOpen: registration_open,
    actorId: req.user!.id,
    actorRole: req.user!.role,
  });
  return sendSuccess(res, { setting });
});
