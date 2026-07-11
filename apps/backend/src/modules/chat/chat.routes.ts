import { Router } from "express";
import { authenticate } from "../auth/authenticate.middleware";
import { authorize } from "../auth/authorize.middleware";
import { validate } from "../../middlewares/validate";
import {
  closeConversationHandler,
  createConversationHandler,
  getConversationHandler,
  listConversationsHandler,
  listMessagesHandler,
  markReadHandler,
  sendMessageHandler,
} from "./chat.controller";
import {
  conversationIdParamSchema,
  createConversationSchema,
  listConversationsQuerySchema,
  listMessagesQuerySchema,
  markReadSchema,
  sendMessageSchema,
} from "./chat.validation";

const router = Router();

// POST /api/conversations - Customer
router.post(
  "/",
  authenticate,
  authorize("customer"),
  validate({ body: createConversationSchema }),
  createConversationHandler
);

// GET /api/conversations - Participant (Customer: milik sendiri; Admin: assigned + general queue)
router.get(
  "/",
  authenticate,
  authorize("customer", "admin", "super_admin"),
  validate({ query: listConversationsQuerySchema }),
  listConversationsHandler
);

// GET /api/conversations/:id - Participant
router.get(
  "/:id",
  authenticate,
  validate({ params: conversationIdParamSchema }),
  getConversationHandler
);

// GET /api/conversations/:id/messages - Participant
router.get(
  "/:id/messages",
  authenticate,
  validate({ params: conversationIdParamSchema, query: listMessagesQuerySchema }),
  listMessagesHandler
);

// POST /api/conversations/:id/messages - Participant (fallback REST; realtime utama via WS)
router.post(
  "/:id/messages",
  authenticate,
  validate({ params: conversationIdParamSchema, body: sendMessageSchema }),
  sendMessageHandler
);

// PATCH /api/conversations/:id/read - Participant
router.patch(
  "/:id/read",
  authenticate,
  validate({ params: conversationIdParamSchema, body: markReadSchema }),
  markReadHandler
);

// PATCH /api/conversations/:id/close - Admin
router.patch(
  "/:id/close",
  authenticate,
  authorize("admin", "super_admin"),
  validate({ params: conversationIdParamSchema }),
  closeConversationHandler
);

export default router;
