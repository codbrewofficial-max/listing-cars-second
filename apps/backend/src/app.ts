import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { globalRateLimiter } from "./middlewares/rateLimiter";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";

import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import settingsRoutes from "./modules/platform-settings/settings.routes";
import mediaRoutes from "./modules/media/media.routes";
import emailLogsRoutes from "./modules/email/email-logs.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(pinoHttp({ logger }));
  app.use(globalRateLimiter);

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
  });

  // ---- Modul Fondasi (Chat 1) ----
  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/media", mediaRoutes);
  app.use("/api/email-logs", emailLogsRoutes);

  // ---- Modul fitur unggulan (Product, Chat, Transaksi, dll) akan didaftarkan
  //      di sini pada chat-chat berikutnya, mengikuti pola yang sama. ----

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
