import { Router } from "express";
import { authenticate } from "../auth/authenticate.middleware";
import { authorize } from "../auth/authorize.middleware";
import { validate } from "../../middlewares/validate";
import { getLeadHandler, listLeadsHandler, submitLeadHandler } from "./leads.controller";
import { leadIdParamSchema, listLeadsQuerySchema, submitLeadSchema } from "./leads.validation";

const router = Router();

// POST /api/leads - Public
router.post("/", validate({ body: submitLeadSchema }), submitLeadHandler);

// GET /api/leads - Owner, Admin
router.get(
  "/",
  authenticate,
  authorize("owner", "admin", "super_admin"),
  validate({ query: listLeadsQuerySchema }),
  listLeadsHandler
);

// GET /api/leads/:id - Owner, Admin
router.get(
  "/:id",
  authenticate,
  authorize("owner", "admin", "super_admin"),
  validate({ params: leadIdParamSchema }),
  getLeadHandler
);

export default router;
