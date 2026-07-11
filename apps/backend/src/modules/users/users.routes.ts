import { Router } from "express";
import { authenticate } from "../auth/authenticate.middleware";
import { authorize } from "../auth/authorize.middleware";
import { validate } from "../../middlewares/validate";
import {
  adminResetPasswordHandler,
  createUserHandler,
  deleteUserHandler,
  getUserHandler,
  listUsersHandler,
  updateUserHandler,
} from "./users.controller";
import {
  adminResetPasswordSchema,
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from "./users.validation";

const router = Router();

// Semua endpoint di bawah ini khusus Super Admin sesuai 05-api-endpoints-mvp.md §14
router.use(authenticate, authorize("super_admin"));

router.get("/", listUsersHandler);
router.post("/", validate({ body: createUserSchema }), createUserHandler);
router.get("/:id", validate({ params: userIdParamSchema }), getUserHandler);
router.patch("/:id", validate({ params: userIdParamSchema, body: updateUserSchema }), updateUserHandler);
router.delete("/:id", validate({ params: userIdParamSchema }), deleteUserHandler);

// PATCH /api/users/:id/reset-password - dari 02c-addendum §8
router.patch(
  "/:id/reset-password",
  validate({ params: userIdParamSchema, body: adminResetPasswordSchema }),
  adminResetPasswordHandler
);

export default router;
