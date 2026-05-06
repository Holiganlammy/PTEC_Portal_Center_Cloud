// utils/authOptions.ts - เก็บแค่ session ID (แก้ไข cookie ใหญ่เกิน)
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureADProvider from "next-auth/providers/azure-ad";
import type { User } from "next-auth";
import { randomUUID } from "crypto";

let isTokenExpired = false;

// กำหนดเวลาหมดอายุ (นาที)
const SESSION_MAX_AGE = 240; // 4 ชั่วโมง = 240 นาที

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        response: { label: "Response", type: "json" },
        responseLogin: { label: "Response Login", type: "json" },
        responseCondition: { label: "Response Condition", type: "text" },
      },

      async authorize(credentials): Promise<User | null> {
        try {
          if (credentials?.response) {
            type OTPResponse = {
              access_token: string;
              user: {
                userid?: string;
                UserID: string;
                UserCode: string;
                fristName: string;
                lastName: string;
                Email: string;
                img_profile: string;
                role_id: number;
                branchid: number;
                depid: number;
              };
            };

            const parsedResponse = JSON.parse(credentials.response) as OTPResponse;
            const user = parsedResponse.user;
            const token = parsedResponse.access_token;

            isTokenExpired = false;

            return {
              id: user.userid?.toString() ?? "",
              UserID: parseInt(user.UserID),
              UserCode: user.UserCode,
              fristName: user.fristName,
              lastName: user.lastName,
              Email: user.Email,
              access_token: token,
              img_profile: user.img_profile,
              role_id: user.role_id,
              branchid: user.branchid,
              depid: user.depid,
              loginMethod: 'credentials',
            };
          }

          if (credentials?.responseCondition === 'pass' && credentials?.responseLogin) {
            type ResponseLogin = {
              access_token: string;
              user: {
                userid?: string;
                UserID: string;
                UserCode: string;
                fristName: string;
                lastName: string;
                Email: string;
                img_profile: string;
                role_id: number;
                branchid: number;
                depid: number;
              };
            };

            const parsedResponse = JSON.parse(credentials.responseLogin) as ResponseLogin;
            const user = parsedResponse.user;
            const token = parsedResponse.access_token;
            isTokenExpired = false;

            return {
              id: user.userid?.toString() ?? "",
              UserID: parseInt(user.UserID),
              UserCode: user.UserCode,
              fristName: user.fristName,
              lastName: user.lastName,
              Email: user.Email,
              access_token: token,
              img_profile: user.img_profile,
              role_id: user.role_id,
              branchid: user.branchid,
              depid: user.depid,
              loginMethod: 'credentials',
            };
          }

          throw new Error("INVALID_CREDENTIALS");
        } catch (error) {
          console.error("Authorize error:", error);
          throw error;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'azure-ad') {
        try {
          const email = user.email;
          const name = user.name;
          const microsoftToken = account.access_token;

          console.log('[Microsoft]  Login successful');
          console.log('[Microsoft] Email:', email);

          const sessionId = randomUUID();
          
          // เรียก backend เพื่อเก็บ Microsoft token และดึงข้อมูล user
          const response = await fetch(`${process.env.Localhost_API}/microsoft-session/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              microsoftToken,
              email,
              name,
              source: 'portal',
            }),
          });

          if (!response.ok) {
            console.error('[Microsoft] ❌ Failed to save session');
            return false;
          }

          const data = await response.json();
          console.log('[Microsoft]  Session saved:', data);

          // Parse userData จาก response
          const userData = data.userData;

          // เก็บข้อมูลจาก userData ลง user object
          user.UserID = userData.userId;
          user.UserCode = userData.userCode;
          user.fristName = userData.fristName;
          user.lastName = userData.lastName;
          user.Email = userData.email;
          user.img_profile = userData.img_profile;
          user.role_id = userData.role;
          user.branchid = userData.branchid;
          user.depid = userData.depid;
          user.access_token = microsoftToken || '';
          user.sessionId = data.sessionId;
          user.loginMethod = 'microsoft';
          user.expiresAt = Date.now() + (SESSION_MAX_AGE * 60 * 1000);

          isTokenExpired = false;
          return true;

        } catch (error) {
          console.error('[Microsoft] ❌ SignIn error:', error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        // เก็บข้อมูลเหมือนกันทั้ง Microsoft และ Credentials
        token.UserID = user.UserID;
        token.UserCode = user.UserCode;
        token.fristName = user.fristName;
        token.lastName = user.lastName;
        token.Email = user.Email;
        token.access_token = user.access_token;
        token.img_profile = user.img_profile;
        token.role_id = user.role_id;
        token.branchid = user.branchid;
        token.depid = user.depid;
        token.loginMethod = user.loginMethod;
        token.expiresAt = Date.now() + (SESSION_MAX_AGE * 60 * 1000);

        if (user.loginMethod === 'microsoft') {
          token.sessionId = user.sessionId;
        }
      }

      // เช็คเวลาหมดอายุ
      if (token.expiresAt && Date.now() > (token.expiresAt as number)) {
        console.log('⚠️ Session expired');
        isTokenExpired = true;
        return {};
      }

      if (isTokenExpired) {
        return {};
      }

      return token;
    },

    async session({ session, token }) {
      if (!token || Object.keys(token).length === 0) {
        return {
          ...session,
          user: undefined,
          expires: new Date(0).toISOString(),
        };
      }

      if (typeof token === 'object') {
        // Session เหมือนกันทุก login method
        session.user = {
          ...(session.user || {}),
          UserID: token.UserID as number,
          UserCode: token.UserCode as string,
          fristName: token.fristName as string,
          lastName: token.lastName as string,
          Email: token.Email as string,
          access_token: token.access_token as string,
          img_profile: token.img_profile as string,
          role_id: token.role_id as number,
          branchid: token.branchid as number,
          depid: token.depid as number,
          loginMethod: token.loginMethod as string,
          expiresAt: token.expiresAt as number,
        };

        // เพิ่ม sessionId ถ้าเป็น Microsoft login
        if (token.loginMethod === 'microsoft') {
          session.user.sessionId = token.sessionId as string;
        }
      }

      return session;
    },
  },

  events: {
    async signOut(message) {
      console.log("User signed out:", message);
      isTokenExpired = false;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE * 60, // วินาที
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
};