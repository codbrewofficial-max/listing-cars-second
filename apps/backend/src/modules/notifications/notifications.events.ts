import { EventEmitter } from "node:events";

/**
 * Event bus in-process, pola sama persis dengan chat.events.ts (lihat modul chat):
 * menjembatani notifications.service.ts (yang men-trigger notifikasi dari modul lain)
 * dengan notifications.ws.ts (broadcaster WS /ws/notifications).
 *
 * Catatan skala (sama seperti chat.events.ts): cukup untuk MVP single-instance.
 * Kalau nanti scale-out multi-instance, ganti ke Redis pub/sub.
 */
export const notificationEvents = new EventEmitter();

export interface NotificationNewEvent {
  user_id: string;
  notification: {
    id: string;
    user_id: string;
    type: string;
    title: string;
    body: string | null;
    related_entity: string | null;
    related_id: string | null;
    is_read: boolean;
    created_at: string;
  };
}

export function emitNotificationNew(payload: NotificationNewEvent) {
  notificationEvents.emit("notification:new", payload);
}
