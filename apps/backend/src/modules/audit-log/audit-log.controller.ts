import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { parsePagination, buildMeta } from "../../utils/pagination";
import { getAuditLogDetailService, listAuditLogsService } from "./audit-log.service";

export const listAuditLogsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, perPage, offset } = parsePagination(req, ["created_at"]);
  const { actor_id, target_entity, target_id, date_from, date_to } = req.query as Record<
    string,
    string | undefined
  >;
  const { data, total } = await listAuditLogsService({
    actorId: actor_id,
    targetEntity: target_entity,
    targetId: target_id,
    dateFrom: date_from,
    dateTo: date_to,
    limit: perPage,
    offset,
  });
  return sendSuccess(res, data, 200, buildMeta(page, perPage, total));
});

export const getAuditLogHandler = asyncHandler(async (req: Request, res: Response) => {
  const auditLog = await getAuditLogDetailService(req.params.id);
  return sendSuccess(res, { audit_log: auditLog });
});
