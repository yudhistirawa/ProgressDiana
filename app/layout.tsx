import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import PageTransition from "@/components/PageTransition";

export const metadata: Metadata = {
  title: "Halaman Login - Sistem Dokumentasi Progres",
  description: "Silakan login untuk masuk ke Sistem Dokumentasi Progres",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  );
}
