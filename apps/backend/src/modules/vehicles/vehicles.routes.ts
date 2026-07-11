import { Router } from "express";
import { authenticate } from "../auth/authenticate.middleware";
import { authorize } from "../auth/authorize.middleware";
import { validate } from "../../middlewares/validate";
import {
  addVehiclePhotoHandler,
  createVehicleHandler,
  deleteVehicleHandler,
  deleteVehiclePhotoHandler,
  getAdminVehicleHandler,
  getPublicVehicleHandler,
  listAdminVehiclesHandler,
  listPublicVehiclesHandler,
  listVehiclePhotosHandler,
  updateDocumentStatusHandler,
  updateVehicleHandler,
  updateVehiclePhotoHandler,
  updateVehicleStatusHandler,
} from "./vehicles.controller";
import {
  addVehiclePhotoSchema,
  createVehicleSchema,
  listAdminVehiclesQuerySchema,
  listPublicVehiclesQuerySchema,
  updateDocumentStatusSchema,
  updateVehiclePhotoSchema,
  updateVehicleSchema,
  updateVehicleStatusSchema,
  vehicleIdParamSchema,
  vehiclePhotoParamSchema,
} from "./vehicles.validation";

// ---- Router publik + CRUD: dipasang di /api/vehicles (05-api-endpoints-mvp.md §2) ----
const router = Router();

// GET /api/vehicles - Public
router.get("/", validate({ query: listPublicVehiclesQuerySchema }), listPublicVehiclesHandler);

// POST /api/vehicles - Admin, Super Admin
router.post(
  "/",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ body: createVehicleSchema }),
  createVehicleHandler
);

// GET /api/vehicles/:id - Public
router.get("/:id", validate({ params: vehicleIdParamSchema }), getPublicVehicleHandler);

// PUT /api/vehicles/:id - Admin, Super Admin
router.put(
  "/:id",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ params: vehicleIdParamSchema, body: updateVehicleSchema }),
  updateVehicleHandler
);

// PATCH /api/vehicles/:id/status - Admin, Super Admin
router.patch(
  "/:id/status",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ params: vehicleIdParamSchema, body: updateVehicleStatusSchema }),
  updateVehicleStatusHandler
);

// PATCH /api/vehicles/:id/document-status - Admin, Super Admin
router.patch(
  "/:id/document-status",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ params: vehicleIdParamSchema, body: updateDocumentStatusSchema }),
  updateDocumentStatusHandler
);

// DELETE /api/vehicles/:id - Super Admin
router.delete(
  "/:id",
  authenticate,
  authorize("super_admin"),
  validate({ params: vehicleIdParamSchema }),
  deleteVehicleHandler
);

// GET /api/vehicles/:id/photos - Public
router.get("/:id/photos", validate({ params: vehicleIdParamSchema }), listVehiclePhotosHandler);

// POST /api/vehicles/:id/photos - Admin, Super Admin
router.post(
  "/:id/photos",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ params: vehicleIdParamSchema, body: addVehiclePhotoSchema }),
  addVehiclePhotoHandler
);

// PATCH /api/vehicles/:id/photos/:photoId - Admin, Super Admin
router.patch(
  "/:id/photos/:photoId",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ params: vehiclePhotoParamSchema, body: updateVehiclePhotoSchema }),
  updateVehiclePhotoHandler
);

// DELETE /api/vehicles/:id/photos/:photoId - Admin, Super Admin
router.delete(
  "/:id/photos/:photoId",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ params: vehiclePhotoParamSchema }),
  deleteVehiclePhotoHandler
);

export default router;

// ---- Router admin: dipasang terpisah di /api/admin/vehicles (path berbeda sesuai dokumen) ----
export const adminVehiclesRouter = Router();

// GET /api/admin/vehicles - Admin, Owner, Super Admin
adminVehiclesRouter.get(
  "/",
  authenticate,
  authorize("admin", "owner", "super_admin"),
  validate({ query: listAdminVehiclesQuerySchema }),
  listAdminVehiclesHandler
);

// GET /api/admin/vehicles/:id - Admin, Owner, Super Admin (detail lengkap termasuk license_plate)
adminVehiclesRouter.get(
  "/:id",
  authenticate,
  authorize("admin", "owner", "super_admin"),
  validate({ params: vehicleIdParamSchema }),
  getAdminVehicleHandler
);
