import { createTransport } from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { getOtpMailOptions } from './emailTemplate';
import { User } from 'src/PTEC_USERIGHT/domain/model/ptec_useright.interface';

export async function sendOtpEmail(
  to: string,
  user: User,
  otp: string,
): Promise<void> {
  try {
    const transporter: Transporter<SMTPTransport.SentMessageInfo> =
      createTransport({
        service: 'gmail',
        auth: {
          user: process.env.Email,
          pass: process.env.Secret_Password,
        },
      });
    const emailTemplate = getOtpMailOptions(to, user, otp);

    const result = await transporter.sendMail(emailTemplate);

    console.log('Email sent successfully:', result.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
