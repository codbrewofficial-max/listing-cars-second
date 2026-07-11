import { z } from "zod";

export const sparePartIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const sparePartPhotoParamSchema = z.object({
  id: z.string().uuid(),
  photoId: z.string().uuid(),
});

export const listPublicSparePartsQuerySchema = z.object({
  category: z.string().optional(),
  condition: z.enum(["baru", "bekas"]).optional(),
  min_price: z.string().optional(),
  max_price: z.string().optional(),
  page: z.string().optional(),
  per_page: z.string().optional(),
  sort: z.string().optional(),
});

export const listAdminSparePartsQuerySchema = listPublicSparePartsQuerySchema.extend({
  status: z.enum(["draft", "published", "sold", "archived"]).optional(),
});

export const createSparePartSchema = z.object({
  name: z.string().min(1).max(150),
  category: z.string().min(1).max(100),
  condition: z.enum(["baru", "bekas"]),
  price: z.coerce.number().positive(),
  description: z.string().optional(),
});

export const updateSparePartSchema = createSparePartSchema.partial();

export const updateSparePartStatusSchema = z.object({
  status: z.enum(["draft", "published", "sold", "archived"]),
});

export const addSparePartPhotoSchema = z.object({
  media_asset_id: z.string().uuid(),
  is_cover: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});
