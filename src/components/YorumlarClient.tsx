"use client";

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ArrowRight, MessageSquare } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

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

  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/yorumlar" />
      <main className="container mx-auto px-4 py-8 md:pl-72">
        <motion.section className="mb-6" initial="initial" animate="animate" variants={fadeInUp}>
          <h1 className="text-2xl font-bold text-gold mb-4 flex items-center"><MessageSquare className="w-6 h-6 mr-2" /> Bet Siteleri Yorumları</h1>
          <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
            <div className="relative w-full md:flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Site ismi ara…" className="pl-9 h-9 md:h-10" />
            </div>
            <div className="w-full md:w-auto flex flex-wrap items-center justify-start md:justify-center gap-2">
              <Button size="sm" className="flex-1 md:flex-none" variant={sortKey==='most_commented'?'default':'outline'} onClick={() => setSortKey('most_commented')}>En Çok Yorumlananlar</Button>
              <Button size="sm" className="flex-1 md:flex-none" variant={sortKey==='last_commented'?'default':'outline'} onClick={() => setSortKey('last_commented')}>Son Yorum Yapılanlar</Button>
              <Button size="sm" className="flex-1 md:flex-none" variant={sortKey==='newest'?'default':'outline'} onClick={() => setSortKey('newest')}>En Yeniler</Button>
              <Button size="sm" className="flex-1 md:flex-none" variant={showOnlyUncommented ? 'default' : 'outline'} onClick={() => setShowOnlyUncommented((v)=>!v)}>
                Henüz Yorumlanmayanlar
              </Button>
            </div>
          </div>
        </motion.section>

        {error && (
          <div className="mt-4 text-sm text-muted-foreground">Yüklenemedi. Lütfen sayfayı yenileyin.</div>
        )}

        {!error && (
          <motion.section className="mt-6" initial="initial" animate="animate" variants={fadeInUp}>
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
                      <Badge variant="default" className="text-xs">Toplam: {s.reviewCount ?? 0}</Badge>
                      <Badge variant="secondary" className="text-xs">Olumlu: {s.positiveCount ?? 0}</Badge>
                      <Badge variant="destructive" className="text-xs">Olumsuz: {s.negativeCount ?? 0}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild className="w-full">
                        <a href={`/yorumlar/${s.slug}`} className="flex w-full items-center justify-center gap-2 px-4">Yorumları Gör <ArrowRight className="w-4 h-4" /></a>
                      </Button>
                      <Button variant="outline" asChild className="w-full">
                        <a href={`/yorumlar/${s.slug}#yeni-yorum`} className="flex items-center justify-center">Yorum Yap</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

        {!!uncommented.length && (
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
                      <a href={`/yorumlar/${b.slug}#yeni-yorum`} className="flex items-center justify-center">Yorum Yap</a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

      </main>
      <Footer />
    </div>
  )
}