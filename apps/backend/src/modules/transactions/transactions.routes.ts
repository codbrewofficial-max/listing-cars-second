import { Router } from "express";
import { authenticate } from "../auth/authenticate.middleware";
import { authorize } from "../auth/authorize.middleware";
import { validate } from "../../middlewares/validate";
import {
  cancelTransactionHandler,
  createTransactionHandler,
  disputeTransactionHandler,
  getApprovalQueueHandler,
  getTransactionHandler,
  listMyTransactionsHandler,
  listTransactionsHandler,
  releaseTransactionHandler,
  resolveTransactionHandler,
  uploadPaymentProofHandler,
  verifyPaymentHandler,
} from "./transactions.controller";
import {
  cancelSchema,
  createTransactionSchema,
  disputeSchema,
  listMyTransactionsQuerySchema,
  listTransactionsQuerySchema,
  paymentProofSchema,
  releaseSchema,
  resolveSchema,
  transactionIdParamSchema,
  verifyPaymentSchema,
} from "./transactions.validation";

// ---- Dipasang di /api/transactions ----
const router = Router();

// POST /api/transactions - Customer
router.post(
  "/",
  authenticate,
  authorize("customer"),
  validate({ body: createTransactionSchema }),
  createTransactionHandler
);

// GET /api/transactions - Owner, Admin, Super Admin
router.get(
  "/",
  authenticate,
  authorize("owner", "admin", "super_admin"),
  validate({ query: listTransactionsQuerySchema }),
  listTransactionsHandler
);

// GET /api/transactions/approval-queue - Owner
// Didaftarkan SEBELUM /:id agar "approval-queue" tidak tertangkap sebagai :id
router.get(
  "/approval-queue",
  authenticate,
  authorize("owner"),
  getApprovalQueueHandler
);

// GET /api/transactions/:id - Owner, Admin, Customer (pemilik, dicek di service)
router.get(
  "/:id",
  authenticate,
  validate({ params: transactionIdParamSchema }),
  getTransactionHandler
);

// POST /api/transactions/:id/payment-proof - Customer
router.post(
  "/:id/payment-proof",
  authenticate,
  authorize("customer"),
  validate({ params: transactionIdParamSchema, body: paymentProofSchema }),
  uploadPaymentProofHandler
);

// PATCH /api/transactions/:id/verify-payment - Admin
router.patch(
  "/:id/verify-payment",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ params: transactionIdParamSchema, body: verifyPaymentSchema }),
  verifyPaymentHandler
);

// PATCH /api/transactions/:id/release - Owner
router.patch(
  "/:id/release",
  authenticate,
  authorize("owner"),
  validate({ params: transactionIdParamSchema, body: releaseSchema }),
  releaseTransactionHandler
);

// PATCH /api/transactions/:id/dispute - Customer, Admin
router.patch(
  "/:id/dispute",
  authenticate,
  authorize("customer", "admin", "super_admin"),
  validate({ params: transactionIdParamSchema, body: disputeSchema }),
  disputeTransactionHandler
);

// PATCH /api/transactions/:id/resolve - Owner
router.patch(
  "/:id/resolve",
  authenticate,
  authorize("owner"),
  validate({ params: transactionIdParamSchema, body: resolveSchema }),
  resolveTransactionHandler
);

// PATCH /api/transactions/:id/cancel - Customer (sebelum bayar), Admin
router.patch(
  "/:id/cancel",
  authenticate,
  authorize("customer", "admin", "super_admin"),
  validate({ params: transactionIdParamSchema, body: cancelSchema }),
  cancelTransactionHandler
);

export default router;

// ---- Dipasang di /api/me/transactions ----
export const myTransactionsRouter = Router();

myTransactionsRouter.get(
  "/",
  authenticate,
  authorize("customer"),
  validate({ query: listMyTransactionsQuerySchema }),
  listMyTransactionsHandler
);
