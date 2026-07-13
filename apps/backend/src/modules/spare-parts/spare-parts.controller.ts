import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { parsePagination, buildMeta } from "../../utils/pagination";
import {
  addSparePartPhotoService,
  createSparePartService,
  deleteSparePartPhotoService,
  deleteSparePartService,
  getAdminSparePartService,
  getPublicSparePartDetailService,
  listAdminSparePartsService,
  listPublicSparePartsService,
  listSparePartPhotosService,
  updateSparePartService,
  updateSparePartStatusService,
} from "./spare-parts.service";

const SORT_COLUMNS = ["created_at", "price"];

function parseFilters(req: Request) {
  const q = req.query as Record<string, string | undefined>;
  return {
    category: q.category,
    condition: q.condition,
    minPrice: q.min_price ? Number(q.min_price) : undefined,
    maxPrice: q.max_price ? Number(q.max_price) : undefined,
    search: q.search,
  };
}

export const listPublicSparePartsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, perPage, offset, sortColumn, sortDirection } = parsePagination(req, SORT_COLUMNS);
  const { data, total } = await listPublicSparePartsService({
    ...parseFilters(req),
    limit: perPage,
    offset,
    sortColumn,
    sortDirection,
  });
  return sendSuccess(res, data, 200, buildMeta(page, perPage, total));
});

export const listAdminSparePartsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, perPage, offset, sortColumn, sortDirection } = parsePagination(req, SORT_COLUMNS);
  const status = (req.query.status as string | undefined) ?? undefined;
  const { data, total } = await listAdminSparePartsService({
    ...parseFilters(req),
    status,
    limit: perPage,
    offset,
    sortColumn,
    sortDirection,
  });
  return sendSuccess(res, data, 200, buildMeta(page, perPage, total));
});

export const getPublicSparePartHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await getPublicSparePartDetailService(req.params.id);
  return sendSuccess(res, result);
});

export const getAdminSparePartHandler = asyncHandler(async (req: Request, res: Response) => {
  const sparePart = await getAdminSparePartService(req.params.id);
  return sendSuccess(res, { spare_part: sparePart });
});

export const createSparePartHandler = asyncHandler(async (req: Request, res: Response) => {
  const sparePart = await createSparePartService({
    sellerId: req.user!.id,
    actorRole: req.user!.role,
    ...req.body,
  });
  return sendSuccess(res, { spare_part: sparePart }, 201);
});

export const updateSparePartHandler = asyncHandler(async (req: Request, res: Response) => {
  const sparePart = await updateSparePartService(req.params.id, req.body, {
    id: req.user!.id,
    role: req.user!.role,
  });
  return sendSuccess(res, { spare_part: sparePart });
});

export const updateSparePartStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const sparePart = await updateSparePartStatusService(req.params.id, req.body.status, {
    id: req.user!.id,
    role: req.user!.role,
  });
  return sendSuccess(res, { spare_part: sparePart });
});

export const deleteSparePartHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await deleteSparePartService(req.params.id, { id: req.user!.id, role: req.user!.role });
  return sendSuccess(res, result);
});

export const listSparePartPhotosHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listSparePartPhotosService(req.params.id);
  return sendSuccess(res, { data });
});

export const addSparePartPhotoHandler = asyncHandler(async (req: Request, res: Response) => {
  const photo = await addSparePartPhotoService({
    sparePartId: req.params.id,
    mediaAssetId: req.body.media_asset_id,
    isCover: req.body.is_cover,
    sortOrder: req.body.sort_order,
    actor: { id: req.user!.id, role: req.user!.role },
  });
  return sendSuccess(res, { photo }, 201);
});

export const deleteSparePartPhotoHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await deleteSparePartPhotoService({
    sparePartId: req.params.id,
    photoId: req.params.photoId,
    actor: { id: req.user!.id, role: req.user!.role },
  });
  return sendSuccess(res, result);
});
