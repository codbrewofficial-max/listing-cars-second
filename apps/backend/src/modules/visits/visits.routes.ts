import { Router } from "express";
import { authenticate } from "../auth/authenticate.middleware";
import { authorize } from "../auth/authorize.middleware";
import { validate } from "../../middlewares/validate";
import {
  addVisitPhotoHandler,
  createVisitRequestHandler,
  getVisitRequestHandler,
  listMyVisitRequestsHandler,
  listVisitPhotosForRequestHandler,
  listVisitRequestsHandler,
  moderateVisitPhotoHandler,
  scheduleVisitRequestHandler,
  updateVisitRequestStatusHandler,
} from "./visits.controller";
import {
  addVisitPhotoSchema,
  createVisitRequestSchema,
  listMyVisitRequestsQuerySchema,
  listVisitRequestsQuerySchema,
  moderateVisitPhotoSchema,
  scheduleVisitRequestSchema,
  updateVisitRequestStatusSchema,
  vehicleIdParamSchema,
  visitPhotoIdParamSchema,
  visitRequestIdParamSchema,
} from "./visits.validation";

// ---- Dipasang di /api/vehicles (POST /:id/visit-requests — "Ajukan Kunjungan") ----
export const vehicleVisitRequestsRouter = Router();

vehicleVisitRequestsRouter.post(
  "/:id/visit-requests",
  authenticate,
  authorize("customer"),
  validate({ params: vehicleIdParamSchema, body: createVisitRequestSchema }),
  createVisitRequestHandler
);

// ---- Dipasang di /api/visit-requests ----
export const visitRequestsRouter = Router();

// GET /api/visit-requests - Admin, Owner, Super Admin
visitRequestsRouter.get(
  "/",
  authenticate,
  authorize("admin", "owner", "super_admin"),
  validate({ query: listVisitRequestsQuerySchema }),
  listVisitRequestsHandler
);

// GET /api/visit-requests/:id - Admin, Owner, Customer (pemilik, dicek di service)
visitRequestsRouter.get(
  "/:id",
  authenticate,
  validate({ params: visitRequestIdParamSchema }),
  getVisitRequestHandler
);

// PATCH /api/visit-requests/:id/schedule - Admin
visitRequestsRouter.patch(
  "/:id/schedule",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ params: visitRequestIdParamSchema, body: scheduleVisitRequestSchema }),
  scheduleVisitRequestHandler
);

// PATCH /api/visit-requests/:id/status - Admin
visitRequestsRouter.patch(
  "/:id/status",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ params: visitRequestIdParamSchema, body: updateVisitRequestStatusSchema }),
  updateVisitRequestStatusHandler
);

// POST /api/visit-requests/:id/photos - Admin, Customer (di-enforce granular di service via VISIT_PHOTO_UPLOAD_ROLES)
visitRequestsRouter.post(
  "/:id/photos",
  authenticate,
  authorize("admin", "super_admin", "customer"),
  validate({ params: visitRequestIdParamSchema, body: addVisitPhotoSchema }),
  addVisitPhotoHandler
);

// GET /api/visit-requests/:id/photos - Admin, Owner, Customer (pemilik)
visitRequestsRouter.get(
  "/:id/photos",
  authenticate,
  validate({ params: visitRequestIdParamSchema }),
  listVisitPhotosForRequestHandler
);

// ---- Dipasang di /api/me/visit-requests ----
export const meVisitRequestsRouter = Router();

meVisitRequestsRouter.get(
  "/",
  authenticate,
  authorize("customer"),
  validate({ query: listMyVisitRequestsQuerySchema }),
  listMyVisitRequestsHandler
);

// ---- Dipasang di /api/visit-photos ----
export const visitPhotosRouter = Router();

// PATCH /api/visit-photos/:photoId/moderate - Admin
visitPhotosRouter.patch(
  "/:photoId/moderate",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ params: visitPhotoIdParamSchema, body: moderateVisitPhotoSchema }),
  moderateVisitPhotoHandler
);
