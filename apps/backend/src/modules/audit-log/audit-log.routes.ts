import { Router } from "express";
import { authenticate } from "../auth/authenticate.middleware";
import { authorize } from "../auth/authorize.middleware";
import { validate } from "../../middlewares/validate";
import { getAuditLogHandler, listAuditLogsHandler } from "./audit-log.controller";
import { auditLogIdParamSchema, listAuditLogsQuerySchema } from "./audit-log.validation";

const router = Router();

// Default sementara sesuai 04-catatan-open-decision.md §6: akses Super Admin only.
// (Akses Owner untuk transaksi tanggung jawabnya belum diputuskan — lihat catatan yang sama.)
router.use(authenticate, authorize("super_admin"));

// GET /api/audit-logs
router.get("/", validate({ query: listAuditLogsQuerySchema }), listAuditLogsHandler);

// GET /api/audit-logs/:id
router.get("/:id", validate({ params: auditLogIdParamSchema }), getAuditLogHandler);

export default router;
