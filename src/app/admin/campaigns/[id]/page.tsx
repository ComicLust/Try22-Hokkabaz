"use client"
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { MediaPicker } from '@/components/media/MediaPicker'

type Campaign = {
  id: string
  title: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  ctaUrl?: string | null
  badgeLabel?: string | null
  bonusText?: string | null
  bonusAmount?: number | null
  tags?: string[] | null
  startDate?: string | null
  endDate?: string | null
  isActive: boolean
  isFeatured: boolean
  priority: number
}

export default function CampaignEditPage() {
  const { toast } = useToast()
  const [item, setItem] = useState<Campaign | null>(null)
  const [saving, setSaving] = useState(false)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const { id } = useParams() as { id: string }
  const [mediaOpen, setMediaOpen] = useState(false)

  const load = async () => {
    if (!id) return
    const res = await fetch(`/api/campaigns/${id}`)
    if (!res.ok) {
      toast({ title: 'Hata', description: 'Kampanya bulunamadı' })
      return
    }
    const data = await res.json()
    // tags Json olabilir; string[]’e dönüştürmeye çalış
    const normalized: Campaign = {
      ...data,
      tags: Array.isArray(data.tags) ? data.tags : [],
    }
    setItem(normalized)
  }

  useEffect(() => {
    load()
    // Tüm kampanyalardan etiket önerileri topla
    ;(async () => {
      try {
        const res = await fetch('/api/campaigns')
        const all = await res.json()
        const uniq = Array.from(new Set(
          (all || []).flatMap((c: any) => Array.isArray(c.tags) ? c.tags : [])
        )) as string[]
        setAvailableTags(uniq)
      } catch {}
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const uploadImage = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!res.ok) throw new Error('Yükleme hatası')
    const data = await res.json()
    return data.url as string
  }

  const save = async () => {
    if (!item) return
    setSaving(true)
    try {
      const payload = { ...item, tags: item.tags ?? [] }
      const res = await fetch(`/api/campaigns/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Kaydetme hatası')
      toast({ title: 'Kaydedildi', description: 'Kampanya güncellendi' })
    } catch (e: any) {
      toast({ title: 'Hata', description: e?.message ?? 'Kaydetme hatası' })
    } finally {
      setSaving(false)
    }
  }

  if (!item) return <div className="p-6">Yükleniyor...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kampanya Düzenle</h1>
        <a href="/admin/campaigns" className="text-sm underline">Listeye Dön</a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="border rounded-md p-4 space-y-3">
            <label className="block text-sm font-medium">Kampanya Görseli</label>
            <div className="flex items-center gap-4">
              {item.imageUrl && (
                <img src={item.imageUrl} alt="campaign" className="w-40 h-24 object-cover rounded" />
              )}
              <Button type="button" variant="outline" onClick={() => setMediaOpen(true)}>
                Görsel Seç / Yükle
              </Button>
              <MediaPicker
                open={mediaOpen}
                onOpenChange={setMediaOpen}
                onSelect={(url) => {
                  setItem((it) => it ? { ...it, imageUrl: url } : it)
                  toast({ title: 'Görsel seçildi', description: 'Kampanya görseli güncellendi' })
                }}
              />
            </div>
          </div>

          <div className="border rounded-md p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm">Kampanya Adı</label>
              <input
                className="border rounded-md px-3 py-2 w-full"
                value={item.title}
                onChange={(e) => setItem({ ...item, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Badge</label>
              <input
                className="border rounded-md px-3 py-2 w-full"
                placeholder="ÖNE ÇIKAN"
                value={item.badgeLabel ?? ''}
                onChange={(e) => setItem({ ...item, badgeLabel: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm">Kısa Açıklama</label>
              <textarea
                className="border rounded-md px-3 py-2 w-full"
                rows={3}
                value={item.description ?? ''}
                onChange={(e) => setItem({ ...item, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Bonus Miktarı (serbest metin)</label>
              <input
                className="border rounded-md px-3 py-2 w-full"
                placeholder="%100, Bedava Üyelik, 50 Free Spin, vb."
                value={item.bonusText ?? ''}
                onChange={(e) => setItem({ ...item, bonusText: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Etiketler</label>
              <div className="flex flex-wrap gap-2">
                {(item.tags ?? []).map((tag, idx) => (
                  <span key={`${tag}-${idx}`} className="inline-flex items-center gap-2 px-2 py-1 border rounded-md text-xs">
                    {tag}
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() => setItem({ ...item, tags: (item.tags ?? []).filter((t) => t !== tag) })}
                    >Sil</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  list="tag-options"
                  className="border rounded-md px-3 py-2 w-full"
                  placeholder="Etiket yazın veya önerilerden seçin"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                />
                <datalist id="tag-options">
                  {availableTags.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                <button
                  type="button"
                  className="px-3 py-2 border rounded-md"
                  onClick={() => {
                    const nt = newTag.trim()
                    if (!nt) return
                    const next = Array.from(new Set([...(item.tags ?? []), nt]))
                    setItem({ ...item, tags: next })
                    setNewTag('')
                  }}
                >Ekle</button>
              </div>
              {availableTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableTags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="px-2 py-1 border rounded-md text-xs hover:bg-accent"
                      onClick={() => {
                        const next = Array.from(new Set([...(item.tags ?? []), t]))
                        setItem({ ...item, tags: next })
                      }}
                    >{t}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm">Detay CTA URL</label>
              <input
                className="border rounded-md px-3 py-2 w-full"
                value={item.ctaUrl ?? ''}
                onChange={(e) => setItem({ ...item, ctaUrl: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border rounded-md p-4 space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.isActive}
                onChange={(e) => setItem({ ...item, isActive: e.target.checked })}
              />
              Aktif
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!item.isFeatured}
                onChange={(e) => setItem({ ...item, isFeatured: e.target.checked })}
              />
              Öne Çıkan
            </label>
            <label className="flex items-center gap-2">
              Öncelik
              <input
                type="number"
                className="border rounded-md px-3 py-2 w-24"
                value={item.priority}
                onChange={(e) => setItem({ ...item, priority: Number(e.target.value) })}
              />
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <a href={`/kampanyalar/${item.slug ?? ''}`} className="px-4 py-2 rounded-md border">Önizle</a>
          </div>
        </div>
      </div>
    </div>
  )
}