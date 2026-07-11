import { ApiError } from "../../utils/ApiError";
import { recordAuditLog } from "../audit-log/audit-log.service";
import { findMediaAssetById } from "../media/media.repository";
import { findVehicleById } from "../vehicles/vehicles.repository";
import type { UserRole } from "../auth/jwt";
import {
  findVisitPhotoById,
  findVisitRequestById,
  insertVisitPhoto,
  insertVisitRequest,
  listVisitPhotosByRequest,
  listVisitRequests,
  moderateVisitPhoto,
  scheduleVisitRequest,
  updateVisitRequestStatus,
} from "./visits.repository";

/**
 * Default MVP (04-catatan-open-decision.md §3): hanya Admin/Super Admin yang boleh
 * upload foto hasil kunjungan. Diletakkan sebagai konfigurasi terpusat (bukan hardcode
 * di route/skema) supaya gampang dibuka untuk Customer nanti — tinggal ubah array ini.
 */
export const VISIT_PHOTO_UPLOAD_ROLES: UserRole[] = ["admin", "super_admin"];

export async function createVisitRequestService(params: {
  vehicleId: string;
  customerId: string;
  notes?: string;
}) {
  const vehicle = await findVehicleById(params.vehicleId);
  if (!vehicle || vehicle.status !== "published") {
    throw ApiError.notFound("Kendaraan tidak ditemukan");
  }

  return insertVisitRequest({
    vehicleId: params.vehicleId,
    customerId: params.customerId,
    notes: params.notes,
  });
}

export async function listVisitRequestsService(filters: {
  status?: string;
  vehicleId?: string;
  limit: number;
  offset: number;
}) {
  return listVisitRequests(filters);
}

export async function listMyVisitRequestsService(params: {
  customerId: string;
  status?: string;
  limit: number;
  offset: number;
}) {
  return listVisitRequests({
    status: params.status,
    customerId: params.customerId,
    limit: params.limit,
    offset: params.offset,
  });
}

export async function getVisitRequestDetailService(params: {
  id: string;
  requester: { id: string; role: string };
}) {
  const visitRequest = await findVisitRequestById(params.id);
  if (!visitRequest) throw ApiError.notFound("Visit request tidak ditemukan");

  const isOwner = visitRequest.customer_id === params.requester.id;
  const isStaff = ["admin", "owner", "super_admin"].includes(params.requester.role);
  if (!isOwner && !isStaff) {
    throw ApiError.forbidden("Anda tidak memiliki akses ke visit request ini");
  }

  const photos = await listVisitPhotosByRequest(params.id);
  return { visit_request: visitRequest, photos };
}

export async function scheduleVisitRequestService(params: {
  id: string;
  scheduledAt: string;
  location: string;
  adminId: string;
  actor: { id: string; role: string };
}) {
  const existing = await findVisitRequestById(params.id);
  if (!existing) throw ApiError.notFound("Visit request tidak ditemukan");

  const visitRequest = await scheduleVisitRequest({
    id: params.id,
    scheduledAt: params.scheduledAt,
    location: params.location,
    adminId: params.adminId,
  });

  await recordAuditLog({
    actorId: params.actor.id,
    actorRole: params.actor.role,
    actionType: "schedule_visit_request",
    targetEntity: "visit_requests",
    targetId: params.id,
    metadata: { scheduled_at: params.scheduledAt, location: params.location },
  });

  // TODO(notifikasi): trigger notifikasi ke customer saat modul Notifikasi Realtime dibangun.

  return visitRequest;
}

export async function updateVisitRequestStatusService(params: {
  id: string;
  status: string;
  notes?: string;
  actor: { id: string; role: string };
}) {
  const existing = await findVisitRequestById(params.id);
  if (!existing) throw ApiError.notFound("Visit request tidak ditemukan");

  const visitRequest = await updateVisitRequestStatus({
    id: params.id,
    status: params.status,
    notes: params.notes,
  });

  await recordAuditLog({
    actorId: params.actor.id,
    actorRole: params.actor.role,
    actionType: "update_visit_request_status",
    targetEntity: "visit_requests",
    targetId: params.id,
    metadata: { from: existing.status, to: params.status },
  });

  // Sesuai 04-catatan-open-decision.md §3 & 05-api-endpoints-mvp.md §4:
  // status visit_request TIDAK otomatis mengubah status listing kendaraan (belum diputuskan).

  return visitRequest;
}

// ---------- Photos ----------

export async function addVisitPhotoService(params: {
  visitRequestId: string;
  mediaAssetId: string;
  uploader: { id: string; role: UserRole };
}) {
  const visitRequest = await findVisitRequestById(params.visitRequestId);
  if (!visitRequest) throw ApiError.notFound("Visit request tidak ditemukan");

  if (!VISIT_PHOTO_UPLOAD_ROLES.includes(params.uploader.role)) {
    throw ApiError.forbidden(
      "Saat ini hanya Admin yang bisa mengunggah foto hasil kunjungan. Hubungi Admin untuk mengunggahkan foto Anda."
    );
  }

  if (params.uploader.role === "customer" && visitRequest.customer_id !== params.uploader.id) {
    throw ApiError.forbidden("Anda tidak memiliki akses ke visit request ini");
  }

  const asset = await findMediaAssetById(params.mediaAssetId);
  if (!asset) throw ApiError.notFound("Media asset tidak ditemukan");

  const uploadedByRole = ["admin", "super_admin"].includes(params.uploader.role) ? "admin" : "customer";

  return insertVisitPhoto({
    visitRequestId: params.visitRequestId,
    vehicleId: visitRequest.vehicle_id,
    mediaAssetId: params.mediaAssetId,
    uploadedBy: params.uploader.id,
    uploadedByRole,
  });
}

export async function listVisitPhotosService(params: {
  visitRequestId: string;
  requester: { id: string; role: string };
}) {
  const visitRequest = await findVisitRequestById(params.visitRequestId);
  if (!visitRequest) throw ApiError.notFound("Visit request tidak ditemukan");

  const isOwner = visitRequest.customer_id === params.requester.id;
  const isStaff = ["admin", "owner", "super_admin"].includes(params.requester.role);
  if (!isOwner && !isStaff) {
    throw ApiError.forbidden("Anda tidak memiliki akses ke visit request ini");
  }

  return listVisitPhotosByRequest(params.visitRequestId);
}

export async function moderateVisitPhotoService(params: {
  photoId: string;
  moderationStatus: string;
  actor: { id: string; role: string };
}) {
  const photo = await findVisitPhotoById(params.photoId);
  if (!photo) throw ApiError.notFound("Foto kunjungan tidak ditemukan");

  const updated = await moderateVisitPhoto({
    photoId: params.photoId,
    moderationStatus: params.moderationStatus,
    moderatedBy: params.actor.id,
  });

  await recordAuditLog({
    actorId: params.actor.id,
    actorRole: params.actor.role,
    actionType: "moderate_visit_photo",
    targetEntity: "visit_photos",
    targetId: params.photoId,
    metadata: { moderation_status: params.moderationStatus, vehicle_id: photo.vehicle_id },
  });

  return updated;
}
