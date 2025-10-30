"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'

interface SpecialOddItemApi {
  id: string
  brandName: string
  matchTitle: string
  oddsLabel: string
  conditions: string | null
  imageUrl?: string | null
  ctaUrl?: string | null
  expiresAt?: string | null
  priority?: number
  createdAt?: string
  brand?: { id: string; name: string; slug: string; logoUrl?: string | null } | null
}

interface SpecialOddUIItem {
  id: string
  brand: string
  brandSlug?: string | null
  brandLogoUrl?: string | null
  match: string
  oddsLabel: string
  conditions: string
  imageUrl?: string | null
  ctaUrl: string
  expiresAt?: string | null
  isExpired: boolean
  priority: number
  createdAt?: string | null
}

const demoItems: SpecialOddUIItem[] = [
  {
    id: 'gs-fb-derbi-10x',
    brand: 'Örnek Marka A',
    match: 'Galatasaray vs Fenerbahçe',
    oddsLabel: '10.0 Oran',
    conditions: 'Sadece yeni üyelere özel. Minimum 100₺ yatırım. Tek maç kuponu.',
    imageUrl: '/uploads/1760532229828-d1r5fy9lmim.png',
    ctaUrl: '/go/marka-a-ozel-derbi-10x',
    expiresAt: '2025-11-01T20:00:00+03:00',
    isExpired: new Date('2025-11-01T20:00:00+03:00').getTime() < Date.now(),
    priority: 100,
  },
  {
    id: 'bjk-ts-7x',
    brand: 'Örnek Marka B',
    match: 'Beşiktaş vs Trabzonspor',
    oddsLabel: '7.0 Oran',
    conditions: 'Mevcut ve yeni üyelere açık. Kombine kuponlarda geçerli değil.',
    imageUrl: '/uploads/1760656077922-1izqxopgu4m.png',
    ctaUrl: '/go/marka-b-ozel-7x',
    expiresAt: null,
    isExpired: false,
    priority: 90,
  },
  {
    id: 'espor-boost-5x',
    brand: 'Örnek Marka C',
    match: 'E-spor Finali',
    oddsLabel: '5.0 Oran',
    conditions: 'Sadece tekli kuponlarda geçerli. Maksimum kazanç 5.000₺.',
    imageUrl: '/uploads/1760657878298-1e9xw9zce0j.png',
    ctaUrl: '/go/marka-c-espor-5x',
    expiresAt: null,
    isExpired: false,
    priority: 80,
  },
]

export default function OzelOranlarClient() {
  const [items, setItems] = useState<SpecialOddUIItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(function load() {
    let active = true
    async function fetchItems() {
      try {
        setIsLoading(true)
        setHasError(false)
        const res = await fetch('/api/special-odds?limit=100', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        const list: SpecialOddItemApi[] = data?.items ?? []
        const now = new Date()
        const mapped: SpecialOddUIItem[] = list.map((i) => ({
          id: i.id,
          // Öncelik: ilişkili marka adı varsa onu göster, yoksa manuel brandName
          brand: i.brand?.name ?? i.brandName ?? 'Bilinmeyen Marka',
          brandSlug: i.brand?.slug ?? null,
          brandLogoUrl: i.brand?.logoUrl ?? null,
          match: i.matchTitle,
          oddsLabel: i.oddsLabel,
          conditions: i.conditions || '',
          imageUrl: i.imageUrl || null,
          ctaUrl: i.ctaUrl || '#',
          expiresAt: i.expiresAt || null,
          isExpired: Boolean(i.expiresAt && new Date(i.expiresAt) < now),
          priority: typeof i.priority === 'number' ? i.priority : 0,
          createdAt: i.createdAt ?? null,
        }))
        // Süresi dolmuşları listenin altına it, kendi aralarında önceliği koru
        const sorted = mapped.sort((a, b) => {
          if (a.isExpired !== b.isExpired) return a.isExpired ? 1 : -1
          // Aynı expirasyon durumunda priority (desc), sonra createdAt (desc)
          if (a.priority !== b.priority) return b.priority - a.priority
          const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return bd - ad
        })
        if (active) setItems(sorted)
      } catch {
        setHasError(true)
        if (active) setItems(demoItems)
      } finally {
        if (active) setIsLoading(false)
      }
    }
    fetchItems()
    return () => { active = false }
  }, [])
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/10 via-transparent to-yellow-400/5 pointer-events-none" />
        <div className="container mx-auto px-4 py-6 md:py-12 relative">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gold tracking-tight">Özel Oranlar</h1>
            <Badge className="bg-yellow-500 text-black">Yeni</Badge>
          </div>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl">
            Derbi ve özel maçlara sponsor markalardan artırılmış oranlı kuponlar. Şartları okuyun, tıklayıp markaya geçin.
          </p>
          {/* Basit filtre placeholder */}
          <div className="mt-6 flex flex-wrap gap-2 text-xs md:text-sm">
            <Badge variant="outline" className="border-yellow-500/40 text-yellow-300">Derbi</Badge>
            <Badge variant="outline" className="border-yellow-500/40 text-yellow-300">Tekli Kupon</Badge>
            <Badge variant="outline" className="border-yellow-500/40 text-yellow-300">Yeni Üye</Badge>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="container mx-auto px-4 pb-8 md:pb-10">
        {hasError && (
          <div className="mb-4 text-sm text-red-400">Veri yüklenemedi, örnek içerik gösteriliyor.</div>
        )}
        {isLoading && (
          <div className="mb-4 text-sm text-muted-foreground">Yükleniyor…</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const isExpired = item.isExpired
            return (
            <Card key={item.id} className={`bg-neutral-950/60 border-yellow-500/20 shadow-smooth ${isExpired ? 'opacity-60' : ''}`}>
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl md:text-2xl font-semibold text-gold">
                    {item.match}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">Özel</Badge>
                    {isExpired && (
                      <Badge variant="secondary" className="bg-red-600/30 text-red-200 border border-red-500/40">Süresi bitti</Badge>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>Marka:</span>
                  {item.brandLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a href={item.brandSlug ? `/yorumlar/${item.brandSlug}` : undefined} className="inline-flex items-center gap-1">
                      <img
                        src={item.brandLogoUrl}
                        alt={`${item.brand} logo`}
                        className="w-5 h-5 rounded-full object-cover border border-yellow-500/30"
                        loading="lazy"
                      />
                      <span className="font-medium text-foreground/80 hover:text-yellow-300 transition-colors">{item.brand}</span>
                    </a>
                  ) : (
                    <a href={item.brandSlug ? `/yorumlar/${item.brandSlug}` : undefined} className="font-medium text-foreground/80 hover:text-yellow-300 transition-colors">
                      {item.brand}
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <div className={`relative aspect-square bg-muted rounded-lg mb-4 overflow-hidden ${isExpired ? 'grayscale' : ''}`}>
                    <img
                      src={item.imageUrl}
                      alt={`${item.brand} özel oran – ${item.match}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 left-3 z-10 bg-gradient-to-r from-yellow-400 to-amber-500 px-2.5 py-0.5 rounded-full border border-amber-600/40 shadow-lg ring-1 ring-black/20">
                      <span className="text-[11px] md:text-[12px] font-semibold text-black leading-none">Güvenilir</span>
                    </div>
                    {isExpired && (
                      <div className="absolute top-2 left-2 bg-red-600/80 backdrop-blur px-2 py-1 rounded-md border border-red-400/40">
                        <span className="text-[11px] text-white">Süresi bitti</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">Özel Oran</div>
                    <div className="text-3xl font-extrabold text-yellow-300 tracking-tight">{item.oddsLabel}</div>
                  </div>
                  {item.expiresAt && (
                    <div className="text-xs text-muted-foreground">
                      {isExpired ? 'Süresi bitti' : `Son Tarih: ${new Date(item.expiresAt).toLocaleString('tr-TR')}`}
                    </div>
                  )}
                </div>
                <div className="mt-3 text-sm text-muted-foreground">{truncateWords(item.conditions, 30)}</div>
              </CardContent>
              <CardFooter className="grid grid-cols-2 gap-2">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black w-full min-h-[44px]" asChild disabled={isExpired}>
                  <a href={item.ctaUrl} rel="nofollow noopener" target="_blank" className="flex items-center justify-center gap-2">
                    Bahise Git
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full min-h-[44px] border-yellow-500/30 text-yellow-300 hover:text-yellow-200">Şartlar</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="sm:max-w-[640px] p-0">
                    <div className="flex max-h-[85vh] flex-col">
                      <AlertDialogHeader className="p-4">
                        <AlertDialogTitle className="text-lg">Şartlar ve Kurallar</AlertDialogTitle>
                      </AlertDialogHeader>
                      <div className="overflow-y-auto p-4 space-y-4">
                        {item.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <div className="relative w-full aspect-[4/3] md:aspect-square overflow-hidden rounded-md border bg-muted">
                            <img src={item.imageUrl} alt={`${item.brand} özel oran görseli`} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground space-y-2">
                          <p>{item.conditions}</p>
                          <p>Marka kural ve limitlerine uyunuz. Sorumlu bahis. 18+.</p>
                        </div>
                      </div>
                      <AlertDialogFooter className="p-4">
                        <AlertDialogCancel className="border-yellow-500/30 text-yellow-300 hover:text-yellow-200 min-h-[40px]">Kapat</AlertDialogCancel>
                        <AlertDialogAction asChild className="bg-yellow-500 hover:bg-yellow-600 text-black min-h-[40px]">
                          <a href={item.ctaUrl} rel="nofollow noopener" target="_blank" className="flex items-center justify-center gap-2">
                            Bahise Git
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          )})}
        </div>
        <div className="mt-8 text-xs text-muted-foreground">Sorumlu bahis. 18+. Oran ve şartlar marka tarafından değiştirilebilir.</div>
      </section>
    </>
  )
}

function truncateWords(text: string, maxWords: number): string {
  if (!text) return ''
  const words = text.trim().split(/\s+/)
  if (words.length <= maxWords) return text
  return `${words.slice(0, maxWords).join(' ')}…`
}