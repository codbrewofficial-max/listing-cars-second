import { Router } from "express";
import { authenticate } from "../auth/authenticate.middleware";
import { authorize } from "../auth/authorize.middleware";
import { validate } from "../../middlewares/validate";
import {
  createArticleHandler,
  deleteArticleHandler,
  getAdminArticleHandler,
  getPublicArticleHandler,
  listAdminArticlesHandler,
  listPublicArticlesHandler,
  updateArticleHandler,
  updateArticleStatusHandler,
} from "./articles.controller";
import {
  articleIdParamSchema,
  articleSlugParamSchema,
  createArticleSchema,
  listAdminArticlesQuerySchema,
  listPublicArticlesQuerySchema,
  updateArticleSchema,
  updateArticleStatusSchema,
} from "./articles.validation";

// ---- Router utama: dipasang di /api/articles (05-api-endpoints-mvp.md §8) ----
// Mengikuti pola yang sama dengan modul vehicles: CRUD admin tetap di path utama,
// hanya listing "termasuk draft" yang dipisah ke /api/admin/articles.
const router = Router();

// GET /api/articles - Public
router.get("/", validate({ query: listPublicArticlesQuerySchema }), listPublicArticlesHandler);

// POST /api/articles - Admin, Super Admin
router.post(
  "/",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ body: createArticleSchema }),
  createArticleHandler
);

// GET /api/articles/:slug - Public (SEO-friendly URL by slug)
router.get("/:slug", validate({ params: articleSlugParamSchema }), getPublicArticleHandler);

// PUT /api/articles/:id - Admin, Super Admin
router.put(
  "/:id",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ params: articleIdParamSchema, body: updateArticleSchema }),
  updateArticleHandler
);

// PATCH /api/articles/:id/status - Admin, Super Admin
router.patch(
  "/:id/status",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ params: articleIdParamSchema, body: updateArticleStatusSchema }),
  updateArticleStatusHandler
);

// DELETE /api/articles/:id - Super Admin
router.delete(
  "/:id",
  authenticate,
  authorize("super_admin"),
  validate({ params: articleIdParamSchema }),
  deleteArticleHandler
);

export default router;

// ---- Router admin: dipasang terpisah di /api/admin/articles ----
export const adminArticlesRouter = Router();

// GET /api/admin/articles - Admin, Super Admin
adminArticlesRouter.get(
  "/",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ query: listAdminArticlesQuerySchema }),
  listAdminArticlesHandler
);

// GET /api/admin/articles/:id - Admin, Super Admin
adminArticlesRouter.get(
  "/:id",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ params: articleIdParamSchema }),
  getAdminArticleHandler
);
