import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hokkabaz - En Güvenilir Bahis Bonusları",
  description: "Türkiye'nin en güvenilir bahis ve casino sitelerinin güncel bonuslarını, deneme bonuslarını ve kampanyalarını bulun. Çevrimsiz bonuslar, anında çekim ve lisanslı siteler.",
  keywords: ["bahis bonusları", "deneme bonusu", "çevrimsiz bonus", "casino bonusu", "güvenilir bahis siteleri", "hoşgeldin bonusu", "bedava bonus", "bahis kampanyaları"],
  authors: [{ name: "Hokkabaz Team" }],
  openGraph: {
    title: "Hokkabaz - En Güvenilir Bahis Bonusları",
    description: "Türkiye'nin en güvenilir bahis ve casino sitelerinin güncel bonuslarını, deneme bonuslarını ve kampanyalarını bulun.",
    url: "https://hokkabaz.com",
    siteName: "Hokkabaz",
    type: "website",
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hokkabaz - En Güvenilir Bahis Bonusları",
    description: "Türkiye'nin en güvenilir bahis ve casino sitelerinin güncel bonuslarını, deneme bonuslarını ve kampanyalarını bulun.",
  },
  other: {
    "twitter:image": "https://hokkabaz.com/og-image.jpg",
    "og:image": "https://hokkabaz.com/og-image.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground overflow-x-hidden`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
