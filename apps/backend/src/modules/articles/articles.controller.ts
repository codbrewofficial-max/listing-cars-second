import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { parsePagination, buildMeta } from "../../utils/pagination";
import {
  createArticleService,
  deleteArticleService,
  getAdminArticleService,
  getPublicArticleBySlugService,
  listAdminArticlesService,
  listPublicArticlesService,
  updateArticleService,
  updateArticleStatusService,
} from "./articles.service";

const SORT_COLUMNS = ["created_at", "published_at", "title"];

export const listPublicArticlesHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, perPage, offset, sortColumn, sortDirection } = parsePagination(req, SORT_COLUMNS);
  const { category, search } = req.query as Record<string, string | undefined>;
  const { data, total } = await listPublicArticlesService({
    category,
    search,
    limit: perPage,
    offset,
    sortColumn,
    sortDirection,
  });
  return sendSuccess(res, data, 200, buildMeta(page, perPage, total));
});

export const getPublicArticleHandler = asyncHandler(async (req: Request, res: Response) => {
  const article = await getPublicArticleBySlugService(req.params.slug);
  return sendSuccess(res, { article });
});

export const listAdminArticlesHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, perPage, offset, sortColumn, sortDirection } = parsePagination(req, SORT_COLUMNS);
  const { category, search, status } = req.query as Record<string, string | undefined>;
  const { data, total } = await listAdminArticlesService({
    category,
    search,
    status,
    limit: perPage,
    offset,
    sortColumn,
    sortDirection,
  });
  return sendSuccess(res, data, 200, buildMeta(page, perPage, total));
});

export const getAdminArticleHandler = asyncHandler(async (req: Request, res: Response) => {
  const article = await getAdminArticleService(req.params.id);
  return sendSuccess(res, { article });
});

export const createArticleHandler = asyncHandler(async (req: Request, res: Response) => {
  const article = await createArticleService({
    ...req.body,
    authorId: req.user!.id,
    actorRole: req.user!.role,
  });
  return sendSuccess(res, { article }, 201);
});

export const updateArticleHandler = asyncHandler(async (req: Request, res: Response) => {
  const article = await updateArticleService(req.params.id, req.body, {
    id: req.user!.id,
    role: req.user!.role,
  });
  return sendSuccess(res, { article });
});

export const updateArticleStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const article = await updateArticleStatusService(req.params.id, req.body.status, {
    id: req.user!.id,
    role: req.user!.role,
  });
  return sendSuccess(res, { article });
});

export const deleteArticleHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await deleteArticleService(req.params.id, { id: req.user!.id, role: req.user!.role });
  return sendSuccess(res, result);
});
