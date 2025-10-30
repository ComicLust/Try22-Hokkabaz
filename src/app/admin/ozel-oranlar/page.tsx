"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MediaPicker } from '@/components/media/MediaPicker'

interface AdminSpecialOddItem {
  id: string
  brandName: string
  matchTitle: string
  oddsLabel: string
  conditions?: string | null
  imageUrl?: string | null
  ctaUrl?: string | null
  expiresAt?: string | null
  isActive: boolean
  priority: number
  brandId?: string | null
  createdAt: string
  updatedAt: string
}

interface CreateForm {
  brandName: string
  matchTitle: string
  oddsLabel: string
  conditions?: string
  imageUrl?: string
  ctaUrl?: string
  expiresAt?: string
  isActive: boolean
  brandId?: string
}

interface DateTimeFieldProps {
  value?: string
  onChange: (iso: string | null) => void
  placeholder?: string
}

function DateTimeField({ value, onChange, placeholder }: DateTimeFieldProps) {
  const [open, setOpen] = useState(false)
  const initial = value ? new Date(value) : null
  const [selectedDate, setSelectedDate] = useState<Date | null>(initial)
  const [hours, setHours] = useState<string>(initial ? String(initial.getHours()).padStart(2, '0') : '00')
  const [minutes, setMinutes] = useState<string>(initial ? String(initial.getMinutes()).padStart(2, '0') : '00')

  function toISO(d: Date, h: number, m: number): string {
    const local = new Date(d)
    local.setHours(h, m, 0, 0)
    return new Date(local).toISOString()
  }

  function displayLabel(): string {
    if (!value) return ''
    try { return new Date(value).toLocaleString('tr-TR') } catch { return value || '' }
  }

  function apply() {
    if (!selectedDate) {
      onChange(null)
      setOpen(false)
      return
    }
    const h = Math.max(0, Math.min(23, parseInt(hours || '0', 10) || 0))
    const m = Math.max(0, Math.min(59, parseInt(minutes || '0', 10) || 0))
    const iso = toISO(selectedDate, h, m)
    onChange(iso)
    setOpen(false)
  }

  return (
    <div className="flex items-center gap-2">
      <Input readOnly placeholder={placeholder || 'Son Tarih'} value={displayLabel()} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline">Seç</Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-3">
          <div className="space-y-3">
            <Calendar
              mode="single"
              selected={selectedDate ?? undefined}
              onSelect={(d) => setSelectedDate(d ?? null)}
              captionLayout="dropdown"
            />
            <div className="flex items-center gap-2">
              <Input value={hours} onChange={(e)=> setHours(e.target.value.replace(/[^0-9]/g,'').slice(0,2))} placeholder="SS" className="w-16" />
              <span className="text-muted-foreground">:</span>
              <Input value={minutes} onChange={(e)=> setMinutes(e.target.value.replace(/[^0-9]/g,'').slice(0,2))} placeholder="DD" className="w-16" />
              <Button type="button" variant="secondary" onClick={apply} className="ml-auto">Uygula</Button>
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="ghost" onClick={()=> { setSelectedDate(null); onChange(null); setHours('00'); setMinutes('00'); }}>Temizle</Button>
              <Button type="button" onClick={()=> setOpen(false)}>Kapat</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default function AdminOzelOranlarPage() {
  const [items, setItems] = useState<AdminSpecialOddItem[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>({ brandName: '', matchTitle: '', oddsLabel: '', isActive: true })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCache, setEditCache] = useState<Record<string, Partial<AdminSpecialOddItem>>>({})
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [brands, setBrands] = useState<{ id: string; name: string; slug: string; logoUrl?: string | null }[]>([])
  const [uploadingCreate, setUploadingCreate] = useState(false)
  const [uploadingEditId, setUploadingEditId] = useState<string | null>(null)
  const [mediaOpenCreate, setMediaOpenCreate] = useState(false)
  const [mediaOpenEditId, setMediaOpenEditId] = useState<string | null>(null)
  const [brandPickerOpenCreate, setBrandPickerOpenCreate] = useState(false)
  const [brandPickerOpenEditId, setBrandPickerOpenEditId] = useState<string | null>(null)
  const [brandQuery, setBrandQuery] = useState('')

  function fetchItems() {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    params.set('active', 'all')
    fetch(`/api/admin/special-odds?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setItems(data?.items ?? [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchItems()
    fetch('/api/admin/review-brands')
      .then(res => res.json())
      .then(d => setBrands(d?.brands ?? []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onCreateChange<K extends keyof CreateForm>(key: K, value: CreateForm[K]) {
    setCreateForm(prev => ({ ...prev, [key]: value }))
  }

  function submitCreate() {
    if (!createForm.brandName || !createForm.matchTitle || !createForm.oddsLabel) return
    setCreating(true)
    fetch('/api/admin/special-odds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    })
      .then(res => res.json())
      .then(created => {
        setItems(prev => [created, ...prev])
        setCreateForm({ brandName: '', matchTitle: '', oddsLabel: '', isActive: true })
      })
      .finally(() => setCreating(false))
  }

  function startEdit(id: string) {
    setEditingId(id)
    const item = items.find(i => i.id === id)
    if (item) setEditCache(prev => ({ ...prev, [id]: { ...item } }))
  }

  function onEditChange(id: string, key: keyof AdminSpecialOddItem, value: any) {
    setEditCache(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: value } }))
  }

  function submitEdit(id: string) {
    const patch = editCache[id]
    if (!patch) return
    fetch(`/api/admin/special-odds/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandName: patch.brandName,
        matchTitle: patch.matchTitle,
        oddsLabel: patch.oddsLabel,
        conditions: patch.conditions ?? null,
        imageUrl: patch.imageUrl ?? null,
        ctaUrl: patch.ctaUrl ?? null,
        expiresAt: patch.expiresAt ?? null,
        isActive: typeof patch.isActive === 'boolean' ? patch.isActive : undefined,
        brandId: typeof patch.brandId !== 'undefined' ? (patch.brandId || null) : undefined,
      }),
    })
      .then(res => res.json())
      .then(updated => {
        setItems(prev => prev.map(i => (i.id === id ? updated : i)))
        setEditingId(null)
      })
  }

  function confirmDelete(id: string) { setConfirmDeleteId(id) }

  function doDelete(id: string) {
    fetch(`/api/admin/special-odds/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => {
        setItems(prev => prev.filter(i => i.id !== id))
        setConfirmDeleteId(null)
      })
  }

  function moveItem(id: string, direction: 'up' | 'down') {
    const idx = items.findIndex(i => i.id === id)
    if (idx === -1) return
    const newItems = items.slice()
    if (direction === 'up' && idx > 0) {
      const tmp = newItems[idx - 1]
      newItems[idx - 1] = newItems[idx]
      newItems[idx] = tmp
    }
    if (direction === 'down' && idx < newItems.length - 1) {
      const tmp = newItems[idx + 1]
      newItems[idx + 1] = newItems[idx]
      newItems[idx] = tmp
    }
    setItems(newItems)
    const orderedIds = newItems.map(i => i.id)
    fetch('/api/admin/special-odds/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    })
  }

  async function uploadFile(file: File): Promise<string | null> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd })
    if (!res.ok) return null
    const data = await res.json()
    return data?.path ?? null
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(i => i.id === String(active.id))
    const newIndex = items.findIndex(i => i.id === String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    const newItems = arrayMove(items, oldIndex, newIndex)
    setItems(newItems)
    const orderedIds = newItems.map(i => i.id)
    fetch('/api/admin/special-odds/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    })
  }

  function SortableRow({ item, idx }: { item: AdminSpecialOddItem; idx: number }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    } as React.CSSProperties
    const expired = !!item.expiresAt && new Date(item.expiresAt).getTime() < Date.now()
    return (
      <div ref={setNodeRef} style={style} className={`border rounded-md p-3 ${isDragging ? 'bg-muted' : ''}`}
        {...attributes} {...listeners}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{item.matchTitle}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{item.brandName} • {item.oddsLabel} • {item.isActive ? 'Aktif' : 'Pasif'}</span>
              {expired && (
                <Badge variant="destructive">Süresi bitti</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => moveItem(item.id, 'up')} disabled={idx === 0}>Yukarı</Button>
            <Button variant="outline" size="sm" onClick={() => moveItem(item.id, 'down')} disabled={idx === items.length - 1}>Aşağı</Button>
            <Button variant="secondary" size="sm" onClick={() => startEdit(item.id)}>Düzenle</Button>
            <Button variant="destructive" size="sm" onClick={() => confirmDelete(item.id)}>Sil</Button>
          </div>
        </div>

        {editingId === item.id && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input placeholder="Marka" defaultValue={item.brandName} onChange={(e) => onEditChange(item.id, 'brandName', e.target.value)} />
            <Input placeholder="Maç" defaultValue={item.matchTitle} onChange={(e) => onEditChange(item.id, 'matchTitle', e.target.value)} />
            <Input placeholder="Oran Etiketi" defaultValue={item.oddsLabel} onChange={(e) => onEditChange(item.id, 'oddsLabel', e.target.value)} />
            <div className="flex items-center gap-2">
              <Input placeholder="Görsel URL" defaultValue={item.imageUrl || ''} onChange={(e) => onEditChange(item.id, 'imageUrl', e.target.value)} />
              <Button type="button" variant="outline" onClick={() => setMediaOpenEditId(item.id)}>Görsel Seç / Yükle</Button>
              {uploadingEditId === item.id && <span className="text-xs text-muted-foreground">Yükleniyor…</span>}
              <MediaPicker
                open={mediaOpenEditId === item.id}
                onOpenChange={(v)=> setMediaOpenEditId(v ? item.id : null)}
                onSelect={(url) => onEditChange(item.id, 'imageUrl', url)}
                title="Kart Görseli Seç / Yükle"
              />
            </div>
            <Input placeholder="CTA URL" defaultValue={item.ctaUrl || ''} onChange={(e) => onEditChange(item.id, 'ctaUrl', e.target.value)} />
            <DateTimeField
              value={item.expiresAt || ''}
              onChange={(iso) => onEditChange(item.id, 'expiresAt', iso || '')}
              placeholder="Son Tarih seç"
            />
            <div>
              <label className="text-xs text-muted-foreground">Marka (opsiyonel)</label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setBrandPickerOpenEditId(item.id)}>Marka Seç (Logolu)</Button>
                { (editCache[item.id]?.brandId ?? item.brandId) && (
                  <Button type="button" variant="ghost" onClick={() => onEditChange(item.id, 'brandId', null)}>Bağı Kaldır</Button>
                )}
              </div>
              { (editCache[item.id]?.brandId ?? item.brandId) && (
                <div className="mt-2 flex items-center gap-2">
                  {brands.find(b=>b.id=== (editCache[item.id]?.brandId ?? item.brandId))?.logoUrl ? (
                    <img src={brands.find(b=>b.id=== (editCache[item.id]?.brandId ?? item.brandId))!.logoUrl!} alt="logo" className="w-8 h-8 object-contain" />
                  ) : (
                    <img src="/logo.svg" alt="logo" className="w-8 h-8" />
                  )}
                  <span className="text-sm">{brands.find(b=>b.id=== (editCache[item.id]?.brandId ?? item.brandId))?.name}</span>
                </div>
              )}
              <Dialog open={brandPickerOpenEditId === item.id} onOpenChange={(v)=> setBrandPickerOpenEditId(v ? item.id : null)}>
                <DialogContent className="sm:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Marka Seç</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Marka ara" value={brandQuery} onChange={(e)=>setBrandQuery(e.target.value)} />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {brands.filter(b=>!brandQuery || b.name.toLowerCase().includes(brandQuery.toLowerCase())).map(b=> (
                        <button key={b.id} type="button" className="border rounded-md p-2 hover:border-primary text-left" onClick={()=>{ onEditChange(item.id, 'brandId', b.id); setBrandPickerOpenEditId(null) }}>
                          <div className="w-full h-16 flex items-center justify-center overflow-hidden">
                            {b.logoUrl ? (
                              <img src={b.logoUrl} alt={b.name} className="w-full h-full object-contain" />
                            ) : (
                              <img src="/logo.svg" alt="logo" className="w-12 h-12" />
                            )}
                          </div>
                          <div className="mt-2 text-sm">{b.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="md:col-span-2">
              <Textarea placeholder="Şartlar" defaultValue={item.conditions || ''} onChange={(e) => onEditChange(item.id, 'conditions', e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={item.isActive ? 'default' : 'outline'}>{item.isActive ? 'Aktif' : 'Pasif'}</Badge>
              <Button variant="outline" size="sm" onClick={() => onEditChange(item.id, 'isActive', !item.isActive)}>
                {item.isActive ? 'Pasifleştir' : 'Aktifleştir'}
              </Button>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingId(null)}>İptal</Button>
              <Button onClick={() => submitEdit(item.id)}>Kaydet</Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const filtered = useMemo(() => {
    const now = Date.now()
    const isExpired = (it: AdminSpecialOddItem) => !!it.expiresAt && new Date(it.expiresAt).getTime() < now

    const base = !q
      ? items.slice()
      : items.filter(i => {
          const qq = q.toLowerCase()
          return (
            i.brandName.toLowerCase().includes(qq) ||
            i.matchTitle.toLowerCase().includes(qq) ||
            i.oddsLabel.toLowerCase().includes(qq)
          )
        })

    // Aktifler üstte, süresi geçenler en altta; kendi içinde priority DESC, createdAt DESC
    base.sort((a, b) => {
      const aExp = isExpired(a)
      const bExp = isExpired(b)
      if (aExp !== bExp) return aExp ? 1 : -1
      if (a.priority !== b.priority) return b.priority - a.priority
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return base
  }, [items, q])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Özel Oranlar Yönetimi</h1>
      <p className="text-muted-foreground">Kart içindeki tüm bilgileri ekleyip düzenleyin, silebilir ve sırasını değiştirebilirsiniz.</p>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Kart Ekle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Marka Adı" value={createForm.brandName} onChange={(e) => onCreateChange('brandName', e.target.value)} />
            <Input placeholder="Maç Başlığı" value={createForm.matchTitle} onChange={(e) => onCreateChange('matchTitle', e.target.value)} />
            <Input placeholder="Oran Etiketi (örn: 10.0 Oran)" value={createForm.oddsLabel} onChange={(e) => onCreateChange('oddsLabel', e.target.value)} />
            <div className="flex items-center gap-2">
              <Input placeholder="Görsel URL (opsiyonel)" value={createForm.imageUrl || ''} onChange={(e) => onCreateChange('imageUrl', e.target.value)} />
              <Button type="button" variant="outline" onClick={() => setMediaOpenCreate(true)}>Görsel Seç / Yükle</Button>
              {uploadingCreate && <span className="text-xs text-muted-foreground">Yükleniyor…</span>}
              <MediaPicker
                open={mediaOpenCreate}
                onOpenChange={setMediaOpenCreate}
                onSelect={(url) => onCreateChange('imageUrl', url)}
                title="Kart Görseli Seç / Yükle"
              />
            </div>
            <Input placeholder="CTA URL (opsiyonel)" value={createForm.ctaUrl || ''} onChange={(e) => onCreateChange('ctaUrl', e.target.value)} />
            <DateTimeField
              value={createForm.expiresAt || ''}
              onChange={(iso) => onCreateChange('expiresAt', iso || '')}
              placeholder="Son Tarih (opsiyonel)"
            />
            <div>
              <label className="text-xs text-muted-foreground">Marka (opsiyonel)</label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setBrandPickerOpenCreate(true)}>Marka Seç (Logolu)</Button>
                {createForm.brandId && (
                  <Button type="button" variant="ghost" onClick={() => onCreateChange('brandId', undefined)}>Temizle</Button>
                )}
              </div>
              {createForm.brandId && (
                <div className="mt-2 flex items-center gap-2">
                  {brands.find(b=>b.id===createForm.brandId)?.logoUrl ? (
                    <img src={brands.find(b=>b.id===createForm.brandId)!.logoUrl!} alt="logo" className="w-8 h-8 object-contain" />
                  ) : (
                    <img src="/logo.svg" alt="logo" className="w-8 h-8" />
                  )}
                  <span className="text-sm">{brands.find(b=>b.id===createForm.brandId)?.name}</span>
                </div>
              )}
              <Dialog open={brandPickerOpenCreate} onOpenChange={setBrandPickerOpenCreate}>
                <DialogContent className="sm:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Marka Seç</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Marka ara" value={brandQuery} onChange={(e)=>setBrandQuery(e.target.value)} />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {brands.filter(b=>!brandQuery || b.name.toLowerCase().includes(brandQuery.toLowerCase())).map(b=> (
                        <button key={b.id} type="button" className="border rounded-md p-2 hover:border-primary text-left" onClick={()=>{ onCreateChange('brandId', b.id); setBrandPickerOpenCreate(false) }}>
                          <div className="w-full h-16 flex items-center justify-center overflow-hidden">
                            {b.logoUrl ? (
                              <img src={b.logoUrl} alt={b.name} className="w-full h-full object-contain" />
                            ) : (
                              <img src="/logo.svg" alt="logo" className="w-12 h-12" />
                            )}
                          </div>
                          <div className="mt-2 text-sm">{b.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="md:col-span-2">
              <Textarea placeholder="Şartlar (opsiyonel)" value={createForm.conditions || ''} onChange={(e) => onCreateChange('conditions', e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={createForm.isActive ? 'default' : 'outline'}>{createForm.isActive ? 'Aktif' : 'Pasif'}</Badge>
              <Button variant="outline" size="sm" onClick={() => onCreateChange('isActive', !createForm.isActive)}>
                {createForm.isActive ? 'Pasifleştir' : 'Aktifleştir'}
              </Button>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button onClick={submitCreate} disabled={creating}>
                {creating ? 'Ekleniyor...' : 'Ekle'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mevcut Kartlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Input placeholder="Ara: marka, maç, oran" value={q} onChange={(e) => setQ(e.target.value)} />
            <Button variant="outline" onClick={fetchItems} disabled={loading}>{loading ? 'Yükleniyor...' : 'Yenile'}</Button>
          </div>
          <div className="space-y-3">
            <DndContext onDragEnd={onDragEnd}>
              <SortableContext items={filtered.map(f => f.id)}>
                {filtered.map((i, idx) => (
                  <SortableRow key={i.id} item={i} idx={idx} />
                ))}
              </SortableContext>
            </DndContext>
            {!filtered.length && (
              <div className="text-sm text-muted-foreground">Kayıt bulunamadı.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmDeleteId}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silme işlemi</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="text-sm">Bu özel oran kartını silmek istediğinizden emin misiniz?</div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDeleteId(null)}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={() => confirmDeleteId && doDelete(confirmDeleteId)}>Sil</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}