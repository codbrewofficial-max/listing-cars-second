import { Router } from "express";
import { authenticate } from "../auth/authenticate.middleware";
import { validate } from "../../middlewares/validate";
import {
  listNotificationsHandler,
  markAllNotificationsReadHandler,
  markNotificationReadHandler,
} from "./notifications.controller";
import { listNotificationsQuerySchema, notificationIdParamSchema } from "./notifications.validation";

const router = Router();

router.use(authenticate);

// GET /api/notifications - Authenticated (milik sendiri)
router.get("/", validate({ query: listNotificationsQuerySchema }), listNotificationsHandler);

// PATCH /api/notifications/read-all - Authenticated
// Didaftarkan SEBELUM /:id/read supaya "read-all" tidak ketangkep sebagai :id.
router.patch("/read-all", markAllNotificationsReadHandler);

// PATCH /api/notifications/:id/read - Authenticated
router.patch(
  "/:id/read",
  validate({ params: notificationIdParamSchema }),
  markNotificationReadHandler
);

export default router;
