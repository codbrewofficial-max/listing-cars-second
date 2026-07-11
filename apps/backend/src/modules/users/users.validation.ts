import { z } from "zod";

export const listUsersQuerySchema = z.object({
  role: z.enum(["super_admin", "owner", "admin", "customer", "toko"]).optional(),
  is_active: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  search: z.string().optional(),
  page: z.string().optional(),
  per_page: z.string().optional(),
  sort: z.string().optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const createUserSchema = z.object({
  name: z.string().min(2).max(150),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["super_admin", "owner", "admin", "customer", "toko"]),
  phone: z.string().min(8).max(20).optional(),
});

export const updateUserSchema = z.object({
  role: z.enum(["super_admin", "owner", "admin", "customer", "toko"]).optional(),
  is_active: z.boolean().optional(),
});

export const adminResetPasswordSchema = z.object({
  new_password: z.string().min(8),
});
