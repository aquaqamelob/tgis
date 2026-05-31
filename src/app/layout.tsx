import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TGiS Quiz",
  description: "Quiz z teorii grafów – pytania z kolokwium",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
