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

import vehiclesRoutes, { adminVehiclesRouter } from "./modules/vehicles/vehicles.routes";
import sparePartsRoutes, { adminSparePartsRouter } from "./modules/spare-parts/spare-parts.routes";
import {
  meVisitRequestsRouter,
  vehicleVisitRequestsRouter,
  visitPhotosRouter,
  visitRequestsRouter,
} from "./modules/visits/visits.routes";
import chatRoutes from "./modules/chat/chat.routes";
import transactionsRoutes, { myTransactionsRouter } from "./modules/transactions/transactions.routes";

import leadsRoutes from "./modules/leads/leads.routes";
import articlesRoutes, { adminArticlesRouter } from "./modules/articles/articles.routes";
import notificationsRoutes from "./modules/notifications/notifications.routes";
import insightsRoutes from "./modules/insights/insights.routes";
import auditLogRoutes from "./modules/audit-log/audit-log.routes";

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

  // ---- Modul fitur unggulan (Chat 2): Product, Kunjungan, Chat Realtime, Transaksi ----

  // Product Management — Kendaraan (§2). Router "vehicleVisitRequestsRouter" (POST
  // /api/vehicles/:id/visit-requests) dipasang di path yang sama, tidak konflik karena
  // sub-path-nya berbeda dari router utama.
  app.use("/api/vehicles", vehiclesRoutes);
  app.use("/api/vehicles", vehicleVisitRequestsRouter);
  app.use("/api/admin/vehicles", adminVehiclesRouter);

  // Product Management — Suku Cadang (§3)
  app.use("/api/spare-parts", sparePartsRoutes);
  app.use("/api/admin/spare-parts", adminSparePartsRouter);

  // Inspeksi Dokumen & Kunjungan Fisik (§4) — document-status ada di modul vehicles,
  // sisanya (visit-requests, visit-photos) di modul visits.
  app.use("/api/visit-requests", visitRequestsRouter);
  app.use("/api/me/visit-requests", meVisitRequestsRouter);
  app.use("/api/visit-photos", visitPhotosRouter);

  // Chat Realtime (§5) — REST fallback; realtime utama via WS /ws/chat (didaftarkan di server.ts)
  app.use("/api/conversations", chatRoutes);

  // Transaksi & Payment Manual / Escrow-lite (§6)
  app.use("/api/transactions", transactionsRoutes);
  app.use("/api/me/transactions", myTransactionsRouter);

  // ---- Modul pendukung (Chat 3): Leads, Article, Notifikasi, Tracking Insight, Audit Log ----

  // Leads System (§7)
  app.use("/api/leads", leadsRoutes);

  // Article Management (§8)
  app.use("/api/articles", articlesRoutes);
  app.use("/api/admin/articles", adminArticlesRouter);

  // Notifikasi Realtime (§10) — REST; realtime utama via WS /ws/notifications (didaftarkan di server.ts)
  app.use("/api/notifications", notificationsRoutes);

  // Tracking Insight (§11)
  app.use("/api/insights", insightsRoutes);

  // Audit Log (§12) — query endpoint; logic INSERT sudah ada sejak Chat 1 & 2 (recordAuditLog)
  app.use("/api/audit-logs", auditLogRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
