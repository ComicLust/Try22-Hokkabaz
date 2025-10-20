'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, MessageSquare, Megaphone, Gift, Images, Sliders, Send, List, Activity } from 'lucide-react'

export default function AdminHome() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [counts, setCounts] = useState({
    brands: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    campaigns: 0,
    bonuses: 0,
    telegram: 0,
    logos: 0,
    slides: 0,
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [brands, pending, approved, campaigns, bonuses, telegram, logos, slides] = await Promise.all([
          fetch('/api/review-brands').then((r) => r.json()),
          fetch('/api/admin/site-reviews?status=pending&limit=1').then((r) => r.json()),
          fetch('/api/admin/site-reviews?status=approved&limit=1').then((r) => r.json()),
          fetch('/api/campaigns').then((r) => r.json()),
          fetch('/api/bonuses').then((r) => r.json()),
          fetch('/api/telegram-groups').then((r) => r.json()),
          fetch('/api/marquee-logos').then((r) => r.json()),
          fetch('/api/carousel').then((r) => r.json()),
        ])
        setCounts({
          brands: Array.isArray(brands) ? brands.length : 0,
          pendingReviews: typeof pending?.total === 'number' ? pending.total : 0,
          approvedReviews: typeof approved?.total === 'number' ? approved.total : 0,
          campaigns: Array.isArray(campaigns) ? campaigns.length : 0,
          bonuses: Array.isArray(bonuses) ? bonuses.length : 0,
          telegram: Array.isArray(telegram) ? telegram.length : 0,
          logos: Array.isArray(logos) ? logos.length : 0,
          slides: Array.isArray(slides) ? slides.length : 0,
        })
      } catch (e: any) {
        setError(e?.message ?? 'Veriler yüklenemedi')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><LayoutDashboard className="w-5 h-5" /> Gösterge Paneli</h1>
        <div className="text-sm text-muted-foreground">WordPress benzeri yönetim özeti</div>
      </header>

      {error && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2">{error}</div>
      )}

      {/* İstatistik Kartları */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><List className="w-4 h-4" /> Markalar</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{counts.brands}</div><div className="text-xs text-muted-foreground">Yorum markaları</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Bekleyen Yorum</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{counts.pendingReviews}</div><div className="text-xs text-muted-foreground">Onay bekleyen</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Onaylı Yorum</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{counts.approvedReviews}</div><div className="text-xs text-muted-foreground">Yayınlanan</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Megaphone className="w-4 h-4" /> Kampanyalar</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{counts.campaigns}</div><div className="text-xs text-muted-foreground">Aktif kampanyalar</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Gift className="w-4 h-4" /> Bonuslar</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{counts.bonuses}</div><div className="text-xs text-muted-foreground">Listeye ekli</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Images className="w-4 h-4" /> Kayan Logolar</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{counts.logos}</div><div className="text-xs text-muted-foreground">Marquee logos</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sliders className="w-4 h-4" /> Slider</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{counts.slides}</div><div className="text-xs text-muted-foreground">Carousel slide sayısı</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Send className="w-4 h-4" /> Telegram</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{counts.telegram}</div><div className="text-xs text-muted-foreground">Gruplar/kanallar</div></CardContent>
          </Card>
        </div>
      </section>

      {/* Hızlı Linkler */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Button asChild variant="outline"><a href="/admin/yorumlar/yorum-onay" className="flex items-center justify-between"><span>Yorum Onayı</span><MessageSquare className="w-4 h-4 ml-2" /></a></Button>
          <Button asChild variant="outline"><a href="/admin/yorumlar/markalar" className="flex items-center justify-between"><span>Yorum Markaları</span><List className="w-4 h-4 ml-2" /></a></Button>
          <Button asChild variant="outline"><a href="/admin/marquee-logos" className="flex items-center justify-between"><span>Anlaşmalı Siteler</span><Images className="w-4 h-4 ml-2" /></a></Button>
          {/* Carousel sayfası kaldırıldı; slider yönetimi Marquee Logolar sayfasında */}
          <Button asChild variant="outline"><a href="/admin/campaigns" className="flex items-center justify-between"><span>Kampanyalar</span><Megaphone className="w-4 h-4 ml-2" /></a></Button>
          <Button asChild variant="outline"><a href="/admin/bonuses" className="flex items-center justify-between"><span>Bonuslar</span><Gift className="w-4 h-4 ml-2" /></a></Button>
          <Button asChild variant="outline"><a href="/admin/seo" className="flex items-center justify-between"><span>Genel SEO</span><LayoutDashboard className="w-4 h-4 ml-2" /></a></Button>
          <Button asChild variant="outline"><a href="/admin/analytics" className="flex items-center justify-between"><span>Analytics & Meta Kodları</span><Activity className="w-4 h-4 ml-2" /></a></Button>
          <Button asChild variant="outline"><a href="/admin/telegram" className="flex items-center justify-between"><span>Telegram</span><Send className="w-4 h-4 ml-2" /></a></Button>
        </div>
      </section>
    </div>
  )
}