import { ApiError } from "../../utils/ApiError";
import { recordAuditLog } from "../audit-log/audit-log.service";
import { findMediaAssetById } from "../media/media.repository";
import {
  deleteSparePart,
  deleteSparePartPhoto,
  findSparePartById,
  findSparePartPhotoById,
  insertSparePart,
  insertSparePartPhoto,
  listSparePartPhotos,
  listSpareParts,
  updateSparePart,
  updateSparePartStatus,
} from "./spare-parts.repository";

export async function listPublicSparePartsService(filters: {
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  limit: number;
  offset: number;
  sortColumn: string;
  sortDirection: "ASC" | "DESC";
}) {
  return listSpareParts({ ...filters, publicOnly: true });
}

export async function listAdminSparePartsService(filters: {
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  limit: number;
  offset: number;
  sortColumn: string;
  sortDirection: "ASC" | "DESC";
}) {
  return listSpareParts(filters);
}

export async function getPublicSparePartDetailService(id: string) {
  const sparePart = await findSparePartById(id);
  if (!sparePart || sparePart.status !== "published") {
    throw ApiError.notFound("Suku cadang tidak ditemukan");
  }
  const photos = await listSparePartPhotos(id);
  return { spare_part: sparePart, photos };
}

export async function getAdminSparePartService(id: string) {
  const sparePart = await findSparePartById(id);
  if (!sparePart) throw ApiError.notFound("Suku cadang tidak ditemukan");
  return sparePart;
}

export async function createSparePartService(params: {
  sellerId: string;
  actorRole: string;
  name: string;
  category: string;
  condition: string;
  price: number;
  description?: string;
}) {
  const sparePart = await insertSparePart({
    sellerId: params.sellerId,
    name: params.name,
    category: params.category,
    condition: params.condition,
    price: params.price,
    description: params.description,
  });

  await recordAuditLog({
    actorId: params.sellerId,
    actorRole: params.actorRole,
    actionType: "create_spare_part",
    targetEntity: "spare_parts",
    targetId: sparePart.id,
    metadata: { name: sparePart.name, category: sparePart.category },
  });

  return sparePart;
}

export async function updateSparePartService(
  id: string,
  fields: Partial<{ name: string; category: string; condition: string; price: number; description: string }>,
  actor: { id: string; role: string }
) {
  const existing = await findSparePartById(id);
  if (!existing) throw ApiError.notFound("Suku cadang tidak ditemukan");

  const sparePart = await updateSparePart(id, fields);

  await recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actionType: "update_spare_part",
    targetEntity: "spare_parts",
    targetId: id,
    metadata: { fields: Object.keys(fields) },
  });

  return sparePart;
}

export async function updateSparePartStatusService(id: string, status: string, actor: { id: string; role: string }) {
  const existing = await findSparePartById(id);
  if (!existing) throw ApiError.notFound("Suku cadang tidak ditemukan");

  const sparePart = await updateSparePartStatus(id, status);

  await recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actionType: "update_spare_part_status",
    targetEntity: "spare_parts",
    targetId: id,
    metadata: { from: existing.status, to: status },
  });

  return sparePart;
}

export async function deleteSparePartService(id: string, actor: { id: string; role: string }) {
  const existing = await findSparePartById(id);
  if (!existing) throw ApiError.notFound("Suku cadang tidak ditemukan");

  await deleteSparePart(id);

  await recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actionType: "delete_spare_part",
    targetEntity: "spare_parts",
    targetId: id,
    metadata: { name: existing.name },
  });

  return { message: "Suku cadang berhasil dihapus" };
}

// ---------- Photos ----------

export async function listSparePartPhotosService(sparePartId: string) {
  const sparePart = await findSparePartById(sparePartId);
  if (!sparePart) throw ApiError.notFound("Suku cadang tidak ditemukan");
  return listSparePartPhotos(sparePartId);
}

export async function addSparePartPhotoService(params: {
  sparePartId: string;
  mediaAssetId: string;
  isCover?: boolean;
  sortOrder?: number;
  actor: { id: string; role: string };
}) {
  const sparePart = await findSparePartById(params.sparePartId);
  if (!sparePart) throw ApiError.notFound("Suku cadang tidak ditemukan");

  const asset = await findMediaAssetById(params.mediaAssetId);
  if (!asset) throw ApiError.notFound("Media asset tidak ditemukan");

  const photo = await insertSparePartPhoto({
    sparePartId: params.sparePartId,
    mediaAssetId: params.mediaAssetId,
    isCover: params.isCover,
    sortOrder: params.sortOrder,
  });

  await recordAuditLog({
    actorId: params.actor.id,
    actorRole: params.actor.role,
    actionType: "add_spare_part_photo",
    targetEntity: "spare_parts",
    targetId: params.sparePartId,
    metadata: { photo_id: photo.id, media_asset_id: params.mediaAssetId },
  });

  return photo;
}

export async function deleteSparePartPhotoService(params: {
  sparePartId: string;
  photoId: string;
  actor: { id: string; role: string };
}) {
  const photo = await findSparePartPhotoById(params.sparePartId, params.photoId);
  if (!photo) throw ApiError.notFound("Foto tidak ditemukan");

  await deleteSparePartPhoto(params.photoId);

  await recordAuditLog({
    actorId: params.actor.id,
    actorRole: params.actor.role,
    actionType: "delete_spare_part_photo",
    targetEntity: "spare_parts",
    targetId: params.sparePartId,
    metadata: { photo_id: params.photoId },
  });

  return { message: "Foto berhasil dihapus" };
}
