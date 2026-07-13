import { z } from "zod";

export const transactionIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const createTransactionSchema = z.object({
  product_type: z.enum(["vehicle", "spare_part"]),
  product_id: z.string().uuid(),
  quantity: z.coerce.number().int().positive().optional(),
});

export const listTransactionsQuerySchema = z.object({
  status: z
    .enum([
      "pending_payment",
      "payment_verified",
      "funds_held",
      "released_to_seller",
      "disputed",
      "resolved",
      "cancelled",
      "refunded",
    ])
    .optional(),
  product_type: z.enum(["vehicle", "spare_part"]).optional(),
  page: z.string().optional(),
  per_page: z.string().optional(),
});

export const listMyTransactionsQuerySchema = z.object({
  status: z
    .enum([
      "pending_payment",
      "payment_verified",
      "funds_held",
      "released_to_seller",
      "disputed",
      "resolved",
      "cancelled",
      "refunded",
    ])
    .optional(),
  page: z.string().optional(),
  per_page: z.string().optional(),
});

export const paymentProofSchema = z.object({
  media_asset_id: z.string().uuid(),
});

export const verifyPaymentSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
});

export const releaseSchema = z.object({
  notes: z.string().optional(),
});

export const disputeSchema = z.object({
  dispute_reason: z.string().min(1).max(2000),
});

export const resolveSchema = z.object({
  resolution: z.enum(["released", "refunded", "cancelled"]),
  notes: z.string().min(1),
});

export const cancelSchema = z.object({
  reason: z.string().optional(),
});
