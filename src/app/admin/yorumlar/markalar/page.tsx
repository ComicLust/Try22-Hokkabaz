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
  seoTitle?: string | null
  seoDescription?: string | null
  isActive: boolean
  createdAt: string
}

export default function AdminReviewBrandsPage() {
  const [items, setItems] = useState<ReviewBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [routeSeo, setRouteSeo] = useState<Record<string, { id?: string, title?: string | null, description?: string | null }>>({})

  // Form state
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [siteUrl, setSiteUrl] = useState('')
  // REPLACED STATE START
  const [editorialSummary, setEditorialSummary] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
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

  // Mevcut marka sayfaları için rota bazlı SEO kayıtlarını yükle
  useEffect(() => {
    async function loadRouteSeo() {
      if (!items.length) { setRouteSeo({}); return }
      try {
        const results = await Promise.all(
          items.map(async (it) => {
            const pageKey = `/yorumlar/${it.slug}`
            try {
              const res = await fetch(`/api/seo?page=${encodeURIComponent(pageKey)}`)
              const data = await res.json()
              if (res.ok && data) {
                return { slug: it.slug, id: data.id, title: data.title ?? null, description: data.description ?? null }
              }
              return { slug: it.slug, id: undefined, title: null, description: null }
            } catch {
              return { slug: it.slug, id: undefined, title: null, description: null }
            }
          })
        )
        const map: Record<string, { id?: string, title?: string | null, description?: string | null }> = {}
        for (const r of results) {
          map[r.slug] = { id: r.id, title: r.title, description: r.description }
        }
        setRouteSeo(map)
      } catch {}
    }
    loadRouteSeo()
  }, [items])

  const create = async () => {
    if (!name.trim()) return alert('Marka adı gerekli')
    try {
      setCreating(true)
      const res = await fetch('/api/review-brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          logoUrl: logoUrl || null,
          siteUrl: siteUrl || null,
          editorialSummary: editorialSummary || null,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setName(''); setLogoUrl(''); setSiteUrl(''); setEditorialSummary(''); setSeoTitle(''); setSeoDescription('')
        await load()
      } else alert(data?.error ?? 'Oluşturma hatası')
    } finally {
      setCreating(false)
    }
  }

  const setActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/review-brands/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }) })
      if (!res.ok) {
        const data = await res.json().catch(()=>({}))
        alert(data?.error ?? 'Güncelleme hatası')
        return
      }
    } finally {
      await load()
    }
  }

  const saveField = async (id: string, patch: Partial<ReviewBrand>) => {
    try {
      const res = await fetch(`/api/review-brands/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
      if (!res.ok) {
        const data = await res.json().catch(()=>({}))
        alert(data?.error ?? 'Güncelleme hatası')
        return
      }
    } finally {
      await load()
    }
  }

  // Rota bazlı SEO başlık/açıklama kaydetme (gerekirse kayıt oluşturur)
  const saveRouteSeoField = async (slug: string, patch: { title?: string | null, description?: string | null }) => {
    try {
      const pageKey = `/yorumlar/${slug}`
      const res = await fetch(`/api/seo?page=${encodeURIComponent(pageKey)}`)
      const existing = await res.json().catch(()=>null)
      const url = existing?.id ? `/api/seo/${existing.id}` : '/api/seo'
      const method = existing?.id ? 'PATCH' : 'POST'
      const body = existing?.id ? patch : { page: pageKey.replace(/^\/+/,'').length ? pageKey.replace(/^\/+/,'') : pageKey, ...patch }
      const saveRes = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await saveRes.json().catch(()=>({}))
      if (!saveRes.ok) {
        alert(data?.error ?? 'SEO güncelleme hatası')
        return
      }
      // local state'i güncelle
      setRouteSeo(prev => ({
        ...prev,
        [slug]: {
          id: data?.id ?? existing?.id,
          title: typeof patch.title === 'string' ? patch.title : (patch.title === null ? null : (prev[slug]?.title ?? null)),
          description: typeof patch.description === 'string' ? patch.description : (patch.description === null ? null : (prev[slug]?.description ?? null))
        }
      }))
    } catch (e: any) {
      alert(e?.message ?? 'SEO güncelleme hatası')
    }
  }

  // Varsayılan başlık/açıklama oluşturucular (yorumlar sayfasındaki mantıkla tutarlı)
  function buildDefaultBrandTitle(name: string): string {
    return `${name} Yorumları ve Şikayetleri Hokkabaz'da!`
  }
  function buildDefaultBrandDescription(name: string): string {
    return `${name} hakkında gerçek kullanıcı yorumları ve şikayetleri Hokkabaz'da. Güvenilirlik, ödeme, bonuslar ve destek deneyimleri tek sayfada!`
  }

  const remove = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try {
      const res = await fetch(`/api/review-brands/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        let msg = 'Silme hatası'
        try {
          const data = await res.json()
          msg = data?.error ?? msg
        } catch {}
        alert(msg)
        return
      }
    } finally {
      await load()
    }
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
          <div>
            <label className="text-sm mb-1 block">SEO Başlık (Title)</label>
            <Input value={seoTitle} onChange={(e)=>setSeoTitle(e.target.value)} placeholder="Örn: OrnekBet Yorumları" />
          </div>
          <div>
            <label className="text-sm mb-1 block">SEO Açıklama (Description)</label>
            <Textarea rows={3} value={seoDescription} onChange={(e)=>setSeoDescription(e.target.value)} placeholder="Arama motoru açıklaması…" />
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
                <div key={it.id} className="grid grid-cols-1 md:grid-cols-7 gap-3 items-start border rounded-md p-3">
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
              <div className="md:col-span-7">
                <label className="text-xs">Özet İnceleme</label>
                <Textarea defaultValue={it.editorialSummary ?? ''} onBlur={(e)=>saveField(it.id,{ editorialSummary: e.target.value || null })} />
              </div>
              <div>
                <label className="text-xs">SEO Başlık (Title)</label>
                <Input
                  defaultValue={routeSeo[it.slug]?.title ?? it.seoTitle ?? buildDefaultBrandTitle(it.name)}
                  placeholder="SEO başlık"
                  onBlur={(e)=>saveRouteSeoField(it.slug, { title: e.target.value || null })}
                />
                <div className="text-[10px] text-muted-foreground mt-1">Etkili değer: rota SEO veya marka alanı, yoksa varsayılan</div>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs">SEO Açıklama (Description)</label>
                <Textarea
                  defaultValue={routeSeo[it.slug]?.description ?? it.seoDescription ?? (it.editorialSummary ?? buildDefaultBrandDescription(it.name))}
                  placeholder="SEO açıklama"
                  onBlur={(e)=>saveRouteSeoField(it.slug, { description: e.target.value || null })}
                />
                <div className="text-[10px] text-muted-foreground mt-1">Etkili değer: rota SEO veya marka alanı, yoksa varsayılan</div>
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