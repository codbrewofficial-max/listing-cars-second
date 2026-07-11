import { Router } from "express";
import { authenticate } from "../auth/authenticate.middleware";
import { authorize } from "../auth/authorize.middleware";
import { validate } from "../../middlewares/validate";
import {
  addSparePartPhotoHandler,
  createSparePartHandler,
  deleteSparePartHandler,
  deleteSparePartPhotoHandler,
  getAdminSparePartHandler,
  getPublicSparePartHandler,
  listAdminSparePartsHandler,
  listPublicSparePartsHandler,
  listSparePartPhotosHandler,
  updateSparePartHandler,
  updateSparePartStatusHandler,
} from "./spare-parts.controller";
import {
  addSparePartPhotoSchema,
  createSparePartSchema,
  listAdminSparePartsQuerySchema,
  listPublicSparePartsQuerySchema,
  sparePartIdParamSchema,
  sparePartPhotoParamSchema,
  updateSparePartSchema,
  updateSparePartStatusSchema,
} from "./spare-parts.validation";

// ---- Router publik + CRUD: dipasang di /api/spare-parts (05-api-endpoints-mvp.md §3) ----
const router = Router();

router.get("/", validate({ query: listPublicSparePartsQuerySchema }), listPublicSparePartsHandler);

router.post(
  "/",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ body: createSparePartSchema }),
  createSparePartHandler
);

router.get("/:id", validate({ params: sparePartIdParamSchema }), getPublicSparePartHandler);

router.put(
  "/:id",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ params: sparePartIdParamSchema, body: updateSparePartSchema }),
  updateSparePartHandler
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ params: sparePartIdParamSchema, body: updateSparePartStatusSchema }),
  updateSparePartStatusHandler
);

router.delete(
  "/:id",
  authenticate,
  authorize("super_admin"),
  validate({ params: sparePartIdParamSchema }),
  deleteSparePartHandler
);

router.get("/:id/photos", validate({ params: sparePartIdParamSchema }), listSparePartPhotosHandler);

router.post(
  "/:id/photos",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ params: sparePartIdParamSchema, body: addSparePartPhotoSchema }),
  addSparePartPhotoHandler
);

router.delete(
  "/:id/photos/:photoId",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ params: sparePartPhotoParamSchema }),
  deleteSparePartPhotoHandler
);

export default router;

// ---- Router admin: dipasang terpisah di /api/admin/spare-parts ----
export const adminSparePartsRouter = Router();

adminSparePartsRouter.get(
  "/",
  authenticate,
  authorize("admin", "owner", "super_admin"),
  validate({ query: listAdminSparePartsQuerySchema }),
  listAdminSparePartsHandler
);

adminSparePartsRouter.get(
  "/:id",
  authenticate,
  authorize("admin", "owner", "super_admin"),
  validate({ params: sparePartIdParamSchema }),
  getAdminSparePartHandler
);
