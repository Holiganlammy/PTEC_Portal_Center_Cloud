import * as fs from 'fs';
import * as path from 'path';
import { google } from 'googleapis';
import { User } from 'src/PTEC_USERIGHT/domain/model/ptec_useright.interface';

interface GoogleCredentials {
  installed: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

interface GoogleToken {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date?: number;
}

export async function sendOtpWithGmailAPI(
  to: string,
  otp: string,
  user?: User,
) {
  const credentialsPath = path.resolve(process.cwd(), 'credentials.json');
  const tokenPath = path.resolve(process.cwd(), 'token.json');

  const credentials: GoogleCredentials = JSON.parse(
    fs.readFileSync(credentialsPath, 'utf8'),
  ) as GoogleCredentials;
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8')) as GoogleToken;

  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0],
  );

  oAuth2Client.setCredentials(token);
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

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

  // 🔹 สร้าง message body (ใช้ MIME multipart)
  const boundary = 'boundary_ptec_' + Date.now();

  const messageParts = [
    `From: PTEC Authentication<${process.env.Email}>`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from('รหัสยืนยัน (OTP) สำหรับการเข้าสู่ระบบ').toString('base64')}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/related; boundary=${boundary}`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    htmlTemplate,
    '',
    `--${boundary}`,
    'Content-Type: image/png',
    'Content-Transfer-Encoding: base64',
    'Content-ID: <logo@ptec>',
    '',
    fs.readFileSync(logoPath).toString('base64'),
    '',
    `--${boundary}--`,
  ];

  const rawMessage = messageParts.join('\n');

  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // 🔹 ส่งเมลผ่าน Gmail API
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage },
  });

  console.log(` ส่ง OTP ไปยัง ${to} สำเร็จ`);
}
