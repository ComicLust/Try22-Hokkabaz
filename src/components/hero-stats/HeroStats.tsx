'use client'

import { useEffect, useMemo, useState } from 'react'
import { Gift, Star, Award, MessageSquare, BadgeCheck, TrendingUp } from 'lucide-react'

interface CountStats {
  bonuses: number
  campaigns: number
  brands: number
  reviews: number
  demoBonuses: number
  bankoTotal: number
  bankoSuccessRate: number
}

const initialStats: CountStats = {
  bonuses: 0,
  campaigns: 0,
  brands: 0,
  reviews: 0,
  demoBonuses: 0,
  bankoTotal: 0,
  bankoSuccessRate: 0,
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('tr-TR').format(n)
}

export function HeroStats() {
  const [stats, setStats] = useState<CountStats>(initialStats)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [hasError, setHasError] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setHasError(false)
        setIsLoading(true)
        const [bonusesRes, campaignsRes, partnersRes, reviewsRes, bankoStatsRes] = await Promise.all([
          fetch('/api/bonuses?active=true', { cache: 'no-store' }),
          fetch('/api/campaigns', { cache: 'no-store' }),
          fetch('/api/partner-sites', { cache: 'no-store' }),
          fetch('/api/site-reviews/stats', { cache: 'no-store' }),
          fetch('/api/banko-coupons/archive/stats', { cache: 'no-store' }),
        ])

        const bonusesJson = await bonusesRes.json()
        const campaignsJson = await campaignsRes.json()
        const partnersJson = await partnersRes.json()
        const reviewsJson = await reviewsRes.json()
        const bankoStatsJson = await bankoStatsRes.json()

        const bonusesArr: any[] = Array.isArray(bonusesJson) ? bonusesJson : []
        const campaignsArr: any[] = Array.isArray(campaignsJson) ? campaignsJson : []
        const partnersArr: any[] = Array.isArray(partnersJson) ? partnersJson : []
        const reviewStatsArr: any[] = Array.isArray(reviewsJson) ? reviewsJson : []

        const activeCampaigns = campaignsArr.filter((c) => c?.isActive)
        const activeBrands = partnersArr.filter((p) => p?.isActive)
        const demoBonuses = bonusesArr.filter((b) => Array.isArray(b?.features) && b.features.includes('demo'))

        const totalReviews = reviewStatsArr.reduce((acc, cur) => acc + Number(cur?.reviewCount ?? 0), 0)
        const bankoTotal = Number(bankoStatsJson?.total ?? 0)
        const bankoSuccessRate = Number(bankoStatsJson?.successRate ?? 0)

        const nextStats: CountStats = {
          bonuses: bonusesArr.length,
          campaigns: activeCampaigns.length,
          brands: activeBrands.length,
          reviews: totalReviews,
          demoBonuses: demoBonuses.length,
          bankoTotal,
          bankoSuccessRate,
        }

        if (mounted) setStats(nextStats)
      } catch (e) {
        if (mounted) setHasError(true)
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const tilesTop = useMemo(() => ([
    { label: 'Aktif Bonus', value: stats.bonuses, href: '/bonuslar', Icon: Gift },
    { label: 'Aktif Kampanya', value: stats.campaigns, href: '/kampanyalar', Icon: Star },
    { label: 'Aktif Marka', value: stats.brands, href: '/guvenilir-bahis-siteleri-listesi', Icon: Award },
  ]), [stats])

  const tilesBottom = useMemo(() => ([
    { label: 'Yorumlar', value: stats.reviews, href: '/yorumlar', Icon: MessageSquare },
    { label: 'Deneme Bonusları', value: stats.demoBonuses, href: '/bonuslar?q=deneme', Icon: BadgeCheck },
    { label: 'Banko Kuponlar', value: stats.bankoTotal, href: '/banko-kuponlar', Icon: TrendingUp, suffix: stats.bankoSuccessRate ? `%${stats.bankoSuccessRate} başarı` : undefined },
  ]), [stats])

  return (
    <section className="relative mb-[15px]">
      <div className="container mx-auto px-4">
        <div className="divide-y divide-border">
          <div className="grid grid-cols-3 gap-0 divide-x divide-border">
            {tilesTop.map(({ label, value, href, Icon }, idx) => (
              <a key={idx} href={href} className="group flex flex-col items-center justify-center py-2 sm:py-3 hover:text-gold transition-colors">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gold mb-1" />
                <div className="text-xl sm:text-2xl font-bold tracking-tight">
                  {isLoading ? <span className="inline-block w-10 h-6 bg-muted animate-pulse rounded" /> : formatNumber(value)}
                </div>
                <div className="text-[11px] sm:text-xs text-muted-foreground">{label}</div>
              </a>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-0 divide-x divide-border">
            {tilesBottom.map(({ label, value, href, Icon, suffix }, idx) => (
              <a key={idx} href={href} className="group flex flex-col items-center justify-center py-2 sm:py-3 hover:text-gold transition-colors">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gold mb-1" />
                <div className="flex items-baseline gap-1">
                  <div className="text-xl sm:text-2xl font-bold tracking-tight">
                    {isLoading ? <span className="inline-block w-10 h-6 bg-muted animate-pulse rounded" /> : formatNumber(value)}
                  </div>
                  {suffix && !isLoading && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground">{suffix}</span>
                  )}
                </div>
                <div className="text-[11px] sm:text-xs text-muted-foreground">{label}</div>
              </a>
            ))}
          </div>
        </div>

        {hasError && (
          <div className="mt-1 text-center text-xs text-muted-foreground">Bazı istatistikler yüklenemedi, daha sonra tekrar deneyin.</div>
        )}
      </div>
    </section>
  )
}
