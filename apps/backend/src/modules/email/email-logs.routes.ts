import { Router } from "express";
import { authenticate } from "../auth/authenticate.middleware";
import { authorize } from "../auth/authorize.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { getUsageTodayService, listEmailLogsService } from "./email.service";
import { parsePagination, buildMeta } from "../../utils/pagination";

const router = Router();

// GET /api/email-logs - Super Admin
router.get(
  "/",
  authenticate,
  authorize("super_admin"),
  asyncHandler(async (req, res) => {
    const { page, perPage, offset } = parsePagination(req, ["created_at"]);
    const { purpose, status, date_from, date_to } = req.query as Record<string, string | undefined>;
    const { data, total } = await listEmailLogsService({
      purpose,
      status,
      dateFrom: date_from,
      dateTo: date_to,
      limit: perPage,
      offset,
    });
    return sendSuccess(res, data, 200, buildMeta(page, perPage, total));
  })
);

// GET /api/email-logs/usage-today - Super Admin, Owner
router.get(
  "/usage-today",
  authenticate,
  authorize("super_admin", "owner"),
  asyncHandler(async (_req, res) => {
    const data = await getUsageTodayService();
    return sendSuccess(res, data);
  })
);

export default router;
