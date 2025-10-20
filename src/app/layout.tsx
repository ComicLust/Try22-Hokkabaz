import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import AnalyticsInjector from '@/components/AnalyticsInjector'
import SeoAutoInjector from '@/components/SeoAutoInjector'
import ExternalLinkTracker from '@/components/ExternalLinkTracker'
import PermissionPrompt from '@/components/push/PermissionPrompt'
import Script from "next/script"
import { Suspense } from "react"

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
        <Script id="hydration-fix" strategy="beforeInteractive">
          {`
            (function(){
              try {
                var b = document.body;
                if (!b) return;
                var attrs = ['cz-shortcut-listen','data-new-gr-c-s-check-loaded','data-gr-ext-installed','data-lt-installed'];
                var clean = function(){
                  attrs.forEach(function(a){ if (b.hasAttribute(a)) { b.removeAttribute(a); } });
                };
                clean();
                var obs = new MutationObserver(function(mutations){
                  for (var i=0;i<mutations.length;i++){
                    var m = mutations[i];
                    if (m.type === 'attributes' && attrs.indexOf(m.attributeName) !== -1) { clean(); }
                  }
                });
                obs.observe(b, { attributes: true, attributeFilter: attrs });
              } catch(e) {}
            })();
          `}
        </Script>
        {children}
        <Toaster />
        <SeoAutoInjector />
        <AnalyticsInjector />
        <Suspense fallback={null}>
          <PermissionPrompt />
        </Suspense>
        {/* Dış linkleri otomatik izleme */}
        <ExternalLinkTracker />
      </body>
    </html>
  );
}
