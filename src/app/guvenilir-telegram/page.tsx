import React from 'react'
import type { Metadata } from 'next'
import { unstable_noStore as noStore } from 'next/cache'
import Header from '@/components/Header'
import { Send, ArrowRight, Users, Megaphone, Filter } from 'lucide-react'
import Footer from '@/components/Footer'
import { db } from '@/lib/db'
import { getSeoRecord } from '@/lib/seo'
import ActiveCounter from '@/components/ActiveCounter'
import ClientOnly from '@/components/ClientOnly'
import TelegramSuggestionCard from '@/components/TelegramSuggestionCard'
import SeoArticle from '@/components/SeoArticle'
import { TopBrandTicker } from '@/components/top-brand-ticker/TopBrandTicker'
import LazyImage from '@/components/LazyImage'

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

export default async function GuvenilirTelegramPage({ searchParams }: { searchParams?: { tip?: string } }) {
  noStore()
  const seo = await getSeoRecord('/guvenilir-telegram', ['guvenilir-telegram']) as any
  const pageTitle = seo?.title ?? 'Güvenilir Telegram Grupları'
  const pageDescription = seo?.description ?? 'Seçtiğimiz güvenilir kanal ve grupları aşağıda bulabilirsiniz.'
  const items = await (db as any).telegramGroup.findMany({
    orderBy: [{ isFeatured: 'desc' }, { priority: 'desc' }, { createdAt: 'desc' }],
  })
  const filterType = (searchParams?.tip ?? '').toLowerCase()
  const byType = (t: string) => (g: any) => g.type === t
  const featuredBase = items.filter((g) => g.isFeatured)
  const regularBase = items.filter((g) => !g.isFeatured)
  const featured =
    filterType === 'group' ? featuredBase.filter(byType('GROUP'))
    : filterType === 'channel' ? featuredBase.filter(byType('CHANNEL'))
    : featuredBase
  const regular =
    filterType === 'group' ? regularBase.filter(byType('GROUP'))
    : filterType === 'channel' ? regularBase.filter(byType('CHANNEL'))
    : regularBase
  const logos = await db.marqueeLogo.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } })
  const marqueeItems = logos.length ? Array.from({ length: 12 }, (_, i) => logos[i % logos.length]).map((m) => ({ imageUrl: m.imageUrl, href: m.href })) : []
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {marqueeItems.length > 0 && (
        <TopBrandTicker items={marqueeItems} className="lg:pl-64" />
      )}
      <main className="max-w-7xl mx-auto px-4 pt-6 md:pt-4 pb-8 w-full flex-1 space-y-8 lg:pl-64">
        {/* Hero */}
        <section className="relative">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gold leading-tight">{pageTitle}</h1>
              <p className="mt-1 text-sm md:text-base text-foreground/80">{pageDescription}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <a href="#gruplar" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-colors text-xs md:text-sm">
                  Grupları Keşfet <ArrowRight className="w-4 h-4" aria-hidden />
                </a>
                <a href="/kampanyalar" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border bg-background/60 hover:bg-background transition-colors text-xs md:text-sm">
                  Aktif Kampanyalar <ArrowRight className="w-4 h-4" aria-hidden />
                </a>
              </div>
              {/* Filtre: Tümü / Grup / Kanal */}
              <div className="mt-3 flex items-center gap-2 text-xs md:text-sm">
                <a
                  href="/guvenilir-telegram"
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-md border transition-colors ${!filterType ? 'bg-primary text-primary-foreground border-primary' : 'bg-background/60 border-border hover:bg-background'}`}
                >
                  <Filter className="w-4 h-4 shrink-0" aria-hidden />
                  <span>Tümü</span>
                </a>
                <a
                  href="/guvenilir-telegram?tip=group"
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-md border transition-colors ${filterType === 'group' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background/60 border-border hover:bg-background'}`}
                >
                  <Users className="w-4 h-4 shrink-0" aria-hidden />
                  <span>Gruplar</span>
                </a>
                <a
                  href="/guvenilir-telegram?tip=channel"
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-md border transition-colors ${filterType === 'channel' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background/60 border-border hover:bg-background'}`}
                >
                  <Megaphone className="w-4 h-4 shrink-0" aria-hidden />
                  <span>Kanallar</span>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
              <div className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Send className="w-4 h-4 text-gold" aria-hidden /> Toplam Grup
                </div>
                <div className="mt-1 text-xl font-semibold">{items.length}</div>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gold" aria-hidden /> Önerilen
                </div>
                <div className="mt-1 text-xl font-semibold">{featured.length}</div>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Megaphone className="w-4 h-4 text-gold" aria-hidden /> Kanal Sayısı
                </div>
                <div className="mt-1 text-xl font-semibold">{items.filter((g:any)=> g.type === 'CHANNEL').length}</div>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gold" aria-hidden /> Grup Sayısı
                </div>
                <div className="mt-1 text-xl font-semibold">{items.filter((g:any)=> g.type === 'GROUP').length}</div>
              </div>
            </div>
          </div>
        </section>

        {/* İçerik anchor */}
        <span id="gruplar" className="block" />

        {featured.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Önerdiğimiz Telegram Grupları</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
              <TelegramSuggestionCard />
              {featured.map((g) => (
                <div
                  key={g.id}
                  className="relative border border-border rounded-lg p-4 flex flex-col items-center text-center gap-3 bg-card text-foreground"
                >
                  {/* Tip etiketi */}
                  <span className="absolute top-2 left-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset border bg-background/70">
                    {g.type === 'CHANNEL' ? 'Kanal' : 'Grup'}
                  </span>
                  {g.isFeatured && (
                    <span className={`absolute top-2 right-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset shadow-sm ${badgeClass('Önerilen')}`}>
                      Önerilen
                    </span>
                  )}
                  <LazyImage
                    src={g.imageUrl ?? '/placeholder.svg'}
                    alt={g.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full border border-border"
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
                    <div className="font-medium text-foreground w-full truncate">{g.name}</div>
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
                    className="mt-1 inline-flex items-center justify-center px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-colors text-xs md:text-sm w-full gap-1.5 text-center leading-tight whitespace-nowrap"
                  >
                    <Send className="w-4 h-4 shrink-0" aria-hidden />
                    <span>Telegram’a Katıl</span>
                    <ArrowRight className="w-4 h-4 shrink-0" aria-hidden />
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Tüm Gruplar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
            <TelegramSuggestionCard />
            {regular.map((g) => (
              <div
                key={g.id}
                className="relative border border-border rounded-lg p-4 flex flex-col items-center text-center gap-3 bg-card text-foreground"
              >
                {/* Tip etiketi */}
                <span className="absolute top-2 left-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset border bg-background/70">
                  {g.type === 'CHANNEL' ? 'Kanal' : 'Grup'}
                </span>
                <LazyImage
                  src={g.imageUrl ?? '/placeholder.svg'}
                  alt={g.name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full border border-border"
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
                  <div className="font-medium text-foreground w-full truncate">{g.name}</div>
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
                  className="mt-1 inline-flex items-center justify-center px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-colors text-xs md:text-sm w-full gap-1.5 text-center leading-tight whitespace-nowrap"
                >
                  <Send className="w-4 h-4 shrink-0" aria-hidden />
                  <span>Telegram’a Katıl</span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden />
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
    const seo = await getSeoRecord('/guvenilir-telegram', ['guvenilir-telegram']) as any
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