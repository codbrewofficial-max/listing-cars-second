import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { parsePagination, buildMeta } from "../../utils/pagination";
import { getLeadDetailService, listLeadsService, submitLeadService } from "./leads.service";

export const submitLeadHandler = asyncHandler(async (req: Request, res: Response) => {
  const lead = await submitLeadService({
    source: req.body.source,
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    message: req.body.message,
    relatedProductType: req.body.related_product_type,
    relatedProductId: req.body.related_product_id,
  });
  return sendSuccess(res, { lead }, 201);
});

export const listLeadsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, perPage, offset } = parsePagination(req, ["created_at"]);
  const { source, date_from, date_to } = req.query as Record<string, string | undefined>;
  const { data, total } = await listLeadsService({
    source,
    dateFrom: date_from,
    dateTo: date_to,
    limit: perPage,
    offset,
  });
  return sendSuccess(res, data, 200, buildMeta(page, perPage, total));
});

export const getLeadHandler = asyncHandler(async (req: Request, res: Response) => {
  const lead = await getLeadDetailService(req.params.id);
  return sendSuccess(res, { lead });
});
