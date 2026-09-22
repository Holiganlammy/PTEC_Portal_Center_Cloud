import * as fs from 'fs';
import * as path from 'path';
import { User } from 'src/PTEC_USERIGHT/domain/model/ptec_useright.interface';
import {
  sendMailViaGraph,
  GraphInlineAttachment,
} from './microsoft-graph-mail.service';

export async function sendOtpWithGmailAPI(
  to: string,
  otp: string,
  user?: User,
) {
  const logoPath = path.resolve(process.cwd(), 'src/images/Picture1.png');

  const htmlTemplate = `
  <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
      <img src="cid:logo@ptec" alt="PTEC Logo" 
    style="width: 200px; height: auto; margin: 0 auto 20px; display: block;" />
      <h1 style="color: #333; margin: 0;">Request OTP Login</h1>
    </div>
    <h2 style="color: #005BBB; text-align: center;">ระบบยืนยันตัวตน PTEC</h2>
    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
      <p>เรียนผู้ใช้งาน ${user?.fristName ?? ''} ${user?.lastName ?? ''} Initial: ${user?.UserCode ?? ''},</p>
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
  </div>`;

  const attachments: GraphInlineAttachment[] = [];
  try {
    if (fs.existsSync(logoPath)) {
      attachments.push({
        cid: 'logo@ptec',
        filename: 'Picture1.png',
        contentType: 'image/png',
        base64Content: fs.readFileSync(logoPath).toString('base64'),
        isInline: true,
      });
    }
  } catch (error) {
    console.error('Error reading logo file:', error);
  }

  // 🔹 ส่งเมลผ่าน Microsoft Graph API
  await sendMailViaGraph({
    to,
    subject: 'รหัสยืนยัน (OTP) สำหรับการเข้าสู่ระบบ',
    html: htmlTemplate,
    attachments,
  });

  console.log(` ส่ง OTP ไปยัง ${to} สำเร็จ`);
}
