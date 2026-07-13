import { z } from "zod";

export const leadIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const submitLeadSchema = z.object({
  source: z.enum(["contact_form", "whatsapp_modal"]),
  name: z.string().min(1).max(150),
  email: z.string().email().optional(),
  phone: z.string().min(6).max(20),
  message: z.string().optional(),
  related_product_type: z.enum(["vehicle", "spare_part"]).optional(),
  related_product_id: z.string().uuid().optional(),
});

export const listLeadsQuerySchema = z.object({
  source: z.enum(["contact_form", "whatsapp_modal"]).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  per_page: z.string().optional(),
  sort: z.string().optional(),
});
