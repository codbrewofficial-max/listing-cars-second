import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { buildMeta, parsePagination } from "../../utils/pagination";
import {
  closeConversationService,
  createConversationService,
  getConversationDetailService,
  listConversationsService,
  listMessagesService,
  markReadService,
  sendMessageService,
} from "./chat.service";

export const createConversationHandler = asyncHandler(async (req: Request, res: Response) => {
  const conversation = await createConversationService({
    customerId: req.user!.id,
    subjectType: req.body.subject_type,
    subjectId: req.body.subject_id,
    initialMessage: req.body.initial_message,
  });
  return sendSuccess(res, { conversation }, 201);
});

export const listConversationsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, perPage, offset } = parsePagination(req, ["updated_at"], "updated_at");
  const { status } = req.query as { status?: string };

  const { data, total } = await listConversationsService({
    requester: { id: req.user!.id, role: req.user!.role },
    status,
    limit: perPage,
    offset,
  });
  return sendSuccess(res, data, 200, buildMeta(page, perPage, total));
});

export const getConversationHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await getConversationDetailService({
    id: req.params.id,
    requester: { id: req.user!.id, role: req.user!.role },
  });
  return sendSuccess(res, result);
});

export const listMessagesHandler = asyncHandler(async (req: Request, res: Response) => {
  const { before, limit } = req.query as { before?: string; limit?: string };
  const data = await listMessagesService({
    conversationId: req.params.id,
    requester: { id: req.user!.id, role: req.user!.role },
    before,
    limit: Math.min(100, Math.max(1, parseInt(limit ?? "50", 10) || 50)),
  });
  return sendSuccess(res, data, 200, { count: data.length });
});

export const sendMessageHandler = asyncHandler(async (req: Request, res: Response) => {
  const message = await sendMessageService({
    conversationId: req.params.id,
    senderId: req.user!.id,
    senderRole: req.user!.role,
    content: req.body.content,
    messageType: req.body.message_type,
    mediaAssetId: req.body.media_asset_id,
  });
  return sendSuccess(res, { message }, 201);
});

export const markReadHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await markReadService({
    conversationId: req.params.id,
    userId: req.user!.id,
    userRole: req.user!.role,
    upToMessageId: req.body.up_to_message_id,
  });
  return sendSuccess(res, result);
});

export const closeConversationHandler = asyncHandler(async (req: Request, res: Response) => {
  const conversation = await closeConversationService({
    id: req.params.id,
    actor: { id: req.user!.id, role: req.user!.role },
  });
  return sendSuccess(res, { conversation });
});
