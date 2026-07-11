import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { parsePagination, buildMeta } from "../../utils/pagination";
import {
  addVehiclePhotoService,
  createVehicleService,
  deleteVehiclePhotoService,
  deleteVehicleService,
  getAdminVehicleService,
  getPublicVehicleDetailService,
  listAdminVehiclesService,
  listPublicVehiclesService,
  listVehiclePhotosService,
  updateDocumentStatusService,
  updateVehiclePhotoService,
  updateVehicleService,
  updateVehicleStatusService,
} from "./vehicles.service";

const SORT_COLUMNS = ["created_at", "price", "year"];

function parseVehicleFilters(req: Request) {
  const q = req.query as Record<string, string | undefined>;
  return {
    brand: q.brand,
    model: q.model,
    minPrice: q.min_price ? Number(q.min_price) : undefined,
    maxPrice: q.max_price ? Number(q.max_price) : undefined,
    year: q.year ? Number(q.year) : undefined,
    location: q.location,
    documentStatus: q.document_status,
  };
}

export const listPublicVehiclesHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, perPage, offset, sortColumn, sortDirection } = parsePagination(req, SORT_COLUMNS);
  const { data, total } = await listPublicVehiclesService({
    ...parseVehicleFilters(req),
    limit: perPage,
    offset,
    sortColumn,
    sortDirection,
  });
  return sendSuccess(res, data, 200, buildMeta(page, perPage, total));
});

export const listAdminVehiclesHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, perPage, offset, sortColumn, sortDirection } = parsePagination(req, SORT_COLUMNS);
  const status = (req.query.status as string | undefined) ?? undefined;
  const { data, total } = await listAdminVehiclesService({
    ...parseVehicleFilters(req),
    status,
    limit: perPage,
    offset,
    sortColumn,
    sortDirection,
  });
  return sendSuccess(res, data, 200, buildMeta(page, perPage, total));
});

export const getPublicVehicleHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await getPublicVehicleDetailService(req.params.id);
  return sendSuccess(res, result);
});

export const getAdminVehicleHandler = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await getAdminVehicleService(req.params.id);
  return sendSuccess(res, { vehicle });
});

export const createVehicleHandler = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await createVehicleService({
    sellerId: req.user!.id,
    actorRole: req.user!.role,
    ...req.body,
  });
  return sendSuccess(res, { vehicle }, 201);
});

export const updateVehicleHandler = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await updateVehicleService(req.params.id, req.body, {
    id: req.user!.id,
    role: req.user!.role,
  });
  return sendSuccess(res, { vehicle });
});

export const updateVehicleStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await updateVehicleStatusService(req.params.id, req.body.status, {
    id: req.user!.id,
    role: req.user!.role,
  });
  return sendSuccess(res, { vehicle });
});

export const updateDocumentStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await updateDocumentStatusService({
    id: req.params.id,
    documentStatus: req.body.document_status,
    verificationChecklist: req.body.verification_checklist,
    actor: { id: req.user!.id, role: req.user!.role },
  });
  return sendSuccess(res, { vehicle });
});

export const deleteVehicleHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await deleteVehicleService(req.params.id, { id: req.user!.id, role: req.user!.role });
  return sendSuccess(res, result);
});

export const listVehiclePhotosHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listVehiclePhotosService(req.params.id);
  return sendSuccess(res, { data });
});

export const addVehiclePhotoHandler = asyncHandler(async (req: Request, res: Response) => {
  const photo = await addVehiclePhotoService({
    vehicleId: req.params.id,
    mediaAssetId: req.body.media_asset_id,
    isCover: req.body.is_cover,
    sortOrder: req.body.sort_order,
    actor: { id: req.user!.id, role: req.user!.role },
  });
  return sendSuccess(res, { photo }, 201);
});

export const updateVehiclePhotoHandler = asyncHandler(async (req: Request, res: Response) => {
  const photo = await updateVehiclePhotoService({
    vehicleId: req.params.id,
    photoId: req.params.photoId,
    fields: req.body,
  });
  return sendSuccess(res, { photo });
});

export const deleteVehiclePhotoHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await deleteVehiclePhotoService({
    vehicleId: req.params.id,
    photoId: req.params.photoId,
    actor: { id: req.user!.id, role: req.user!.role },
  });
  return sendSuccess(res, result);
});
