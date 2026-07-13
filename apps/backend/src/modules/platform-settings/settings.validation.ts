import { z } from "zod";

export const updateSettingSchema = z.object({
  value: z.unknown(),
});

export const toggleRegistrationSchema = z.object({
  registration_open: z.boolean(),
});

export const settingKeyParamSchema = z.object({
  key: z.string().min(1).max(100),
});
