import React from 'react'
import type { Metadata } from 'next'
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveMatchClient from "@/components/LiveMatchClient";
import SeoArticle from "@/components/SeoArticle";
import { getSeoRecord } from '@/lib/seo'

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/canli-mac-izle" />
      <main className="pt-3 md:pl-72">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gold mb-4">Canlı Maç İzle</h1>
          <p className="text-muted-foreground mb-6">Derbi ve özel maç yayınlarını bu sayfadan takip edebilir, sponsorlarımızın kampanyalarına göz atabilirsiniz.</p>
          <LiveMatchClient />
        </div>
      </main>
      <SeoArticle slug="canli-mac-izle" />
      <Footer />
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSeoRecord('/canli-mac-izle', ['canli-mac-izle']) as any
    const title = seo?.title ?? 'Canlı Maç İzle'
    const description = seo?.description ?? 'Derbi ve özel maç yayınlarını bu sayfadan takip edebilir, sponsorlarımızın kampanyalarına göz atabilirsiniz.'
    const keywords = seo?.keywords?.split(',').map((k: string) => k.trim()).filter(Boolean)
    const ogTitle = seo?.ogTitle ?? title
    const ogDescription = seo?.ogDescription ?? description
    const twitterTitle = seo?.twitterTitle ?? title
    const twitterDescription = seo?.twitterDescription ?? description
    const images = seo?.ogImageUrl ? [seo.ogImageUrl] : ['/uploads/1760732951329-fzch33159aq.jpg']

    return {
      title,
      description,
      keywords,
      alternates: seo?.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        url: 'https://hokkabaz.bet/canli-mac-izle',
        siteName: 'Hokkabaz',
        type: 'website',
        locale: 'tr_TR',
        images,
      },
      twitter: {
        card: 'summary_large_image',
        title: twitterTitle,
        description: twitterDescription,
        images: seo?.twitterImageUrl ? [seo.twitterImageUrl] : ['/uploads/1760732951329-fzch33159aq.jpg'],
      },
      robots: {
        index: seo?.robotsIndex ?? true,
        follow: seo?.robotsFollow ?? true,
      },
      other: seo?.structuredData ? { structuredData: JSON.stringify(seo.structuredData) } : undefined,
    }
  } catch {
    return {
      title: 'Canlı Maç İzle',
      description: 'Derbi ve özel maç yayınlarını bu sayfadan takip edebilir, sponsorlarımızın kampanyalarına göz atabilirsiniz.',
    }
  }
}