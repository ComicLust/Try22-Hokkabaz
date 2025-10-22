"use client"
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { MediaPicker } from '@/components/media/MediaPicker'

type VpnItem = {
  name: string
  plan: 'free' | 'paid'
  locations: string[]
  description: string
  href: string
  features?: string[]
  imageUrl?: string
}

export default function AdminVpnPage() {
  const [items, setItems] = useState<VpnItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [mediaOpenRowIdx, setMediaOpenRowIdx] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(i => i.name.toLowerCase().includes(q))
  }, [items, search])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/admin/vpn-items')
        const json = await res.json()
        setItems(json.items || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const saveAll = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/vpn-items', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    })
    setSaving(false)
    if (!res.ok) {
      alert('Kaydetme hata verdi')
    } else {
      alert('Güncellendi')
    }
  }

  const addNew = () => {
    setItems(prev => ([...prev, {
      name: '', plan: 'free', locations: [], description: '', href: '', features: [], imageUrl: ''
    }]))
  }

  const removeAt = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">VPN Önerileri Yönetimi</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Ara" value={search} onChange={(e)=>setSearch(e.target.value)} className="w-48" />
          <Button type="button" onClick={saveAll} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Tümünü Kaydet'}</Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">Basit bir içerik yönetimi ekranı: ad, plan, lokasyonlar, açıklama, link ve logo düzenlenebilir. Değişiklikler dosya tabanlı depoya yazılır.</div>

      <div className="space-y-4">
        {loading && <div>Yükleniyor...</div>}
        {!loading && filtered.map((it, idx) => (
          <div key={idx} className="border rounded-md p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs">Ad</label>
              <Input value={it.name} onChange={(e)=>setItems(arr=>arr.map((x,i)=>i===idx?{...x,name:e.target.value}:x))} />

              <label className="text-xs">Plan</label>
              <Select value={it.plan} onValueChange={(v:any)=>setItems(arr=>arr.map((x,i)=>i===idx?{...x,plan:v}:x))}>
                <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Ücretsiz</SelectItem>
                  <SelectItem value="paid">Ücretli</SelectItem>
                </SelectContent>
              </Select>

              <label className="text-xs">Lokasyonlar (virgülle ayırın)</label>
              <Input value={it.locations.join(', ')} onChange={(e)=>setItems(arr=>arr.map((x,i)=>i===idx?{...x,locations:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}:x))} />
            </div>

            <div className="space-y-2">
              <label className="text-xs">Açıklama</label>
              <Textarea value={it.description} onChange={(e)=>setItems(arr=>arr.map((x,i)=>i===idx?{...x,description:e.target.value}:x))} rows={5} />

              <label className="text-xs">Özellikler (virgülle)</label>
              <Input value={(it.features||[]).join(', ')} onChange={(e)=>setItems(arr=>arr.map((x,i)=>i===idx?{...x,features:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}:x))} />
            </div>

            <div className="space-y-2">
              <label className="text-xs">Resmi Site Linki</label>
              <Input value={it.href} onChange={(e)=>setItems(arr=>arr.map((x,i)=>i===idx?{...x,href:e.target.value}:x))} />

              <label className="text-xs">Logo URL</label>
              <div className="flex items-center gap-2">
                <Input value={it.imageUrl || ''} onChange={(e)=>setItems(arr=>arr.map((x,i)=>i===idx?{...x,imageUrl:e.target.value}:x))} />
                <Button type="button" variant="outline" onClick={()=>setMediaOpenRowIdx(idx)}>Görsel Seç / Yükle</Button>
              </div>
              <MediaPicker
                open={mediaOpenRowIdx===idx}
                onOpenChange={(v)=>!v && setMediaOpenRowIdx(null)}
                onSelect={(url)=>{
                  setItems(arr=>arr.map((x,i)=>i===idx?{...x,imageUrl:url}:x))
                }}
                title="Logo Seç / Yükle"
              />

              <div className="flex items-center justify-between">
                <Button type="button" variant="outline" onClick={()=>removeAt(idx)}>Sil</Button>
                {it.imageUrl && (<img src={it.imageUrl} alt="logo" className="w-20 h-12 object-contain border rounded" />)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={addNew}>Yeni Öneri Ekle</Button>
        <a href="/vpn-onerileri" className="text-sm underline">Kamu sayfasını aç</a>
      </div>
    </div>
  )
}