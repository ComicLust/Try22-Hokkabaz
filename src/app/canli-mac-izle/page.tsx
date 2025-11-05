import React from 'react'
import type { Metadata } from 'next'
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveMatchClient from "@/components/LiveMatchClient";
import SeoArticle from "@/components/SeoArticle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, Gift, Star, Award } from 'lucide-react'
import { getSeoRecord } from '@/lib/seo'

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/canli-mac-izle" />
      <main className="pt-3 md:pl-72">
        <div className="container mx-auto px-4 py-6">
          {/* Hero */}
          <section className="mb-8 md:mb-10">
            <h1 className="sr-only">Canlı Maç İzle</h1>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gold text-background"><PlayCircle className="w-5 h-5" /></span>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-foreground">Canlı Maç İzle</div>
                    <p className="mt-1 text-sm md:text-base text-muted-foreground">
                      Derbi ve özel maç yayınlarını takip et; sponsor kampanyaları ve güvenilir sitelere hızlıca ulaş.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <a href="#canli-yayin" className="inline-flex items-center gap-2">
                    İzlemeye Geç
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href="/kampanyalar" className="inline-flex items-center gap-2">
                    <Star className="w-4 h-4" /> Kampanyalar
                  </a>
                </Button>
              </div>
            </div>

            {/* Yönlendirme blokları */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="/bonuslar" className="block">
                <Card className="rounded-lg hover:border-gold transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Gift className="w-5 h-5 text-gold" /> Bonuslar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Güncel hoş geldin ve yatırım bonuslarını keşfet.</p>
                  </CardContent>
                </Card>
              </a>
              <a href="/kampanyalar" className="block">
                <Card className="rounded-lg hover:border-gold transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Star className="w-5 h-5 text-gold" /> Aktif Kampanyalar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Öne çıkan fırsatları ve devam eden kampanyaları görüntüle.</p>
                  </CardContent>
                </Card>
              </a>
              <a href="/guvenilir-bahis-siteleri-listesi" className="block">
                <Card className="rounded-lg hover:border-gold transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="w-5 h-5 text-gold" /> Güvenilir Siteler
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Editör onaylı, yüksek puanlı sitelerin tam listesi.</p>
                  </CardContent>
                </Card>
              </a>
            </div>
          </section>

          <span id="canli-yayin" className="block" />
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