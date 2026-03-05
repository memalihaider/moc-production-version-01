// import type { Metadata } from "next";
// import { Poppins, Playfair_Display, Inconsolata } from "next/font/google";
// import "./globals.css";
// import { Providers } from "@/components/providers";

// const poppins = Poppins({
//   variable: "--font-poppins",
//   subsets: ["latin"],
//   weight: ["300", "400", "500", "600", "700"],
// });

// const playfairDisplay = Playfair_Display({
//   variable: "--font-playfair-display",
//   subsets: ["latin"],
//   weight: ["400", "700"],
// });

// const inconsolata = Inconsolata({
//   variable: "--font-inconsolata",
//   subsets: ["latin"],
// });

// export const metadata: Metadata = {
//   title: "Man of Cave Management System",
//   description: "Man of Cave booking and management system",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body
//         className={`${poppins.variable} ${inconsolata.variable} ${playfairDisplay.variable} antialiased font-sans`}
//       >
//         <Providers>
//           {children}
//         </Providers>
//       </body>
//     </html>
//   );
// }


// new codee
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