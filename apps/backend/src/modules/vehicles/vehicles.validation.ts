import { z } from "zod";

export const vehicleIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const vehiclePhotoParamSchema = z.object({
  id: z.string().uuid(),
  photoId: z.string().uuid(),
});

export const listPublicVehiclesQuerySchema = z.object({
  brand: z.string().optional(),
  model: z.string().optional(),
  min_price: z.string().optional(),
  max_price: z.string().optional(),
  year: z.string().optional(),
  location: z.string().optional(),
  document_status: z.enum(["not_verified", "verified", "rejected"]).optional(),
  page: z.string().optional(),
  per_page: z.string().optional(),
  sort: z.string().optional(),
});

export const listAdminVehiclesQuerySchema = listPublicVehiclesQuerySchema.extend({
  status: z.enum(["draft", "published", "sold", "archived"]).optional(),
});

export const createVehicleSchema = z.object({
  brand: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.coerce.number().int().min(1900).max(2100),
  mileage: z.coerce.number().int().min(0).optional(),
  license_plate: z.string().max(20).optional(),
  price: z.coerce.number().positive(),
  condition_notes: z.string().optional(),
  description: z.string().optional(),
  location: z.string().max(150).optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const updateVehicleStatusSchema = z.object({
  status: z.enum(["draft", "published", "sold", "archived"]),
});

export const updateDocumentStatusSchema = z.object({
  document_status: z.enum(["not_verified", "verified", "rejected"]),
  verification_checklist: z.record(z.unknown()).optional(),
});

export const addVehiclePhotoSchema = z.object({
  media_asset_id: z.string().uuid(),
  is_cover: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export const updateVehiclePhotoSchema = z.object({
  is_cover: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});
