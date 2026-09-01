// app/CheckSession.tsx
"use client";

import PageLoading from "@/components/PageLoading";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
const PUBLIC_ROUTES = ['/login', '/forget_password', '/reset-password'];

interface CheckSessionProps {
  children: React.ReactNode;
}

export function CheckSession({ children }: CheckSessionProps) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [confirmed, setConfirmed] = useState(false);

  const mustCheck = !PUBLIC_ROUTES.includes(pathname);
  // Session หมดอายุ → ค้าง dialog ไว้จนกว่า user จะกดตกลง
  const isExpired = mustCheck && status === "unauthenticated";
  const showExpiredDialog = isExpired && !confirmed;

  const handleConfirmExpired = () => {
    setConfirmed(true);
    router.push("/login");
    signOut({ redirect: false }).catch((err) => {
      console.error("SignOut error:", err);
    });
  };

  // แสดง loading เมื่อ checking
  if (mustCheck && status === "loading") {
    return <PageLoading />;
  }

  // ถ้า unauthenticated ให้ค้าง dialog ไว้จนกว่าจะกดตกลง
  if (showExpiredDialog) {
    return (
      <AlertDialog open={showExpiredDialog}>
        <AlertDialogContent
          onEscapeKeyDown={(e: KeyboardEvent) => e.preventDefault()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>เซสชันหมดอายุ</AlertDialogTitle>
            <AlertDialogDescription>
              เซสชันของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้ง
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleConfirmExpired}>
              ตกลง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // กด "ตกลง" แล้ว กำลัง redirect ไป login อยู่
  if (isExpired && confirmed) {
    return <PageLoading />;
  }

  return <>{children}</>;
}