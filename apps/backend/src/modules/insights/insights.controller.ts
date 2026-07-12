import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { getLeadsReportService, getOverviewService, getTransactionsReportService } from "./insights.service";

function parseDateRange(req: Request) {
  const { date_from, date_to } = req.query as Record<string, string | undefined>;
  return { dateFrom: date_from, dateTo: date_to };
}

export const getOverviewHandler = asyncHandler(async (req: Request, res: Response) => {
  const summary = await getOverviewService(parseDateRange(req));
  return sendSuccess(res, { summary });
});

export const getLeadsReportHandler = asyncHandler(async (req: Request, res: Response) => {
  const { group_by } = req.query as Record<string, string | undefined>;
  const result = await getLeadsReportService({ ...parseDateRange(req), groupBy: group_by });
  return sendSuccess(res, result);
});

export const getTransactionsReportHandler = asyncHandler(async (req: Request, res: Response) => {
  const { group_by } = req.query as Record<string, string | undefined>;
  const result = await getTransactionsReportService({ ...parseDateRange(req), groupBy: group_by });
  return sendSuccess(res, result);
});
