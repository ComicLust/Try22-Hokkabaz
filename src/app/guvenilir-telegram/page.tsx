import React from 'react'
import type { Metadata } from 'next'
import { unstable_noStore as noStore } from 'next/cache'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { db } from '@/lib/db'
import ActiveCounter from '@/components/ActiveCounter'
import ClientOnly from '@/components/ClientOnly'
import TelegramSuggestionCard from '@/components/TelegramSuggestionCard'
import SeoArticle from '@/components/SeoArticle'

function formatMembers(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return `${n}`
}

function badgeClass(b: string) {
  const key = b.toLowerCase()
  if (key === 'önerilen') return 'bg-gold text-primary-foreground ring-primary'
  if (key === 'güvenilir') return 'bg-neon text-primary-foreground ring-accent'
  if (key === 'aktif') return 'bg-blue-600 text-white ring-blue-500'
  return 'bg-secondary text-foreground ring-border'
}

export default async function GuvenilirTelegramPage() {
  noStore()
  const seo = await (db as any).seoSetting.findUnique({ where: { page: '/guvenilir-telegram' }, select: {
    title: true, description: true, keywords: true, canonicalUrl: true, ogTitle: true, ogDescription: true, ogImageUrl: true, ogLogoUrl: true, twitterTitle: true, twitterDescription: true, twitterImageUrl: true, robotsIndex: true, robotsFollow: true, structuredData: true,
  } })
  const pageTitle = seo?.title ?? 'Güvenilir Telegram Grupları'
  const pageDescription = seo?.description ?? 'Seçtiğimiz güvenilir kanal ve grupları aşağıda bulabilirsiniz.'
  const items = await (db as any).telegramGroup.findMany({
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
  })
  const featured = items.filter((g) => g.isFeatured)
  const regular = items.filter((g) => !g.isFeatured)
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-16 md:pt-8 pb-8 w-full flex-1 space-y-8 md:pl-72">
        <header className="space-y-2">
          <h1 className="hidden md:block text-2xl font-semibold text-foreground">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">{pageDescription}</p>
        </header>

        {featured.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Önerdiğimiz Telegram Grupları</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              <TelegramSuggestionCard />
              {featured.map((g) => (
                <div
                  key={g.id}
                  className="relative border border-border rounded-lg p-4 flex flex-col items-center text-center gap-3 bg-card text-foreground"
                >
                  {g.isFeatured && (
                    <span className={`absolute top-2 right-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset shadow-sm ${badgeClass('Önerilen')}`}>
                      Önerilen
                    </span>
                  )}
                  <img
                    src={g.imageUrl ?? '/placeholder.svg'}
                    alt={g.name}
                    className="w-20 h-20 rounded-full object-cover border border-border"
                    loading="lazy"
                  />
                  {/* Önerilen rozet sağ üstte; diğer rozetler görselin altında */}
                  {Array.isArray((g as any).badges) && (g as any).badges.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1">
                      {(g as any).badges
                        .filter((b: string) => b.toLowerCase() !== 'önerilen')
                        .map((b: string) => (
                          <span key={b} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeClass(b)}`}>
                            {b}
                          </span>
                        ))}
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{g.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                      {(g as any).membersText ? (
                        <span>{(g as any).membersText}</span>
                      ) : (
                        typeof g.members === 'number' && <span>{formatMembers(g.members)} üye</span>
                      )}
                      <ClientOnly><ActiveCounter /></ClientOnly>
                    </div>
                  </div>
                  <a
                    href={g.ctaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center justify-center px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-colors text-sm w-full"
                  >
                    Telegram’a Katıl
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Tüm Gruplar</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <TelegramSuggestionCard />
            {regular.map((g) => (
              <div
                key={g.id}
                className="relative border border-border rounded-lg p-4 flex flex-col items-center text-center gap-3 bg-card text-foreground"
              >
                <img
                  src={g.imageUrl ?? '/placeholder.svg'}
                  alt={g.name}
                  className="w-20 h-20 rounded-full object-cover border border-border"
                  loading="lazy"
                />
                {Array.isArray((g as any).badges) && (g as any).badges.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1">
                    {(g as any).badges.map((b: string) => (
                      <span key={b} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeClass(b)}`}>
                        {b}
                      </span>
                    ))}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="font-medium text-foreground">{g.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                    {(g as any).membersText ? (
                      <span>{(g as any).membersText}</span>
                    ) : (
                      typeof g.members === 'number' && <span>{formatMembers(g.members)} üye</span>
                    )}
                    <ClientOnly><ActiveCounter /></ClientOnly>
                  </div>
                </div>
                <a
                  href={g.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center justify-center px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-colors text-sm w-full"
                >
                  Telegram’a Katıl
                </a>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SeoArticle slug="guvenilir-telegram" />
      <Footer />
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await (db as any).seoSetting.findUnique({ where: { page: '/guvenilir-telegram' }, select: {
      title: true, description: true, keywords: true, canonicalUrl: true, ogTitle: true, ogDescription: true, ogImageUrl: true, ogLogoUrl: true, twitterTitle: true, twitterDescription: true, twitterImageUrl: true, robotsIndex: true, robotsFollow: true, structuredData: true,
    } })
    const title = seo?.title ?? 'Güvenilir Telegram Grupları'
    const description = seo?.description ?? 'Seçtiğimiz güvenilir kanal ve grupları aşağıda bulabilirsiniz.'
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
  url: 'https://hokkabaz.bet/guvenilir-telegram',
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
      title: 'Güvenilir Telegram Grupları',
      description: 'Seçtiğimiz güvenilir kanal ve grupları aşağıda bulabilirsiniz.',
    }
  }
}