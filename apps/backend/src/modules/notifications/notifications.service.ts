import { ApiError } from "../../utils/ApiError";
import {
  findNotificationById,
  insertNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRow,
  type NotificationType,
} from "./notifications.repository";
import { emitNotificationNew } from "./notifications.events";

/**
 * Helper terpusat untuk membuat + broadcast notifikasi, dipakai lintas modul
 * (chat, visits, transactions, vehicles) sebagai titik pemicu (lihat daftar
 * event yang sudah dikonfirmasi sebelum modul ini dibangun).
 *
 * Selalu INSERT ke tabel `notifications` (riwayat persisten) DAN emit event
 * in-process supaya notifications.ws.ts bisa push realtime ke client yang online.
 * Kalau user sedang offline, notifikasi tetap tersimpan dan muncul saat dia
 * buka GET /api/notifications berikutnya.
 */
export async function createNotificationService(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  relatedEntity?: string;
  relatedId?: string;
}): Promise<NotificationRow> {
  const notification = await insertNotification({
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    relatedEntity: params.relatedEntity,
    relatedId: params.relatedId,
  });

  emitNotificationNew({ user_id: params.userId, notification });

  return notification;
}

/** Kirim notifikasi yang sama ke banyak user sekaligus (mis. seluruh Owner). */
export async function createNotificationForManyService(params: {
  userIds: string[];
  type: NotificationType;
  title: string;
  body?: string;
  relatedEntity?: string;
  relatedId?: string;
}): Promise<void> {
  await Promise.all(
    params.userIds.map((userId) =>
      createNotificationService({
        userId,
        type: params.type,
        title: params.title,
        body: params.body,
        relatedEntity: params.relatedEntity,
        relatedId: params.relatedId,
      })
    )
  );
}

export async function listNotificationsService(params: {
  userId: string;
  isRead?: boolean;
  limit: number;
  offset: number;
}) {
  return listNotifications(params);
}

export async function markNotificationReadService(params: { id: string; userId: string }): Promise<NotificationRow> {
  const notification = await findNotificationById(params.id);
  if (!notification || notification.user_id !== params.userId) {
    throw ApiError.notFound("Notifikasi tidak ditemukan");
  }
  const updated = await markNotificationRead(params.id, params.userId);
  return updated ?? notification;
}

export async function markAllNotificationsReadService(userId: string) {
  await markAllNotificationsRead(userId);
  return { message: "Semua notifikasi ditandai sudah dibaca" };
}
