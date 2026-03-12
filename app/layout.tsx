import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers"; // ✅ Bas yeh import

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", weight: ['400', '500', '600', '700', '800', '900'] });

export const metadata: Metadata = {
  title: "MAN OF CAVE",
  description: "MAN OF CAVE – Premium grooming services for the modern gentleman.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${cinzel.variable} ${inter.className}`}>
        <Providers>{children}</Providers> {/* ✅ Bas yeh */}
      </body>
    </html>
  );
}