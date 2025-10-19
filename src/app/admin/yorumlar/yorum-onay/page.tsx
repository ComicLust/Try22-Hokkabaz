"use client";

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

// Types aligned with API response
type AdminReviewItem = {
  id: string
  brandId: string
  author?: string | null
  isAnonymous: boolean
  rating?: number | null
  isPositive?: boolean | null
  content: string
  isApproved: boolean
  isRejected?: boolean
  helpfulCount: number
  notHelpfulCount: number
  createdAt: string
  updatedAt: string
  brand?: { id: string; name: string; slug: string; logoUrl?: string | null }
}

type ReviewBrand = { id: string; name: string; slug: string }

type StatusTab = 'pending' | 'approved' | 'rejected' | 'all'

export default function AdminCommentApprovalPage() {
  const [status, setStatus] = useState<StatusTab>('pending')
  const [brandSlug, setBrandSlug] = useState<string>('')
  const [q, setQ] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const limit = 20

  const [items, setItems] = useState<AdminReviewItem[]>([])
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
      const res = await fetch('/api/review-brands')
      const data = await res.json()
      if (res.ok) setBrands((Array.isArray(data) ? data : []).map((b: any) => ({ id: b.id, name: b.name, slug: b.slug })))
    } catch {}
  }

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.set('status', status)
      if (brandSlug) params.set('brandSlug', brandSlug)
      if (q) params.set('q', q)
      params.set('page', String(page))
      params.set('limit', String(limit))
      const res = await fetch(`/api/admin/site-reviews?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setItems(Array.isArray(data?.items) ? data.items : [])
        setTotal(Number(data?.total || 0))
        setSelected({})
      } else {
        setError(data?.error ?? 'Yükleme hatası')
      }
    } catch (e: any) {
      setError(e?.message ?? 'Yükleme hatası')
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
    const res = await fetch(`/api/admin/site-reviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve' }) })
    if (!res.ok) await load()
  }

  const unapprove = async (id: string) => {
    const idx = items.findIndex((i) => i.id === id)
    if (idx >= 0) {
      const next = [...items]
      next[idx] = { ...next[idx], isApproved: false }
      setItems(next)
    }
    const res = await fetch(`/api/admin/site-reviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'unapprove' }) })
    if (!res.ok) await load()
  }

  const saveContent = async (id: string, content: string) => {
    const idx = items.findIndex((i) => i.id === id)
    if (idx >= 0) {
      const next = [...items]
      next[idx] = { ...next[idx], content }
      setItems(next)
    }
    const res = await fetch(`/api/admin/site-reviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) })
    if (!res.ok) await load()
  }

  const remove = async (id: string) => {
    if (!confirm('Yorumu silmek istediğinize emin misiniz?')) return
    const res = await fetch(`/api/admin/site-reviews/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id))
      setTotal((t) => Math.max(0, t - 1))
    } else {
      await load()
    }
  }

  const handleBulk = async (action: 'approve' | 'unapprove' | 'reject' | 'unreject') => {
    const ids = Object.keys(selected).filter((id) => selected[id])
    if (ids.length === 0) return
    const res = await fetch('/api/admin/site-reviews/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ids }),
    })
    if (res.ok) {
      setItems((prev) => prev.map((i) => {
        if (!selected[i.id]) return i
        if (action === 'approve') return { ...i, isApproved: true, isRejected: false }
        if (action === 'unapprove') return { ...i, isApproved: false }
        if (action === 'reject') return { ...i, isApproved: false, isRejected: true }
        if (action === 'unreject') return { ...i, isRejected: false }
        return i
      }))
      clearSelection()
    } else {
      await load()
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Yorumlar – Yorum Onay</h1>
      <p className="text-muted-foreground">WordPress benzeri yönetim: bekleyen, onaylı ve tüm yorumları görüntüleyin; onaylayın, düzenleyin, silin.</p>

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
              <Button variant={status==='rejected'?'default':'outline'} size="sm" onClick={()=>setStatus('rejected')}>Reddedilen</Button>
              <Button variant={status==='all'?'default':'outline'} size="sm" onClick={()=>setStatus('all')}>Tümü</Button>
            </div>
            <div>
              <label className="text-xs">Marka</label>
              <select className="w-full border rounded h-9 px-2" value={brandSlug} onChange={(e)=>setBrandSlug(e.target.value)}>
                <option value="">Tümü</option>
                {brands.map((b)=> (
                  <option key={b.id} value={b.slug}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs">Ara</label>
              <Input placeholder="Yorum içeriğinde ara" value={q} onChange={(e)=>setQ(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions toolbar */}
      <Card>
        <CardHeader>
          <CardTitle>Toplu İşlemler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm">Seçilen: {selectedCount}</span>
            <Button size="sm" variant="outline" onClick={selectAll}>Tümünü Seç</Button>
            <Button size="sm" variant="outline" onClick={clearSelection}>Seçimi Temizle</Button>
            <Button size="sm" onClick={()=>handleBulk('approve')} disabled={selectedCount===0}>Seçilenleri Onayla</Button>
            <Button size="sm" variant="outline" onClick={()=>handleBulk('unapprove')} disabled={selectedCount===0}>Seçilenleri Yayından Kaldır</Button>
            <Button size="sm" variant="destructive" onClick={()=>handleBulk('reject')} disabled={selectedCount===0}>Seçilenleri Reddet</Button>
            <Button size="sm" variant="outline" onClick={()=>handleBulk('unreject')} disabled={selectedCount===0}>Reddini Geri Al</Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Yorum Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-muted-foreground">Yükleniyor…</div>}
          {error && <div className="text-sm text-red-500">{error}</div>}
          {!loading && !error && (
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-start border rounded-md p-3">
                  {/* select checkbox */}
                  <div className="md:col-span-1 flex items-center gap-2">
                    <input type="checkbox" checked={!!selected[it.id]} onChange={()=>toggleSelect(it.id)} />
                    <div className="w-16 h-10 bg-muted flex items-center justify-center border rounded">
                      {it.brand?.logoUrl ? (
                        <img src={it.brand.logoUrl} alt={it.brand?.name ?? ''} className="w-full h-full object-contain" />
                      ) : (
                        <img src="/logo.svg" alt="logo" className="w-8 h-8" />
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2">
                      {it.isRejected ? (
                        <Badge variant="destructive">Reddedildi</Badge>
                      ) : (
                        <Badge variant={it.isApproved ? 'default' : 'secondary'}>{it.isApproved ? 'Onaylı' : 'Beklemede'}</Badge>
                      )}
                      {typeof it.isPositive === 'boolean' && (
                        <Badge variant={it.isPositive ? 'default' : 'destructive'}>{it.isPositive ? 'Pozitif' : 'Negatif'}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Marka: <a href={`/yorumlar/${it.brand?.slug ?? ''}`} className="underline">{it.brand?.name ?? '-'}</a></div>
                    <div className="text-xs text-muted-foreground mt-1">Yazar: {it.isAnonymous ? 'Anonim' : (it.author || '—')}</div>
                    <div className="text-xs text-muted-foreground mt-1">Tarih: {new Date(it.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-xs">Yorum Metni</label>
                    <Textarea defaultValue={it.content} onBlur={(e)=>saveContent(it.id, e.target.value)} rows={4} />
                    <div className="text-xs text-muted-foreground mt-1">Faydalı: {it.helpfulCount} | Faydalı Değil: {it.notHelpfulCount}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!it.isApproved ? (
                      <Button size="sm" onClick={()=>approve(it.id)}>Onayla</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={()=>unapprove(it.id)}>Yayından Kaldır</Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={()=>remove(it.id)}>Sil</Button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-sm text-muted-foreground">Bu filtrelerle yorum bulunamadı.</div>
              )}
            </div>
          )}
          {/* pagination */}
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={!canPrev} onClick={()=>setPage((p)=>Math.max(1,p-1))}>Önceki</Button>
            <div className="text-sm">Sayfa {page}</div>
            <Button size="sm" variant="outline" disabled={!canNext} onClick={()=>setPage((p)=>p+1)}>Sonraki</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}