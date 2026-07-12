import { ApiError } from "../../utils/ApiError";
import { recordAuditLog } from "../audit-log/audit-log.service";
import { findMediaAssetById } from "../media/media.repository";
import { findVehicleById } from "../vehicles/vehicles.repository";
import { findSparePartById } from "../spare-parts/spare-parts.repository";
import { createNotificationService, createNotificationForManyService } from "../notifications/notifications.service";
import { listUsers } from "../auth/auth.repository";
import {
  findTransactionById,
  insertTransaction,
  listTransactions,
  setPaymentProof,
  updateTransactionStatus,
  type TransactionRow,
} from "./transactions.repository";

/**
 * MODUL 5 — ALUR STATUS TRANSAKSI (ESCROW-LITE), sesuai kesepakatan sebelum coding:
 *
 *   pending_payment --(Customer upload bukti + Admin verify-payment approved)--> funds_held
 *   funds_held --(Owner release)--> released_to_seller
 *   funds_held --(Customer/Admin dispute)--> disputed
 *   disputed --(Owner resolve)--> released_to_seller | refunded | cancelled   (LANGSUNG ke status final,
 *                                                                              nilai enum 'resolved' tidak dipakai)
 *   pending_payment --(Customer sebelum funds_held, atau Admin)--> cancelled
 *
 * Setiap transisi WAJIB tercatat ke audit_logs (03-rbac-alur-admin.md §4) — dilakukan di service
 * ini, menempel di titik transisi, bukan ditambahkan belakangan.
 *
 * payment_gateway_ref sengaja tidak pernah diisi/dipakai logic apa pun di modul ini (reserved Fase 2).
 */

async function getOwnerUserIds(): Promise<string[]> {
  const { data } = await listUsers({ role: "owner", isActive: true, limit: 100, offset: 0 });
  return data.map((u) => u.id);
}

async function getProductForTransaction(productType: string, productId: string) {
  if (productType === "vehicle") {
    const vehicle = await findVehicleById(productId);
    if (!vehicle || vehicle.status !== "published") {
      throw ApiError.notFound("Kendaraan tidak ditemukan atau sudah tidak tersedia");
    }
    return { price: Number(vehicle.price), sellerId: vehicle.seller_id };
  }
  const sparePart = await findSparePartById(productId);
  if (!sparePart || sparePart.status !== "published") {
    throw ApiError.notFound("Suku cadang tidak ditemukan atau sudah tidak tersedia");
  }
  return { price: Number(sparePart.price), sellerId: sparePart.seller_id };
}

export async function createTransactionService(params: {
  buyerId: string;
  buyerRole: string;
  productType: string;
  productId: string;
  quantity?: number;
}) {
  const quantity = params.quantity ?? 1;
  if (params.productType === "vehicle" && quantity !== 1) {
    throw ApiError.badRequest("Quantity untuk kendaraan harus 1");
  }

  const product = await getProductForTransaction(params.productType, params.productId);
  const amount = product.price * quantity;

  const transaction = await insertTransaction({
    productType: params.productType,
    productId: params.productId,
    quantity,
    buyerId: params.buyerId,
    sellerId: product.sellerId,
    amount,
  });

  await recordAuditLog({
    actorId: params.buyerId,
    actorRole: params.buyerRole,
    actionType: "create_transaction",
    targetEntity: "transactions",
    targetId: transaction.id,
    metadata: { product_type: params.productType, product_id: params.productId, amount },
  });

  return transaction;
}

export async function listTransactionsService(filters: {
  status?: string;
  productType?: string;
  limit: number;
  offset: number;
}) {
  return listTransactions(filters);
}

export async function listMyTransactionsService(params: {
  buyerId: string;
  status?: string;
  limit: number;
  offset: number;
}) {
  return listTransactions({ status: params.status, buyerId: params.buyerId, limit: params.limit, offset: params.offset });
}

async function assertTransactionAccess(transaction: TransactionRow, requester: { id: string; role: string }) {
  const isStaff = ["admin", "owner", "super_admin"].includes(requester.role);
  const isOwnerOfTransaction = transaction.buyer_id === requester.id;
  if (!isStaff && !isOwnerOfTransaction) {
    throw ApiError.forbidden("Anda tidak memiliki akses ke transaksi ini");
  }
}

export async function getTransactionDetailService(params: { id: string; requester: { id: string; role: string } }) {
  const transaction = await findTransactionById(params.id);
  if (!transaction) throw ApiError.notFound("Transaksi tidak ditemukan");
  await assertTransactionAccess(transaction, params.requester);
  return transaction;
}

export async function uploadPaymentProofService(params: {
  transactionId: string;
  mediaAssetId: string;
  buyerId: string;
  buyerRole: string;
}) {
  const transaction = await findTransactionById(params.transactionId);
  if (!transaction) throw ApiError.notFound("Transaksi tidak ditemukan");
  if (transaction.buyer_id !== params.buyerId) {
    throw ApiError.forbidden("Anda tidak memiliki akses ke transaksi ini");
  }
  if (transaction.status !== "pending_payment") {
    throw ApiError.conflict(
      `Bukti pembayaran hanya bisa diunggah saat status pending_payment (status saat ini: ${transaction.status})`,
      "INVALID_TRANSACTION_STATE"
    );
  }

  const asset = await findMediaAssetById(params.mediaAssetId);
  if (!asset) throw ApiError.notFound("Media asset tidak ditemukan");

  const updated = await setPaymentProof(params.transactionId, params.mediaAssetId);

  await recordAuditLog({
    actorId: params.buyerId,
    actorRole: params.buyerRole,
    actionType: "upload_payment_proof",
    targetEntity: "transactions",
    targetId: params.transactionId,
    metadata: { media_asset_id: params.mediaAssetId },
  });

  return updated;
}

export async function verifyPaymentService(params: {
  transactionId: string;
  approved: boolean;
  notes?: string;
  actor: { id: string; role: string };
}) {
  const transaction = await findTransactionById(params.transactionId);
  if (!transaction) throw ApiError.notFound("Transaksi tidak ditemukan");

  if (transaction.status !== "pending_payment") {
    throw ApiError.conflict(
      `Verifikasi pembayaran hanya berlaku dari status pending_payment (status saat ini: ${transaction.status})`,
      "INVALID_TRANSACTION_STATE"
    );
  }
  if (!transaction.payment_proof_media_id) {
    throw ApiError.conflict("Belum ada bukti pembayaran yang diunggah customer", "NO_PAYMENT_PROOF");
  }

  let updated: TransactionRow | null;

  if (params.approved) {
    // Naik 2 status sekaligus (payment_verified -> funds_held) sesuai kesepakatan,
    // dicatat sebagai 1 audit log dengan metadata keduanya.
    updated = await updateTransactionStatus({
      id: params.transactionId,
      status: "funds_held",
      fields: {
        payment_verified_by: params.actor.id,
        payment_verified_at: new Date().toISOString(),
      },
    });
  } else {
    updated = transaction; // tetap pending_payment, customer perlu upload ulang
  }

  await recordAuditLog({
    actorId: params.actor.id,
    actorRole: params.actor.role,
    actionType: "verify_payment",
    targetEntity: "transactions",
    targetId: params.transactionId,
    metadata: { approved: params.approved, notes: params.notes, resulting_status: updated?.status },
  });

  // Trigger notifikasi (Modul 3): beri tahu buyer status pembayaran, dan beri tahu
  // seluruh Owner bahwa ada transaksi baru masuk approval queue (funds_held).
  if (params.approved && updated) {
    await createNotificationService({
      userId: transaction.buyer_id,
      type: "transaction_status",
      title: "Pembayaran terverifikasi",
      body: "Dana Anda kini berstatus tertahan (funds_held), menunggu proses serah terima.",
      relatedEntity: "transactions",
      relatedId: params.transactionId,
    });
    const ownerIds = await getOwnerUserIds();
    await createNotificationForManyService({
      userIds: ownerIds,
      type: "transaction_status",
      title: "Transaksi menunggu approval release dana",
      body: `Transaksi ${params.transactionId} kini berstatus funds_held.`,
      relatedEntity: "transactions",
      relatedId: params.transactionId,
    });
  }

  return updated;
}

export async function getApprovalQueueService(params: { limit: number; offset: number }) {
  return listTransactions({ status: "funds_held", limit: params.limit, offset: params.offset });
}

export async function releaseTransactionService(params: {
  transactionId: string;
  notes?: string;
  actor: { id: string; role: string };
}) {
  const transaction = await findTransactionById(params.transactionId);
  if (!transaction) throw ApiError.notFound("Transaksi tidak ditemukan");

  if (transaction.status !== "funds_held") {
    throw ApiError.conflict(
      `Pelepasan dana hanya berlaku dari status funds_held (status saat ini: ${transaction.status})`,
      "INVALID_TRANSACTION_STATE"
    );
  }

  const updated = await updateTransactionStatus({
    id: params.transactionId,
    status: "released_to_seller",
    fields: { released_by: params.actor.id, released_at: new Date().toISOString() },
  });

  await recordAuditLog({
    actorId: params.actor.id,
    actorRole: params.actor.role,
    actionType: "release_transaction_funds",
    targetEntity: "transactions",
    targetId: params.transactionId,
    metadata: { notes: params.notes, amount: transaction.amount },
  });

  // Trigger notifikasi (Modul 3): beri tahu buyer dana sudah dilepas ke penjual.
  await createNotificationService({
    userId: transaction.buyer_id,
    type: "transaction_status",
    title: "Transaksi selesai",
    body: "Dana telah dilepas ke penjual. Terima kasih telah bertransaksi.",
    relatedEntity: "transactions",
    relatedId: params.transactionId,
  });

  return updated;
}

export async function disputeTransactionService(params: {
  transactionId: string;
  disputeReason: string;
  actor: { id: string; role: string };
}) {
  const transaction = await findTransactionById(params.transactionId);
  if (!transaction) throw ApiError.notFound("Transaksi tidak ditemukan");

  if (params.actor.role === "customer" && transaction.buyer_id !== params.actor.id) {
    throw ApiError.forbidden("Anda tidak memiliki akses ke transaksi ini");
  }

  if (transaction.status !== "funds_held") {
    throw ApiError.conflict(
      `Dispute hanya bisa diajukan saat dana tertahan (funds_held); status saat ini: ${transaction.status}`,
      "INVALID_TRANSACTION_STATE"
    );
  }

  const updated = await updateTransactionStatus({
    id: params.transactionId,
    status: "disputed",
    fields: { dispute_reason: params.disputeReason },
  });

  await recordAuditLog({
    actorId: params.actor.id,
    actorRole: params.actor.role,
    actionType: "dispute_transaction",
    targetEntity: "transactions",
    targetId: params.transactionId,
    metadata: { dispute_reason: params.disputeReason },
  });

  // Trigger notifikasi (Modul 3): beri tahu buyer (kalau bukan dia sendiri yang mengajukan)
  // dan seluruh Owner, karena keputusan final dispute ada di tangan Owner.
  if (transaction.buyer_id !== params.actor.id) {
    await createNotificationService({
      userId: transaction.buyer_id,
      type: "transaction_status",
      title: "Transaksi Anda ditandai bermasalah",
      body: params.disputeReason,
      relatedEntity: "transactions",
      relatedId: params.transactionId,
    });
  }
  const ownerIds = await getOwnerUserIds();
  await createNotificationForManyService({
    userIds: ownerIds,
    type: "transaction_status",
    title: "Transaksi disputed, menunggu keputusan Owner",
    body: params.disputeReason,
    relatedEntity: "transactions",
    relatedId: params.transactionId,
  });

  return updated;
}

export async function resolveTransactionService(params: {
  transactionId: string;
  resolution: "released" | "refunded" | "cancelled";
  notes: string;
  actor: { id: string; role: string };
}) {
  const transaction = await findTransactionById(params.transactionId);
  if (!transaction) throw ApiError.notFound("Transaksi tidak ditemukan");

  if (transaction.status !== "disputed") {
    throw ApiError.conflict(
      `Resolve hanya berlaku dari status disputed (status saat ini: ${transaction.status})`,
      "INVALID_TRANSACTION_STATE"
    );
  }

  const statusMap = {
    released: "released_to_seller",
    refunded: "refunded",
    cancelled: "cancelled",
  } as const;
  const finalStatus = statusMap[params.resolution];

  const fields: Record<string, unknown> = {
    resolved_by: params.actor.id,
    resolved_at: new Date().toISOString(),
  };
  if (params.resolution === "released") {
    fields.released_by = params.actor.id;
    fields.released_at = new Date().toISOString();
  }

  const updated = await updateTransactionStatus({
    id: params.transactionId,
    status: finalStatus,
    fields,
  });

  await recordAuditLog({
    actorId: params.actor.id,
    actorRole: params.actor.role,
    actionType: "resolve_transaction_dispute",
    targetEntity: "transactions",
    targetId: params.transactionId,
    metadata: { resolution: params.resolution, notes: params.notes },
  });

  // Trigger notifikasi (Modul 3): beri tahu buyer keputusan final dispute.
  const resolutionLabel: Record<typeof params.resolution, string> = {
    released: "Dana dilepas ke penjual",
    refunded: "Dana akan dikembalikan (refund manual, Admin/Owner akan menghubungi Anda)",
    cancelled: "Transaksi dibatalkan",
  };
  await createNotificationService({
    userId: transaction.buyer_id,
    type: "transaction_status",
    title: "Dispute transaksi Anda sudah diputuskan",
    body: `${resolutionLabel[params.resolution]}. Catatan: ${params.notes}`,
    relatedEntity: "transactions",
    relatedId: params.transactionId,
  });

  // Catatan (04-catatan-open-decision.md §7 & 02c belum menetapkan alur refund detail):
  // hasil 'refunded' hanya dicatat statusnya di sini. Proses transfer balik dana ke pembeli
  // tetap MANUAL di luar sistem (Admin/Owner koordinasi langsung), sesuai 05-api-endpoints-mvp.md §15.

  return updated;
}

export async function cancelTransactionService(params: {
  transactionId: string;
  reason?: string;
  actor: { id: string; role: string };
}) {
  const transaction = await findTransactionById(params.transactionId);
  if (!transaction) throw ApiError.notFound("Transaksi tidak ditemukan");

  if (params.actor.role === "customer" && transaction.buyer_id !== params.actor.id) {
    throw ApiError.forbidden("Anda tidak memiliki akses ke transaksi ini");
  }

  if (transaction.status !== "pending_payment") {
    throw ApiError.conflict(
      `Transaksi hanya bisa dibatalkan sebelum dana diverifikasi (status pending_payment); status saat ini: ${transaction.status}`,
      "INVALID_TRANSACTION_STATE"
    );
  }

  const updated = await updateTransactionStatus({ id: params.transactionId, status: "cancelled" });

  await recordAuditLog({
    actorId: params.actor.id,
    actorRole: params.actor.role,
    actionType: "cancel_transaction",
    targetEntity: "transactions",
    targetId: params.transactionId,
    metadata: { reason: params.reason },
  });

  // Trigger notifikasi (Modul 3): beri tahu buyer kalau yang membatalkan adalah Admin (bukan dirinya).
  if (transaction.buyer_id !== params.actor.id) {
    await createNotificationService({
      userId: transaction.buyer_id,
      type: "transaction_status",
      title: "Transaksi Anda dibatalkan",
      body: params.reason,
      relatedEntity: "transactions",
      relatedId: params.transactionId,
    });
  }

  return updated;
}
