import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { parsePagination, buildMeta } from "../../utils/pagination";
import {
  addVisitPhotoService,
  createVisitRequestService,
  getVisitRequestDetailService,
  listMyVisitRequestsService,
  listVisitPhotosService,
  listVisitRequestsService,
  moderateVisitPhotoService,
  scheduleVisitRequestService,
  updateVisitRequestStatusService,
} from "./visits.service";

export const createVisitRequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const visitRequest = await createVisitRequestService({
    vehicleId: req.params.id,
    customerId: req.user!.id,
    notes: req.body.notes,
  });
  return sendSuccess(res, { visit_request: visitRequest }, 201);
});

export const listVisitRequestsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, perPage, offset } = parsePagination(req, ["created_at"]);
  const { status, vehicle_id } = req.query as { status?: string; vehicle_id?: string };
  const { data, total } = await listVisitRequestsService({
    status,
    vehicleId: vehicle_id,
    limit: perPage,
    offset,
  });
  return sendSuccess(res, data, 200, buildMeta(page, perPage, total));
});

export const listMyVisitRequestsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, perPage, offset } = parsePagination(req, ["created_at"]);
  const { status } = req.query as { status?: string };
  const { data, total } = await listMyVisitRequestsService({
    customerId: req.user!.id,
    status,
    limit: perPage,
    offset,
  });
  return sendSuccess(res, data, 200, buildMeta(page, perPage, total));
});

export const getVisitRequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await getVisitRequestDetailService({
    id: req.params.id,
    requester: { id: req.user!.id, role: req.user!.role },
  });
  return sendSuccess(res, result);
});

export const scheduleVisitRequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const visitRequest = await scheduleVisitRequestService({
    id: req.params.id,
    scheduledAt: req.body.scheduled_at,
    location: req.body.location,
    adminId: req.body.admin_id ?? req.user!.id,
    actor: { id: req.user!.id, role: req.user!.role },
  });
  return sendSuccess(res, { visit_request: visitRequest });
});

export const updateVisitRequestStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const visitRequest = await updateVisitRequestStatusService({
    id: req.params.id,
    status: req.body.status,
    notes: req.body.notes,
    actor: { id: req.user!.id, role: req.user!.role },
  });
  return sendSuccess(res, { visit_request: visitRequest });
});

export const addVisitPhotoHandler = asyncHandler(async (req: Request, res: Response) => {
  const photo = await addVisitPhotoService({
    visitRequestId: req.params.id,
    mediaAssetId: req.body.media_asset_id,
    uploader: { id: req.user!.id, role: req.user!.role },
  });
  return sendSuccess(res, { visit_photo: photo }, 201);
});

export const listVisitPhotosForRequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listVisitPhotosService({
    visitRequestId: req.params.id,
    requester: { id: req.user!.id, role: req.user!.role },
  });
  return sendSuccess(res, { data });
});

export const moderateVisitPhotoHandler = asyncHandler(async (req: Request, res: Response) => {
  const photo = await moderateVisitPhotoService({
    photoId: req.params.photoId,
    moderationStatus: req.body.moderation_status,
    actor: { id: req.user!.id, role: req.user!.role },
  });
  return sendSuccess(res, { visit_photo: photo });
});
