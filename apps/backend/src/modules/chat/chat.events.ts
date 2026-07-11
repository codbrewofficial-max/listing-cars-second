import { EventEmitter } from "node:events";

/**
 * Event bus in-process untuk menjembatani REST service (chat.service.ts) dengan
 * WebSocket broadcaster (chat.ws.ts), supaya pengiriman pesan lewat REST fallback
 * tetap ter-broadcast realtime ke partisipan lain yang sedang konek WS, begitu juga
 * sebaliknya saat pesan dikirim lewat WS.
 *
 * Catatan skala: ini cukup untuk MVP (single instance Node.js di 1 VPS/Docker
 * container, lihat spesifikasi_sistem §6). Kalau nanti scale-out ke multi-instance,
 * event bus ini perlu diganti ke sesuatu yang lintas-proses (mis. Redis pub/sub).
 */
export const chatEvents = new EventEmitter();

export interface MessageNewEvent {
  conversation_id: string;
  message: {
    id: string;
    conversation_id: string;
    sender_id: string;
    message_type: string;
    content: string;
    media_asset_id: string | null;
    created_at: string;
  };
}

export interface MessageReadEvent {
  conversation_id: string;
  user_id: string;
  up_to_message_id: string;
}

export interface ConversationClosedEvent {
  conversation_id: string;
  closed_by: string;
}

export function emitMessageNew(payload: MessageNewEvent) {
  chatEvents.emit("message:new", payload);
}

export function emitMessageRead(payload: MessageReadEvent) {
  chatEvents.emit("message:read", payload);
}

export function emitConversationClosed(payload: ConversationClosedEvent) {
  chatEvents.emit("conversation:closed", payload);
}
