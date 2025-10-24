"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { MediaPicker } from '@/components/media/MediaPicker'

// Brand bonus edit page uses the same fields as creation form

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
}

export default function BrandBonusEditPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id

  const [item, setItem] = useState<Bonus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<Partial<Bonus>>({})
  const [saving, setSaving] = useState(false)

  const [mediaOpenLogo, setMediaOpenLogo] = useState(false)
  const [mediaOpenPost, setMediaOpenPost] = useState(false)

  useEffect(() => {
    (async () => {
      if (!id) return
      setLoading(true)
      try {
        const res = await fetch(`/api/brand/bonuses/${id}`, { credentials: 'include' })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Yükleme hatası')
        setItem(json)
        setForm({
          title: json.title,
          description: json.description ?? '',
          shortDescription: json.shortDescription ?? '',
          bonusType: json.bonusType ?? '',
          gameCategory: json.gameCategory ?? '',
          amount: json.amount ?? null,
          wager: json.wager ?? null,
          minDeposit: json.minDeposit ?? null,
          imageUrl: json.imageUrl ?? '',
          postImageUrl: json.postImageUrl ?? '',
          ctaUrl: json.ctaUrl ?? '',
          badges: Array.isArray(json.badges) ? json.badges : [],
          validityText: json.validityText ?? '',
          startDate: json.startDate ? String(json.startDate).substring(0,10) : '',
          endDate: json.endDate ? String(json.endDate).substring(0,10) : '',
          features: Array.isArray(json.features) ? json.features : [],
        })
      } catch (e: any) {
        setError(e?.message ?? 'Hata')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    if (!item?.isApproved) return // UI guard
    setSaving(true)
    try {
      const payload: any = { ...form }
      // Tarihleri normalize
      if (typeof payload.startDate === 'string' && payload.startDate) payload.startDate = new Date(payload.startDate).toISOString()
      if (typeof payload.endDate === 'string' && payload.endDate) payload.endDate = new Date(payload.endDate).toISOString()

      const res = await fetch(`/api/brand/bonuses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Güncelleme hatası')
      // Düzenleme sonrası tekrar onaya düşer; listeye döndürüyoruz
      router.push('/brand/bonuses')
    } catch (e: any) {
      setError(e?.message ?? 'Hata')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Yükleniyor...</div>
  if (error) return <div className="p-6 text-destructive">{error}</div>
  if (!item) return <div className="p-6">Bulunamadı</div>

  const canEdit = !!item.isApproved

  return (
    <div className="p-6 space-y-6 bg-background text-foreground">
      <Card className="bg-neutral-950/60 border-yellow-500/20">
        <CardHeader>
          <CardTitle className="text-yellow-300">Bonus Düzenle</CardTitle>
        </CardHeader>
        <CardContent>
          {!canEdit && (
            <div className="mb-4 text-sm text-muted-foreground">
              Bu bonus onay bekliyor; onaylanana kadar düzenleme yapılamaz.
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            {/* Görseller */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs text-neutral-400">Bet Sitesi Logosu</label>
                <div className="flex items-center gap-2">
                  <Input value={form.imageUrl as string || ''} onChange={e=>setForm(f=>({ ...f, imageUrl: e.target.value }))} placeholder="https://..." disabled={!canEdit} />
                  <Button type="button" variant="outline" onClick={()=>setMediaOpenLogo(true)} disabled={!canEdit}>Görsel Seç / Yükle</Button>
                  <MediaPicker open={mediaOpenLogo} onOpenChange={setMediaOpenLogo} onSelect={(url)=>setForm(f=>({ ...f, imageUrl: url }))} title="Logo Seç / Yükle" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-neutral-400">Bonus Kare Görseli (Instagram post)</label>
                <div className="flex items-center gap-2">
                  <Input value={form.postImageUrl as string || ''} onChange={e=>setForm(f=>({ ...f, postImageUrl: e.target.value }))} placeholder="https://..." disabled={!canEdit} />
                  <Button type="button" variant="outline" onClick={()=>setMediaOpenPost(true)} disabled={!canEdit}>Görsel Seç / Yükle</Button>
                  <MediaPicker open={mediaOpenPost} onOpenChange={setMediaOpenPost} onSelect={(url)=>setForm(f=>({ ...f, postImageUrl: url }))} title="Kare Görsel Seç / Yükle" />
                </div>
              </div>
            </div>

            {/* Başlık */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-400">Başlık</label>
                <Input value={form.title as string || ''} onChange={e=>setForm(f=>({ ...f, title: e.target.value }))} placeholder="Bonus başlığı" required disabled={!canEdit} />
              </div>
            </div>

            {/* Tür & Kategori */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs text-neutral-400">Bonus Türü</label>
                <Input value={form.bonusType as string || ''} onChange={e=>setForm(f=>({ ...f, bonusType: e.target.value }))} placeholder="Örn: Hoşgeldin Bonusu" disabled={!canEdit} />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-neutral-400">Site Kategorisi</label>
                <Input value={form.gameCategory as string || ''} onChange={e=>setForm(f=>({ ...f, gameCategory: e.target.value }))} placeholder="Örn: Spor" disabled={!canEdit} />
              </div>
            </div>

            {/* Sayısal alanlar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-neutral-400">Tutar (TL)</label>
                <Input type="number" value={typeof form.amount === 'number' ? form.amount : ''} onChange={e=>setForm(f=>({ ...f, amount: Number(e.target.value) }))} placeholder="ör. 100" disabled={!canEdit} />
              </div>
              <div>
                <label className="text-xs text-neutral-400">Wager (x)</label>
                <Input type="number" value={typeof form.wager === 'number' ? form.wager : ''} onChange={e=>setForm(f=>({ ...f, wager: Number(e.target.value) }))} placeholder="ör. 10" disabled={!canEdit} />
              </div>
              <div>
                <label className="text-xs text-neutral-400">Min. Yatırım (TL)</label>
                <Input type="number" value={typeof form.minDeposit === 'number' ? form.minDeposit : ''} onChange={e=>setForm(f=>({ ...f, minDeposit: Number(e.target.value) }))} placeholder="ör. 0" disabled={!canEdit} />
              </div>
            </div>

            {/* CTA */}
            <div>
              <label className="text-xs text-neutral-400">CTA URL</label>
              <Input value={form.ctaUrl as string || ''} onChange={e=>setForm(f=>({ ...f, ctaUrl: e.target.value }))} placeholder="https://..." disabled={!canEdit} />
            </div>

            {/* Açıklamalar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-400">Açıklama</label>
                <Textarea value={form.description as string || ''} onChange={e=>setForm(f=>({ ...f, description: e.target.value }))} placeholder="Detaylı açıklama" rows={3} disabled={!canEdit} />
              </div>
              <div>
                <label className="text-xs text-neutral-400">Kısa Açıklama</label>
                <Input value={form.shortDescription as string || ''} onChange={e=>setForm(f=>({ ...f, shortDescription: e.target.value }))} placeholder="Örn: Çevrim şartsız deneme" disabled={!canEdit} />
              </div>
            </div>

            {/* Geçerlilik ve Tarihler */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-neutral-400">Geçerlilik Metni</label>
                <Input value={form.validityText as string || ''} onChange={e=>setForm(f=>({ ...f, validityText: e.target.value }))} placeholder="Örn: Sadece yeni üyeler için" disabled={!canEdit} />
              </div>
              <div>
                <label className="text-xs text-neutral-400">Başlangıç Tarihi</label>
                <Input type="date" value={typeof form.startDate === 'string' ? form.startDate : ''} onChange={e=>setForm(f=>({ ...f, startDate: e.target.value }))} disabled={!canEdit} />
              </div>
              <div>
                <label className="text-xs text-neutral-400">Bitiş Tarihi</label>
                <Input type="date" value={typeof form.endDate === 'string' ? form.endDate : ''} onChange={e=>setForm(f=>({ ...f, endDate: e.target.value }))} disabled={!canEdit} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={!canEdit || saving}>Kaydet ve Onaya Gönder</Button>
              <Button type="button" variant="outline" onClick={()=>router.push('/brand/bonuses')}>Listeye Dön</Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Bu sayfada yapılan düzenlemeler sonrası bonus tekrar onaya düşer.</p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}