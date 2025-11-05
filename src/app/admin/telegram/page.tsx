"use client"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MediaPicker } from "@/components/media/MediaPicker"
import { Send, Users, Hash, Image, Trash2, Plus, Search } from "lucide-react"

type TelegramGroup = {
  id: string
  name: string
  members?: number | null
  membersText?: string | null
  imageUrl?: string | null
  ctaUrl: string
  type: "CHANNEL" | "GROUP"
  isFeatured: boolean
  badges?: string[] | null
  priority?: number | null
}

export default function AdminTelegramPage() {
  const [items, setItems] = useState<TelegramGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [badgeInput, setBadgeInput] = useState("")

  const [form, setForm] = useState<Partial<TelegramGroup>>({
    name: "",
    members: undefined,
    membersText: "",
    imageUrl: "",
    ctaUrl: "",
    type: "GROUP",
    isFeatured: false,
    badges: [],
  })
  const [saving, setSaving] = useState(false)
  const [mediaOpenForm, setMediaOpenForm] = useState(false)
  const [mediaOpenRowId, setMediaOpenRowId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) => i.name.toLowerCase().includes(q))
  }, [items, search])

  const featured = filtered.filter((i) => i.isFeatured)
  const listed = filtered.filter((i) => !i.isFeatured)

  // Drag & drop state
  const [dragging, setDragging] = useState<{ list: 'featured' | 'listed' | null; id: string | null }>({ list: null, id: null })
  const [dirtyOrder, setDirtyOrder] = useState<{ featured: boolean; listed: boolean }>({ featured: false, listed: false })

  function reorderWithin(listType: 'featured' | 'listed', sourceId: string, targetId: string) {
    const sourceArray = listType === 'featured' ? featured : listed
    const srcIndex = sourceArray.findIndex((x) => x.id === sourceId)
    const tgtIndex = sourceArray.findIndex((x) => x.id === targetId)
    if (srcIndex < 0 || tgtIndex < 0 || srcIndex === tgtIndex) return

    const newOrder = sourceArray.slice()
    const [moved] = newOrder.splice(srcIndex, 1)
    newOrder.splice(tgtIndex, 0, moved)

    // Merge back into items preserving other list
    const otherArray = listType === 'featured' ? listed : featured
    const rebuilt: TelegramGroup[] = []
    // Keep featured first in original items order grouping
    const featuredSet = new Set((listType === 'featured' ? newOrder : otherArray).map((x) => x.id))
    const listedSet = new Set((listType === 'featured' ? otherArray : newOrder).map((x) => x.id))
    for (const i of items) {
      if (featuredSet.has(i.id)) continue
      if (listedSet.has(i.id)) continue
      // should not happen but keep any others
      rebuilt.push(i)
    }
    // Rebuild: featured + listed + the rest
    const finalItems: TelegramGroup[] = []
    const newFeatured = listType === 'featured' ? newOrder : otherArray
    const newListed = listType === 'featured' ? otherArray : newOrder
    for (const f of newFeatured) finalItems.push(f)
    for (const l of newListed) finalItems.push(l)
    for (const r of rebuilt) finalItems.push(r)
    setItems(finalItems)
    setDirtyOrder((d) => ({ ...d, [listType]: true }))
  }

  async function saveOrder(listType: 'featured' | 'listed') {
    const sourceArray = listType === 'featured' ? items.filter((i) => i.isFeatured) : items.filter((i) => !i.isFeatured)
    // Highest priority for first row
    const priorities = new Map<string, number>()
    const base = sourceArray.length
    sourceArray.forEach((it, idx) => priorities.set(it.id, base - idx))

    try {
      await Promise.all(
        sourceArray.map((it) =>
          fetch(`/api/telegram-groups/${it.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priority: priorities.get(it.id) }),
          })
        )
      )
      setDirtyOrder((d) => ({ ...d, [listType]: false }))
      await load()
    } catch (e: any) {
      setError(e?.message ?? 'Sıralama kaydedilemedi')
    }
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/telegram-groups")
      const json = await res.json()
      setItems(json ?? [])
    } catch (e: any) {
      setError(e?.message ?? "Yükleme hatası")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function createItem() {
    setSaving(true)
    setError(null)
    try {
      const payload: any = {
        name: form.name?.trim(),
        members: form.members ?? null,
        membersText: form.membersText ? form.membersText.trim() : null,
        imageUrl: form.imageUrl || null,
        ctaUrl: form.ctaUrl?.trim(),
        type: form.type ?? "GROUP",
        isFeatured: !!form.isFeatured,
        badges: (form.badges ?? []).filter(Boolean),
      }
      const res = await fetch("/api/telegram-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Kaydetme hatası")
      setForm({ name: "", members: undefined, membersText: "", imageUrl: "", ctaUrl: "", type: "GROUP", isFeatured: false, badges: [] })
      await load()
    } catch (e: any) {
      setError(e?.message ?? "Kaydetme hatası")
    } finally {
      setSaving(false)
    }
  }

  async function updateItem(id: string, patch: Partial<TelegramGroup>) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/telegram-groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Güncelleme hatası")
      await load()
    } catch (e: any) {
      setError(e?.message ?? "Güncelleme hatası")
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Bu grubu silmek istediğinize emin misiniz?")) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/telegram-groups/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Silme hatası")
      await load()
    } catch (e: any) {
      setError(e?.message ?? "Silme hatası")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Send className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Telegram Grupları</h1>
        </div>
        <p className="text-muted-foreground text-sm">Güvenilir Telegram kanal/grup yönetimi (listele, ekle, düzenle, sil).</p>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Add New Group Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Yeni Grup Ekle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Grup Adı</label>
              <Input
                placeholder="Grup adı"
                value={form.name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telegram Linki</label>
              <Input
                placeholder="Telegram linki (ctaUrl)"
                value={form.ctaUrl ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Üye Sayısı</label>
              <Input
                placeholder="Üye sayısı"
                type="number"
                value={typeof form.members === "number" ? form.members : ""}
                onChange={(e) => setForm((f) => ({ ...f, members: e.target.value ? Number(e.target.value) : undefined }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Üye Metni</label>
              <Input
                placeholder="Üye (metin) örn: 15K+ üye"
                value={form.membersText ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, membersText: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tip</label>
              <Select
                value={form.type ?? "GROUP"}
                onValueChange={(value) => setForm((f) => ({ ...f, type: value as "CHANNEL" | "GROUP" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GROUP">Grup</SelectItem>
                  <SelectItem value="CHANNEL">Kanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="featured"
                  checked={!!form.isFeatured}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, isFeatured: !!checked }))}
                />
                <label htmlFor="featured" className="text-sm">Önerilen</label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Profil Resmi</label>
            <div className="flex gap-2">
              <Input
                placeholder="Profil resmi URL (imageUrl)"
                value={form.imageUrl ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={() => setMediaOpenForm(true)}>
                <Image className="h-4 w-4 mr-2" />
                Görsel Seç
              </Button>
            </div>
            <MediaPicker
              open={mediaOpenForm}
              onOpenChange={setMediaOpenForm}
              onSelect={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
              title="Telegram Görseli Seç / Yükle"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Rozetler</label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {(form.badges ?? []).map((b, idx) => (
                <Badge
                  key={`${b}-${idx}`}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setForm((f) => ({ ...f, badges: (f.badges ?? []).filter((x) => x !== b) }))}
                >
                  {b}
                  <span className="ml-1">×</span>
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Rozet ekle ve Enter/virgül"
              value={badgeInput}
              onChange={(e) => setBadgeInput(e.target.value)}
              onKeyDown={(e) => {
                const isCommit = e.key === "Enter" || e.key === ","
                if (isCommit) {
                  e.preventDefault()
                  const token = badgeInput.trim()
                  if (token) setForm((f) => ({ ...f, badges: [ ...(f.badges ?? []), token ] }))
                  setBadgeInput("")
                }
              }}
              onBlur={() => {
                const token = badgeInput.trim()
                if (token) setForm((f) => ({ ...f, badges: [ ...(f.badges ?? []), token ] }))
                setBadgeInput("")
              }}
            />
            <p className="text-xs text-muted-foreground">Örnek: Güvenilir, Aktif, 7/24</p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              disabled={saving || !form.name || !form.ctaUrl}
              onClick={createItem}
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Gruplarda ara…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Yükleniyor…</p>
          </CardContent>
        </Card>
      )}

      {/* Featured Groups */}
      {featured.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Önerilen Gruplar
              <Badge variant="secondary">{featured.length}</Badge>
            </CardTitle>
            {dirtyOrder.featured && (
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={() => saveOrder('featured')}>Sıralamayı Kaydet</Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">Sıra</TableHead>
                    <TableHead>Ad</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Üye (sayı)</TableHead>
                    <TableHead>Üye (metin)</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Resim</TableHead>
                    <TableHead>Rozetler</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featured.map((g) => (
                    <TableRow
                      key={g.id}
                      draggable
                      onDragStart={() => setDragging({ list: 'featured', id: g.id })}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragging.list === 'featured' && dragging.id && dragging.id !== g.id) {
                          reorderWithin('featured', dragging.id, g.id)
                        }
                        setDragging({ list: null, id: null })
                      }}
                      className="cursor-grab"
                    >
                      <TableCell className="text-muted-foreground">
                        <span className="inline-block w-4 h-4">↕︎</span>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={g.name}
                          onChange={(e) => updateItem(g.id, { name: e.target.value })}
                          className="min-w-[150px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={g.type}
                          onValueChange={(value) => updateItem(g.id, { type: value as any })}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GROUP">Grup</SelectItem>
                            <SelectItem value="CHANNEL">Kanal</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={g.members ?? ""}
                          onChange={(e) => updateItem(g.id, { members: e.target.value ? Number(e.target.value) : null })}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Üye (metin)"
                          value={g.membersText ?? ""}
                          onChange={(e) => updateItem(g.id, { membersText: e.target.value })}
                          className="min-w-[120px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={g.ctaUrl}
                          onChange={(e) => updateItem(g.id, { ctaUrl: e.target.value })}
                          className="min-w-[200px]"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            value={g.imageUrl ?? ""}
                            onChange={(e) => updateItem(g.id, { imageUrl: e.target.value || null })}
                            className="min-w-[150px]"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => setMediaOpenRowId(g.id)}
                          >
                            <Image className="h-4 w-4" />
                          </Button>
                          <MediaPicker
                            open={mediaOpenRowId === g.id}
                            onOpenChange={(v) => setMediaOpenRowId(v ? g.id : null)}
                            onSelect={async (url) => {
                              try {
                                await updateItem(g.id, { imageUrl: url })
                              } catch (e: any) {
                                setError(e?.message ?? "Güncelleme hatası")
                              }
                            }}
                            title="Telegram Görseli Seç / Yükle"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1 min-w-[200px]">
                          {(g.badges ?? []).map((b, idx) => (
                            <Badge
                              key={`${g.id}-b-${idx}`}
                              variant="outline"
                              className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => updateItem(g.id, { badges: (g.badges ?? []).filter((x) => x !== b) as any })}
                            >
                              {b}
                              <span className="ml-1">×</span>
                            </Badge>
                          ))}
                          <Input
                            placeholder="Rozet ekle"
                            className="min-w-[120px]"
                            onKeyDown={(e) => {
                              const el = e.currentTarget as HTMLInputElement
                              const isCommit = e.key === "Enter" || e.key === ","
                              if (isCommit) {
                                e.preventDefault()
                                const token = el.value.trim()
                                if (token) updateItem(g.id, { badges: [ ...(g.badges ?? []), token ] as any })
                                el.value = ""
                              }
                            }}
                            onBlur={(e) => {
                              const token = e.currentTarget.value.trim()
                              if (token) updateItem(g.id, { badges: [ ...(g.badges ?? []), token ] as any })
                              e.currentTarget.value = ""
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`featured-${g.id}`}
                              checked={g.isFeatured}
                              onCheckedChange={(checked) => updateItem(g.id, { isFeatured: !!checked })}
                            />
                            <label htmlFor={`featured-${g.id}`} className="text-xs">Önerilen</label>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteItem(g.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Groups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Tüm Gruplar
            <Badge variant="secondary">{listed.length}</Badge>
          </CardTitle>
          {dirtyOrder.listed && (
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={() => saveOrder('listed')}>Sıralamayı Kaydet</Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {listed.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Listede grup yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">Sıra</TableHead>
                    <TableHead>Ad</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Üye (sayı)</TableHead>
                    <TableHead>Üye (metin)</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Resim</TableHead>
                    <TableHead>Rozetler</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listed.map((g) => (
                    <TableRow
                      key={g.id}
                      draggable
                      onDragStart={() => setDragging({ list: 'listed', id: g.id })}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragging.list === 'listed' && dragging.id && dragging.id !== g.id) {
                          reorderWithin('listed', dragging.id, g.id)
                        }
                        setDragging({ list: null, id: null })
                      }}
                      className="cursor-grab"
                    >
                      <TableCell className="text-muted-foreground">
                        <span className="inline-block w-4 h-4">↕︎</span>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={g.name}
                          onChange={(e) => updateItem(g.id, { name: e.target.value })}
                          className="min-w-[150px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={g.type}
                          onValueChange={(value) => updateItem(g.id, { type: value as any })}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GROUP">Grup</SelectItem>
                            <SelectItem value="CHANNEL">Kanal</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={g.members ?? ""}
                          onChange={(e) => updateItem(g.id, { members: e.target.value ? Number(e.target.value) : null })}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Üye (metin)"
                          value={g.membersText ?? ""}
                          onChange={(e) => updateItem(g.id, { membersText: e.target.value })}
                          className="min-w-[120px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={g.ctaUrl}
                          onChange={(e) => updateItem(g.id, { ctaUrl: e.target.value })}
                          className="min-w-[200px]"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            value={g.imageUrl ?? ""}
                            onChange={(e) => updateItem(g.id, { imageUrl: e.target.value || null })}
                            className="min-w-[150px]"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => setMediaOpenRowId(g.id)}
                          >
                            <Image className="h-4 w-4" />
                          </Button>
                          <MediaPicker
                            open={mediaOpenRowId === g.id}
                            onOpenChange={(v) => setMediaOpenRowId(v ? g.id : null)}
                            onSelect={async (url) => {
                              try {
                                await updateItem(g.id, { imageUrl: url })
                              } catch (e: any) {
                                setError(e?.message ?? "Güncelleme hatası")
                              }
                            }}
                            title="Telegram Görseli Seç / Yükle"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1 min-w-[200px]">
                          {(g.badges ?? []).map((b, idx) => (
                            <Badge
                              key={`${g.id}-lb-${idx}`}
                              variant="outline"
                              className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => updateItem(g.id, { badges: (g.badges ?? []).filter((x) => x !== b) as any })}
                            >
                              {b}
                              <span className="ml-1">×</span>
                            </Badge>
                          ))}
                          <Input
                            placeholder="Rozet ekle"
                            className="min-w-[120px]"
                            onKeyDown={(e) => {
                              const el = e.currentTarget as HTMLInputElement
                              const isCommit = e.key === "Enter" || e.key === ","
                              if (isCommit) {
                                e.preventDefault()
                                const token = el.value.trim()
                                if (token) updateItem(g.id, { badges: [ ...(g.badges ?? []), token ] as any })
                                el.value = ""
                              }
                            }}
                            onBlur={(e) => {
                              const token = e.currentTarget.value.trim()
                              if (token) updateItem(g.id, { badges: [ ...(g.badges ?? []), token ] as any })
                              e.currentTarget.value = ""
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`listed-${g.id}`}
                              checked={g.isFeatured}
                              onCheckedChange={(checked) => updateItem(g.id, { isFeatured: !!checked })}
                            />
                            <label htmlFor={`listed-${g.id}`} className="text-xs">Önerilen</label>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteItem(g.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}