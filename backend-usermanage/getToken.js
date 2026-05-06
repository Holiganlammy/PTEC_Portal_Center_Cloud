import fs from "fs";
import readline from "readline";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];
const CREDENTIALS_PATH = "./credentials.json";
const TOKEN_PATH = "./token.json";

async function getAccessToken() {
  const content = fs.readFileSync(CREDENTIALS_PATH, "utf8");
  const credentials = JSON.parse(content);
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("🔗 เปิดลิงก์นี้ใน browser แล้ว login ด้วย noreply.ptec@gmail.com:");
  console.log(authUrl);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question("📥 วางรหัส (code) ที่ได้จาก Google: ", async (code) => {
    rl.close();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log(" ได้ Token แล้ว เก็บไว้ที่ token.json");
  });
}

getAccessToken();
