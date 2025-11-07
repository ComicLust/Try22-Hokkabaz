'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LayoutDashboard, MessageSquare, Megaphone, Gift, Images, Sliders, Send, List, Activity, Globe, RefreshCw, Link2 } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

export default function AdminHome() {
  const { toast } = useToast()
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
interface StatRow { date: string; reviews: number; clicks: number }
  const [weekly, setWeekly] = useState<StatRow[]>([])
  const [statsDays, setStatsDays] = useState<number>(30)
  const [statsFrom, setStatsFrom] = useState<string>('')
  const [statsTo, setStatsTo] = useState<string>('')
  const [totalReviews, setTotalReviews] = useState<number>(0)
  const [totalClicks, setTotalClicks] = useState<number>(0)
  const [activities, setActivities] = useState<{ model: string; id: string; title: string; updatedAt: string }[]>([])
  const [pendingModeration, setPendingModeration] = useState<{ reviews: any[]; bonuses: any[] }>({ reviews: [], bonuses: [] })
  const [reviewsPage, setReviewsPage] = useState(1)
  const [bonusesPage, setBonusesPage] = useState(1)
  const [reviewsTotal, setReviewsTotal] = useState(0)
  const [bonusesTotal, setBonusesTotal] = useState(0)
  const [modLoading, setModLoading] = useState(false)
  const [selectedReviews, setSelectedReviews] = useState<Record<string, boolean>>({})
  const [selectedBonuses, setSelectedBonuses] = useState<Record<string, boolean>>({})
  const [sitemapInfo, setSitemapInfo] = useState<{ totalUrls?: number; generatedAt?: string; staticCount?: number; brandCount?: number } | null>(null)

  // Meta Preview
  const [metaUrl, setMetaUrl] = useState('')
  const [metaData, setMetaData] = useState<any | null>(null)
  const [metaLoading, setMetaLoading] = useState(false)
  const [metaError, setMetaError] = useState<string | null>(null)

  // Sitemap Ping
  const [pingLoading, setPingLoading] = useState(false)
  const [pingResult, setPingResult] = useState<{ google?: number; bing?: number; sitemap?: string } | null>(null)

  // Cache Control
  const [cacheSlug, setCacheSlug] = useState('')
  const [cacheBrandId, setCacheBrandId] = useState('')
  const [cacheMsg, setCacheMsg] = useState<string | null>(null)

  // robots.txt edit
  const [robotsContent, setRobotsContent] = useState('')
  const [robotsLoading, setRobotsLoading] = useState(false)
  const [robotsMsg, setRobotsMsg] = useState<string | null>(null)

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

        const [weeklyRes, actRes, robotsRes, sitemapStatus] = await Promise.all([
          fetch('/api/admin/stats/daily?days=30').then((r) => r.json()),
          fetch('/api/admin/activity/recent').then((r) => r.json()),
          fetch('/api/admin/robots').then((r) => r.json()),
          fetch('/api/admin/sitemap/status').then((r)=>r.json()).catch(()=>null),
        ])
        if (weeklyRes?.ok && Array.isArray(weeklyRes.data)) applyStats(weeklyRes.data)
        if (actRes?.ok && Array.isArray(actRes.items)) setActivities(actRes.items)
        // Moderasyon listeleri sayfalama ile ayrı effect'te yüklenir
        if (robotsRes?.ok && typeof robotsRes.content === 'string') setRobotsContent(robotsRes.content)
        if (sitemapStatus?.ok) setSitemapInfo({ totalUrls: sitemapStatus.totalUrls, generatedAt: sitemapStatus.generatedAt, staticCount: sitemapStatus.staticCount, brandCount: sitemapStatus.brandCount })
      } catch (e: any) {
        setError(e?.message ?? 'Veriler yüklenemedi')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Moderasyon listelerini sayfa başına 25 yükle
  useEffect(() => {
    const loadModeration = async () => {
      setModLoading(true)
      try {
        const [modReviews, modBonuses] = await Promise.all([
          fetch(`/api/admin/site-reviews?status=pending&limit=25&page=${reviewsPage}`).then((r) => r.json()),
          fetch(`/api/admin/bonuses?status=pending&limit=25&page=${bonusesPage}`).then((r) => r.json()),
        ])
        setPendingModeration({
          reviews: Array.isArray(modReviews?.items) ? modReviews.items : [],
          bonuses: Array.isArray(modBonuses?.items) ? modBonuses.items : [],
        })
        if (typeof modReviews?.total === 'number') setReviewsTotal(modReviews.total)
        if (typeof modBonuses?.total === 'number') setBonusesTotal(modBonuses.total)
      } catch (e) {
        // sessiz geç
      } finally {
        setModLoading(false)
      }
    }
    loadModeration()
  }, [reviewsPage, bonusesPage])

  // MA7 kaldırıldı; yalnızca günlük değerler kullanılıyor

  function applyStats(data: { date: string; reviews: number; clicks: number }[]) {
    setWeekly(data)
    setTotalReviews(data.reduce((sum, r) => sum + (r.reviews || 0), 0))
    setTotalClicks(data.reduce((sum, r) => sum + (r.clicks || 0), 0))
  }

  // CTR grafiği kaldırıldı

  async function fetchStatsByDays(days: number) {
    setStatsDays(days)
    setStatsFrom('')
    setStatsTo('')
    const res = await fetch(`/api/admin/stats/daily?days=${days}`)
    const json = await res.json()
    if (json?.ok && Array.isArray(json.data)) applyStats(json.data)
  }

  async function fetchStatsByRange() {
    if (!statsFrom || !statsTo) return
    const params = new URLSearchParams({ from: statsFrom, to: statsTo })
    const res = await fetch(`/api/admin/stats/daily?${params.toString()}`)
    const json = await res.json()
    if (json?.ok && Array.isArray(json.data)) applyStats(json.data)
  }

  async function handleMetaPreview() {
    setMetaLoading(true)
    setMetaError(null)
    setMetaData(null)
    try {
      const res = await fetch(`/api/admin/meta-preview?url=${encodeURIComponent(metaUrl)}`)
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Meta alınamadı')
      setMetaData(json.meta)
    } catch (e: any) {
      setMetaError(e?.message ?? 'Meta alınamadı')
    } finally {
      setMetaLoading(false)
    }
  }

  async function handleSitemapPing() {
    setPingLoading(true)
    setPingResult(null)
    try {
      const baseUrl = window.location.origin
      const res = await fetch('/api/admin/sitemap/ping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baseUrl }) })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Ping başarısız')
      setPingResult({ google: json.google, bing: json.bing, sitemap: json.sitemap })
    } catch (e: any) {
      setError(e?.message || 'Sitemap ping başarısız')
    } finally {
      setPingLoading(false)
    }
  }

  async function handleSitemapRebuild() {
    // Tüm ilgili cache tag’lerini temizle ve ardından arama motorlarına ping at
    await postCache({ action: 'all' })
    try {
      const baseUrl = window.location.origin
      const res = await fetch('/api/admin/sitemap/ping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baseUrl }) })
      const json = await res.json()
      if (json?.ok) setPingResult({ google: json.google, bing: json.bing, sitemap: json.sitemap })
    } catch {}
  }

  function downloadJSON(fileName: string, data: any) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  function toCSV(rows: any[], keys: string[]) {
    const head = keys.join(',')
    const esc = (v: any) => {
      if (v === null || v === undefined) return ''
      const s = String(v)
      // Satır içi virgül/çift tırnak kaçışları
      const needsQuote = /[",\n]/.test(s)
      const q = s.replace(/"/g, '""')
      return needsQuote ? `"${q}"` : q
    }
    const body = rows.map((r) => keys.map((k) => esc((r as any)[k])).join(',')).join('\n')
    return `${head}\n${body}`
  }

  function downloadCSV(fileName: string, rows: any[], keys: string[]) {
    const csv = toCSV(rows, keys)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  function toggleReviewSelect(id: string) {
    setSelectedReviews((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function toggleBonusSelect(id: string) {
    setSelectedBonuses((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function clearSelections() {
    setSelectedReviews({})
    setSelectedBonuses({})
  }

  async function bulkReviews(action: 'approve' | 'reject') {
    const ids = Object.keys(selectedReviews).filter((id) => selectedReviews[id])
    if (!ids.length) {
      toast({ title: 'Seçim yok', description: 'İşlem yapılacak yorum seçilmedi', })
      return
    }
    const res = await fetch('/api/admin/site-reviews/bulk', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ids }) })
    const json = await res.json()
    if (json?.ok) {
      // Başarıyla işlenenleri listeden çıkar
      setPendingModeration((prev) => ({ ...prev, reviews: prev.reviews.filter((r: any) => !ids.includes(r.id)) }))
      clearSelections()
      toast({ title: 'Toplu işlem tamamlandı', description: `${ids.length} yorum ${action === 'approve' ? 'onaylandı' : 'reddedildi'}` })
    } else {
      toast({ title: 'Toplu işlem hatası', description: json?.error || 'İşlem başarısız', })
    }
  }

  async function bulkBonuses(action: 'approve' | 'unapprove') {
    const ids = Object.keys(selectedBonuses).filter((id) => selectedBonuses[id])
    if (!ids.length) {
      toast({ title: 'Seçim yok', description: 'İşlem yapılacak bonus seçilmedi', })
      return
    }
    const res = await fetch('/api/admin/bonuses/bulk', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ids }) })
    const json = await res.json()
    if (json?.ok) {
      setPendingModeration((prev) => ({ ...prev, bonuses: prev.bonuses.filter((b: any) => !ids.includes(b.id)) }))
      clearSelections()
      toast({ title: 'Toplu işlem tamamlandı', description: `${ids.length} bonus ${action === 'approve' ? 'onaylandı' : 'beklemeye alındı'}` })
    } else {
      toast({ title: 'Toplu işlem hatası', description: json?.error || 'İşlem başarısız', })
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select'
      if (e.key === 'Escape') { clearSelections(); return }
      if (isInput) return
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === 'a') { e.preventDefault(); bulkReviews('approve') }
      if (meta && e.key.toLowerCase() === 'r') { e.preventDefault(); bulkReviews('reject') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedReviews])

  async function postCache(body: any) {
    setCacheMsg(null)
    try {
      const res = await fetch('/api/admin/cache', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Cache temizleme başarısız')
      setCacheMsg('Cache temizlendi')
    } catch (e: any) {
      setCacheMsg(e?.message || 'İşlem başarısız')
    }
  }

  async function saveRobots() {
    setRobotsMsg(null)
    setRobotsLoading(true)
    try {
      const res = await fetch('/api/admin/robots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: robotsContent }) })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'robots.txt kaydedilemedi')
      setRobotsMsg('robots.txt kaydedildi')
    } catch (e: any) {
      setRobotsMsg(e?.message || 'İşlem başarısız')
    } finally {
      setRobotsLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><LayoutDashboard className="w-5 h-5" /> Gösterge Paneli</h1>
        <div className="text-sm text-muted-foreground">GMANVİBES</div>
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
          <Button asChild variant="outline"><a href="/admin/stories" className="flex items-center justify-between"><span>Story</span><Sliders className="w-4 h-4 ml-2" /></a></Button>
          <Button asChild variant="outline"><a href="/admin/campaigns" className="flex items-center justify-between"><span>Kampanyalar</span><Megaphone className="w-4 h-4 ml-2" /></a></Button>
          <Button asChild variant="outline"><a href="/admin/bonuses" className="flex items-center justify-between"><span>Bonuslar</span><Gift className="w-4 h-4 ml-2" /></a></Button>
          <Button asChild variant="outline"><a href="/admin/seo" className="flex items-center justify-between"><span>Genel SEO</span><LayoutDashboard className="w-4 h-4 ml-2" /></a></Button>
          <Button asChild variant="outline"><a href="/admin/analytics" className="flex items-center justify-between"><span>Analytics & Meta Kodları</span><Activity className="w-4 h-4 ml-2" /></a></Button>
          <Button asChild variant="outline"><a href="/admin/telegram" className="flex items-center justify-between"><span>Telegram</span><Send className="w-4 h-4 ml-2" /></a></Button>
          <Button asChild variant="outline"><a href="/robots.txt" className="flex items-center justify-between"><span>robots.txt</span><Globe className="w-4 h-4 ml-2" /></a></Button>
          <Button asChild variant="outline"><a href="/sitemap.xml" className="flex items-center justify-between"><span>Sitemap</span><Link2 className="w-4 h-4 ml-2" /></a></Button>
        </div>
      </section>

      {/* OG/Twitter Meta Önizleme */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">OG/Twitter Meta Önizleme</h2>
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-sm">URL seç ve meta’yı getir</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <select
                className="rounded border p-2 text-sm"
                onChange={(e) => {
                  const path = e.target.value
                  if (!path) return
                  const origin = window.location.origin
                  setMetaUrl(`${origin}${path}`)
                }}
              >
                <option value="">Sayfa Seç</option>
                <option value="/">Ana Sayfa</option>
                <option value="/kampanyalar">Kampanyalar</option>
                <option value="/bonuslar">Bonuslar</option>
                <option value="/guvenilir-bahis-siteleri-listesi">Güvenilir Siteler</option>
                <option value="/guvenilir-telegram">Telegram</option>
              </select>
              <Input placeholder="https://..." value={metaUrl} onChange={(e) => setMetaUrl(e.target.value)} className="w-1/2" />
              <Button onClick={handleMetaPreview} disabled={metaLoading || !metaUrl}>Getir</Button>
            </div>
            {metaError && <div className="text-red-600 text-sm">{metaError}</div>}
            {metaLoading && <div className="text-sm text-muted-foreground">Yükleniyor…</div>}
            {metaData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Başlıklar</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <div><span className="font-medium">title:</span> {metaData.title || '-'}</div>
                    <div><span className="font-medium">og:title:</span> {metaData['og:title'] || '-'}</div>
                    <div><span className="font-medium">og:description:</span> {metaData['og:description'] || '-'}</div>
                    <div><span className="font-medium">twitter:title:</span> {metaData['twitter:title'] || '-'}</div>
                    <div><span className="font-medium">twitter:description:</span> {metaData['twitter:description'] || '-'}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Görseller</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm"><span className="font-medium">og:image:</span> {metaData['og:image'] || '-'}</div>
                    {metaData['og:image'] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={metaData['og:image']} alt="OG" className="max-h-40 rounded border" loading="lazy" />
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      

      {/* Cache Kontrol */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Cache Kontrol</h2>
        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => postCache({ action: 'review-brands' })} variant="outline"><RefreshCw className="w-4 h-4 mr-2" /> Marka listesi</Button>
              <div className="flex items-center gap-2">
                <Input placeholder="slug" value={cacheSlug} onChange={(e) => setCacheSlug(e.target.value)} className="w-40" />
                <Button onClick={() => postCache({ action: 'review-brand-by-slug', slug: cacheSlug })} disabled={!cacheSlug} variant="outline">Marka slug</Button>
              </div>
              <div className="flex items-center gap-2">
                <Input placeholder="brandId" value={cacheBrandId} onChange={(e) => setCacheBrandId(e.target.value)} className="w-40" />
                <Button onClick={() => postCache({ action: 'site-reviews', brandId: cacheBrandId })} disabled={!cacheBrandId} variant="outline">Yorum listesi</Button>
              </div>
              <Button onClick={() => postCache({ action: 'home-bonuses' })} variant="outline">Home: Bonuslar</Button>
              <Button onClick={() => postCache({ action: 'home-campaigns' })} variant="outline">Home: Kampanyalar</Button>
              <Button onClick={() => postCache({ action: 'home-reviews-stats' })} variant="outline">Home: Yorum İstatistikleri</Button>
              <Button onClick={() => postCache({ action: 'all' })} variant="destructive">Tüm Cacheyi Sil</Button>
            </div>
            {cacheMsg && <div className="text-sm text-muted-foreground">{cacheMsg}</div>}
          </CardContent>
        </Card>
      </section>

      {/* robots.txt & Sitemap */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">robots.txt & Sitemap</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">robots.txt</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Button asChild variant="outline"><a href="/robots.txt" target="_blank" rel="noopener noreferrer">Görüntüle</a></Button>
                <Button onClick={saveRobots} disabled={robotsLoading}>
                  {robotsLoading ? 'Kaydediliyor…' : 'Düzenlemeyi Kaydet'}
                </Button>
              </div>
              <textarea
                value={robotsContent}
                onChange={(e) => setRobotsContent(e.target.value)}
                className="w-full h-40 rounded border p-2 font-mono text-sm"
                spellCheck={false}
              />
              {robotsMsg && <div className="text-xs text-muted-foreground">{robotsMsg}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Sitemap</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-2">
              <Button asChild variant="outline"><a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">Görüntüle</a></Button>
              <Button onClick={handleSitemapPing} disabled={pingLoading}>{pingLoading ? 'Ping…' : 'Google/Bing’e Ping'}</Button>
              <Button variant="outline" onClick={handleSitemapRebuild}>Manuel Yeniden Üret</Button>
              {sitemapInfo && (
                <div className="text-xs text-muted-foreground">Toplam URL: {sitemapInfo.totalUrls ?? '-'} · Son Üretim: {sitemapInfo.generatedAt ? new Date(sitemapInfo.generatedAt).toLocaleString('tr-TR') : '-'}</div>
              )}
              {pingResult && (
                <div className="text-xs text-muted-foreground">{pingResult.sitemap} → Google {pingResult.google}, Bing {pingResult.bing}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* İstatistik Grafikleri */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">İstatistik Grafikleri ({statsFrom && statsTo ? `${statsFrom} → ${statsTo}` : `${statsDays} gün`})</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Button size="sm" variant={statsDays===7? 'default':'outline'} onClick={()=>fetchStatsByDays(7)}>7</Button>
              <Button size="sm" variant={statsDays===30? 'default':'outline'} onClick={()=>fetchStatsByDays(30)}>30</Button>
              <Button size="sm" variant={statsDays===90? 'default':'outline'} onClick={()=>fetchStatsByDays(90)}>90</Button>
            </div>
            <div className="flex items-center gap-1">
              <Input type="date" value={statsFrom} onChange={(e)=>setStatsFrom(e.target.value)} className="h-8 w-[9.5rem]" />
              <span className="text-xs text-muted-foreground">→</span>
              <Input type="date" value={statsTo} onChange={(e)=>setStatsTo(e.target.value)} className="h-8 w-[9.5rem]" />
              <Button size="sm" onClick={fetchStatsByRange} disabled={!statsFrom || !statsTo}>Uygula</Button>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={()=>downloadJSON('istatistikler.json', weekly)}>JSON</Button>
            <Button size="sm" variant="outline" onClick={()=>downloadCSV('istatistikler.csv', weekly, ['date','reviews','clicks'])}>CSV</Button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">Yorumlar <Badge variant="secondary">Toplam: {totalReviews}</Badge></CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ reviews: { label: 'Yorumlar', color: '#3b82f6' } }}
                className="h-64"
              >
                <LineChart data={weekly}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                  <ChartTooltip content={<ChartTooltipContent className="bg-popover text-popover-foreground border border-border" />} />
                  <Line type="monotone" dataKey="reviews" stroke="var(--color-reviews)" strokeWidth={2} dot={{ r: 2 }} />
              {/* MA7 kaldırıldı */}
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">Tıklamalar <Badge variant="secondary">Toplam: {totalClicks}</Badge></CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ clicks: { label: 'Tıklamalar', color: '#22c55e' } }}
                className="h-64"
              >
                <LineChart data={weekly}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                  <ChartTooltip content={<ChartTooltipContent className="bg-popover text-popover-foreground border border-border" />} />
                  <Line type="monotone" dataKey="clicks" stroke="var(--color-clicks)" strokeWidth={2} dot={{ r: 2 }} />
              {/* MA7 kaldırıldı */}
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Moderasyon Kuyruğu */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Moderasyon Kuyruğu</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Bekleyen Yorumlar</span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" onClick={()=>downloadJSON('bekleyen-yorumlar.json', pendingModeration.reviews)}>JSON</Button>
                  <Button size="sm" variant="outline" onClick={()=>downloadCSV('bekleyen-yorumlar.csv', pendingModeration.reviews, ['id','author','content','createdAt'])}>CSV</Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><input type="checkbox" aria-label="Tümünü seç" onChange={(e)=>{
                      const checked = e.target.checked
                      const next: Record<string, boolean> = {}
                      pendingModeration.reviews.forEach((r: any)=>{ next[r.id] = checked })
                      setSelectedReviews(next)
                    }} /></TableHead>
                    <TableHead>Yazar</TableHead>
                    <TableHead>Özet</TableHead>
                    <TableHead>Aksiyon</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={`skeleton-r-${i}`}>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell className="font-medium"><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="text-muted-foreground"><Skeleton className="h-4 w-64" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    pendingModeration.reviews.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell><input type="checkbox" checked={!!selectedReviews[r.id]} onChange={()=>toggleReviewSelect(r.id)} aria-label={`Seç ${r.id}`} /></TableCell>
                        <TableCell className="font-medium">{r.author || 'Anonim'}</TableCell>
                        <TableCell className="text-muted-foreground">{(r.content || '').slice(0, 80)}{(r.content || '').length > 80 ? '…' : ''}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="default" asChild><a href={`/admin/yorumlar/yorum-onay?id=${r.id}`}>İncele</a></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" onClick={()=>bulkReviews('approve')}>Toplu Onay</Button>
                <Button size="sm" variant="destructive" onClick={()=>bulkReviews('reject')}>Toplu Reddet</Button>
                <Button size="sm" variant="outline" onClick={clearSelections}>Seçimleri Temizle (Esc)</Button>
                <div className="text-xs text-muted-foreground ml-auto">Kısayollar: ⌘/Ctrl+A = Onay, ⌘/Ctrl+R = Reddet</div>
              </div>
              <div className="mt-3">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" onClick={(e)=>{e.preventDefault(); setReviewsPage((p)=>Math.max(1, p-1))}} />
                    </PaginationItem>
                    {Array.from({ length: Math.max(1, Math.ceil(reviewsTotal/25)) }).slice(0,5).map((_, idx)=>{
                      const page = idx+1
                      return (
                        <PaginationItem key={`rp-${page}`}>
                          <PaginationLink href="#" isActive={page===reviewsPage} onClick={(e)=>{e.preventDefault(); setReviewsPage(page)}}>{page}</PaginationLink>
                        </PaginationItem>
                      )
                    })}
                    <PaginationItem>
                      <PaginationNext href="#" onClick={(e)=>{e.preventDefault(); const last = Math.max(1, Math.ceil(reviewsTotal/25)); setReviewsPage((p)=>Math.min(last, p+1))}} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Bekleyen Bonuslar</span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" onClick={()=>downloadJSON('bekleyen-bonuslar.json', pendingModeration.bonuses)}>JSON</Button>
                  <Button size="sm" variant="outline" onClick={()=>downloadCSV('bekleyen-bonuslar.csv', pendingModeration.bonuses, ['id','title','amount','createdAt'])}>CSV</Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><input type="checkbox" aria-label="Tümünü seç" onChange={(e)=>{
                      const checked = e.target.checked
                      const next: Record<string, boolean> = {}
                      pendingModeration.bonuses.forEach((b: any)=>{ next[b.id] = checked })
                      setSelectedBonuses(next)
                    }} /></TableHead>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Aksiyon</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={`skeleton-b-${i}`}>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell className="font-medium"><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    pendingModeration.bonuses.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell><input type="checkbox" checked={!!selectedBonuses[b.id]} onChange={()=>toggleBonusSelect(b.id)} aria-label={`Seç ${b.id}`} /></TableCell>
                        <TableCell className="font-medium">{b.title || 'Bonus'}</TableCell>
                        <TableCell>{b.isApproved ? 'Onaylı' : 'Beklemede'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="default" asChild><a href={`/admin/bonuses?id=${b.id}`}>İncele</a></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" onClick={()=>bulkBonuses('approve')}>Toplu Onay</Button>
                <Button size="sm" variant="destructive" onClick={()=>bulkBonuses('unapprove')}>Toplu Geri Al</Button>
                <Button size="sm" variant="outline" onClick={clearSelections}>Seçimleri Temizle (Esc)</Button>
                <div className="text-xs text-muted-foreground ml-auto">Kısayollar: ⌘/Ctrl+A = Onay</div>
              </div>
              <div className="mt-3">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" onClick={(e)=>{e.preventDefault(); setBonusesPage((p)=>Math.max(1, p-1))}} />
                    </PaginationItem>
                    {Array.from({ length: Math.max(1, Math.ceil(bonusesTotal/25)) }).slice(0,5).map((_, idx)=>{
                      const page = idx+1
                      return (
                        <PaginationItem key={`bp-${page}`}>
                          <PaginationLink href="#" isActive={page===bonusesPage} onClick={(e)=>{e.preventDefault(); setBonusesPage(page)}}>{page}</PaginationLink>
                        </PaginationItem>
                      )
                    })}
                    <PaginationItem>
                      <PaginationNext href="#" onClick={(e)=>{e.preventDefault(); const last = Math.max(1, Math.ceil(bonusesTotal/25)); setBonusesPage((p)=>Math.min(last, p+1))}} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Son Aktiviteler (10 satır) */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Son Aktiviteler</h2>
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Güncelleme</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((a) => (
                  <TableRow key={`${a.model}-${a.id}`}>
                    <TableCell className="font-medium">{a.model}</TableCell>
                    <TableCell>{a.title}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(a.updatedAt).toLocaleString('tr-TR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}