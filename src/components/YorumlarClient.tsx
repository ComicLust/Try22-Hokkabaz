"use client";

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ArrowRight, MessageSquare, BarChart3, Clock, CalendarDays, CircleDashed, Lightbulb, MessageSquarePlus, ThumbsUp, ThumbsDown } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import SeoArticle from "@/components/SeoArticle";
import { TopBrandTicker } from '@/components/top-brand-ticker/TopBrandTicker'
import { Skeleton } from '@/components/ui/skeleton'

type ReviewBrand = { id: string; name: string; slug: string; logoUrl?: string | null; createdAt: string; }
type ReviewStat = { brandId: string; slug: string; name: string; logoUrl?: string | null; createdAt: string; isActive?: boolean; reviewCount: number; lastReviewAt?: string | null; positiveCount: number; negativeCount: number }

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export default function YorumlarClient() {
  const [brands, setBrands] = useState<ReviewBrand[]>([])
  const [stats, setStats] = useState<ReviewStat[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<'most_commented' | 'last_commented' | 'newest'>('most_commented')
  const [showOnlyUncommented, setShowOnlyUncommented] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { toast } = useToast()

  // Marka öneri formu
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [brandName, setBrandName] = useState('')
  const [email, setEmail] = useState('')
  const [siteUrl, setSiteUrl] = useState('')
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false)

  // Basit captcha (toplama)
  const [captchaA, setCaptchaA] = useState<number>(() => Math.floor(Math.random()*5)+2)
  const [captchaB, setCaptchaB] = useState<number>(() => Math.floor(Math.random()*5)+2)
  const [captchaInput, setCaptchaInput] = useState<string>('')
  const captchaOk = useMemo(() => Number(captchaInput) === (captchaA + captchaB), [captchaInput, captchaA, captchaB])
  const regenCaptcha = () => { setCaptchaA(Math.floor(Math.random()*5)+2); setCaptchaB(Math.floor(Math.random()*5)+2); setCaptchaInput('') }

  // Marquee (kayan logolar)
  type MarqueeLogo = { id: string; imageUrl: string; href?: string | null; order: number; isActive: boolean };
  const [marqueeLogos, setMarqueeLogos] = useState<MarqueeLogo[]>([])
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/marquee-logos')
        const data = await res.json()
        setMarqueeLogos(Array.isArray(data) ? data.filter((d: MarqueeLogo) => d.isActive) : [])
      } catch {}
    })()
  }, [])
  const marqueeItems = useMemo(() => {
    const reps = 12
    if (!marqueeLogos.length) return [] as MarqueeLogo[]
    return Array.from({ length: reps }, (_, i) => marqueeLogos[i % marqueeLogos.length])
  }, [marqueeLogos])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [bRes, sRes] = await Promise.all([
          fetch('/api/review-brands?active=true', { headers: { Accept: 'application/json' } }),
          fetch('/api/site-reviews/stats', { headers: { Accept: 'application/json' } }),
        ])
        const [bJson, sJson] = await Promise.all([bRes.json(), sRes.json()])
        setBrands(Array.isArray(bJson) ? bJson : [])
        setStats(Array.isArray(sJson) ? sJson : [])
      } catch (e) {
        setError('Yüklenemedi')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const map = useMemo(() => {
    const m: Record<string, { reviewCount: number; lastReviewAt?: string | null; positiveCount: number; negativeCount: number }> = {}
    for (const s of stats) {
      m[s.slug] = { reviewCount: s.reviewCount ?? 0, lastReviewAt: s.lastReviewAt ?? null, positiveCount: s.positiveCount ?? 0, negativeCount: s.negativeCount ?? 0 }
    }
    return m
  }, [stats])

  const enriched = useMemo(() => {
    return brands.map((b) => ({
      ...b,
      reviewCount: map[b.slug]?.reviewCount ?? 0,
      lastReviewAt: map[b.slug]?.lastReviewAt ?? null,
      positiveCount: map[b.slug]?.positiveCount ?? 0,
      negativeCount: map[b.slug]?.negativeCount ?? 0,
    }))
  }, [brands, stats])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = enriched.filter((s) => (q ? (s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)) : true))
    if (showOnlyUncommented) list = list.filter((s) => (s.reviewCount ?? 0) === 0)
    switch (sortKey) {
      case 'most_commented':
        list = list.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0))
        break
      case 'last_commented':
        list = list.sort((a, b) => {
          const av = a.lastReviewAt ? new Date(a.lastReviewAt).getTime() : 0
          const bv = b.lastReviewAt ? new Date(b.lastReviewAt).getTime() : 0
          return bv - av
        })
        break
      case 'newest':
        list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }
    return list
  }, [enriched, searchQuery, sortKey, showOnlyUncommented])

  const uncommented = useMemo(() => enriched.filter((b) => (b.reviewCount ?? 0) === 0), [enriched])

  const totalReviews = useMemo(() => stats.reduce((acc, s) => acc + (s.reviewCount ?? 0), 0), [stats])
  const commentedCount = useMemo(() => enriched.filter((b) => (b.reviewCount ?? 0) > 0).length, [enriched])
  const lastReviewDate = useMemo(() => {
    const max = stats.reduce((m, s) => {
      const t = s.lastReviewAt ? new Date(s.lastReviewAt).getTime() : 0
      return t > m ? t : m
    }, 0)
    return max ? new Date(max).toLocaleDateString('tr-TR') : null
  }, [stats])

  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/yorumlar" />
      {marqueeItems.length > 0 && (
        <TopBrandTicker
          items={marqueeItems.map((m) => ({ imageUrl: m.imageUrl, href: m.href }))}
          className="md:pl-72"
        />
      )}
      <main className="container mx-auto px-4 py-8 md:pl-72">
        <motion.section className="mb-6" initial="initial" animate="animate" variants={fadeInUp}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-2xl font-bold text-gold flex items-center gap-2">
                <MessageSquare className="w-6 h-6" /> Bet Siteleri Yorumları
              </h1>
              <p className="mt-1 text-sm md:text-base text-muted-foreground">
                Gerçek kullanıcı yorumlarıyla bahis sitelerini karşılaştırın. Arama, filtre ve sıralama seçenekleriyle en iyi kararınızı verin.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild className="gap-1.5">
                  <a href="#yorumlu-siteler">Yorumları Keşfet <ArrowRight className="w-4 h-4" /></a>
                </Button>
                <Button variant="outline" className="gap-1.5" onClick={()=> setSuggestOpen(true)}>
                  <Lightbulb className="w-4 h-4" aria-hidden /> Marka Öner
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
              <div className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-gold" aria-hidden />
                  Toplam Yorum
                </div>
                <div className="mt-1 text-xl font-semibold">{totalReviews}</div>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <BarChart3 className="w-4 h-4 text-gold" aria-hidden />
                  Yorumlu Marka
                </div>
                <div className="mt-1 text-xl font-semibold">{commentedCount}</div>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <CircleDashed className="w-4 h-4 text-gold" aria-hidden />
                  Yeni Eklenecek
                </div>
                <div className="mt-1 text-xl font-semibold">{uncommented.length}</div>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="w-4 h-4 text-gold" aria-hidden />
                  Son Yorum
                </div>
                <div className="mt-1 text-xl font-semibold">{lastReviewDate ?? '—'}</div>
              </div>
            </div>
          </div>
        </motion.section>
        <motion.section className="mb-6" initial="initial" animate="animate" variants={fadeInUp}>
          <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
            <div className="relative w-full md:flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Site ismi ara…" className="pl-9 h-9 md:h-10" />
            </div>
            <div className="w-full md:w-auto flex flex-wrap items-center justify-start md:justify-center gap-2">
              <Button size="sm" className="flex-1 md:flex-none gap-1.5" variant={sortKey==='most_commented'?'default':'outline'} onClick={() => setSortKey('most_commented')}>
                <BarChart3 className="w-4 h-4" aria-hidden /> En Çok Yorumlananlar
              </Button>
              <Button size="sm" className="flex-1 md:flex-none gap-1.5" variant={sortKey==='last_commented'?'default':'outline'} onClick={() => setSortKey('last_commented')}>
                <Clock className="w-4 h-4" aria-hidden /> Son Yorum Yapılanlar
              </Button>
              <Button size="sm" className="flex-1 md:flex-none gap-1.5" variant={sortKey==='newest'?'default':'outline'} onClick={() => setSortKey('newest')}>
                <CalendarDays className="w-4 h-4" aria-hidden /> En Yeniler
              </Button>
              <Button size="sm" className="flex-1 md:flex-none gap-1.5" variant={showOnlyUncommented ? 'default' : 'outline'} onClick={() => setShowOnlyUncommented((v)=>!v)}>
                <CircleDashed className="w-4 h-4" aria-hidden /> Henüz Yorumlanmayanlar
              </Button>
              <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="flex-1 md:flex-none gap-1.5"><Lightbulb className="w-4 h-4" aria-hidden /> Marka Öner</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Marka Öner</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Marka Adı</Label>
                      <Input value={brandName} onChange={(e)=>setBrandName(e.target.value)} placeholder="Örn: Örnek Bahis" />
                    </div>
                    <div className="space-y-1">
                      <Label>E-posta</Label>
                      <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="ornek@mail.com" />
                    </div>
                    <div className="space-y-1">
                      <Label>Marka URL</Label>
                      <Input value={siteUrl} onChange={(e)=>setSiteUrl(e.target.value)} placeholder="https://ornekbahis.com" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm">Doğrulama:</span>
                      <span className="font-mono text-sm">{captchaA} + {captchaB} =</span>
                      <Input
                        className="w-16 h-8"
                        value={captchaInput}
                        onChange={(e)=>setCaptchaInput(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="?"
                        type="tel"
                      />
                      <Button type="button" variant="ghost" size="sm" onClick={regenCaptcha}>Yenile</Button>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button disabled={submittingSuggestion} onClick={async ()=>{
                        if (!brandName.trim()) { toast({ variant:'destructive', title:'Eksik bilgi', description:'Lütfen marka adını girin.' }); return }
                        if (!captchaOk) { toast({ variant:'destructive', title:'Doğrulama başarısız', description:'Lütfen basit toplama doğrulamasını doğru yanıtlayın.' }); return }
                        try {
                          setSubmittingSuggestion(true)
                          const res = await fetch('/api/brand-suggestions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ brandName: brandName.trim(), email: email.trim(), siteUrl: siteUrl.trim() })
                          })
                          if (res.ok) {
                            toast({ title: 'Gönderildi', description: 'Öneriniz bizlere ulaştı!.' })
                            setBrandName(''); setEmail(''); setSiteUrl(''); regenCaptcha(); setSuggestOpen(false)
                          } else {
                            const data = await res.json().catch(()=>({}))
                            toast({ variant:'destructive', title:'Gönderim hatası', description: data?.error ?? 'Gönderim başarısız' })
                          }
                        } finally { setSubmittingSuggestion(false) }
                      }}>Gönder</Button>
                      <Button variant="outline" onClick={()=>setSuggestOpen(false)}>İptal</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Bilgiler yalnızca moderasyon ve iletişim amaçlıdır; sitede otomatik yayınlanmaz.</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.section>

        {error && (
          <div className="mt-4 text-sm text-muted-foreground">Yüklenemedi. Lütfen sayfayı yenileyin.</div>
        )}

        {!error && !loading && (
          <motion.section id="yorumlu-siteler" className="mt-6" initial="initial" animate="animate" variants={fadeInUp}>
            <h2 className="text-xl font-bold text-gold mb-4">Yorumlu Siteler</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((s) => (
                <Card key={s.id} className="overflow-hidden">
                  <CardHeader className="flex flex-col items-center">
                    <a href={`/yorumlar/${s.slug}`} className="block w-full">
                      <div className="w-full max-w-[220px] h-[60px] md:max-w-[240px] md:h-[72px] mx-auto overflow-hidden bg-card flex items-center justify-center border rounded-lg p-2 hover:shadow-md cursor-pointer">
                        {s.logoUrl ? (
                          <img src={s.logoUrl} alt={s.name} className="w-full h-full object-contain filter brightness-110 contrast-115" />
                        ) : (
                          <img src="/logo.svg" alt="logo" className="h-12 w-24 filter brightness-110 contrast-115" />
                        )}
                      </div>
                    </a>
                    <CardTitle className="text-base text-center mt-2">{s.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2 items-center">
                      <Badge variant="default" className="text-xs flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" aria-hidden /> Toplam: {s.reviewCount ?? 0}</Badge>
                      <Badge className="text-xs flex items-center gap-1 bg-emerald-600 text-white hover:bg-emerald-600/90 border-none"><ThumbsUp className="w-3.5 h-3.5" aria-hidden /> Olumlu: {s.positiveCount ?? 0}</Badge>
                      <Badge variant="destructive" className="text-xs flex items-center gap-1"><ThumbsDown className="w-3.5 h-3.5" aria-hidden /> Olumsuz: {s.negativeCount ?? 0}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild className="w-full">
                        <a href={`/yorumlar/${s.slug}`} className="flex w-full items-center justify-center gap-2 px-4">Yorumları Gör <ArrowRight className="w-4 h-4" /></a>
                      </Button>
                      <Button variant="outline" asChild className="w-full">
                        <a href={`/yorumlar/${s.slug}#yeni-yorum`} className="flex items-center justify-center gap-1.5"><MessageSquarePlus className="w-4 h-4" aria-hidden /> Yorum Yap</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

        {loading && (
          <motion.section className="mt-6" initial="initial" animate="animate" variants={fadeInUp}>
            <h2 className="text-xl font-bold text-gold mb-4">Siteler yükleniyor…</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="flex flex-col items-center">
                    <div className="w-full max-w-[220px] h-[60px] md:max-w-[240px] md:h-[72px] mx-auto overflow-hidden bg-card flex items-center justify-center border rounded-lg p-2">
                      <Skeleton className="h-10 w-24" />
                    </div>
                    <CardTitle className="text-base text-center mt-2">
                      <Skeleton className="h-4 w-40" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

        {!loading && !!uncommented.length && (
          <motion.section className="mt-10" initial="initial" animate="animate" variants={fadeInUp}>
            <h2 className="text-xl font-bold text-gold mb-4">Henüz Yorumlanmayanlar / Yeni Eklenecekler</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uncommented.slice(0, 12).map((b) => (
                 <Card key={b.id} className="overflow-hidden backdrop-blur-lg bg-opacity-80 bg-card border border-border rounded-2xl hover:shadow-xl transition-all duration-300">
                  <CardHeader className="flex flex-col items-center">
                    <a href={`/yorumlar/${b.slug}`} className="block w-full">
                      <div className="w-full max-w-[220px] h-[60px] md:max-w-[240px] md:h-[72px] mx-auto overflow-hidden bg-card flex items-center justify-center border rounded-lg p-2 hover:shadow-md cursor-pointer">
                         {b.logoUrl ? (
                           <img src={b.logoUrl} alt={b.name} className="w-full h-full object-contain filter brightness-110 contrast-115" />
                         ) : (
                           <img src="/logo.svg" alt="logo" className="h-12 w-24 filter brightness-110 contrast-115" />
                         )}
                       </div>
                    </a>
                    <CardTitle className="text-base text-center mt-2">{b.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" asChild className="w-full">
                      <a href={`/yorumlar/${b.slug}#yeni-yorum`} className="flex items-center justify-center gap-1.5"><MessageSquarePlus className="w-4 h-4" aria-hidden /> Yorum Yap</a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

      </main>
      <SeoArticle slug="yorumlar" />
      <Footer />
    </div>
  )
}