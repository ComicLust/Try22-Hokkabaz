"use client"
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type Bonus = {
  id: string
  title: string
  slug: string
  description?: string | null
  shortDescription?: string | null
  imageUrl?: string | null // logo
  postImageUrl?: string | null // kare post görseli
  ctaUrl?: string | null
  bonusType?: string | null
  gameCategory?: string | null
  amount?: number | null
  wager?: number | null
  minDeposit?: number | null
  badges?: string[] | null
  features?: string[] | null
  validityText?: string | null
  startDate?: string | null
  endDate?: string | null
  isActive: boolean
  isFeatured?: boolean
  priority?: number
}

// MediaPicker entegrasyonu için UI importları
import { Button } from '@/components/ui/button'
import { MediaPicker } from '@/components/media/MediaPicker'
import { slugifyTr } from '@/lib/slugify'

export default function BonusEditPage() {
  const { id } = useParams() as { id: string }
  const [item, setItem] = useState<Bonus | null>(null)
  const [saving, setSaving] = useState(false)
  const [availableBadges, setAvailableBadges] = useState<string[]>([])
  const [newBadge, setNewBadge] = useState('')
  const [newFeature, setNewFeature] = useState('')
  const [typeOptions, setTypeOptions] = useState<string[]>(['Deneme Bonusu','Hoşgeldin Bonusu','Yatırım Bonusu','Kayıp Bonusu'])
  const [categoryOptions, setCategoryOptions] = useState<string[]>(['Spor','Casino','Slot','Poker','Bingo','Tombala','E-spor','Sanal'])
  const [newType, setNewType] = useState('')
  const [newCategory, setNewCategory] = useState('')
  // MediaPicker açık/kapat durumları
  const [mediaLogoOpen, setMediaLogoOpen] = useState(false)
  const [mediaPostOpen, setMediaPostOpen] = useState(false)

  const load = async () => {
    if (!id) return
    const res = await fetch(`/api/bonuses/${id}`)
    if (!res.ok) return
    const data = await res.json()
    setItem(data)
  }

  useEffect(() => {
    load()
    // Tüm bonuslardan rozet önerileri topla
    ;(async () => {
      try {
        const res = await fetch('/api/bonuses')
        const all = await res.json()
        const uniq = Array.from(new Set(
          (all || []).flatMap((b: any) => Array.isArray(b.badges) ? b.badges : [])
        )) as string[]
        setAvailableBadges(uniq)
        // Bonus türü ve kategori seçeneklerini mevcut veriden türet
        const types = Array.from(new Set(((all || []).map((b: any) => b.bonusType).filter(Boolean)))) as string[]
        const cats = Array.from(new Set(((all || []).map((b: any) => b.gameCategory).filter(Boolean)))) as string[]
        if (types.length) setTypeOptions(prev => Array.from(new Set([...prev, ...types])) as string[])
        if (cats.length) setCategoryOptions(prev => Array.from(new Set([...prev, ...cats])) as string[])
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
      const payload = { ...item }
      const res = await fetch(`/api/bonuses/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Kaydetme hatası')
      alert('Bonus güncellendi')
    } catch (e: any) {
      alert(e?.message ?? 'Kaydetme hatası')
    } finally {
      setSaving(false)
    }
  }

  if (!item) return <div className="p-6">Yükleniyor...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bonus Düzenle</h1>
        <a href="/admin/bonuses" className="text-sm underline">Listeye Dön</a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol panel: Logo ve açıklama */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border rounded-md p-4 space-y-3">
            <label className="block text-sm font-medium">Bet Sitesi Logosu</label>
            <div className="flex items-center gap-4">
              {item?.imageUrl && (
                <img src={item.imageUrl} alt="logo" className="w-40 h-24 object-contain border" />
              )}
              {/* Dosya input yerine medya seçici */}
              <Button type="button" variant="outline" onClick={() => setMediaLogoOpen(true)}>
                Görsel Seç / Yükle
              </Button>
              <MediaPicker
                open={mediaLogoOpen}
                onOpenChange={setMediaLogoOpen}
                onSelect={(url) => {
                  setItem((it) => it ? { ...it, imageUrl: url } : it)
                  alert('Logo güncellendi')
                }}
                title="Logo Seç / Yükle"
              />
            </div>
          </div>

          <div className="border rounded-md p-4 space-y-3">
            <label className="block text-sm font-medium">Bonus Kare Görseli (Instagram post)</label>
            <div className="flex items-center gap-4">
              {item?.postImageUrl && (
                <div className="w-40 h-40 border bg-muted overflow-hidden">
                  <img src={item.postImageUrl} alt="post" className="w-full h-full object-cover" />
                </div>
              )}
              {/* Dosya input yerine medya seçici */}
              <Button type="button" variant="outline" onClick={() => setMediaPostOpen(true)}>
                Görsel Seç / Yükle
              </Button>
              <MediaPicker
                open={mediaPostOpen}
                onOpenChange={setMediaPostOpen}
                onSelect={(url) => {
                  setItem((it) => it ? { ...it, postImageUrl: url } : it)
                  alert('Kare görsel güncellendi')
                }}
                title="Kare Görsel Seç / Yükle"
              />
            </div>
          </div>

          <div className="border rounded-md p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm">Başlık</label>
              <input
                className="border rounded-md px-3 py-2 w-full"
                value={item.title}
                onChange={(e) => setItem((prev) => prev ? { ...prev, title: e.target.value, slug: (prev.slug && prev.slug.length > 0) ? prev.slug : slugifyTr(e.target.value, { withHyphens: true, maxLen: 64 }) } : prev)}
              />
            </div>
            <div className="space-y-2 hidden">
              <label className="text-sm">Slug</label>
              <input
                className="border rounded-md px-3 py-2 w-full"
                type="hidden"
                value={item.slug}
                readOnly
              />
            </div>

            {/* Bonus Türü */}
            <div className="space-y-2">
              <label className="text-sm">Bonus Türü</label>
              <select
                className="border rounded-md px-3 py-2 w-full"
                value={item.bonusType ?? ''}
                onChange={(e) => setItem({ ...item, bonusType: e.target.value || null })}
              >
                <option value="">Seçiniz</option>
                {typeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <input
                  className="border rounded-md px-3 py-2 w-full"
                  placeholder="Yeni tür ekle"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                />
                <button
                  type="button"
                  className="px-3 py-2 rounded-md border"
                  onClick={() => {
                    const v = newType.trim()
                    if (!v) return
                    setTypeOptions((prev) => Array.from(new Set([...prev, v])))
                    setItem((it) => it ? { ...it, bonusType: v } : it)
                    setNewType('')
                  }}
                >Ekle</button>
              </div>
            </div>

            {/* Site Kategorisi */}
            <div className="space-y-2">
              <label className="text-sm">Site Kategorisi</label>
              <select
                className="border rounded-md px-3 py-2 w-full"
                value={item.gameCategory ?? ''}
                onChange={(e) => setItem({ ...item, gameCategory: e.target.value || null })}
              >
                <option value="">Seçiniz</option>
                {categoryOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <input
                  className="border rounded-md px-3 py-2 w-full"
                  placeholder="Yeni kategori ekle"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <button
                  type="button"
                  className="px-3 py-2 rounded-md border"
                  onClick={() => {
                    const v = newCategory.trim()
                    if (!v) return
                    setCategoryOptions((prev) => Array.from(new Set([...prev, v])))
                    setItem((it) => it ? { ...it, gameCategory: v } : it)
                    setNewCategory('')
                  }}
                >Ekle</button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm">Tutar (TL)</label>
              <input
                type="number"
                className="border rounded-md px-3 py-2 w-full"
                value={item.amount ?? 0}
                onChange={(e) => setItem({ ...item, amount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Wager (x)</label>
              <input
                type="number"
                className="border rounded-md px-3 py-2 w-full"
                value={item.wager ?? 0}
                onChange={(e) => setItem({ ...item, wager: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm">Min. Yatırım (TL)</label>
              <input
                type="number"
                className="border rounded-md px-3 py-2 w-full"
                value={item.minDeposit ?? 0}
                onChange={(e) => setItem({ ...item, minDeposit: Number(e.target.value) })}
              />
            </div>
          <div className="space-y-2">
            <label className="text-sm">CTA URL</label>
            <input
              className="border rounded-md px-3 py-2 w-full"
              placeholder="https://..."
              value={item.ctaUrl ?? ''}
              onChange={(e) => setItem({ ...item, ctaUrl: e.target.value })}
            />
          </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm">Açıklama</label>
              <textarea
                className="border rounded-md px-3 py-2 w-full"
                rows={3}
                value={item.description ?? ''}
                onChange={(e) => setItem({ ...item, description: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm">Kısa Açıklama (kart/metin alanı için)</label>
              <input
                className="border rounded-md px-3 py-2 w-full"
                placeholder="Örn: Çevrim şartsız deneme bonusu"
                value={item.shortDescription ?? ''}
                onChange={(e) => setItem({ ...item, shortDescription: e.target.value })}
              />
            </div>

            {/* Geçerlilik / Tarihler */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm">Geçerlilik Metni</label>
              <input
                className="border rounded-md px-3 py-2 w-full"
                placeholder="Örn: Son 3 gün geçerli"
                value={item.validityText ?? ''}
                onChange={(e) => setItem({ ...item, validityText: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Başlangıç Tarihi</label>
              <input
                type="date"
                className="border rounded-md px-3 py-2 w-full"
                value={item.startDate ? item.startDate.substring(0, 10) : ''}
                onChange={(e) => {
                  const v = e.target.value
                  setItem({ ...item, startDate: v ? new Date(v).toISOString() : null })
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Bitiş Tarihi</label>
              <input
                type="date"
                className="border rounded-md px-3 py-2 w-full"
                value={item.endDate ? item.endDate.substring(0, 10) : ''}
                onChange={(e) => {
                  const v = e.target.value
                  setItem({ ...item, endDate: v ? new Date(v).toISOString() : null })
                }}
              />
            </div>

            {/* Rozetler */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm">Rozetler</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(item.badges ?? []).map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded border">
                    {tag}
                    <button
                      type="button"
                      className="text-red-500"
                      onClick={() => setItem(it => it ? { ...it, badges: (it.badges ?? []).filter((t) => t !== tag) } : it)}
                    >x</button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="border rounded-md px-3 py-2 w-full"
                  placeholder="Örn: Lisanslı, SSL, 18+"
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                />
                <button
                  type="button"
                  className="px-3 py-2 rounded-md border"
                  onClick={() => {
                    const val = newBadge.trim()
                    if (!val) return
                    setItem(it => it ? { ...it, badges: Array.from(new Set([...(it.badges ?? []), val])) } : it)
                    setNewBadge('')
                  }}
                >Ekle</button>
              </div>
              {availableBadges.length > 0 && (
                <div className="text-xs text-muted-foreground mt-2">
                  Önerilen: {availableBadges.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="mr-2 underline"
                      onClick={() => setItem(it => it ? { ...it, badges: Array.from(new Set([...(it.badges ?? []), t])) } : it)}
                    >{t}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Özellikler (alt yazılar) */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm">Özellikler / Alt Yazılar</label>
              <div className="space-y-2">
                {(item.features ?? []).map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      className="border rounded-md px-3 py-2 w-full"
                      value={feat}
                      onChange={(e) => setItem(it => {
                        if (!it) return it
                        const arr = [...(it.features ?? [])]
                        arr[idx] = e.target.value
                        return { ...it, features: arr }
                      })}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 rounded-md border"
                      onClick={() => setItem(it => it ? { ...it, features: (it.features ?? []).filter((_, i) => i !== idx) } : it)}
                    >Sil</button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="border rounded-md px-3 py-2 w-full"
                  placeholder="Örn: Çevrim Şartsız"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                />
                <button
                  type="button"
                  className="px-3 py-2 rounded-md border"
                  onClick={() => {
                    const val = newFeature.trim()
                    if (!val) return
                    setItem(it => it ? { ...it, features: [...(it.features ?? []), val] } : it)
                    setNewFeature('')
                  }}
                >Ekle</button>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ panel: durumlar ve aksiyonlar */}
        <div className="space-y-4">
          <div className="border rounded-md p-4 grid grid-cols-1 gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!item.isActive}
                onChange={(e) => setItem({ ...item, isActive: e.target.checked })}
              />
              Aktif
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!item.isFeatured}
                onChange={(e) => setItem({ ...item, isFeatured: e.target.checked })}
              />
              Öne Çıkan
            </label>
            <div className="space-y-2">
              <label className="text-sm">Öncelik</label>
              <input
                type="number"
                className="border rounded-md px-3 py-2 w-full"
                value={item.priority ?? 0}
                onChange={(e) => setItem({ ...item, priority: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="px-4 py-2 rounded-md border"
              onClick={save}
              disabled={saving}
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <a className="px-4 py-2 rounded-md border" href="/admin/bonuses">İptal</a>
          </div>
        </div>
      </div>
    </div>
  )
}