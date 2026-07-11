import { ApiError } from "../../utils/ApiError";
import {
  addParticipant,
  closeConversation,
  findConversationById,
  findMessageById,
  hasAdminParticipant,
  insertConversation,
  insertMessage,
  isParticipant,
  listConversationsForAdminQueue,
  listConversationsForCustomer,
  listMessages,
  listParticipants,
  markMessagesRead,
} from "./chat.repository";
import { emitConversationClosed, emitMessageNew, emitMessageRead } from "./chat.events";

/**
 * Modul 4 — mekanisme assignment Admin: General Queue (keputusan final).
 * Tidak ada auto-assign saat conversation dibuat. Conversation baru langsung berstatus
 * 'open' tanpa partisipan admin. Admin manapun bisa melihatnya di antrian (lihat
 * listConversationsForAdminQueue di repository), dan begitu seorang Admin membalas
 * pesan pertama kali, dia otomatis ditambahkan sebagai partisipan (assigned).
 */

export async function createConversationService(params: {
  customerId: string;
  subjectType?: string;
  subjectId?: string;
  initialMessage?: string;
}) {
  const conversation = await insertConversation({
    subjectType: params.subjectType,
    subjectId: params.subjectId,
  });

  await addParticipant({
    conversationId: conversation.id,
    userId: params.customerId,
    participantType: "customer",
  });

  if (params.initialMessage) {
    const message = await insertMessage({
      conversationId: conversation.id,
      senderId: params.customerId,
      messageType: "text",
      content: params.initialMessage,
    });
    emitMessageNew({ conversation_id: conversation.id, message });
  }

  return conversation;
}

export async function listConversationsService(params: {
  requester: { id: string; role: string };
  status?: string;
  limit: number;
  offset: number;
}) {
  if (params.requester.role === "customer") {
    return listConversationsForCustomer({
      customerId: params.requester.id,
      status: params.status,
      limit: params.limit,
      offset: params.offset,
    });
  }
  // admin / super_admin: lihat conversation yang sudah diikuti + antrian umum yang belum ada admin
  return listConversationsForAdminQueue({
    adminId: params.requester.id,
    status: params.status,
    limit: params.limit,
    offset: params.offset,
  });
}

async function assertParticipantAccess(conversationId: string, requester: { id: string; role: string }) {
  const conversation = await findConversationById(conversationId);
  if (!conversation) throw ApiError.notFound("Percakapan tidak ditemukan");

  const alreadyParticipant = await isParticipant(conversationId, requester.id);
  if (alreadyParticipant) return conversation;

  // Admin/Super Admin yang belum jadi partisipan tetap boleh MELIHAT (general queue),
  // tapi belum resmi "assigned" sampai dia mengirim pesan pertama (lihat sendMessageService).
  if ((requester.role === "admin" || requester.role === "super_admin") && conversation.status === "open") {
    const hasAdmin = await hasAdminParticipant(conversationId);
    if (!hasAdmin) return conversation;
  }

  throw ApiError.forbidden("Anda tidak memiliki akses ke percakapan ini");
}

export async function getConversationDetailService(params: {
  id: string;
  requester: { id: string; role: string };
}) {
  const conversation = await assertParticipantAccess(params.id, params.requester);
  const participants = await listParticipants(params.id);
  return { conversation, participants };
}

export async function listMessagesService(params: {
  conversationId: string;
  requester: { id: string; role: string };
  before?: string;
  limit: number;
}) {
  await assertParticipantAccess(params.conversationId, params.requester);
  return listMessages({ conversationId: params.conversationId, before: params.before, limit: params.limit });
}

export async function sendMessageService(params: {
  conversationId: string;
  senderId: string;
  senderRole: string;
  content: string;
  messageType?: string;
  mediaAssetId?: string;
}) {
  const conversation = await assertParticipantAccess(params.conversationId, {
    id: params.senderId,
    role: params.senderRole,
  });

  if (conversation.status === "closed") {
    throw ApiError.conflict("Percakapan sudah ditutup", "CONVERSATION_CLOSED");
  }

  // General queue: Admin/Super Admin yang belum jadi partisipan otomatis "assigned"
  // begitu dia mengirim pesan pertama di conversation ini.
  const alreadyParticipant = await isParticipant(params.conversationId, params.senderId);
  if (!alreadyParticipant && (params.senderRole === "admin" || params.senderRole === "super_admin")) {
    await addParticipant({
      conversationId: params.conversationId,
      userId: params.senderId,
      participantType: "admin",
    });
  }

  const message = await insertMessage({
    conversationId: params.conversationId,
    senderId: params.senderId,
    messageType: params.messageType ?? "text",
    content: params.content,
    mediaAssetId: params.mediaAssetId,
  });

  emitMessageNew({ conversation_id: params.conversationId, message });

  return message;
}

export async function markReadService(params: {
  conversationId: string;
  userId: string;
  userRole: string;
  upToMessageId: string;
}) {
  await assertParticipantAccess(params.conversationId, { id: params.userId, role: params.userRole });

  const message = await findMessageById(params.upToMessageId);
  if (!message || message.conversation_id !== params.conversationId) {
    throw ApiError.badRequest("up_to_message_id tidak valid untuk percakapan ini");
  }

  await markMessagesRead({
    conversationId: params.conversationId,
    userId: params.userId,
    upToMessageId: params.upToMessageId,
  });

  emitMessageRead({
    conversation_id: params.conversationId,
    user_id: params.userId,
    up_to_message_id: params.upToMessageId,
  });

  return { message: "Pesan ditandai sudah dibaca" };
}

export async function closeConversationService(params: { id: string; actor: { id: string; role: string } }) {
  const conversation = await findConversationById(params.id);
  if (!conversation) throw ApiError.notFound("Percakapan tidak ditemukan");

  const updated = await closeConversation(params.id);

  emitConversationClosed({ conversation_id: params.id, closed_by: params.actor.id });

  return updated;
}
