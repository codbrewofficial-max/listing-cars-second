import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { parsePagination, buildMeta } from "../../utils/pagination";
import {
  cancelTransactionService,
  createTransactionService,
  disputeTransactionService,
  getApprovalQueueService,
  getTransactionDetailService,
  listMyTransactionsService,
  listTransactionsService,
  releaseTransactionService,
  resolveTransactionService,
  uploadPaymentProofService,
  verifyPaymentService,
} from "./transactions.service";

export const createTransactionHandler = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await createTransactionService({
    buyerId: req.user!.id,
    buyerRole: req.user!.role,
    productType: req.body.product_type,
    productId: req.body.product_id,
    quantity: req.body.quantity,
  });
  return sendSuccess(res, { transaction }, 201);
});

export const listTransactionsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, perPage, offset } = parsePagination(req, ["created_at"]);
  const { status, product_type } = req.query as { status?: string; product_type?: string };
  const { data, total } = await listTransactionsService({
    status,
    productType: product_type,
    limit: perPage,
    offset,
  });
  return sendSuccess(res, data, 200, buildMeta(page, perPage, total));
});

export const listMyTransactionsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, perPage, offset } = parsePagination(req, ["created_at"]);
  const { status } = req.query as { status?: string };
  const { data, total } = await listMyTransactionsService({
    buyerId: req.user!.id,
    status,
    limit: perPage,
    offset,
  });
  return sendSuccess(res, data, 200, buildMeta(page, perPage, total));
});

export const getTransactionHandler = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await getTransactionDetailService({
    id: req.params.id,
    requester: { id: req.user!.id, role: req.user!.role },
  });
  return sendSuccess(res, { transaction });
});

export const uploadPaymentProofHandler = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await uploadPaymentProofService({
    transactionId: req.params.id,
    mediaAssetId: req.body.media_asset_id,
    buyerId: req.user!.id,
    buyerRole: req.user!.role,
  });
  return sendSuccess(res, { transaction });
});

export const verifyPaymentHandler = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await verifyPaymentService({
    transactionId: req.params.id,
    approved: req.body.approved,
    notes: req.body.notes,
    actor: { id: req.user!.id, role: req.user!.role },
  });
  return sendSuccess(res, { transaction });
});

export const getApprovalQueueHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, perPage, offset } = parsePagination(req, ["created_at"]);
  const { data, total } = await getApprovalQueueService({ limit: perPage, offset });
  return sendSuccess(res, data, 200, buildMeta(page, perPage, total));
});

export const releaseTransactionHandler = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await releaseTransactionService({
    transactionId: req.params.id,
    notes: req.body.notes,
    actor: { id: req.user!.id, role: req.user!.role },
  });
  return sendSuccess(res, { transaction });
});

export const disputeTransactionHandler = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await disputeTransactionService({
    transactionId: req.params.id,
    disputeReason: req.body.dispute_reason,
    actor: { id: req.user!.id, role: req.user!.role },
  });
  return sendSuccess(res, { transaction });
});

export const resolveTransactionHandler = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await resolveTransactionService({
    transactionId: req.params.id,
    resolution: req.body.resolution,
    notes: req.body.notes,
    actor: { id: req.user!.id, role: req.user!.role },
  });
  return sendSuccess(res, { transaction });
});

export const cancelTransactionHandler = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await cancelTransactionService({
    transactionId: req.params.id,
    reason: req.body.reason,
    actor: { id: req.user!.id, role: req.user!.role },
  });
  return sendSuccess(res, { transaction });
});
