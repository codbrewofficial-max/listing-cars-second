import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { ApiError } from "../../utils/ApiError";
import { deleteMediaAssetService, getMediaAssetService, getUsageService, uploadImage } from "./media.service";

export const uploadMediaHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("File tidak ditemukan, gunakan field 'file'");

  const folder = typeof req.body.folder === "string" ? req.body.folder : undefined;

  const asset = await uploadImage({
    buffer: req.file.buffer,
    uploadedBy: req.user!.id,
    folder,
  });

  return sendSuccess(
    res,
    {
      media_asset: {
        id: asset.id,
        file_url: asset.file_url,
        width: asset.width,
        height: asset.height,
        size_bytes: asset.size_bytes,
      },
    },
    201
  );
});

export const getMediaHandler = asyncHandler(async (req: Request, res: Response) => {
  const asset = await getMediaAssetService(req.params.id);
  return sendSuccess(res, { media_asset: asset });
});

export const deleteMediaHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await deleteMediaAssetService(req.params.id);
  return sendSuccess(res, result);
});

export const getMediaUsageHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getUsageService();
  return sendSuccess(res, data);
});
