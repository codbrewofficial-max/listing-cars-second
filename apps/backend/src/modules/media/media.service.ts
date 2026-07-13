import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET, R2_PUBLIC_BASE_URL } from "../../config/r2";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import {
  deleteMediaAssetById,
  findMediaAssetById,
  getTotalStorageUsedBytes,
  insertMediaAsset,
  isMediaAssetReferenced,
} from "./media.repository";

const WEBP_QUALITY = 80;
const MAX_DIMENSION = 2000; // batas lebar/tinggi agar file tidak raksasa, cocok utk jaringan H+

/**
 * Fungsi upload reusable — dipakai oleh modul manapun yang butuh upload gambar
 * (foto produk, foto kunjungan, bukti pembayaran, cover artikel, lampiran chat).
 *
 * Pipeline: buffer asli -> sharp (resize max + convert WebP) -> upload ke R2 -> catat di media_assets.
 */
export async function uploadImage(params: {
  buffer: Buffer;
  uploadedBy: string;
  folder?: string; // contoh: "vehicles", "visit-photos", "payment-proofs", "articles"
}) {
  // Cek kuota Media Library 1GB sebelum upload (§9 di 05-api-endpoints-mvp.md).
  const used = await getTotalStorageUsedBytes();
  if (used >= env.MEDIA_LIBRARY_QUOTA_BYTES) {
    throw ApiError.conflict("Kuota Media Library (1GB) sudah penuh. Hapus aset yang tidak terpakai.", "QUOTA_EXCEEDED");
  }

  const processed = sharp(params.buffer).rotate().resize({
    width: MAX_DIMENSION,
    height: MAX_DIMENSION,
    fit: "inside",
    withoutEnlargement: true,
  });

  const webpBuffer = await processed.webp({ quality: WEBP_QUALITY }).toBuffer();
  const metadata = await sharp(webpBuffer).metadata();

  const folder = params.folder ?? "misc";
  const fileKey = `${folder}/${uuidv4()}.webp`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileKey,
      Body: webpBuffer,
      ContentType: "image/webp",
    })
  );

  const fileUrl = `${R2_PUBLIC_BASE_URL}/${fileKey}`;

  const asset = await insertMediaAsset({
    fileUrl,
    fileKey,
    mimeType: "image/webp",
    sizeBytes: webpBuffer.byteLength,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    uploadedBy: params.uploadedBy,
  });

  return asset;
}

export async function getMediaAssetService(id: string) {
  const asset = await findMediaAssetById(id);
  if (!asset) throw ApiError.notFound("Media asset tidak ditemukan");
  return asset;
}

export async function deleteMediaAssetService(id: string) {
  const asset = await findMediaAssetById(id);
  if (!asset) throw ApiError.notFound("Media asset tidak ditemukan");

  const referenced = await isMediaAssetReferenced(id);
  if (referenced) {
    throw ApiError.conflict("Media asset masih direferensikan oleh data lain, tidak bisa dihapus.", "ASSET_IN_USE");
  }

  await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: asset.file_key }));
  await deleteMediaAssetById(id);

  return { message: "Media asset berhasil dihapus" };
}

export async function getUsageService() {
  const used = await getTotalStorageUsedBytes();
  const quota = env.MEDIA_LIBRARY_QUOTA_BYTES;
  return {
    used_bytes: used,
    quota_bytes: quota,
    percentage: quota > 0 ? Math.round((used / quota) * 10000) / 100 : 0,
  };
}
