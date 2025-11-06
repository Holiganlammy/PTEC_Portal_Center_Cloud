// app/layout.tsx
import "./globals.css";
import { Providers } from "./AppWrapper";
import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import { SessionMonitor } from "@/components/SessionMonitor/SessionManagement";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PTEC Portal Systems",
  description: "PTEC Portal Systems",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="overflow-hidden">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <SessionMonitor />
          {children}
        </Providers>
      </body>
    </html>
  );
}