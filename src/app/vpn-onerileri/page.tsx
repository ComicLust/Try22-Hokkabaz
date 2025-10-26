import React from 'react'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { db } from '@/lib/db'
import { Shield, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { readFile } from 'fs/promises'
import path from 'path'
import SeoArticle from '@/components/SeoArticle'

export const dynamic = 'force-dynamic'

export default async function VpnOnerileriPage() {
  // SEO settings from DB if exists
  let title = 'VPN Önerileri'
  let description = 'Türkiye’de engellenmiş sitelere erişim için ücretsiz ve güvenilir seçenekler.'
  try {
    const seo = await (db as any).seoSetting.findUnique({ where: { page: '/vpn-onerileri' } })
    title = seo?.title ?? title
    description = seo?.description ?? description
  } catch {}

  // Dinamik öğeleri dosyadan oku
  let items: Array<{
    name: string
    plan: 'free' | 'paid'
    locations: string[]
    description: string
    href: string
    features?: string[]
    imageUrl?: string
  }> = []
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'vpn-items.json')
    const content = await readFile(filePath, 'utf-8')
    items = JSON.parse(content)
  } catch {}

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-16 md:pt-8 pb-8 w-full flex-1 space-y-8 md:pl-72">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </header>

        <section className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.name}
                className="border border-border rounded-lg p-4 bg-card text-foreground flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={`${item.name} logo`} className="w-12 h-12 object-contain rounded-md bg-white border border-border" />
                  )}
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gold" />
                    <div className="font-medium">{item.name}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                {/* Rozetler: ücretli/ücretsiz ve lokasyonlar */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant={item.plan === 'free' ? 'secondary' : 'default'}>
                    {item.plan === 'free' ? 'Ücretsiz' : 'Ücretli'}
                  </Badge>
                  {Array.isArray(item.locations) && item.locations.map((loc) => (
                    <Badge key={loc} variant="outline">{loc}</Badge>
                  ))}
                </div>
                {Array.isArray(item.features) && item.features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.features.map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-border"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-colors text-sm w-full"
                >
                  Resmi Siteye Git <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Bilgilendirme</h2>
          <p className="text-sm text-muted-foreground">
            İnternet erişimi için alternatif çözümler sunuyoruz. Lütfen yerel mevzuata uyun ve kullandığınız hizmetlerin
            kullanım koşullarını dikkatle okuyun.
          </p>
        </section>
      </main>

      <SeoArticle slug="vpn-onerileri" />
      <Footer />
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await (db as any).seoSetting.findUnique({ where: { page: '/vpn-onerileri' }, select: {
      title: true, description: true, keywords: true, canonicalUrl: true, ogTitle: true, ogDescription: true, ogImageUrl: true, ogLogoUrl: true, twitterTitle: true, twitterDescription: true, twitterImageUrl: true, robotsIndex: true, robotsFollow: true, structuredData: true,
    } })
    const title = seo?.title ?? 'VPN Önerileri'
    const description = seo?.description ?? 'Türkiye’de engellenmiş sitelere erişim için ücretsiz ve güvenilir seçenekler.'
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
        url: 'https://hokkabaz.net/vpn-onerileri',
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
      title: 'VPN Önerileri',
      description: 'Türkiye’de engellenmiş sitelere erişim için ücretsiz ve güvenilir seçenekler.',
    }
  }
}