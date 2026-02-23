import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { User } from 'src/PTEC_USERIGHT/domain/model/ptec_useright.interface';
import * as path from 'path';

export function getOtpMailOptions(
  to: string,
  user: User,
  otp: string,
): SMTPTransport.MailOptions {
  return {
    from: process.env.Email,
    to,
    subject: 'รหัสยืนยัน (OTP) สำหรับการเข้าสู่ระบบ',
    text: `รหัส OTP ของคุณคือ: ${otp}\nรหัสนี้จะหมดอายุภายใน 5 นาที`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <img src="cid:logo@ptec" alt="PTEC Logo" style="width: 300px; height: auto; margin: 0 auto 20px; display: block;" />
          <h1 style="color: #333; margin: 0;">Password Reset Request</h1>
        </div>
        <h2 style="color: #005BBB; text-align: center;">ระบบยืนยันตัวตน PTEC</h2>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <p>เรียนผู้ใช้งาน ${user.fristName} ${user.lastName} Initial: ${user.UserCode},</p>
          <p>คุณได้ร้องขอรหัส OTP สำหรับเข้าสู่ระบบ</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #d32f2f; background-color: #fff; padding: 10px 20px; border: 2px solid #d32f2f; border-radius: 4px;">${otp}</span>
          </div>
          <p>รหัสนี้จะหมดอายุใน <strong>5 นาที</strong></p>
          <p>หากคุณไม่ได้ร้องขอ กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
        </div>
        <p style="font-size: 12px; color: #888; text-align: center; margin-top: 20px;">
          ขอแสดงความนับถือ<br/>ระบบยืนยันตัวตน PTEC Authentication Systems
        </p>
      </div>
    `,
    attachments: [
      {
        filename: 'Picture1.png',
        path: path.resolve(process.cwd(), 'src/images/Picture1.png'),
        cid: 'logo@ptec',
      },
    ],
  };
}
