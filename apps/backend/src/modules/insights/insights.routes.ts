import { Router } from "express";
import { authenticate } from "../auth/authenticate.middleware";
import { authorize } from "../auth/authorize.middleware";
import { getLeadsReportHandler, getOverviewHandler, getTransactionsReportHandler } from "./insights.controller";

const router = Router();

// Semua endpoint di bawah khusus Owner, Super Admin (05-api-endpoints-mvp.md §11)
router.use(authenticate, authorize("owner", "super_admin"));

router.get("/overview", getOverviewHandler);
router.get("/leads-report", getLeadsReportHandler);
router.get("/transactions-report", getTransactionsReportHandler);

export default router;
