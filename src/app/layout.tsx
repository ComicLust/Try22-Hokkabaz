import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import AnalyticsInjector from '@/components/AnalyticsInjector'
import SeoAutoInjector from '@/components/SeoAutoInjector'
import ExternalLinkTracker from '@/components/ExternalLinkTracker'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import Script from "next/script"
import { db } from '@/lib/db'
import { unstable_noStore as noStore } from 'next/cache'
import ScrollTopButton from '@/components/scroll-top-button/ScrollTopButton'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const GeistMonoInit = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hokkabaz.bet'
export const revalidate = 0

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Hokkabaz - En Güvenilir Bahis Bonusları",
  description: "Türkiye'nin en güvenilir bahis ve casino sitelerinin güncel bonuslarını, deneme bonuslarını ve kampanyalarını bulun. Çevrimsiz bonuslar, anında çekim ve lisanslı siteler.",
  keywords: ["bahis bonusları", "deneme bonusu", "çevrimsiz bonus", "casino bonusu", "güvenilir bahis siteleri", "hoşgeldin bonusu", "bedava bonus", "bahis kampanyaları"],
  authors: [{ name: "Hokkabaz Team" }],
  manifest: "/manifest.json",
  themeColor: "#ffd700",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes",
  openGraph: {
    title: "Hokkabaz - En Güvenilir Bahis Bonusları",
    description: "Türkiye'nin en güvenilir bahis ve casino sitelerinin güncel bonuslarını, deneme bonuslarını ve kampanyalarını bulun.",
    url: SITE_URL,
    siteName: "Hokkabaz",
    type: "website",
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hokkabaz - En Güvenilir Bahis Bonusları",
    description: "Türkiye'nin en güvenilir bahis ve casino sitelerinin güncel bonuslarını, deneme bonuslarını ve kampanyalarını bulun.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  noStore()
  const geistMono = GeistMonoInit
  let orgJsonLd: any
  try {
    const orgSetting = await (db as any).seoSetting.findUnique({
      where: { page: '__organization__' },
      select: { structuredData: true },
    })
    orgJsonLd = orgSetting?.structuredData
  } catch {
    orgJsonLd = null
  }
  const defaultOrg = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Hokkabaz",
    url: SITE_URL,
    logo: SITE_URL + "/logo.svg",
    image: SITE_URL + "/uploads/1760732951329-fzch33159aq.jpg"
  }
  if (!orgJsonLd) orgJsonLd = defaultOrg

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
                    var el = document.querySelector('style[data-next-hide-fouc]');
                    if (el && el.parentNode) el.parentNode.removeChild(el);
                    document.documentElement.style.removeProperty('--next-hide-fouc');
                  } catch {}
                }, 50);
              } catch {}
            })();
        `}</Script>
        <AnalyticsInjector />
        <Script id="global-org-jsonld" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(orgJsonLd)}
        </Script>
        <Script id="global-website-jsonld" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Hokkabaz",
            url: SITE_URL,
            potentialAction: {
              "@type": "SearchAction",
              target: SITE_URL + "/?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </Script>
        <SeoAutoInjector />
        <ExternalLinkTracker />
        <ServiceWorkerRegistration />
        {children}
        <Toaster />
        <ScrollTopButton offset={400} />
      </body>
    </html>
  );
}
