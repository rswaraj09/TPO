import { Resend } from "resend";
import logger from "../../utils/logger/logger";

let resend: Resend | null = null;

interface SendMailArgs {
  to: string | string[];
  subject: string;
  html: string;
}

export const sendMail = async ({ to, subject, html }: SendMailArgs): Promise<boolean> => {
  if (!process.env.RESEND_API_KEY) {
    logger.error("RESEND_API_KEY is not defined in environment variables");
    return false;
  }

  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "TPO Vishwaniketan <noreply@example.com>";

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      logger.error({ error, to, subject }, "Resend email failed");
      return false;
    }

    logger.info({ id: data?.id, to, subject }, "Email sent");
    return true;
  } catch (error) {
    logger.error({ error }, "Email send exception");
    return false;
  }
};
