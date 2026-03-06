import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Bankai.Hub",
  description: "Внутренняя платформа digital-агентства Bankai",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body className={`${inter.className} bg-[#1e1f21] text-slate-200 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
