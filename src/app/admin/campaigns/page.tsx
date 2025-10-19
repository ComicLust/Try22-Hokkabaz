"use client"
import { useEffect, useState } from 'react'
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
  bonusAmount?: number | null
  tags?: string[] | null
  startDate?: string | null
  endDate?: string | null
  isActive: boolean
  isFeatured: boolean
  priority: number
}

export default function CampaignsPage() {
  const [items, setItems] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Partial<Campaign>>({ isActive: true, isFeatured: false, priority: 0 })
  const [mediaOpenForm, setMediaOpenForm] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/campaigns')
    const data = await res.json()
    setItems(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const createItem = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setForm({ isActive: true, priority: 0 })
      await load()
    } else {
      alert('Oluşturma hatası')
    }
  }

  const updateItem = async (id: string, patch: Partial<Campaign>) => {
    const res = await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) await load()
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Bu kampanya silinsin mi?')) return
    const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
    if (res.ok) await load()
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Kampanyalar</h1>

      <form onSubmit={createItem} className="border rounded-md p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="border rounded-md px-3 py-2"
            placeholder="Başlık"
            value={form.title ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <input
            className="border rounded-md px-3 py-2"
            placeholder="Slug"
            value={form.slug ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            required
          />
          <div className="flex items-center gap-2">
            <input
              className="border rounded-md px-3 py-2"
              placeholder="Görsel URL"
              value={form.imageUrl ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            />
            <Button type="button" variant="outline" onClick={() => setMediaOpenForm(true)}>Görsel Seç / Yükle</Button>
            <MediaPicker
              open={mediaOpenForm}
              onOpenChange={setMediaOpenForm}
              onSelect={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
              title="Kampanya Görseli Seç / Yükle"
            />
          </div>
          <input
            className="border rounded-md px-3 py-2"
            placeholder="CTA URL"
            value={form.ctaUrl ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Aktif
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.isFeatured}
              onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
            />
            Öne Çıkan
          </label>
          <label className="flex items-center gap-2">
            Öncelik
            <input
              type="number"
              className="border rounded-md px-3 py-2 w-24"
              value={form.priority ?? 0}
              onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
            />
          </label>
        </div>
        <button type="submit" className="px-4 py-2 rounded-md bg-primary text-primary-foreground">Ekle</button>
      </form>

      <div className="border rounded-md overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left">
              <th className="p-3">Başlık</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Öncelik</th>
              <th className="p-3">Aktif</th>
              <th className="p-3">Öne Çıkan</th>
              <th className="p-3">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-3">{it.title}</td>
                <td className="p-3">{it.slug}</td>
                <td className="p-3">
                  <input
                    type="number"
                    className="border rounded-md px-2 py-1 w-24"
                    defaultValue={it.priority}
                    onBlur={(e) => updateItem(it.id, { priority: Number(e.target.value) })}
                  />
                </td>
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={it.isActive}
                    onChange={(e) => updateItem(it.id, { isActive: e.target.checked })}
                  />
                </td>
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={!!it.isFeatured}
                    onChange={(e) => updateItem(it.id, { isFeatured: e.target.checked })}
                  />
                </td>
                <td className="p-3 space-x-2">
                  <a className="px-3 py-1 rounded-md border inline-block" href={`/admin/campaigns/${it.id}`}>Düzenle</a>
                  <button className="px-3 py-1 rounded-md border" onClick={() => deleteItem(it.id)}>Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-3">Yükleniyor...</div>}
      </div>
    </div>
  )
}