import { Router } from "express";
import { authenticate } from "../auth/authenticate.middleware";
import { authorize } from "../auth/authorize.middleware";
import { validate } from "../../middlewares/validate";
import {
  getAllSettingsHandler,
  getPublicSettingsHandler,
  toggleRegistrationHandler,
  updateSettingHandler,
} from "./settings.controller";
import { settingKeyParamSchema, toggleRegistrationSchema, updateSettingSchema } from "./settings.validation";

const router = Router();

// GET /api/settings/public - Public
router.get("/public", getPublicSettingsHandler);

// GET /api/settings - Super Admin
router.get("/", authenticate, authorize("super_admin"), getAllSettingsHandler);

// PATCH /api/settings/registration-toggle - Super Admin
// Diletakkan sebelum /:key agar tidak tertangkap sebagai key bernama "registration-toggle"
router.patch(
  "/registration-toggle",
  authenticate,
  authorize("super_admin"),
  validate({ body: toggleRegistrationSchema }),
  toggleRegistrationHandler
);

// PATCH /api/settings/:key - Super Admin
router.patch(
  "/:key",
  authenticate,
  authorize("super_admin"),
  validate({ params: settingKeyParamSchema, body: updateSettingSchema }),
  updateSettingHandler
);

export default router;
