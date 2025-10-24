"use client"

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { MediaPicker } from '@/components/media/MediaPicker'
import { slugifyTr } from '@/lib/slugify'
import Link from 'next/link'
import { Check } from 'lucide-react'

type Bonus = {
  id: string
  title: string
  slug: string
  description?: string | null
  shortDescription?: string | null
  bonusType?: string | null
  gameCategory?: string | null
  amount?: number | null
  wager?: number | null
  minDeposit?: number | null
  ctaUrl?: string | null
  imageUrl?: string | null
  postImageUrl?: string | null
  badges?: string[] | null
  validityText?: string | null
  startDate?: string | null
  endDate?: string | null
  features?: string[] | null
  isApproved: boolean
  createdAt: string
}

export default function BrandBonusesPage() {
  const [items, setItems] = useState<Bonus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // form state
  const [form, setForm] = useState<Partial<Bonus>>({})
  const [creating, setCreating] = useState(false)

  const [typeOptions, setTypeOptions] = useState<string[]>(['Deneme Bonusu','Hoşgeldin Bonusu','Yatırım Bonusu','Kayıp Bonusu'])
  const [categoryOptions, setCategoryOptions] = useState<string[]>(['Spor','Casino','Slot','Poker','Bingo','Tombala','E-spor','Sanal'])
  const [newType, setNewType] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [mediaOpenLogo, setMediaOpenLogo] = useState(false)
  const [mediaOpenPost, setMediaOpenPost] = useState(false)
  const [newBadge, setNewBadge] = useState('')
  const [newFeature, setNewFeature] = useState('')
  const [availableBadges, setAvailableBadges] = useState<string[]>([])

  useEffect(() => {
    load()
  }, [])
  useEffect(() => {
    // Önerilen rozetleri tüm bonuslardan topla
    ;(async () => {
      try {
        const res = await fetch('/api/bonuses')
        const all = await res.json()
        const uniq = Array.from(new Set(
          (all || []).flatMap((b: any) => Array.isArray(b.badges) ? b.badges : [])
        )) as string[]
        setAvailableBadges(uniq)
      } catch {}
    })()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/brand/bonuses', { cache: 'no-store', credentials: 'include' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Listeleme hatası')
      setItems(json)
      // öneri listeleri
      try {
        const uniqBadges = Array.from(new Set((json || []).flatMap((b: any) => Array.isArray(b.badges) ? b.badges : []))) as string[]
        // add dynamic types & categories
        const uniqTypes = Array.from(new Set((json || []).map((b: any) => b.bonusType).filter(Boolean))) as string[]
        const uniqCats = Array.from(new Set((json || []).map((b: any) => b.gameCategory).filter(Boolean))) as string[]
        if (uniqTypes.length) setTypeOptions(prev => Array.from(new Set([...prev, ...uniqTypes])))
        if (uniqCats.length) setCategoryOptions(prev => Array.from(new Set([...prev, ...uniqCats])))
      } catch {}
    } catch (e: any) {
      setError(e?.message ?? 'Hata')
    } finally {
      setLoading(false)
    }
  }

  async function createBonus(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !String(form.title).length) return
    setCreating(true)
    try {
      const payload: any = { ...form }
      // slug otomatik
      if (!payload.slug && payload.title) payload.slug = slugifyTr(String(payload.title), { withHyphens: true, maxLen: 64 })
      // tarihleri normalize
      if (typeof payload.startDate === 'string' && payload.startDate) payload.startDate = new Date(payload.startDate).toISOString()
      if (typeof payload.endDate === 'string' && payload.endDate) payload.endDate = new Date(payload.endDate).toISOString()

      const res = await fetch('/api/brand/bonuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Oluşturma hatası')
      setForm({})
      setNewBadge('')
      setNewFeature('')
      await load()
    } catch (e: any) {
      setError(e?.message ?? 'Hata')
    } finally {
      setCreating(false)
    }
  }

  async function saveBonus(id: string, patch: any) {
    try {
      const res = await fetch(`/api/brand/bonuses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Güncelleme hatası')
      await load()
    } catch (e: any) {
      setError(e?.message ?? 'Hata')
    }
  }

  return (
    <div className="p-6 space-y-6 bg-background text-foreground">
      <Card className="bg-neutral-950/60 border-yellow-500/20">
        <CardContent className="p-3 text-center text-sm text-muted-foreground">
          Eklediğiniz bonuslar Hokkabaz yöneticisinin onayına sunulur.
        </CardContent>
      </Card>

      <Card className="bg-neutral-950/60 border-yellow-500/20">
        <CardHeader>
          <CardTitle className="text-yellow-300">Bonus Ekle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createBonus} className="space-y-4">
            {/* Görseller */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs text-neutral-400">Bet Sitesi Logosu</label>
                <div className="flex items-center gap-2">
                  <Input value={form.imageUrl ?? ''} onChange={e=>setForm(f=>({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
                  <Button type="button" variant="outline" onClick={()=>setMediaOpenLogo(true)}>Görsel Seç / Yükle</Button>
                  <MediaPicker open={mediaOpenLogo} onOpenChange={setMediaOpenLogo} onSelect={(url)=>setForm(f=>({ ...f, imageUrl: url }))} title="Logo Seç / Yükle" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-neutral-400">Bonus Kare Görseli (Instagram post)</label>
                <div className="flex items-center gap-2">
                  <Input value={form.postImageUrl ?? ''} onChange={e=>setForm(f=>({ ...f, postImageUrl: e.target.value }))} placeholder="https://..." />
                  <Button type="button" variant="outline" onClick={()=>setMediaOpenPost(true)}>Görsel Seç / Yükle</Button>
                  <MediaPicker open={mediaOpenPost} onOpenChange={setMediaOpenPost} onSelect={(url)=>setForm(f=>({ ...f, postImageUrl: url }))} title="Kare Görsel Seç / Yükle" />
                </div>
              </div>
            </div>

            {/* Başlık */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-400">Başlık</label>
                <Input value={form.title ?? ''} onChange={e=>setForm(f=>({ ...f, title: e.target.value, slug: slugifyTr(e.target.value, { withHyphens: true, maxLen: 64 }) }))} placeholder="Bonus başlığı" required />
              </div>
            </div>

            {/* Tür & Kategori */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs text-neutral-400">Bonus Türü</label>
                <select className="border rounded-md px-3 py-2 w-full bg-transparent" value={form.bonusType ?? ''} onChange={e=>setForm(f=>({ ...f, bonusType: e.target.value || null }))}>
                  <option value="">Seçiniz</option>
                  {typeOptions.map(opt=> (<option key={opt} value={opt}>{opt}</option>))}
                </select>
                <div className="flex items-center gap-2">
                  <Input value={newType} onChange={e=>setNewType(e.target.value)} placeholder="Yeni tür ekle" />
                  <Button type="button" variant="outline" onClick={()=>{ const v = newType.trim(); if (!v) return; setTypeOptions(p=>Array.from(new Set([...p, v]))); setForm(f=>({ ...f, bonusType: v })); setNewType('') }}>Ekle</Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-neutral-400">Site Kategorisi</label>
                <select className="border rounded-md px-3 py-2 w-full bg-transparent" value={form.gameCategory ?? ''} onChange={e=>setForm(f=>({ ...f, gameCategory: e.target.value || null }))}>
                  <option value="">Seçiniz</option>
                  {categoryOptions.map(opt=> (<option key={opt} value={opt}>{opt}</option>))}
                </select>
                <div className="flex items-center gap-2">
                  <Input value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder="Yeni kategori ekle" />
                  <Button type="button" variant="outline" onClick={()=>{ const v = newCategory.trim(); if (!v) return; setCategoryOptions(p=>Array.from(new Set([...p, v]))); setForm(f=>({ ...f, gameCategory: v })); setNewCategory('') }}>Ekle</Button>
                </div>
              </div>
            </div>

            {/* Sayısal alanlar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-neutral-400">Tutar (TL)</label>
                <Input type="number" value={form.amount ?? ''} onChange={e=>setForm(f=>({ ...f, amount: Number(e.target.value) }))} placeholder="ör. 100" />
              </div>
              <div>
                <label className="text-xs text-neutral-400">Wager (x)</label>
                <Input type="number" value={form.wager ?? ''} onChange={e=>setForm(f=>({ ...f, wager: Number(e.target.value) }))} placeholder="ör. 10" />
              </div>
              <div>
                <label className="text-xs text-neutral-400">Min. Yatırım (TL)</label>
                <Input type="number" value={form.minDeposit ?? ''} onChange={e=>setForm(f=>({ ...f, minDeposit: Number(e.target.value) }))} placeholder="ör. 0" />
              </div>
            </div>

            {/* CTA */}
            <div>
              <label className="text-xs text-neutral-400">CTA URL</label>
              <Input value={form.ctaUrl ?? ''} onChange={e=>setForm(f=>({ ...f, ctaUrl: e.target.value }))} placeholder="https://..." />
            </div>

            {/* Açıklamalar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-400">Açıklama</label>
                <Textarea value={form.description ?? ''} onChange={e=>setForm(f=>({ ...f, description: e.target.value }))} placeholder="Detaylı açıklama" rows={3} />
              </div>
              <div>
                <label className="text-xs text-neutral-400">Kısa Açıklama</label>
                <Input value={form.shortDescription ?? ''} onChange={e=>setForm(f=>({ ...f, shortDescription: e.target.value }))} placeholder="Örn: Çevrim şartsız deneme" />
              </div>
            </div>

            {/* Geçerlilik ve Tarihler */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-neutral-400">Geçerlilik Metni</label>
                <Input value={form.validityText ?? ''} onChange={e=>setForm(f=>({ ...f, validityText: e.target.value }))} placeholder="Örn: Sadece yeni üyeler için" />
              </div>
              <div>
                <label className="text-xs text-neutral-400">Başlangıç Tarihi</label>
                <Input type="date" value={form.startDate ? String(form.startDate).substring(0,10) : ''} onChange={e=>setForm(f=>({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-neutral-400">Bitiş Tarihi</label>
                <Input type="date" value={form.endDate ? String(form.endDate).substring(0,10) : ''} onChange={e=>setForm(f=>({ ...f, endDate: e.target.value }))} />
              </div>
            </div>

            {/* Rozetler */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-400">Rozetler <span className="opacity-70">(en fazla 3)</span></label>
              <div className="flex flex-wrap gap-2">
                {(form.badges ?? []).map((b,i)=>(
                  <span key={i} className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded border">{b}<button type="button" className="text-red-500" onClick={()=>setForm(f=>({ ...f, badges: (f.badges ?? []).filter(t=>t!==b) }))}>x</button></span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input value={newBadge} onChange={e=>setNewBadge(e.target.value)} placeholder="Örn: Lisanslı, SSL, 18+" />
                <Button type="button" variant="outline" onClick={()=>{ 
                  const raw = newBadge.trim(); 
                  if (!raw) return; 
                  const parts = raw.split(',').map(s=>s.trim()).filter(Boolean); 
                  if (parts.length === 0) return; 
                  setForm(f=>{ 
                    const existing = f.badges ?? []; 
                    const combined = Array.from(new Set([...existing, ...parts])); 
                    const limited = combined.slice(0, 3); 
                    return { ...f, badges: limited } 
                  }); 
                  setNewBadge(''); 
                }}>Ekle</Button>
              </div>
              {availableBadges.length > 0 && (
                <div className="text-xs text-neutral-400 mt-2">
                  Önerilen: {availableBadges.map((t) => (
                    <button key={t} type="button" className="mr-2 underline" onClick={()=>{
                      setForm(f=>{ 
                        const existing = f.badges ?? []; 
                        if (existing.length >= 3) return f; 
                        const combined = Array.from(new Set([...existing, t])); 
                        const limited = combined.slice(0,3); 
                        return { ...f, badges: limited } 
                      })
                    }}>{t}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Özellikler */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-400">Özellikler / Alt Yazılar</label>
              <div className="space-y-2">
                {(form.features ?? []).map((feat,idx)=>(
                  <div key={idx} className="flex items-center gap-2">
                    <Input value={feat} onChange={e=>{ const arr = [...(form.features ?? [])]; arr[idx] = e.target.value; setForm(f=>({ ...f, features: arr })) }} />
                    <Button type="button" variant="outline" onClick={()=>setForm(f=>({ ...f, features: (f.features ?? []).filter((_,i)=>i!==idx) }))}>Sil</Button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input value={newFeature} onChange={e=>setNewFeature(e.target.value)} placeholder="Örn: Çevrim Şartsız" />
                <Button type="button" variant="outline" onClick={()=>{ const v = newFeature.trim(); if (!v) return; setForm(f=>({ ...f, features: [...(f.features ?? []), v] })); setNewFeature('') }}>Ekle</Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={creating}>Gönder</Button>
            </div>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">Slug alanı gizlidir; başlıktan otomatik üretilir. Yayınlama/öne çıkarma yetkisi yoktur.</p>
        </CardContent>
      </Card>


      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Bonuslarım</h2>
        </div>
        {loading && <div>Yükleniyor...</div>}
        {error && <div className="text-destructive text-sm">{error}</div>}
        {!loading && items.length === 0 && <div className="text-sm text-muted-foreground">Henüz bonus eklemediniz.</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <Card key={item.id} className="backdrop-blur-lg bg-opacity-80 bg-card border rounded-2xl p-4 hover:border-yellow-500 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-md flex items-center justify-center border bg-background">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-xs">IMG</span>
                  )}
                </div>
                <Badge variant={item.isApproved ? 'default' : 'secondary'}>
                  {item.isApproved ? 'Onaylandı' : 'Onay Bekliyor'}
                </Badge>
              </div>
              <div className="text-lg font-medium">{item.title}</div>
              {typeof item.amount === 'number' && (
                <div className="text-2xl font-bold text-yellow-300">{item.amount} TL</div>
              )}
              <div className="space-y-2 mb-4">
                {(item.features ?? []).map((f, i) => (
                  <div key={i} className="flex items-center text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-yellow-300 mr-2" /> {f}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {item.isApproved ? (
                  <Link href={`/brand/bonuses/${item.id}`} className="px-3 py-2 rounded-md border text-center bg-primary text-primary-foreground">Düzenle</Link>
                ) : (
                  <Button type="button" variant="outline" disabled title="Onay beklerken düzenleme yapılamaz">Düzenle</Button>
                )}
                {item.ctaUrl ? (
                  <a className="px-3 py-2 rounded-md border text-center" href={item.ctaUrl} target="_blank" rel="noopener noreferrer">Siteye Git</a>
                ) : (
                  <span className="px-3 py-2 rounded-md border text-center opacity-50">Siteye Git</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}