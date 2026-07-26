import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Ertak Bog'i",
  description:
    "Boshlang'ich sinflar uchun kreativ o'qish platformasi — Torrance 4 mezoni bo'yicha baholash bilan",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz">
      <body className={`${nunito.variable} antialiased`}>{children}</body>
    </html>
  );
}
