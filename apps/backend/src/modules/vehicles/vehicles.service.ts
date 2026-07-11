import { ApiError } from "../../utils/ApiError";
import { recordAuditLog } from "../audit-log/audit-log.service";
import { findMediaAssetById } from "../media/media.repository";
import {
  deleteVehicle,
  deleteVehiclePhoto,
  findVehicleById,
  findVehiclePhotoById,
  insertVehicle,
  insertVehiclePhoto,
  listPublishedVisitPhotosForVehicle,
  listVehiclePhotos,
  listVehicles,
  updateVehicle,
  updateVehicleDocumentStatus,
  updateVehiclePhoto,
  updateVehicleStatus,
  type VehicleRow,
} from "./vehicles.repository";

/**
 * license_plate bersifat internal (lihat 02b-erd-detail-mvp.md §5) — TIDAK PERNAH
 * boleh ikut ter-expose di response publik. Serialisasi publik vs internal dipisah
 * eksplisit di sini supaya tidak ada jalur yang lupa strip field ini.
 */
export function toPublicVehicle(vehicle: VehicleRow) {
  const { license_plate, ...publicVehicle } = vehicle;
  return publicVehicle;
}

export function toInternalVehicle(vehicle: VehicleRow) {
  return vehicle;
}

export async function listPublicVehiclesService(filters: {
  brand?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  year?: number;
  location?: string;
  documentStatus?: string;
  limit: number;
  offset: number;
  sortColumn: string;
  sortDirection: "ASC" | "DESC";
}) {
  const { data, total } = await listVehicles({ ...filters, publicOnly: true });
  return { data: data.map(toPublicVehicle), total };
}

export async function listAdminVehiclesService(filters: {
  brand?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  year?: number;
  location?: string;
  documentStatus?: string;
  status?: string;
  limit: number;
  offset: number;
  sortColumn: string;
  sortDirection: "ASC" | "DESC";
}) {
  const { data, total } = await listVehicles(filters);
  return { data, total };
}

export async function getPublicVehicleDetailService(id: string) {
  const vehicle = await findVehicleById(id);
  if (!vehicle || vehicle.status !== "published") {
    throw ApiError.notFound("Kendaraan tidak ditemukan");
  }
  const [photos, visitPhotosPublished] = await Promise.all([
    listVehiclePhotos(id),
    listPublishedVisitPhotosForVehicle(id),
  ]);
  return {
    vehicle: toPublicVehicle(vehicle),
    photos,
    visit_photos_published: visitPhotosPublished,
  };
}

export async function getAdminVehicleService(id: string) {
  const vehicle = await findVehicleById(id);
  if (!vehicle) throw ApiError.notFound("Kendaraan tidak ditemukan");
  return vehicle;
}

export async function createVehicleService(params: {
  sellerId: string;
  actorRole: string;
  brand: string;
  model: string;
  year: number;
  mileage?: number;
  license_plate?: string;
  price: number;
  condition_notes?: string;
  description?: string;
  location?: string;
}) {
  const vehicle = await insertVehicle({
    sellerId: params.sellerId,
    brand: params.brand,
    model: params.model,
    year: params.year,
    mileage: params.mileage,
    licensePlate: params.license_plate,
    price: params.price,
    conditionNotes: params.condition_notes,
    description: params.description,
    location: params.location,
  });

  await recordAuditLog({
    actorId: params.sellerId,
    actorRole: params.actorRole,
    actionType: "create_vehicle",
    targetEntity: "vehicles",
    targetId: vehicle.id,
    metadata: { brand: vehicle.brand, model: vehicle.model },
  });

  return vehicle;
}

export async function updateVehicleService(
  id: string,
  fields: Partial<{
    brand: string;
    model: string;
    year: number;
    mileage: number;
    license_plate: string;
    price: number;
    condition_notes: string;
    description: string;
    location: string;
  }>,
  actor: { id: string; role: string }
) {
  const existing = await findVehicleById(id);
  if (!existing) throw ApiError.notFound("Kendaraan tidak ditemukan");

  const vehicle = await updateVehicle(id, fields);
  if (!vehicle) throw ApiError.notFound("Kendaraan tidak ditemukan");

  await recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actionType: "update_vehicle",
    targetEntity: "vehicles",
    targetId: id,
    metadata: { fields: Object.keys(fields) },
  });

  return vehicle;
}

export async function updateVehicleStatusService(
  id: string,
  status: string,
  actor: { id: string; role: string }
) {
  const existing = await findVehicleById(id);
  if (!existing) throw ApiError.notFound("Kendaraan tidak ditemukan");

  const vehicle = await updateVehicleStatus(id, status);

  await recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actionType: "update_vehicle_status",
    targetEntity: "vehicles",
    targetId: id,
    metadata: { from: existing.status, to: status },
  });

  return vehicle;
}

export async function updateDocumentStatusService(params: {
  id: string;
  documentStatus: string;
  verificationChecklist?: Record<string, unknown>;
  actor: { id: string; role: string };
}) {
  const existing = await findVehicleById(params.id);
  if (!existing) throw ApiError.notFound("Kendaraan tidak ditemukan");

  const vehicle = await updateVehicleDocumentStatus({
    id: params.id,
    documentStatus: params.documentStatus,
    verifiedBy: params.actor.id,
    verificationChecklist: params.verificationChecklist,
  });

  await recordAuditLog({
    actorId: params.actor.id,
    actorRole: params.actor.role,
    actionType: "verify_vehicle_document",
    targetEntity: "vehicles",
    targetId: params.id,
    metadata: {
      from: existing.document_status,
      to: params.documentStatus,
      has_checklist: !!params.verificationChecklist,
    },
  });

  return vehicle;
}

export async function deleteVehicleService(id: string, actor: { id: string; role: string }) {
  const existing = await findVehicleById(id);
  if (!existing) throw ApiError.notFound("Kendaraan tidak ditemukan");

  await deleteVehicle(id);

  await recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actionType: "delete_vehicle",
    targetEntity: "vehicles",
    targetId: id,
    metadata: { brand: existing.brand, model: existing.model },
  });

  return { message: "Kendaraan berhasil dihapus" };
}

// ---------- Photos ----------

export async function listVehiclePhotosService(vehicleId: string) {
  const vehicle = await findVehicleById(vehicleId);
  if (!vehicle) throw ApiError.notFound("Kendaraan tidak ditemukan");
  return listVehiclePhotos(vehicleId);
}

export async function addVehiclePhotoService(params: {
  vehicleId: string;
  mediaAssetId: string;
  isCover?: boolean;
  sortOrder?: number;
  actor: { id: string; role: string };
}) {
  const vehicle = await findVehicleById(params.vehicleId);
  if (!vehicle) throw ApiError.notFound("Kendaraan tidak ditemukan");

  const asset = await findMediaAssetById(params.mediaAssetId);
  if (!asset) throw ApiError.notFound("Media asset tidak ditemukan");

  const photo = await insertVehiclePhoto({
    vehicleId: params.vehicleId,
    mediaAssetId: params.mediaAssetId,
    isCover: params.isCover,
    sortOrder: params.sortOrder,
  });

  await recordAuditLog({
    actorId: params.actor.id,
    actorRole: params.actor.role,
    actionType: "add_vehicle_photo",
    targetEntity: "vehicles",
    targetId: params.vehicleId,
    metadata: { photo_id: photo.id, media_asset_id: params.mediaAssetId },
  });

  return photo;
}

export async function updateVehiclePhotoService(params: {
  vehicleId: string;
  photoId: string;
  fields: { is_cover?: boolean; sort_order?: number };
}) {
  const photo = await findVehiclePhotoById(params.vehicleId, params.photoId);
  if (!photo) throw ApiError.notFound("Foto tidak ditemukan");
  return updateVehiclePhoto(params.photoId, params.fields);
}

export async function deleteVehiclePhotoService(params: {
  vehicleId: string;
  photoId: string;
  actor: { id: string; role: string };
}) {
  const photo = await findVehiclePhotoById(params.vehicleId, params.photoId);
  if (!photo) throw ApiError.notFound("Foto tidak ditemukan");

  await deleteVehiclePhoto(params.photoId);

  await recordAuditLog({
    actorId: params.actor.id,
    actorRole: params.actor.role,
    actionType: "delete_vehicle_photo",
    targetEntity: "vehicles",
    targetId: params.vehicleId,
    metadata: { photo_id: params.photoId },
  });

  return { message: "Foto berhasil dihapus" };
}
