import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { parsePagination, buildMeta } from "../../utils/pagination";
import {
  listNotificationsService,
  markAllNotificationsReadService,
  markNotificationReadService,
} from "./notifications.service";

export const listNotificationsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, perPage, offset } = parsePagination(req, ["created_at"]);
  const isReadRaw = req.query.is_read as string | undefined;
  const { data, total, unreadCount } = await listNotificationsService({
    userId: req.user!.id,
    isRead: isReadRaw === undefined ? undefined : isReadRaw === "true",
    limit: perPage,
    offset,
  });
  return sendSuccess(res, data, 200, { ...buildMeta(page, perPage, total), unread_count: unreadCount });
});

export const markNotificationReadHandler = asyncHandler(async (req: Request, res: Response) => {
  const notification = await markNotificationReadService({ id: req.params.id, userId: req.user!.id });
  return sendSuccess(res, { notification });
});

export const markAllNotificationsReadHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await markAllNotificationsReadService(req.user!.id);
  return sendSuccess(res, result);
});
