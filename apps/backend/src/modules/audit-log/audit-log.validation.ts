import { z } from "zod";

export const auditLogIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listAuditLogsQuerySchema = z.object({
  actor_id: z.string().uuid().optional(),
  target_entity: z.string().optional(),
  target_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.string().optional(),
  per_page: z.string().optional(),
});
