"use client";

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ArrowRight, MessageSquare, BarChart3, Clock, CalendarDays, CircleDashed, MessageSquarePlus, ThumbsUp, ThumbsDown, Plus, AlertCircle, User, FileText, Image as ImageIcon } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
// Kategori UI kaldırıldı
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { slugifyTr } from '@/lib/slugify'
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

  // Şikayet/yorum oluşturma akışı
  const [createOpen, setCreateOpen] = useState(false)
  const [dialogQuery, setDialogQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState<ReviewBrand | null>(null)
  const [newBrandName, setNewBrandName] = useState('')
  const [newBrandUrl, setNewBrandUrl] = useState('')
  const [creatingBrand, setCreatingBrand] = useState(false)
  // Şikayet akışında varsayılan olumsuz
  const [isPositive, setIsPositive] = useState<boolean>(false)
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  // Kategori kaldırıldı

  // Görsel yükleme durumu (YorumDetayClient ile aynı kurallar)
  const [imageUrls, setImageUrls] = useState<(string | null)[]>([])
  const [uploading, setUploading] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingIndex, setPendingIndex] = useState<number | null>(null)
  const [dragActive, setDragActive] = useState<boolean>(false)
  // Yükleme ilerlemesi ve ekran okuyucu mesajları
  const [uploadProgress, setUploadProgress] = useState<number[]>([0, 0, 0])
  const [srMessage, setSrMessage] = useState<string>('')

  // Mobil marka listesi sanallaştırma
  const mobileListRef = useRef<HTMLDivElement | null>(null)
  const [mobileStartIndex, setMobileStartIndex] = useState<number>(0)
  const [mobileEndIndex, setMobileEndIndex] = useState<number>(20)
  function handleMobileScroll() {
    const el = mobileListRef.current
    if (!el) return
    const rowH = 72
    const top = el.scrollTop
    const view = el.clientHeight
    const start = Math.max(0, Math.floor(top / rowH) - 2)
    const end = Math.ceil((top + view) / rowH) + 2
    setMobileStartIndex(start)
    setMobileEndIndex(end)
  }
  useEffect(() => {
    // Dialog açıldığında başlangıç aralığını ayarla
    if (createOpen) {
      setMobileStartIndex(0)
      setMobileEndIndex(20)
    }
  }, [createOpen])

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

  // Debounce edilmiş arama
  const [debouncedDialogQuery, setDebouncedDialogQuery] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedDialogQuery(dialogQuery.trim().toLowerCase()), 200)
    return () => clearTimeout(t)
  }, [dialogQuery])

  const dialogFiltered = useMemo(() => {
    const q = debouncedDialogQuery
    return enriched.filter((s) => (q ? (s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)) : true))
  }, [enriched, debouncedDialogQuery])

  function highlight(text: string, query: string) {
    const q = query.trim().toLowerCase()
    if (!q) return text
    const i = text.toLowerCase().indexOf(q)
    if (i < 0) return text
    const before = text.slice(0, i)
    const match = text.slice(i, i + q.length)
    const after = text.slice(i + q.length)
    return (
      <>
        {before}
        <mark className="bg-yellow-200/60 text-foreground rounded px-0.5">{match}</mark>
        {after}
      </>
    )
  }

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

  // Görsel yükleme yardımcıları
  function canAddMoreImages(): boolean {
    const filledCount = imageUrls.filter(Boolean).length
    return filledCount < 3
  }
  function removeImageAt(idx: number) {
    setImageUrls((prev) => {
      const next = [...prev]
      next[idx] = null
      return next
    })
  }
  async function processFiles(files: FileList | File[]) {
    const allowed = new Set(['image/png', 'image/jpeg'])
    const list = Array.from(files)
    setUploading(true)
    for (const file of list) {
      if (!canAddMoreImages()) break
      if (!allowed.has(file.type)) { setUploadError('Sadece PNG/JPEG'); continue }
      if (file.size > 500 * 1024) { setUploadError('Maksimum 500KB'); continue }
      // Hedef indexi belirle
      const targetIndex = (() => {
        const current = [...imageUrls]
        const idx = typeof pendingIndex === 'number' ? pendingIndex : current.findIndex((v) => v == null)
        if (idx >= 0) return idx
        if (current.length < 3) return current.length
        return -1
      })()
      if (targetIndex < 0) break
      setUploadProgress((prev) => { const next = [...prev]; next[targetIndex] = 0; return next })
      setSrMessage('Yükleme başladı')
      try {
        const url = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', '/api/upload')
          xhr.responseType = 'json'
          xhr.upload.onprogress = (e: ProgressEvent) => {
            if (e.lengthComputable) {
              const pct = Math.max(0, Math.min(100, Math.round((e.loaded / e.total) * 100)))
              setUploadProgress((prev) => { const next = [...prev]; next[targetIndex] = pct; return next })
              setSrMessage(`Yükleme ilerlemesi yüzde ${pct}`)
            }
          }
          xhr.onload = () => {
            const data: any = xhr.response
            if (xhr.status >= 200 && xhr.status < 300 && data?.url) {
              setSrMessage('Görsel yüklendi')
              resolve(String(data.url))
            } else {
              const msg = String(data?.error || 'Yükleme hatası')
              setSrMessage('Yükleme hatası')
              reject(new Error(msg))
            }
          }
          xhr.onerror = () => {
            setSrMessage('Ağ hatası')
            reject(new Error('Ağ hatası'))
          }
          const fd = new FormData()
          fd.append('file', file)
          xhr.send(fd)
        })
        setImageUrls((prev) => {
          const next = [...prev]
          next[targetIndex] = url
          return next.slice(0, 3)
        })
      } catch (err: any) {
        setUploadError(String(err?.message || 'Yükleme hatası'))
        setUploadProgress((prev) => { const next = [...prev]; next[targetIndex] = 0; return next })
      }
    }
    setUploading(false)
  }
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadError(null)
    if (!canAddMoreImages() && pendingIndex === null) { setUploadError('En fazla 3 görsel yükleyebilirsiniz.'); e.target.value = ''; return }
    await processFiles(files)
    e.target.value = ''
    setPendingIndex(null)
  }

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
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <Button asChild className="gap-1.5">
                  <a href="#yorumlu-siteler">Yorumları Keşfet <ArrowRight className="w-4 h-4" /></a>
                </Button>
                <Button onClick={()=> setCreateOpen(true)}
                  className="gap-1.5 font-semibold shadow-md ring-2 ring-gold/40">
                  <MessageSquarePlus className="w-4 h-4" aria-hidden /> Şikayet Oluştur
                </Button>
                <span className="text-xs md:text-sm text-muted-foreground">Şikayetin mi var? Tıklayıp hemen paylaş.</span>
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
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Şikayet Oluştur</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Erişilebilirlik için canlı durum bölgesi */}
                    <p className="sr-only" role="status" aria-live="polite">{srMessage}</p>
                    {/* Stepper: 2 aşamalı küçük gösterge */}
                    <div className="mb-3 flex items-center gap-2 text-xs">
                      <Badge variant={selectedBrand ? 'outline' : 'default'} className="inline-flex items-center gap-1">
                        <Search className="w-3 h-3" />
                        <span>Marka Seç</span>
                      </Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant={selectedBrand ? 'default' : 'outline'} className="inline-flex items-center gap-1">
                        {isPositive ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                        <span>Yorum Yaz</span>
                      </Badge>
                    </div>

                    {/* Adım 1: Marka Seçimi veya Ekleme */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">1) Marka Seç</h3>
                      {selectedBrand ? (
                        <div className="flex items-center justify-between rounded-md border p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 flex items-center justify-center border rounded bg-card">
                              {selectedBrand.logoUrl ? (
                                <img src={selectedBrand.logoUrl} alt={selectedBrand.name} className="w-full h-full object-contain" />
                              ) : (
                                <img src="/logo.svg" alt="logo" className="h-6 w-12" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{selectedBrand.name}</div>
                              <div className="text-xs text-muted-foreground">/yorumlar/{selectedBrand.slug}</div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={()=> setSelectedBrand(null)}>Değiştir</Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <Input value={dialogQuery} onChange={(e)=>setDialogQuery(e.target.value)} placeholder="Marka ara…" className="h-9" />
                          </div>
                          <div className="overflow-x-auto hidden sm:block">
                            <div className="max-h-[50vh] overflow-y-auto rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow className="sticky top-0 bg-background z-10">
                                    <TableHead>Logo</TableHead>
                                    <TableHead>Marka</TableHead>
                                    <TableHead>Yorum</TableHead>
                                    <TableHead></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {dialogFiltered.slice(0, 50).map((b)=> (
                                    <TableRow key={b.id}>
                                      <TableCell>
                                        <div className="w-10 h-10 flex items-center justify-center border rounded bg-card">
                                          {b.logoUrl ? (
                                            <img src={b.logoUrl} alt={b.name} className="w-full h-full object-contain" />
                                          ) : (
                                            <img src="/logo.svg" alt="logo" className="h-6 w-12" />
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-sm">{highlight(b.name, debouncedDialogQuery)}</TableCell>
                                      <TableCell className="text-sm">{b.reviewCount ?? 0}</TableCell>
                                      <TableCell className="text-right"><Button size="sm" onClick={()=> setSelectedBrand(b)}>Seç</Button></TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                          {/* Akıllı öneri: inline yeni marka ekle */}
                          {dialogQuery.trim().length >= 2 && (
                            (()=>{
                              const name = dialogQuery.trim()
                              const slugCandidate = slugifyTr(name)
                              const duplicate = enriched.find((b)=> b.slug === slugCandidate || b.name.trim().toLowerCase() === name.toLowerCase())
                              return (
                                <div className="rounded-md border p-2 flex items-center justify-between">
                                  <div className="text-xs">Yeni marka olarak ekle: <span className="font-medium">{name}</span></div>
                                  <Button size="sm" variant={duplicate? 'outline':'default'} disabled={!!duplicate} onClick={()=>{ setNewBrandName(name); setNewBrandUrl('') }}>
                                    {duplicate ? 'Zaten mevcut' : 'Formu doldur'}
                                  </Button>
                                </div>
                              )
                            })()
                          )}

                          {/* Mobil kart listesi: basit sanallaştırma */}
                          <div className="sm:hidden max-h-[60vh] overflow-y-auto" ref={mobileListRef} onScroll={handleMobileScroll}>
                            {(() => {
                              const items = dialogFiltered
                              const total = items.length
                              const rowH = 72
                              const start = mobileStartIndex
                              const end = Math.min(mobileEndIndex, total)
                              const topPad = start * rowH
                              const bottomPad = Math.max(0, (total - end) * rowH)
                              const windowed = items.slice(start, end)
                              return (
                                <div className="space-y-2" style={{ paddingTop: `${topPad}px`, paddingBottom: `${bottomPad}px` }}>
                                  {windowed.map((b)=> (
                                    <div key={b.id} className="flex items-center justify-between rounded-md border p-2" style={{ height: `${rowH}px` }}>
                                      <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 flex items-center justify-center border rounded bg-card">
                                          {b.logoUrl ? (
                                            <img src={b.logoUrl} alt={b.name} className="w-full h-full object-contain" />
                                          ) : (
                                            <img src="/logo.svg" alt="logo" className="h-6 w-12" />
                                          )}
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium">{highlight(b.name, debouncedDialogQuery)}</div>
                                          <div className="text-xs text-muted-foreground">Yorum: {b.reviewCount ?? 0}</div>
                                        </div>
                                      </div>
                                      <Button size="sm" onClick={()=> setSelectedBrand(b)}>Seç</Button>
                                    </div>
                                  ))}
                                </div>
                              )
                            })()}
                          </div>
                          <div className="space-y-2 pt-2">
                            <div className="text-xs text-muted-foreground">Markan listede yok mu?</div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <Input value={newBrandName} onChange={(e)=> setNewBrandName(e.target.value)} placeholder="Marka adı" />
                              <Input value={newBrandUrl} onChange={(e)=> setNewBrandUrl(e.target.value)} placeholder="Site URL (opsiyonel)" />
                              <Button disabled={creatingBrand || !newBrandName.trim()} onClick={async ()=>{
                                if (!newBrandName.trim()) { toast({ variant:'destructive', title:'Eksik bilgi', description:'Lütfen marka adını girin.' }); return }
                                // İsim/slug çakışma kontrolü
                                const slugCandidate = slugifyTr(newBrandName.trim())
                                const existing = brands.find((b)=> b.slug === slugCandidate || b.name.trim().toLowerCase() === newBrandName.trim().toLowerCase())
                                if (existing) {
                                  setSelectedBrand(existing)
                                  toast({ variant:'destructive', title:'Marka zaten mevcut', description:`${existing.name} listede mevcut, onu seçtim.` })
                                  return
                                }
                                try {
                                  setCreatingBrand(true)
                                  const res = await fetch('/api/review-brands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newBrandName.trim(), siteUrl: newBrandUrl.trim() || undefined }) })
                                  const data = await res.json().catch(()=>({}))
                                  if (!res.ok) {
                                    if (res.status === 409) {
                                      const bySlug = brands.find((b)=> b.slug === slugCandidate)
                                      if (bySlug) {
                                        setSelectedBrand(bySlug)
                                        setNewBrandName(''); setNewBrandUrl('')
                                        toast({ variant:'destructive', title:'Marka zaten mevcut', description:`${bySlug.name} listede mevcut, onu seçtim.` })
                                        return
                                      }
                                    }
                                    toast({ variant:'destructive', title:'Marka eklenemedi', description: String(data?.error || 'Hata') })
                                  } else {
                                    const created: ReviewBrand = data
                                    setBrands(prev => [created, ...prev])
                                    setSelectedBrand(created)
                                    setNewBrandName(''); setNewBrandUrl('')
                                    toast({ title: 'Marka eklendi', description: `${created.name} seçildi, şimdi şikayetini yaz.` })
                                  }
                                } finally { setCreatingBrand(false) }
                              }}>Marka Ekle ve Seç</Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Marka eklendikten sonra moderasyon kurallarına uygun yorumlar onaylandıktan sonra yayınlanır.</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Adım 2: Şikayet / Olumlu değerlendirme yazımı */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {isPositive ? <ThumbsUp className="w-4 h-4 text-emerald-600" /> : <ThumbsDown className="w-4 h-4 text-red-600" />}
                        <span>2) Şikayetinizi veya olumlu değerlendirmenizi yazın</span>
                      </div>
                      {!selectedBrand && (
                        <p className="text-xs text-muted-foreground">Devam etmek için önce bir marka seçin veya ekleyin.</p>
                      )}
                      {selectedBrand && (
                        <div className="space-y-3">
                          {/* Ton seçimi */}
                          <div className="flex gap-2">
                            <Button variant={isPositive===false? 'default':'outline'} size="sm" onClick={()=> setIsPositive(false)} className="flex items-center gap-1">
                              <ThumbsDown className="w-3.5 h-3.5" /> Şikayet
                            </Button>
                            <Button variant={isPositive===true? 'default':'outline'} size="sm" onClick={()=> setIsPositive(true)} className="flex items-center gap-1">
                              <ThumbsUp className="w-3.5 h-3.5" /> Olumlu Değerlendirme
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={isPositive? 'default':'destructive'} className="text-xs flex items-center gap-1">
                              {isPositive ? <ThumbsUp className="w-3.5 h-3.5" /> : <ThumbsDown className="w-3.5 h-3.5" />}
                              {isPositive ? 'Olumlu değerlendirme' : 'Şikayet'}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              Şikayetleriniz markalara otomatik gönderilir
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button type="button" className="inline-flex items-center justify-center p-0.5 rounded hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Bilgi">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Oluşturulan şikayetler markaların resmi mail adreslerine otomatik iletilir.
                                </TooltipContent>
                              </Tooltip>
                            </span>
                          </div>
                          {/* Kategori UI kaldırıldı */}
                          <div className="flex items-center gap-2">
                            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} id="anon" />
                            <Label htmlFor="anon" className="text-sm flex items-center gap-1"><User className="w-4 h-4" /> İsimsiz yaz</Label>
                          </div>
                          {!isAnonymous && (
                            <div className="relative">
                              <Input value={author} onChange={(e)=> setAuthor(e.target.value)} placeholder="Kullanıcı adı / takma ad" />
                              <User className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="space-y-1">
                            <Label className="text-sm flex items-center gap-1"><FileText className="w-4 h-4" /> Metin</Label>
                            <Textarea value={content} onChange={(e)=> setContent(e.target.value)} placeholder="Şikayetinizin veya değerlendirmenizin detaylarını yazın…Kullanıcı adınızı yazmayıda unutmayınız!" rows={5} />
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Lütfen kanıt ve tarih gibi somut bilgileri ekleyin.</span>
                              <span className="text-xs text-muted-foreground">{content.length} karakter</span>
                            </div>
                          </div>

                          {/* Görsel yükleme (3 slot, drag & drop) */}
                          <div>
                            <Label className="text-sm flex items-center gap-1"><ImageIcon className="w-4 h-4" /> Görsel (opsiyonel)</Label>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/png,image/jpeg"
                              multiple
                              onChange={handleFileSelect}
                              disabled={uploading}
                              className="hidden"
                            />
                            <div
                              className={`mt-1 flex gap-2 p-2 rounded-md border-2 ${dragActive ? 'border-gold bg-muted/40' : 'border-dashed'}`}
                              onDragOver={(e)=>{ e.preventDefault(); setDragActive(true) }}
                              onDragLeave={(e)=>{ e.preventDefault(); setDragActive(false) }}
                              onDrop={(e)=>{ e.preventDefault(); setDragActive(false); const dt = e.dataTransfer; const files = dt?.files; if (files && files.length) { setPendingIndex(null); processFiles(files) } }}
                              aria-label="Görsel sürükle-bırak alanı"
                            >
                              {[0,1,2].map((idx) => {
                                const url = imageUrls[idx] || null
                                const canClick = !uploading
                                return (
                                  <div
                                    key={idx}
                                    className={`relative aspect-square w-20 sm:w-24 border-2 rounded-md ${url ? 'border-muted' : 'border-dashed'} flex items-center justify-center ${canClick ? 'cursor-pointer hover:bg-muted/40' : 'opacity-50 cursor-not-allowed'} bg-card`}
                                    onClick={() => { if (!canClick) return ; setPendingIndex(idx); fileInputRef.current?.click() }}
                                    aria-label={`Görsel yükle ${idx+1}`}
                                    role="button"
                                  >
                                      {url ? (
                                      <>
                                        <img src={url} alt="yüklenen görsel" className="absolute inset-0 w-full h-full object-cover rounded-md" loading="lazy" />
                                        {typeof pendingIndex === 'number' && pendingIndex === idx && uploadProgress[idx] != null && (
                                          <div className="absolute bottom-0 left-0 right-0 h-2 bg-muted/60">
                                            <div className="h-2 bg-primary" style={{ width: `${uploadProgress[idx] ?? 0}%` }} />
                                          </div>
                                        )}
                                        <Button type="button" variant="destructive" size="sm" className="absolute top-1 right-1 h-6 px-2" onClick={(e)=>{ e.stopPropagation(); removeImageAt(idx) }}>Kaldır</Button>
                                      </>
                                    ) : (
                                      <div className="text-muted-foreground flex items-center justify-center"><Plus className="w-6 h-6" /></div>
                                    )}
                                  </div>
                              )
                            })}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">Maksimum 500KB. PNG/JPEG izin verilir. En fazla 3 görsel.</p>
                          {uploadError && <div className="mt-1 text-xs text-red-600">{uploadError}</div>}
                          </div>

                          <div className="flex gap-2">
                            <Button disabled={submittingReview} onClick={async ()=>{
                              if (!selectedBrand) { toast({ variant:'destructive', title:'Marka seçilmedi', description:'Lütfen bir marka seçin.' }); return }
                              if (!content.trim()) { toast({ variant:'destructive', title:'Eksik bilgi', description:'Lütfen metin girin.' }); return }
                              if (!isAnonymous && !author.trim()) { toast({ variant:'destructive', title:'Eksik bilgi', description:'İsimsiz değilse kullanıcı adı girin.' }); return }
                              try {
                                setSubmittingReview(true)
                                const res = await fetch('/api/site-reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brandSlug: selectedBrand.slug, author, isAnonymous, isPositive, content, imageUrls: imageUrls.filter((u): u is string => typeof u === 'string') }) })
                                const data = await res.json().catch(()=>({}))
                                if (!res.ok) {
                                  toast({ variant:'destructive', title:'Gönderim hatası', description: String(data?.error || 'Hata') })
                                } else {
                                  toast({ title: 'Gönderildi', description: 'Moderatör onayından sonra yorumunuz görüntülenecek.' })
                                  setAuthor(''); setContent(''); setIsAnonymous(true); setIsPositive(false); setImageUrls([]); setUploadError(null)
                                  setCreateOpen(false)
                                }
                              } finally { setSubmittingReview(false) }
                            }} className="flex items-center gap-1.5">Gönder <ArrowRight className="w-4 h-4" /></Button>
                            <Button variant="outline" onClick={()=> setCreateOpen(false)}>İptal</Button>
                          </div>
                        </div>
                      )}
                    </div>
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