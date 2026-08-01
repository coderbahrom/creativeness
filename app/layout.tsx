import type { Metadata } from "next";
import { Nunito, Literata } from "next/font/google";
import "./globals.css";

// Interfeys ovozi: yumaloq, bolaga yaqin grotesk.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Ertak ovozi: o'quv kitobi serifi. Ikki ovoz qarama-qarshi o'qda turadi —
// bola matnni o'qiyaptimi yoki interfeys bilan ishlayaptimi, shundan bilinadi.
const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ertak Bog'i",
  description:
    "Naima.CreativRead metodikasining amaliy platformasi: boshlang'ich sinflar uchun kreativ o'qish, Torrance 4 mezoni bo'yicha baholash bilan",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz">
      <body className={`${nunito.variable} ${literata.variable} antialiased`}>{children}</body>
    </html>
  );
}
