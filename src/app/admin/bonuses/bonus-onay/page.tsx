"use client";

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// Types aligned with API response
export type AdminBonusItem = {
  id: string
  title: string
  slug: string
  amount?: number | null
  bonusType?: string | null
  gameCategory?: string | null
  imageUrl?: string | null
  isApproved: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  brand?: { id: string; name: string; slug: string; logoUrl?: string | null }
}

type ReviewBrand = { id: string; name: string; slug: string }

type StatusTab = 'pending' | 'approved' | 'all'

export default function AdminBonusApprovalPage() {
  const [status, setStatus] = useState<StatusTab>('pending')
  const [brandSlug, setBrandSlug] = useState<string>('')
  const [q, setQ] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const limit = 20

  const [items, setItems] = useState<AdminBonusItem[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const [brands, setBrands] = useState<ReviewBrand[]>([])

  const canPrev = useMemo(() => page > 1, [page])
  const canNext = useMemo(() => page * limit < total, [page, total])

  // Selection state for bulk actions
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected])
  const toggleSelect = (id: string) => setSelected(prev => ({ ...prev, [id]: !prev[id] }))
  const selectAll = () => setSelected(Object.fromEntries(items.map((it) => [it.id, true])) as Record<string, boolean>)
  const clearSelection = () => setSelected({})

  const loadBrands = async () => {
    try {
      // Yalnızca kullanıcı (yönetici) atanmış markaları getir
      const res = await fetch('/api/admin/brand-managers?limit=500')
      const data = await res.json()
      const arr = (data?.items || []).map((m: any) => m.brand).filter(Boolean)
      const uniqMap = new Map<string, ReviewBrand>()
      for (const b of arr) {
        const key = b.slug
        if (!uniqMap.has(key)) uniqMap.set(key, { id: b.id, name: b.name, slug: b.slug })
      }
      setBrands(Array.from(uniqMap.values()))
    } catch (e) {}
  }

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('status', status)
      if (brandSlug) params.set('brandSlug', brandSlug)
      if (q) params.set('q', q)
      params.set('page', String(page))
      params.set('limit', String(limit))

      const res = await fetch(`/api/admin/bonuses?${params.toString()}`)
      const data = await res.json()
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch (e: any) {
      setError(e?.message || 'Yükleme hatası')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBrands() }, [])
  useEffect(() => { setPage(1) }, [status, brandSlug, q])
  useEffect(() => { load() }, [status, brandSlug, q, page])

  const approve = async (id: string) => {
    const idx = items.findIndex((i) => i.id === id)
    if (idx >= 0) {
      const next = [...items]
      next[idx] = { ...next[idx], isApproved: true }
      setItems(next)
    }
    const res = await fetch(`/api/admin/bonuses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve' }) })
    if (!res.ok) await load()
  }

  const unapprove = async (id: string) => {
    const idx = items.findIndex((i) => i.id === id)
    if (idx >= 0) {
      const next = [...items]
      next[idx] = { ...next[idx], isApproved: false }
      setItems(next)
    }
    const res = await fetch(`/api/admin/bonuses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'unapprove' }) })
    if (!res.ok) await load()
  }

  const remove = async (id: string) => {
    if (!confirm('Bonusu silmek istediğinize emin misiniz?')) return
    const res = await fetch(`/api/admin/bonuses/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id))
      setTotal((t) => Math.max(0, t - 1))
    } else {
      await load()
    }
  }

  const handleBulk = async (action: 'approve' | 'unapprove') => {
    const ids = Object.keys(selected).filter((id) => selected[id])
    if (ids.length === 0) return
    const res = await fetch('/api/admin/bonuses/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ids }),
    })
    if (res.ok) {
      setItems((prev) => prev.map((i) => {
        if (!selected[i.id]) return i
        if (action === 'approve') return { ...i, isApproved: true }
        if (action === 'unapprove') return { ...i, isApproved: false }
        return i
      }))
      clearSelection()
    } else {
      await load()
    }
  }

  const approveAllVisible = async () => {
    const ids = items.map((i) => i.id)
    if (ids.length === 0) return
    const res = await fetch('/api/admin/bonuses/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', ids }),
    })
    if (res.ok) {
      setItems((prev) => prev.map((i) => ({ ...i, isApproved: true })))
      clearSelection()
    } else {
      await load()
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Bonuslar – Bonus Onay</h1>
      <p className="text-muted-foreground">Bekleyen, onaylı ve tüm bonusları görüntüleyin; tekil veya toplu onaylayın, düzenleyin, silin. Markadan gelenleri marka bilgisiyle görün.</p>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex gap-2 items-center">
              <Button variant={status==='pending'?'default':'outline'} size="sm" onClick={()=>setStatus('pending')}>Bekleyen</Button>
              <Button variant={status==='approved'?'default':'outline'} size="sm" onClick={()=>setStatus('approved')}>Onaylı</Button>
              <Button variant={status==='all'?'default':'outline'} size="sm" onClick={()=>setStatus('all')}>Tümü</Button>
            </div>
            <div>
              <label className="text-xs">Marka (kullanıcıya bağlı)</label>
              <select className="w-full border rounded h-9 px-2" value={brandSlug} onChange={(e)=>setBrandSlug(e.target.value)}>
                <option value="">Tümü</option>
                {brands.map((b)=> (
                  <option key={b.id} value={b.slug}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs">Arama</label>
              <Input placeholder="Başlık/slug" value={q} onChange={(e)=>setQ(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" size="sm" onClick={()=>{ setBrandSlug(''); setQ(''); }}>Temizle</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Üst aksiyon çubuğu */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 py-4">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={approveAllVisible} disabled={items.length===0}>Tümünü Onayla</Button>
            <Button size="sm" variant="secondary" onClick={()=>handleBulk('approve')} disabled={selectedCount===0}>Seçilenleri Onayla</Button>
            <Button size="sm" variant="outline" onClick={()=>handleBulk('unapprove')} disabled={selectedCount===0}>Seçilenlerin Onayını Kaldır</Button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>Tümünü Seç</Button>
            <Button variant="outline" size="sm" onClick={clearSelection}>Seçimi Temizle</Button>
            <span className="text-sm text-muted-foreground">Seçili: {selectedCount}</span>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((it) => (
          <Card key={it.id} className="overflow-hidden">
            <CardHeader className="flex-row items-center gap-3">
              <input type="checkbox" checked={!!selected[it.id]} onChange={()=>toggleSelect(it.id)} />
              <div className="w-10 h-10 rounded-md flex items-center justify-center border bg-background">
                {it.imageUrl ? (
                  <img src={it.imageUrl} alt={it.title} className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="text-xs">IMG</span>
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{it.title}</div>
                <div className="text-xs text-muted-foreground">{it.bonusType || 'Bonus'} · {it.gameCategory || 'Kategori yok'} · {it.amount ?? 0} TL</div>
                {it.brand && (
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    {it.brand.logoUrl && (<img src={it.brand.logoUrl} alt={it.brand.name} className="w-4 h-4 rounded" />)}
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">Marka: {it.brand.name}</span>
                  </div>
                )}
              </div>
              <Badge variant={it.isApproved ? 'default' : 'secondary'}>{it.isApproved ? 'Onaylı' : 'Bekliyor'}</Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {!it.isApproved && (<Button size="sm" onClick={()=>approve(it.id)}>Onayla</Button>)}
                {it.isApproved && (<Button size="sm" variant="secondary" onClick={()=>unapprove(it.id)}>Onayı Kaldır</Button>)}
                <Button size="sm" variant="outline" asChild><a href={`/admin/bonuses/${it.id}`}>Düzenle</a></Button>
                <Button size="sm" variant="destructive" onClick={()=>remove(it.id)}>Sil</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {items.length === 0 && !loading && (
        <div className="text-muted-foreground">Kayıt bulunamadı.</div>
      )}

      {/* Pagination */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={!canPrev} onClick={()=>setPage(p=>Math.max(1,p-1))}>Önceki</Button>
        <span className="text-sm">Sayfa {page} / {Math.max(1, Math.ceil(total/limit))}</span>
        <Button variant="outline" size="sm" disabled={!canNext} onClick={()=>setPage(p=>p+1)}>Sonraki</Button>
      </div>

      {loading && <div className="p-3">Yükleniyor...</div>}
      {error && <div className="p-3 text-red-600">Hata: {error}</div>}
    </div>
  )
}