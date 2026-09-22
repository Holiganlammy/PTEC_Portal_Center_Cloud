import * as fs from 'fs';
import * as path from 'path';
import {
  sendMailViaGraph,
  GraphInlineAttachment,
} from './microsoft-graph-mail.service';

export async function sendResetPasswordWithGmailAPI(
  to: string,
  fullname: string,
  resetLink: string,
) {
  const logoPath = path.resolve(process.cwd(), 'src/images/Picture1.png');

  // 🔹 HTML Template ของ Reset Password
  const htmlTemplate = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
      <img src="cid:logo@ptec" alt="PTEC Logo" 
           style="max-width: 180px; height: auto; margin: 0 auto 20px; display: block;" />
      <h1 style="color: #333; margin: 0;">Password Reset Request</h1>
    </div>
    
    <div style="padding: 30px; background-color: #ffffff; border-radius: 8px;">
      <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
        สวัสดี ${fullname || 'ผู้ใช้งาน'},
      </p>
      
      <p style="font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 25px;">
        ระบบได้รับคำขอให้รีเซ็ตรหัสผ่านของคุณ หากคุณไม่ได้เป็นผู้ร้องขอ กรุณาเพิกเฉยต่ออีเมลฉบับนี้ 
        และรหัสผ่านของคุณจะไม่มีการเปลี่ยนแปลง
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" 
           style="background-color: #005BBB; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; font-weight: bold; 
                  display: inline-block;">
          Reset Your Password
        </a>
      </div>
      
      <p style="font-size: 12px; color: #999; margin-top: 30px;">
        ลิงก์นี้จะหมดอายุใน 30 นาที เพื่อความปลอดภัย
      </p>
      
      <p style="font-size: 12px; color: #999;">
        หากปุ่มไม่สามารถใช้งานได้ ให้นำลิงก์นี้ไปวางในแถบ URL ของเบราว์เซอร์:<br>
        <span style="word-break: break-all;">${resetLink}</span>
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 15px; text-align: center;">
      <p style="font-size: 12px; color: #666; margin: 0;">
        หากมีคำถามเพิ่มเติม กรุณาติดต่อทีมสนับสนุนของเรา
      </p>
    </div>

    <p style="font-size: 12px; color: #888; text-align: center; margin-top: 20px;">
      ขอแสดงความนับถือ<br/>PTEC Authentication Systems
    </p>
  </div>`;

  const subject = 'คำขอรีเซ็ตรหัสผ่าน (Password Reset Request)';

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
  await sendMailViaGraph({ to, subject, html: htmlTemplate, attachments });

  console.log(` ส่ง Reset Password ไปยัง ${to} สำเร็จ`);
}
