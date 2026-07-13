import { z } from "zod";

export const articleIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const articleSlugParamSchema = z.object({
  slug: z.string().min(1),
});

export const listPublicArticlesQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  per_page: z.string().optional(),
  sort: z.string().optional(),
});

export const listAdminArticlesQuerySchema = listPublicArticlesQuerySchema.extend({
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export const createArticleSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  category: z.string().max(100).optional(),
  seo_title: z.string().max(255).optional(),
  seo_description: z.string().optional(),
  cover_media_id: z.string().uuid().optional(),
  // slug opsional: kalau tidak dikirim, di-generate otomatis dari title (lihat articles.service.ts)
  slug: z.string().min(1).max(255).optional(),
});

// updateArticleSchema melonggarkan cover_media_id jadi nullable (selain optional) khusus
// untuk mendukung tombol "Hapus Cover" di form Admin — mengirim `cover_media_id: null`
// secara eksplisit berarti "kosongkan cover", berbeda dari tidak mengirim field sama
// sekali (undefined) yang berarti "cover lama dibiarkan apa adanya".
export const updateArticleSchema = createArticleSchema.partial().extend({
  cover_media_id: z.string().uuid().nullable().optional(),
});

export const updateArticleStatusSchema = z.object({
  status: z.enum(["draft", "published", "archived"]),
});
