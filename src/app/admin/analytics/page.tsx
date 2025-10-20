"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

type CodeItem = {
  id: string
  name: string
  type: string
  code: string
  injectTo: 'head' | 'body' | string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const TYPES = [
  'custom',
  'Google Tag Manager (GTM)',
  'Google Analytics',
  'Meta Pixel',
  'Yandex Metrica',
  'Microsoft Clarity',
  'Google Search Console (Meta Tag)',
  'Bing Webmaster Tools (Meta Tag)',
  'TikTok Pixel',
]

export default function AnalyticsCodesAdminPage() {
  const [items, setItems] = useState<CodeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create form state
  const [name, setName] = useState('')
  const [type, setType] = useState<string>('custom')
  const [injectTo, setInjectTo] = useState<'head' | 'body'>('head')
  const [code, setCode] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/analytics-codes')
      const data = await res.json()
      setItems(data)
    } catch (e) {
      setError('Kodlar yüklenirken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  async function create() {
    try {
      setCreating(true)
      setError(null)
      const res = await fetch('/api/admin/analytics-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, injectTo, code, isActive }),
      })
      if (!res.ok) {
        const er = await res.json().catch(()=>({error:'Hata'}))
        throw new Error(er.error || 'Ekleme başarısız')
      }
      const created = await res.json()
      setItems((prev) => [created, ...prev])
      setName(''); setType('custom'); setInjectTo('head'); setCode(''); setIsActive(true)
    } catch (e: any) {
      setError(e.message || 'Ekleme sırasında hata')
    } finally {
      setCreating(false)
    }
  }

  async function update(id: string, patch: Partial<CodeItem>) {
    try {
      const res = await fetch(`/api/admin/analytics-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Güncelleme başarısız')
      const updated = await res.json()
      setItems((prev) => prev.map((it) => it.id === id ? updated : it))
    } catch (e) {
      alert('Güncelleme sırasında hata oluştu')
    }
  }

  async function remove(id: string) {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try {
      const res = await fetch(`/api/admin/analytics-codes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Silme başarısız')
      setItems((prev) => prev.filter((it) => it.id !== id))
    } catch (e) {
      alert('Silme sırasında hata oluştu')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Analytics & Meta Kodları</h1>
      <p className="text-muted-foreground">
        Bu alanda Google Analytics, Meta Pixel veya benzeri izleme kodlarını ekleyebilirsiniz. Aktif olan kodlar otomatik olarak siteye gömülür.
      </p>
      <div className="text-xs text-muted-foreground">
        Desteklenen örnekler: Google Tag Manager (GTM), Yandex Metrica, Microsoft Clarity, Google Search Console (Verification Meta Tag), Bing Webmaster Tools (Meta Tag), TikTok Pixel, Custom Script / HTML Kod.
      </div>

      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle>Yeni Kod Ekle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm mb-1 block">Ad</label>
              <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Örn: GA4, GTM, Clarity…" />
            </div>
            <div>
              <label className="text-sm mb-1 block">Tür</label>
              <select className="w-full border rounded h-9 px-2" value={type} onChange={(e)=>setType(e.target.value)}>
                {TYPES.map((t)=> <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm mb-1 block">Konum</label>
              <select className="w-full border rounded h-9 px-2" value={injectTo} onChange={(e)=>setInjectTo(e.target.value as 'head'|'body')}>
                <option value="head">HEAD</option>
                <option value="body">BODY</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={(v)=>setIsActive(!!v)} />
              <span className="text-sm">Aktif/Pasif</span>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm mb-1 block">Kod (HTML / JS)</label>
              <Textarea rows={6} value={code} onChange={(e)=>setCode(e.target.value)} placeholder="Örnek: <script>...</script> veya <meta name=… content=… />" />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={create} disabled={creating}>{creating ? 'Ekleniyor…' : 'Kodu Ekle'}</Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Kod Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-muted-foreground">Yükleniyor…</div>}
          {error && <div className="text-sm text-red-500">{error}</div>}
          {!loading && !error && (
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-start border rounded-md p-3">
                  <div className="md:col-span-2">
                    <label className="text-xs">Ad</label>
                    <Input defaultValue={it.name} onBlur={(e)=>update(it.id,{ name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs">Tür</label>
                    <select className="w-full border rounded h-9 px-2" defaultValue={it.type} onBlur={(e)=>update(it.id,{ type: e.target.value })}>
                      {TYPES.map((t)=> <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs">Konum</label>
                    <select className="w-full border rounded h-9 px-2" defaultValue={it.injectTo} onBlur={(e)=>update(it.id,{ injectTo: e.target.value })}>
                      <option value="head">HEAD</option>
                      <option value="body">BODY</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={it.isActive ? 'default' : 'secondary'}>{it.isActive ? 'Aktif' : 'Pasif'}</Badge>
                    <Switch checked={it.isActive} onCheckedChange={(v)=>update(it.id,{ isActive: !!v })} />
                  </div>
                  <div className="md:col-span-6">
                    <label className="text-xs">Kod</label>
                    <Textarea defaultValue={it.code} rows={5} onBlur={(e)=>update(it.id,{ code: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="destructive" size="sm" onClick={()=>remove(it.id)}>Sil</Button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-sm text-muted-foreground">Henüz kod eklenmedi.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}