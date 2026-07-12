import type { IncomingMessage, Server as HttpServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { verifyAccessToken } from "../auth/jwt";
import { logger } from "../../config/logger";
import { notificationEvents, type NotificationNewEvent } from "./notifications.events";

interface AuthedSocket extends WebSocket {
  userId?: string;
}

// Registry koneksi aktif per user (1 user bisa punya >1 tab/device -> >1 socket),
// pola sama dengan chat.ws.ts.
const clientsByUser = new Map<string, Set<AuthedSocket>>();

function registerClient(userId: string, ws: AuthedSocket) {
  ws.userId = userId;
  if (!clientsByUser.has(userId)) clientsByUser.set(userId, new Set());
  clientsByUser.get(userId)!.add(ws);
}

function unregisterClient(ws: AuthedSocket) {
  if (ws.userId) clientsByUser.get(ws.userId)?.delete(ws);
}

function sendJson(ws: WebSocket, payload: unknown) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

/**
 * Setup WS /ws/notifications. Auth via token di query string handshake (`?token=<access_token>`),
 * sama seperti WS /ws/chat (lihat chat.ws.ts) — browser WebSocket API tidak bisa mengirim
 * custom header Authorization saat handshake.
 *
 * Berbeda dengan /ws/chat, socket ini murni satu arah (server -> client push event
 * `notification:new`); tidak ada event masuk dari client yang perlu diproses.
 */
export function setupNotificationsWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url ?? "", "http://localhost");
    if (url.pathname !== "/ws/notifications") return; // biarkan handler upgrade path lain yang menangani

    const token = url.searchParams.get("token");
    if (!token) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req, payload);
      });
    } catch {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
    }
  });

  wss.on("connection", (ws: AuthedSocket, _req: IncomingMessage, payload: { sub: string }) => {
    registerClient(payload.sub, ws);
    sendJson(ws, { event: "connected", data: { user_id: payload.sub } });

    ws.on("close", () => unregisterClient(ws));
    ws.on("error", (err) => logger.warn({ err }, "WS /ws/notifications: socket error"));
  });

  notificationEvents.on("notification:new", (payload: NotificationNewEvent) => {
    const sockets = clientsByUser.get(payload.user_id);
    if (!sockets) return;
    for (const ws of sockets) sendJson(ws, { event: "notification:new", data: payload.notification });
  });

  logger.info("WebSocket /ws/notifications siap menerima koneksi");
  return wss;
}
