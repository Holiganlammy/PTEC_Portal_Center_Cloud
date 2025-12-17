// middleware.ts
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

//  เพิ่ม: Bypass SSL verification สำหรับ development
if (process.env.NODE_ENV === 'development' || process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const secret = process.env.NEXTAUTH_SECRET;

const menuCache = new Map<string, { paths: string[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function fetchUserAccessiblePaths(
  userId: number, 
  roleId: number,
  token: string = ""
) {
  const cacheKey = `${userId}-${roleId}`;
  const cached = menuCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[RBAC] 📦 Using cached paths for user ${userId} (role ${roleId})`);
    return cached.paths;
  }

  try {
    //  เพิ่ม error logging ที่ละเอียดขึ้น
    console.log(`[RBAC] 🔍 Fetching menu for user ${userId}...`);

    const res = await fetch(`${process.env.Localhost_API}/Apps_List_Menu`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ UserID: userId }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`[RBAC] ❌ Fetch menu fail for user ${userId}, status: ${res.status}`);
      
      if (res.status === 401) {
        console.error(`[AUTH] ❌ Token expired for user ${userId}`);
        return null;
      }
      
      return [];
    }

    const menus = await res.json();
    console.log(`[RBAC] 📋 Raw menus response:`, JSON.stringify(menus).substring(0, 200));
    
    const accessiblePaths = (menus || [])
      .filter((m: any) => m.path !== null && m.path !== undefined && m.path !== "")
      .map((m: any) => m.path);

    menuCache.set(cacheKey, {
      paths: accessiblePaths,
      timestamp: Date.now()
    });

    console.log(`[RBAC]  User ${userId} (role ${roleId}) accessible paths (${accessiblePaths.length}):`, accessiblePaths);
    return accessiblePaths;
  } catch (err) {
    //  แสดง error แบบละเอียด
    console.error("[RBAC] ❌ Middleware fetch error:", err);
    console.error("[RBAC] Error details:", {
      message: err instanceof Error ? err.message : 'Unknown error',
      cause: err instanceof Error ? err.cause : undefined,
      userId,
      roleId
    });
    return [];
  }
}

function isPathAllowed(requestPath: string, allowedPaths: string[]): boolean {
  const cleanRequestPath = requestPath.split("?")[0];

  for (const allowedPath of allowedPaths) {
    const cleanAllowedPath = allowedPath.split("?")[0];

    if (cleanRequestPath === cleanAllowedPath) {
      return true;
    }

    if (cleanAllowedPath.endsWith("/*")) {
      const basePath = cleanAllowedPath.slice(0, -2);
      if (cleanRequestPath === basePath || cleanRequestPath.startsWith(basePath + "/")) {
        return true;
      }
    }
  }

  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  //  ต้องเช็ค static files ก่อนทุกอย่าง
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  //  Public paths
  const publicPaths = [
    "/login", 
    "/forget_password", 
    "/reset-password", 
    "/unauthorized",
    "/api/auth",
  ];
  
  //  Home page
  if (pathname === "/home" || pathname === "/") {
    return NextResponse.next();
  }
  
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get token
  const token = await getToken({ req, secret });

  if (!token) {
    console.log(`[AUTH] ❌ No token for path: ${pathname}`);
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userId = token.UserID || token.userid || token.sub;
  const roleId = token.role_id;

  if (!userId) {
    console.log(`[AUTH] ❌ No userId in token for path: ${pathname}`);
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  const allowedPaths = await fetchUserAccessiblePaths(
    Number(userId), 
    Number(roleId),
    String(token.access_token || "")
  );

  if (allowedPaths === null) {
    console.log("[AUTH] ❌ Token expired (401 from API)");
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    loginUrl.searchParams.set("reason", "session_expired");
    return NextResponse.redirect(loginUrl);
  }

  if (allowedPaths.length === 0) {
    console.log(`[RBAC] ❌ No accessible paths for user ${userId}`);
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  const isAllowed = isPathAllowed(pathname, allowedPaths);

  if (!isAllowed) {
    console.warn(`[RBAC] ❌ User ${userId} (role ${roleId}) DENIED access to ${pathname}`);
    console.warn(`[RBAC] Allowed paths:`, allowedPaths);
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  console.log(`[RBAC]  User ${userId} (role ${roleId}) ALLOWED to access ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    //  แก้ matcher ให้ถูกต้อง - ต้อง exclude _next/static และ _next/image
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)",
  ],
};