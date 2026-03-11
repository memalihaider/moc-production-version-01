import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers"; // ✅ Bas yeh import

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Man Of Cave",
  description: "Man Of Cave – Premium grooming services for the modern gentleman.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers> {/* ✅ Bas yeh */}
      </body>
    </html>
  );
}