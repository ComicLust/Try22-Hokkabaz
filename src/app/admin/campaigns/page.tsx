"use client"
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MediaPicker } from '@/components/media/MediaPicker'
import Image from 'next/image'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

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
  const [query, setQuery] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const { toast } = useToast()

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
      setForm({ isActive: true, isFeatured: false, priority: 0 })
      await load()
      toast({ title: 'Önbellek temizlendi' })
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
    if (res.ok) {
      await load()
      toast({ title: 'Önbellek temizlendi' })
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Bu kampanya silinsin mi?')) return
    const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
    if (res.ok) {
      await load()
      toast({ title: 'Önbellek temizlendi' })
    }
  }

  // Sürükle-bırak sıralama (priority desc)
  const onDragStart = (id: string) => setDragId(id)
  const onDragOver = (e: React.DragEvent) => e.preventDefault()
  const onDrop = async (targetId: string) => {
    if (!dragId || query.trim()) { setDragId(null); return }
    const fromIndex = items.findIndex(i => i.id === dragId)
    const toIndex = items.findIndex(i => i.id === targetId)
    if (fromIndex === -1 || toIndex === -1) { setDragId(null); return }
    const next = items.slice()
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    setItems(next)
    setDragId(null)
    // Priority en yüksek üstte olacak şekilde yeniden yaz
    await Promise.all(next.map((it, idx) =>
      fetch(`/api/campaigns/${it.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: next.length - idx })
      })
    ))
    await load()
    toast({ title: 'Önbellek temizlendi' })
  }

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) =>
      (it.title || '').toLowerCase().includes(q) || (it.slug || '').toLowerCase().includes(q)
    )
  }, [items, query])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kampanyalar</h1>
        <div className="w-64">
          <Input placeholder="Ara (başlık/slug)" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {/* Oluşturma Formu + Canlı Önizleme */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Yeni Kampanya Ekle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={createItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Başlık</Label>
                  <Input placeholder="Başlık" value={form.title ?? ''} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input placeholder="slug-ornek" value={form.slug ?? ''} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Açıklama</Label>
                  <Textarea placeholder="Kısa açıklama" value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Görsel URL</Label>
                  <div className="flex items-center gap-2">
                    <Input placeholder="https://..." value={form.imageUrl ?? ''} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} />
                    <Button type="button" variant="outline" onClick={() => setMediaOpenForm(true)}>Seç/Yükle</Button>
                  </div>
                  <MediaPicker open={mediaOpenForm} onOpenChange={setMediaOpenForm} onSelect={(url) => setForm((f) => ({ ...f, imageUrl: url }))} title="Kampanya Görseli Seç / Yükle" />
                </div>
                <div className="space-y-2">
                  <Label>CTA URL</Label>
                  <Input placeholder="https://..." value={form.ctaUrl ?? ''} onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between rounded-md border p-2">
                  <div className="space-y-1">
                    <Label className="text-sm">Aktif</Label>
                    <div className="text-xs text-muted-foreground">Listelerde gösterilsin</div>
                  </div>
                  <Switch checked={!!form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
                </div>
                <div className="flex items-center justify-between rounded-md border p-2">
                  <div className="space-y-1">
                    <Label className="text-sm">Öne Çıkan</Label>
                    <div className="text-xs text-muted-foreground">Ana listede vurgulansın</div>
                  </div>
                  <Switch checked={!!form.isFeatured} onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} />
                </div>
                <div className="space-y-2">
                  <Label>Öncelik</Label>
                  <Input type="number" value={form.priority ?? 0} onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))} />
                </div>
              </div>
              <Button type="submit" className="w-full">Ekle</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Canlı Önizleme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative aspect-video rounded-md overflow-hidden border bg-muted">
                {form.imageUrl ? (
                  <Image src={form.imageUrl} alt={form.title || 'Kampanya Görseli'} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">Görsel seçilmedi</div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {form.isActive ? <Badge>Aktif</Badge> : <Badge variant="outline">Pasif</Badge>}
                  {form.isFeatured ? <Badge className="bg-gold text-black">Öne Çıkan</Badge> : null}
                </div>
                <h3 className="font-semibold text-lg">{form.title || 'Başlık'}</h3>
                <div className="text-sm text-muted-foreground">/{form.slug || 'slug-ornek'}</div>
                <p className="text-sm">{form.description || 'Kısa açıklama burada görünecek.'}</p>
                {form.ctaUrl ? (
                  <Button asChild size="sm"><a href={form.ctaUrl} target="_blank" rel="noopener noreferrer">Bağlantı</a></Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listeleme (Grid) */}
      <Card>
        <CardHeader>
          <CardTitle>Mevcut Kampanyalar</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-3">Yükleniyor...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((it) => (
                <Card
                  key={it.id}
                  className="overflow-hidden"
                  draggable={query.trim() === ''}
                  onDragStart={() => onDragStart(it.id)}
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(it.id)}
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-video bg-muted">
                      {it.imageUrl ? (
                        <Image src={it.imageUrl} alt={it.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">Görsel yok</div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        {it.isActive ? <Badge>Aktif</Badge> : <Badge variant="outline">Pasif</Badge>}
                        {it.isFeatured ? <Badge className="bg-gold text-black">Öne Çıkan</Badge> : null}
                        <Badge variant="outline">Öncelik: {it.priority}</Badge>
                      </div>
                      <h3 className="font-semibold text-base">{it.title}</h3>
                      <div className="text-xs text-muted-foreground">/{it.slug}</div>
                      {it.description ? <p className="text-sm line-clamp-3">{it.description}</p> : null}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Aktif</Label>
                        <Switch checked={it.isActive} onCheckedChange={(v) => updateItem(it.id, { isActive: v })} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Öne Çıkan</Label>
                        <Switch checked={!!it.isFeatured} onCheckedChange={(v) => updateItem(it.id, { isFeatured: v })} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Öncelik</Label>
                        <Input type="number" className="w-20" defaultValue={it.priority} onBlur={(e) => updateItem(it.id, { priority: Number(e.target.value) })} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end md:justify-start">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/campaigns/${it.id}`}>Düzenle</Link>
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteItem(it.id)}>Sil</Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}