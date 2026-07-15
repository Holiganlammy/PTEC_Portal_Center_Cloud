import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      UserID: number;
      UserCode: string;
      fristName?: string;
      lastName?: string;
      Email?: string;
      access_token?: string;
      img_profile?: string;
      role_id?: number;
      branchid?: number;
      depid?: number;
      loginMethod?: string;
      expiresAt?: number;
      sessionId?: string;
      name?: string;
      source?: string;
    };
  }
  interface User {
    UserID: number;
    UserCode: string;
    fristName?: string;
    lastName?: string;
    Email?: string;
    access_token: string;
    img_profile?: string;
    role_id?: number;
    branchid?: number;
    accessTokenExpires?: number;
    depid?:number;
    loginMethod?: string;
    loginTime?: number;
    expiresAt?: number;
    sessionId?: string;
    source?: string;
  }

  interface JWT {
    UserID: number;
    UserCode: string;
    fristName?: string;
    lastName?: string;
    Email?: string;
    access_token?: string;
    img_profile?: string;
    role_id?: number;
    source?: string;
  }
}
