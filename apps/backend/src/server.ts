import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { pool } from "./config/db";
import { setupChatWebSocket } from "./modules/chat/chat.ws";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Server berjalan di ${env.APP_BASE_URL} (port ${env.PORT}) [${env.NODE_ENV}]`);
});

// WS /ws/chat — attach ke http.Server yang sama dengan Express (bukan port terpisah)
setupChatWebSocket(server);

async function shutdown(signal: string) {
  logger.info(`Menerima ${signal}, mematikan server dengan baik...`);
  server.close(async () => {
    await pool.end();
    logger.info("Server & koneksi database ditutup.");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
