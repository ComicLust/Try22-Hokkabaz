"use client";

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MediaPicker } from '@/components/media/MediaPicker'

type ReviewBrand = {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
  siteUrl?: string | null
  editorialSummary?: string | null
  isActive: boolean
  createdAt: string
}

export default function AdminReviewBrandsPage() {
  const [items, setItems] = useState<ReviewBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [siteUrl, setSiteUrl] = useState('')
  // REPLACED STATE START
  const [editorialSummary, setEditorialSummary] = useState('')
  const [creating, setCreating] = useState(false)
  const [mediaOpenBrandForm, setMediaOpenBrandForm] = useState(false)
  const [mediaOpenBrandRowId, setMediaOpenBrandRowId] = useState<string | null>(null)
  const [formLogoUploading, setFormLogoUploading] = useState(false)
  const [logoUploadingId, setLogoUploadingId] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/review-brands')
      const data = await res.json()
      if (res.ok) setItems(Array.isArray(data) ? data : [])
      else setError(data?.error ?? 'Yükleme hatası')
    } catch (e: any) {
      setError(e?.message ?? 'Yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    if (!name.trim()) return alert('Marka adı gerekli')
    try {
      setCreating(true)
      const res = await fetch('/api/review-brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, logoUrl: logoUrl || null, siteUrl: siteUrl || null, editorialSummary: editorialSummary || null }),
      })
      const data = await res.json()
      if (res.ok) {
        setName(''); setLogoUrl(''); setSiteUrl(''); setEditorialSummary('')
        await load()
      } else alert(data?.error ?? 'Oluşturma hatası')
    } finally {
      setCreating(false)
    }
  }

  const setActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/review-brands/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }) })
    await load()
  }

  const saveField = async (id: string, patch: Partial<ReviewBrand>) => {
    await fetch(`/api/review-brands/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    await load()
  }

  const remove = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    const res = await fetch(`/api/review-brands/${id}`, { method: 'DELETE' })
    if (res.ok) await load()
  }

  // Upload helpers (inside component to access state setters)
  const uploadLogo = async (file: File) => {
    try {
      setFormLogoUploading(true)
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Yükleme hatası')
      setLogoUrl(data.url)
    } catch (e: any) {
      alert(e?.message ?? 'Yükleme hatası')
    } finally {
      setFormLogoUploading(false)
    }
  }

  const uploadLogoFor = async (id: string, file: File) => {
    try {
      setLogoUploadingId(id)
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Yükleme hatası')
      await saveField(id, { logoUrl: data.url })
    } catch (e: any) {
      alert(e?.message ?? 'Yükleme hatası')
    } finally {
      setLogoUploadingId(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Yorumlar – Markalar</h1>
      <p className="text-muted-foreground">Yorumlar sayfasında listelenecek bağımsız markaları yönetin.</p>

      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle>Yeni Marka Ekle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm mb-1 block">Marka Adı</label>
              <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Örn: OrnekBet" />
            </div>
            <div>
              <label className="text-sm mb-1 block">Marka Görseli (URL)</label>
              <div className="flex items-center gap-2">
                <Input value={logoUrl} onChange={(e)=>setLogoUrl(e.target.value)} placeholder="https://..." />
                <Button type="button" variant="outline" onClick={() => setMediaOpenBrandForm(true)}>Görsel Seç / Yükle</Button>
              </div>
              <MediaPicker
                open={mediaOpenBrandForm}
                onOpenChange={setMediaOpenBrandForm}
                onSelect={(url) => setLogoUrl(url)}
                title="Marka Logosu Seç / Yükle"
              />
            </div>
            <div>
              <label className="text-sm mb-1 block">Siteye Git Linki (URL)</label>
              <Input value={siteUrl} onChange={(e)=>setSiteUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm mb-1 block">Özet İnceleme Metni</label>
              <Textarea rows={3} value={editorialSummary} onChange={(e)=>setEditorialSummary(e.target.value)} placeholder="Kısa editöryel özet…" />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={create} disabled={creating}>{creating ? 'Ekleniyor…' : 'Markayı Ekle'}</Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Marka Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-muted-foreground">Yükleniyor…</div>}
          {error && <div className="text-sm text-red-500">{error}</div>}
          {!loading && !error && (
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-start border rounded-md p-3">
                  <div className="md:col-span-1 flex items-center gap-2">
                    <div className="w-16 h-10 bg-white shadow-sm flex items-center justify-center border rounded">
                      {it.logoUrl ? (
                        <img src={it.logoUrl} alt={it.name} className="w-full h-full object-contain filter brightness-110 contrast-115" />
                      ) : (
                        <img src="/logo.svg" alt="logo" className="w-8 h-8 filter brightness-110 contrast-115" />
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs">Ad</label>
                    <Input defaultValue={it.name} onBlur={(e)=>saveField(it.id,{ name: e.target.value })} />
                    <div className="text-xs text-muted-foreground mt-1">Slug: <span className="font-mono">{it.slug}</span></div>
                    <a href={`/yorumlar/${it.slug}`} className="text-xs underline">Yorum sayfasını aç</a>
                  </div>
                  <div>
                    <label className="text-xs">Logo URL</label>
                    <div className="flex items-center gap-2">
                      <Input defaultValue={it.logoUrl ?? ''} onBlur={(e)=>saveField(it.id,{ logoUrl: e.target.value || null })} />
                      <Button type="button" variant="outline" size="sm" onClick={() => setMediaOpenBrandRowId(it.id)}>Görsel Seç / Yükle</Button>
                    </div>
                    <MediaPicker
                      open={mediaOpenBrandRowId === it.id}
                      onOpenChange={(v) => setMediaOpenBrandRowId(v ? it.id : null)}
                      onSelect={(url) => saveField(it.id, { logoUrl: url })}
                      title="Marka Logosu Seç / Yükle"
                    />
                  </div>
                  <div>
                    <label className="text-xs">Site Linki</label>
                    <Input defaultValue={it.siteUrl ?? ''} onBlur={(e)=>saveField(it.id,{ siteUrl: e.target.value || null })} />
                  </div>
                  <div className="md:col-span-6">
                    <label className="text-xs">Özet İnceleme</label>
                    <Textarea defaultValue={it.editorialSummary ?? ''} onBlur={(e)=>saveField(it.id,{ editorialSummary: e.target.value || null })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={it.isActive ? 'default' : 'secondary'}>{it.isActive ? 'Aktif' : 'Pasif'}</Badge>
                    <Button variant="outline" size="sm" onClick={()=>setActive(it.id,!it.isActive)}>{it.isActive ? 'Pasifleştir' : 'Aktifleştir'}</Button>
                    <Button variant="destructive" size="sm" onClick={()=>remove(it.id)}>Sil</Button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-sm text-muted-foreground">Henüz marka eklenmedi.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}