import { getAllSettings, getPublicSettings, getSetting, upsertSetting } from "./settings.repository";
import { recordAuditLog } from "../audit-log/audit-log.service";

export async function getPublicSettingsService() {
  return getPublicSettings();
}

export async function getAllSettingsService() {
  return getAllSettings();
}

export async function isRegistrationOpen(): Promise<boolean> {
  const value = await getSetting<boolean>("registration_open");
  return value === true;
}

export async function getEmailDailyLimit(): Promise<number> {
  const value = await getSetting<number>("email_daily_limit");
  return typeof value === "number" ? value : 250;
}

export async function updateSettingService(params: {
  key: string;
  value: unknown;
  actorId: string;
  actorRole: string;
}) {
  const setting = await upsertSetting(params.key, params.value, params.actorId);
  await recordAuditLog({
    actorId: params.actorId,
    actorRole: params.actorRole,
    actionType: "update_platform_setting",
    targetEntity: "platform_settings",
    targetId: null,
    metadata: { key: params.key, value: params.value },
  });
  return setting;
}

export async function toggleRegistrationService(params: {
  registrationOpen: boolean;
  actorId: string;
  actorRole: string;
}) {
  return updateSettingService({
    key: "registration_open",
    value: params.registrationOpen,
    actorId: params.actorId,
    actorRole: params.actorRole,
  });
}
