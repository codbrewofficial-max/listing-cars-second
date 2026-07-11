import { countSentToday, insertEmailLog, listEmailLogs, type EmailPurpose } from "./email.repository";
import { getEmailDailyLimit } from "../platform-settings/settings.service";
import { sendViaBrevo } from "./brevo.client";
import { logger } from "../../config/logger";

interface SendEmailParams {
  to: string;
  purpose: EmailPurpose;
  subject: string;
  html: string;
  relatedUserId?: string | null;
}

export interface SendEmailResult {
  status: "sent" | "failed" | "skipped_limit";
}

/**
 * Service terpusat pengiriman email, dipakai oleh SEMUA modul yang butuh kirim email
 * (verification, reset password, nanti notifikasi lain).
 *
 * Alur (sesuai 02c-addendum §6):
 * 1. Hitung email status='sent' hari ini.
 * 2. Ambil limit dari platform_settings.email_daily_limit (default 250).
 * 3. Jika limit terlampaui -> log status skipped_limit, tidak panggil Brevo.
 * 4. Jika masih dalam kuota -> panggil Brevo, log hasilnya (sent/failed).
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const [sentToday, limit] = await Promise.all([countSentToday(), getEmailDailyLimit()]);

  if (sentToday >= limit) {
    await insertEmailLog({
      recipientEmail: params.to,
      purpose: params.purpose,
      status: "skipped_limit",
      relatedUserId: params.relatedUserId ?? null,
    });
    logger.warn({ to: params.to, purpose: params.purpose }, "Email skipped: daily quota exceeded");
    return { status: "skipped_limit" };
  }

  try {
    const messageId = await sendViaBrevo({ to: params.to, subject: params.subject, htmlContent: params.html });
    await insertEmailLog({
      recipientEmail: params.to,
      purpose: params.purpose,
      status: "sent",
      providerMessageId: messageId,
      relatedUserId: params.relatedUserId ?? null,
    });
    return { status: "sent" };
  } catch (err) {
    await insertEmailLog({
      recipientEmail: params.to,
      purpose: params.purpose,
      status: "failed",
      errorMessage: err instanceof Error ? err.message : "Unknown error",
      relatedUserId: params.relatedUserId ?? null,
    });
    logger.error({ err, to: params.to, purpose: params.purpose }, "Email send failed");
    return { status: "failed" };
  }
}

export async function listEmailLogsService(filters: {
  purpose?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit: number;
  offset: number;
}) {
  return listEmailLogs(filters);
}

export async function getUsageTodayService() {
  const [sentToday, limit] = await Promise.all([countSentToday(), getEmailDailyLimit()]);
  return {
    sent_today: sentToday,
    limit,
    remaining: Math.max(0, limit - sentToday),
    date: new Date().toISOString().slice(0, 10),
  };
}
