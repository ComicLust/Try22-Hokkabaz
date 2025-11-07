import HomeClient from '@/components/HomeClient'
import { db } from '@/lib/db'
import { getSeoRecord } from '@/lib/seo'
import type { Metadata } from 'next'
import Script from 'next/script'

export const revalidate = 300

interface ApiBonus { id: string; title?: string; shortDescription?: string | null; imageUrl?: string | null; isActive: boolean; isFeatured?: boolean | null; validityText?: string | null; startDate?: string | null; endDate?: string | null }
interface MarqueeLogo { id: string; imageUrl: string; href?: string | null; order: number; isActive: boolean }
interface PartnerSite { id: string; name?: string; slug?: string; logoUrl?: string | null; siteUrl?: string | null; rating?: number | null; features?: any; isActive: boolean }
interface ApiCampaign { id: string; title: string; slug: string; description?: string | null; imageUrl?: string | null; ctaUrl?: string | null; badgeLabel?: string | null; bonusText?: string | null; bonusAmount?: number | null; tags?: string[] | null; startDate?: string | null; endDate?: string | null; isActive: boolean; isFeatured: boolean; priority: number; createdAt: string }
interface ReviewsStatItem { brandId: string; reviewCount: number }
interface BankoStats { total: number; successRate: number }

export default async function Page() {
  // Server-side veri çekimi (ISR + tag)
  let initialBonuses: ApiBonus[] = []
  let initialMarqueeLogos: MarqueeLogo[] = []
  let initialPartnerSites: PartnerSite[] = []
  let initialCampaigns: ApiCampaign[] = []
  let initialHeroStats: { bonuses: number; campaigns: number; brands: number; reviews: number; demoBonuses: number; bankoTotal: number; bankoSuccessRate: number } | undefined

  try {
    const [bRes, mRes, pRes, cRes, rStatsRes, bStatsRes] = await Promise.all([
      fetch('/api/bonuses?active=true&featured=true', { next: { revalidate, tags: ['home:bonuses'] } }),
      fetch('/api/marquee-logos', { next: { revalidate, tags: ['home:marquee'] } }),
      fetch('/api/partner-sites', { next: { revalidate, tags: ['home:partner-sites'] } }),
      fetch('/api/campaigns', { next: { revalidate, tags: ['home:campaigns'] } }),
      fetch('/api/site-reviews/stats', { next: { revalidate, tags: ['home:reviews-stats'] } }),
      fetch('/api/banko-coupons/archive/stats', { next: { revalidate, tags: ['home:banko-stats'] } }),
    ])
    initialBonuses = bRes.ok ? await bRes.json() : []
    initialMarqueeLogos = mRes.ok ? await mRes.json() : []
    initialPartnerSites = pRes.ok ? await pRes.json() : []
    initialCampaigns = cRes.ok ? await cRes.json() : []

    const reviewsStats: ReviewsStatItem[] = rStatsRes.ok ? await rStatsRes.json() : []
    const bankoStats: BankoStats = bStatsRes.ok ? await bStatsRes.json() : { total: 0, successRate: 0 }

    const bonusesArr: ApiBonus[] = Array.isArray(initialBonuses) ? initialBonuses : []
    const campaignsArr: ApiCampaign[] = Array.isArray(initialCampaigns) ? initialCampaigns : []
    const partnersArr: PartnerSite[] = Array.isArray(initialPartnerSites) ? initialPartnerSites : []
    const demoBonuses = bonusesArr.filter((b: any) => Array.isArray(b?.features) && b.features.includes('demo'))
    const activeCampaigns = campaignsArr.filter((c: any) => c?.isActive)
    const activeBrands = partnersArr.filter((p: any) => p?.isActive)
    const totalReviews = Array.isArray(reviewsStats)
      ? reviewsStats.reduce((acc, cur) => acc + Number((cur as any)?.reviewCount ?? 0), 0)
      : 0

    initialHeroStats = {
      bonuses: bonusesArr.length,
      campaigns: activeCampaigns.length,
      brands: activeBrands.length,
      reviews: totalReviews,
      demoBonuses: demoBonuses.length,
      bankoTotal: Number(bankoStats?.total ?? 0),
      bankoSuccessRate: Number(bankoStats?.successRate ?? 0),
    }
  } catch {}

  return (
    <>
      {/* SSR fallback: boş ekranı önlemek için minimal içerik */}
      <div id="app-root">
        <HomeClient
          initialBonuses={Array.isArray(initialBonuses) ? initialBonuses : []}
          initialMarqueeLogos={Array.isArray(initialMarqueeLogos) ? initialMarqueeLogos : []}
          initialPartnerSites={Array.isArray(initialPartnerSites) ? initialPartnerSites : []}
          initialCampaigns={Array.isArray(initialCampaigns) ? initialCampaigns : []}
          initialHeroStats={initialHeroStats}
        />
      </div>
      <div id="fallback" className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <a href="/" className="font-semibold text-lg text-gold">Hokkabaz</a>
            <span className="text-xs text-muted-foreground">Temel görünüm</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Sayfa yüklenemedi veya gömülü tarayıcıda (ör. Telegram) bir sorun oluştu. Aşağıdaki bağlantılar üzerinden içeriğe erişebilirsiniz.
          </p>
          <nav className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <a href="/kampanyalar" className="px-3 py-2 rounded-md ring-1 ring-border hover:bg-gold/5 transition-colors">Kampanyalar</a>
            <a href="/bonuslar" className="px-3 py-2 rounded-md ring-1 ring-border hover:bg-gold/5 transition-colors">Bonuslar</a>
            <a href="/guvenilir-bahis-siteleri-listesi" className="px-3 py-2 rounded-md ring-1 ring-border hover:bg-gold/5 transition-colors">Güvenilir Siteler</a>
            <a href="/banko-kuponlar" className="px-3 py-2 rounded-md ring-1 ring-border hover:bg-gold/5 transition-colors">Banko Kuponlar</a>
            <a href="/vpn-onerileri" className="px-3 py-2 rounded-md ring-1 ring-border hover:bg-gold/5 transition-colors">VPN Önerileri</a>
            <a href="/guvenilir-telegram" className="px-3 py-2 rounded-md ring-1 ring-border hover:bg-gold/5 transition-colors">Telegram Grupları</a>
          </nav>
        </div>
      </div>
      <Script id="faq-schema" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Kampanyalar nasıl seçiliyor?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Kampanyaları objektif kriterlere göre değerlendiriyoruz: güvenilirlik, kullanıcı geri bildirimleri, bonus şartları ve çekim kolaylığı. Öne çıkanları ana sayfada listeliyoruz."
              }
            },
            {
              "@type": "Question",
              "name": "Deneme bonusları gerçekten ücretsiz mi?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Deneme bonusları çoğunlukla ücretsizdir. Bazılarında kimlik doğrulama veya minimum çevrim şartı olabilir. Her kartta özet şartları ve geçerlilik metnini ayrıca belirtiyoruz."
              }
            },
            {
              "@type": "Question",
              "name": "Banko Kuponlar nasıl güncelleniyor?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Banko Kuponlar her gün saat 18:00’de yenilenir. Maç sonuçları otomatik işlenir ve arşivden geçmiş kuponlara ulaşabilirsiniz."
              }
            },
            {
              "@type": "Question",
              "name": "Güvenilir siteleri nasıl belirliyorsunuz?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Lisans, ödeme geçmişi, kullanıcı yorumları ve şeffaf kurallar temel kriterlerimizdir. Anlaşmalı Siteler bölümünde düzenli olarak güncellenen listemizi bulabilirsiniz."
              }
            },
            {
              "@type": "Question",
              "name": "Telegram grubuna nasıl katılırım?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Footer’daki Telegram Grupları ve ana sayfadaki panelden davet linkine tıklayarak direkt katılabilirsiniz. Duyurular ve canlı sohbet için grubu kullanıyoruz."
              }
            },
            {
              "@type": "Question",
              "name": "Canlı maç yayınlarını nereden izlerim?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Canlı Maç İzle sayfasında yayın bilgilerini ve gerekli yönlendirmeleri paylaşıyoruz. Yayın kurallarına ve yerel mevzuata uymanızı tavsiye ederiz."
              }
            },
            {
              "@type": "Question",
              "name": "VPN önerileri ne işe yarar?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Erişim sorunlarında alternatif çözümler sunar. VPN Önerileri sayfasında ücretli/ücretsiz seçenekleri, konumlar ve resmi site linklerini bulabilirsiniz."
              }
            },
            {
              "@type": "Question",
              "name": "Yorumlar nasıl onaylanıyor?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yorumlar moderasyon sürecinden geçer. Spam, hakaret veya yanıltıcı içerikler reddedilir. Onaylı yorumlar marka sayfalarında görünür."
              }
            },
            {
              "@type": "Question",
              "name": "Bonus çekimi için tipik şartlar nelerdir?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Çoğunlukla minimum çevrim, oyun kısıtları ve süre şartları bulunur. Her kampanya kartında özetlenir, detaylara resmi siteden erişebilirsiniz."
              }
            },
            {
              "@type": "Question",
              "name": "Destek ekibiyle nasıl iletişime geçerim?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "İletişim sayfasındaki formu veya e-posta adresini kullanabilirsiniz. Acil durumlar için Telegram grubundaki moderatörlere yazabilirsiniz."
              }
            }
          ]
        })}
      </Script>
    </>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const s = await getSeoRecord('/', ['']) as any

    const title = s?.title ?? 'Hokkabaz'
    const description = s?.description ?? 'Güvenilir bahis ve casino içerikleri'
    const canonical = s?.canonicalUrl ?? undefined
    return {
      title,
      description,
      alternates: canonical ? { canonical } : undefined,
      openGraph: {
        title: s?.ogTitle ?? title,
        description: s?.ogDescription ?? description,
        type: 'website',
        images: s?.ogImageUrl ? [s.ogImageUrl] : ['/uploads/1760732951329-fzch33159aq.jpg'],
        url: canonical,
      },
      twitter: {
        title: s?.twitterTitle ?? title,
        description: s?.twitterDescription ?? description,
        images: s?.twitterImageUrl ? [s.twitterImageUrl] : ['/uploads/1760732951329-fzch33159aq.jpg'],
        card: 'summary_large_image',
      },
      robots: {
        index: s?.robotsIndex ?? true,
        follow: s?.robotsFollow ?? true,
      },
      other: s?.keywords ? { keywords: s.keywords } : undefined,
    }
  } catch {
    return {
      title: 'Hokkabaz',
      description: 'Güvenilir bahis ve casino içerikleri',
      openGraph: {
        title: 'Hokkabaz',
        description: 'Güvenilir bahis ve casino içerikleri',
        type: 'website',
        images: ['/uploads/1760732951329-fzch33159aq.jpg'],
      },
      twitter: {
        title: 'Hokkabaz',
        description: 'Güvenilir bahis ve casino içerikleri',
        images: ['/uploads/1760732951329-fzch33159aq.jpg'],
        card: 'summary_large_image',
      },
      robots: {
        index: true,
        follow: true,
      },
    }
  }
}