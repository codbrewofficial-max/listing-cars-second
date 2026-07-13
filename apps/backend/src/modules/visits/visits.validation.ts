import { z } from "zod";

export const vehicleIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const visitRequestIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const visitPhotoIdParamSchema = z.object({
  photoId: z.string().uuid(),
});

export const createVisitRequestSchema = z.object({
  notes: z.string().optional(),
});

export const listVisitRequestsQuerySchema = z.object({
  status: z.enum(["requested", "scheduled", "completed", "cancelled"]).optional(),
  vehicle_id: z.string().uuid().optional(),
  page: z.string().optional(),
  per_page: z.string().optional(),
});

export const listMyVisitRequestsQuerySchema = z.object({
  status: z.enum(["requested", "scheduled", "completed", "cancelled"]).optional(),
  page: z.string().optional(),
  per_page: z.string().optional(),
});

export const scheduleVisitRequestSchema = z.object({
  scheduled_at: z.string().datetime().or(z.string().min(1)),
  location: z.string().min(1),
  admin_id: z.string().uuid().optional(),
});

export const updateVisitRequestStatusSchema = z.object({
  status: z.enum(["completed", "cancelled"]),
  notes: z.string().optional(),
});

export const addVisitPhotoSchema = z.object({
  media_asset_id: z.string().uuid(),
});

export const moderateVisitPhotoSchema = z.object({
  moderation_status: z.enum(["published", "rejected"]),
});
