import type { IncomingMessage, Server as HttpServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { verifyAccessToken } from "../auth/jwt";
import { logger } from "../../config/logger";
import { hasAdminParticipant, listParticipants } from "./chat.repository";
import { markReadService, sendMessageService } from "./chat.service";
import { chatEvents, type ConversationClosedEvent, type MessageNewEvent, type MessageReadEvent } from "./chat.events";

interface AuthedSocket extends WebSocket {
  userId?: string;
  userRole?: string;
}

// Registry koneksi aktif per user (1 user bisa punya >1 tab/device -> >1 socket).
const clientsByUser = new Map<string, Set<AuthedSocket>>();
const adminSockets = new Set<AuthedSocket>();

function registerClient(userId: string, role: string, ws: AuthedSocket) {
  ws.userId = userId;
  ws.userRole = role;
  if (!clientsByUser.has(userId)) clientsByUser.set(userId, new Set());
  clientsByUser.get(userId)!.add(ws);
  if (role === "admin" || role === "super_admin") adminSockets.add(ws);
}

function unregisterClient(ws: AuthedSocket) {
  if (ws.userId) clientsByUser.get(ws.userId)?.delete(ws);
  adminSockets.delete(ws);
}

function sendJson(ws: WebSocket, payload: unknown) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

/**
 * Broadcast event ke seluruh partisipan conversation yang sedang konek.
 * Kalau `alsoQueueAdmins` true dan conversation belum punya partisipan admin
 * (masih di general queue), event juga dikirim ke SEMUA admin yang sedang online,
 * supaya siapapun admin yang available bisa melihat & merespon pesan queue secara realtime.
 */
async function broadcastToConversation(
  conversationId: string,
  event: string,
  data: unknown,
  alsoQueueAdmins = false
) {
  const participants = await listParticipants(conversationId);
  const targetUserIds = new Set(participants.map((p) => p.user_id));

  for (const userId of targetUserIds) {
    const sockets = clientsByUser.get(userId);
    if (sockets) for (const ws of sockets) sendJson(ws, { event, data });
  }

  if (alsoQueueAdmins) {
    const hasAdmin = await hasAdminParticipant(conversationId);
    if (!hasAdmin) {
      for (const ws of adminSockets) {
        if (!ws.userId || !targetUserIds.has(ws.userId)) sendJson(ws, { event, data });
      }
    }
  }
}

/**
 * Setup WS /ws/chat. Auth via token di query string handshake (`?token=<access_token>`),
 * karena browser WebSocket API tidak bisa mengirim custom header Authorization saat handshake.
 */
export function setupChatWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url ?? "", "http://localhost");
    if (url.pathname !== "/ws/chat") return; // biarkan handler upgrade path lain yang menangani

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

  wss.on("connection", (ws: AuthedSocket, _req: IncomingMessage, payload: { sub: string; role: string }) => {
    registerClient(payload.sub, payload.role, ws);
    sendJson(ws, { event: "connected", data: { user_id: payload.sub } });

    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === "message:new") {
          await sendMessageService({
            conversationId: msg.conversation_id,
            senderId: ws.userId!,
            senderRole: ws.userRole!,
            content: msg.content,
            messageType: msg.message_type,
            mediaAssetId: msg.media_asset_id,
          });
          // Broadcast ke partisipan dilakukan oleh listener chatEvents di bawah
          // (dipicu otomatis begitu insertMessage sukses), jadi tidak dobel di sini.
        } else if (msg.type === "message:read") {
          await markReadService({
            conversationId: msg.conversation_id,
            userId: ws.userId!,
            userRole: ws.userRole!,
            upToMessageId: msg.up_to_message_id,
          });
        } else {
          sendJson(ws, { event: "error", data: { message: `Tipe event tidak dikenal: ${msg.type}` } });
        }
      } catch (err) {
        sendJson(ws, { event: "error", data: { message: "Payload WS tidak valid atau aksi gagal" } });
        logger.warn({ err }, "WS /ws/chat: gagal proses pesan masuk");
      }
    });

    ws.on("close", () => unregisterClient(ws));
    ws.on("error", (err) => logger.warn({ err }, "WS /ws/chat: socket error"));
  });

  chatEvents.on("message:new", (payload: MessageNewEvent) => {
    broadcastToConversation(payload.conversation_id, "message:new", payload.message, true).catch((err) =>
      logger.error({ err }, "Gagal broadcast message:new")
    );
  });

  chatEvents.on("message:read", (payload: MessageReadEvent) => {
    broadcastToConversation(payload.conversation_id, "message:read", payload).catch((err) =>
      logger.error({ err }, "Gagal broadcast message:read")
    );
  });

  chatEvents.on("conversation:closed", (payload: ConversationClosedEvent) => {
    broadcastToConversation(payload.conversation_id, "conversation:closed", payload).catch((err) =>
      logger.error({ err }, "Gagal broadcast conversation:closed")
    );
  });

  logger.info("WebSocket /ws/chat siap menerima koneksi");
  return wss;
}
