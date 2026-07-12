import { z } from "zod";

export const notificationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listNotificationsQuerySchema = z.object({
  is_read: z.enum(["true", "false"]).optional(),
  page: z.string().optional(),
  per_page: z.string().optional(),
});
