import * as brevo from "@getbrevo/brevo";
import { env } from "../../config/env";

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, env.BREVO_API_KEY);

export interface SendBrevoEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
}

/** Panggilan mentah ke Brevo Transactional Email API. Return message id provider. */
export async function sendViaBrevo(params: SendBrevoEmailParams): Promise<string> {
  const email = new brevo.SendSmtpEmail();
  email.sender = { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME };
  email.to = [{ email: params.to }];
  email.subject = params.subject;
  email.htmlContent = params.htmlContent;

  const response = await apiInstance.sendTransacEmail(email);
  // messageId biasanya ada di response.body.messageId
  return (response.body as { messageId?: string })?.messageId ?? "";
}
