import { z } from "zod";

export const conversationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const createConversationSchema = z.object({
  subject_type: z.enum(["vehicle", "spare_part"]).optional(),
  subject_id: z.string().uuid().optional(),
  initial_message: z.string().min(1).max(4000).optional(),
});

export const listConversationsQuerySchema = z.object({
  status: z.enum(["open", "closed"]).optional(),
  page: z.string().optional(),
  per_page: z.string().optional(),
});

export const listMessagesQuerySchema = z.object({
  before: z.string().optional(),
  limit: z.string().optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  message_type: z.enum(["text", "image", "system"]).optional(),
  media_asset_id: z.string().uuid().optional(),
});

export const markReadSchema = z.object({
  up_to_message_id: z.string().uuid(),
});
