import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relevance Cloud Engine",
  description: "SEO Relevance Cloud & Entity Analysis Tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
