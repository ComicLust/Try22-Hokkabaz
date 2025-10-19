"use client"
import { useEffect, useMemo, useState } from 'react'

type Campaign = {
  id: string
  title: string
  slug: string
  isFeatured: boolean
  priority: number
}

export default function FeaturedCampaignsAdmin() {
  const [items, setItems] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [edited, setEdited] = useState<Record<string, Partial<Campaign>>>({})

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/campaigns')
    const data = await res.json()
    setItems(data.map((d: any) => ({ id: d.id, title: d.title, slug: d.slug, isFeatured: !!d.isFeatured, priority: d.priority ?? 0 })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggleFeatured = (id: string, value: boolean) => {
    setItems((arr) => arr.map((it) => it.id === id ? { ...it, isFeatured: value } : it))
    setEdited((e) => ({ ...e, [id]: { ...(e[id] || {}), isFeatured: value } }))
  }

  const changePriority = (id: string, value: number) => {
    setItems((arr) => arr.map((it) => it.id === id ? { ...it, priority: value } : it))
    setEdited((e) => ({ ...e, [id]: { ...(e[id] || {}), priority: value } }))
  }

  const editedCount = useMemo(() => Object.keys(edited).length, [edited])

  const saveAll = async () => {
    if (!editedCount) return
    setSaving(true)
    try {
      await Promise.all(Object.entries(edited).map(([id, patch]) => fetch(`/api/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })))
      setEdited({})
      await load()
      alert('Değişiklikler kaydedildi')
    } catch (e) {
      alert('Kaydetme hatası')
    } finally {
      setSaving(false)
    }
  }

  const selectAll = (value: boolean) => {
    const next: Record<string, Partial<Campaign>> = {}
    setItems((arr) => arr.map((it) => {
      next[it.id] = { isFeatured: value }
      return { ...it, isFeatured: value }
    }))
    setEdited((e) => ({ ...e, ...next }))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Öne Çıkanlar Yönetimi</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => selectAll(true)} className="px-3 py-2 rounded-md border">Tümünü Öne Çıkar</button>
          <button onClick={() => selectAll(false)} className="px-3 py-2 rounded-md border">Tümünü Kaldır</button>
          <button onClick={saveAll} disabled={saving || !editedCount} className="px-4 py-2 rounded-md bg-primary text-primary-foreground">
            {saving ? 'Kaydediliyor...' : `Kaydet (${editedCount})`}
          </button>
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left">
              <th className="p-3">Başlık</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Öne Çıkan</th>
              <th className="p-3">Öncelik</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-3">{it.title}</td>
                <td className="p-3">{it.slug}</td>
                <td className="p-3">
                  <input type="checkbox" checked={!!it.isFeatured} onChange={(e) => toggleFeatured(it.id, e.target.checked)} />
                </td>
                <td className="p-3">
                  <input type="number" className="border rounded-md px-2 py-1 w-24" value={it.priority} onChange={(e) => changePriority(it.id, Number(e.target.value))} />
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