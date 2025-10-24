import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import AnalyticsInjector from '@/components/AnalyticsInjector'
import SeoAutoInjector from '@/components/SeoAutoInjector'
import ExternalLinkTracker from '@/components/ExternalLinkTracker'
// removed: import PermissionPrompt from '@/components/push/PermissionPrompt'
import Script from "next/script"
// removed: import { Suspense } from "react"

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
}: Readonly<{ children: React.ReactNode }>) {
  const ONE_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || ''
  const ONE_SAFARI_WEB_ID = process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID || ''
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground overflow-x-hidden`}>
        <Script id="hydration-fix" strategy="beforeInteractive">{`
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

                // Fail-safe: Next.js FOUC gizleme stilini kaldır ve gövdeyi görünür tut
                setTimeout(function(){
                  try {
                    var foucStyle = document.querySelector('style[data-next-hide-fouc]');
                    if (foucStyle && foucStyle.parentNode) {
                      foucStyle.parentNode.removeChild(foucStyle);
                    }
                    var bodyDisplay = window.getComputedStyle(b).display;
                    if (bodyDisplay === 'none') {
                      b.style.display = 'block';
                    }
                  } catch(_e){}
                }, 1000);
              } catch(e) {}
            })();
          `}</Script>
        {children}
        <Toaster />
        <SeoAutoInjector />
        <AnalyticsInjector />
        {/* OneSignal Web SDK (v16) */}
        {ONE_APP_ID && process.env.NODE_ENV === 'production' && (
          <>
            <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
            <Script id="onesignal-init" strategy="afterInteractive">{`
              window.OneSignalDeferred = window.OneSignalDeferred || [];
              OneSignalDeferred.push(async function(OneSignal) {
                await OneSignal.init({
                  appId: '${ONE_APP_ID}',
                  ${""}
                  ${""}
                  ${ONE_SAFARI_WEB_ID ? `safari_web_id: '${ONE_SAFARI_WEB_ID}',` : ''}
                  notifyButton: { enable: true },
                });
              });
            `}</Script>
          </>
        )}
        {/* Dış linkleri otomatik izleme */}
        <ExternalLinkTracker />
      </body>
    </html>
  )
}
