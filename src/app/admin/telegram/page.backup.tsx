"use client"
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MediaPicker } from '@/components/media/MediaPicker'

type TelegramGroup = {
  id: string
  name: string
  members?: number | null
  membersText?: string | null
  imageUrl?: string | null
  ctaUrl: string
  type: 'CHANNEL' | 'GROUP'
  isFeatured: boolean
  badges?: string[] | null
}

export default function AdminTelegramPage() {
  const [items, setItems] = useState<TelegramGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [badgeInput, setBadgeInput] = useState('')

  const [form, setForm] = useState<Partial<TelegramGroup>>({
    name: '',
    members: undefined,
    membersText: '',
    imageUrl: '',
    ctaUrl: '',
    type: 'GROUP',
    isFeatured: false,
    badges: [],
  })
  const [saving, setSaving] = useState(false)
  // MediaPicker durumları
  const [mediaOpenForm, setMediaOpenForm] = useState(false)
  const [mediaOpenRowId, setMediaOpenRowId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) => i.name.toLowerCase().includes(q))
  }, [items, search])

  const featured = filtered.filter((i) => i.isFeatured)
  const listed = filtered.filter((i) => !i.isFeatured)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/telegram-groups')
      const json = await res.json()
      setItems(json ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Yükleme hatası')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function uploadImage(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error ?? 'Upload failed')
    return json.url as string
  }

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
        type: form.type ?? 'GROUP',
        isFeatured: !!form.isFeatured,
        badges: (form.badges ?? []).filter(Boolean),
      }
      const res = await fetch('/api/telegram-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? 'Kaydetme hatası')
      setForm({ name: '', members: undefined, membersText: '', imageUrl: '', ctaUrl: '', type: 'GROUP', isFeatured: false, badges: [] })
      await load()
    } catch (e: any) {
      setError(e?.message ?? 'Kaydetme hatası')
    } finally {
      setSaving(false)
    }
  }

  async function updateItem(id: string, patch: Partial<TelegramGroup>) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/telegram-groups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? 'Güncelleme hatası')
      await load()
    } catch (e: any) {
      setError(e?.message ?? 'Güncelleme hatası')
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Bu grubu silmek istediğinize emin misiniz?')) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/telegram-groups/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? 'Silme hatası')
      await load()
    } catch (e: any) {
      setError(e?.message ?? 'Silme hatası')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6 bg-background text-foreground">
      <h1 className="text-2xl font-semibold">Telegram Grupları (Admin)</h1>
      <p className="text-muted-foreground text-sm">Güvenilir Telegram kanal/grup yönetimi (listele, ekle, düzenle, sil).</p>

      {error && (
        <div className="rounded border border-destructive/30 bg-destructive/15 text-destructive px-3 py-2">{error}</div>
      )}

      {/* Ekleme Formu */}
      <div className="border border-border rounded-md p-4 space-y-3 bg-card text-foreground">
        <div className="font-medium">Yeni Grup Ekle</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="border border-border rounded-md px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground"
            placeholder="Grup adı"
            value={form.name ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="border border-border rounded-md px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground"
            placeholder="Telegram linki (ctaUrl)"
            value={form.ctaUrl ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
          />
          <input
            className="border border-border rounded-md px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground"
            placeholder="Üye sayısı"
            type="number"
            value={typeof form.members === 'number' ? form.members : ''}
            onChange={(e) => setForm((f) => ({ ...f, members: e.target.value ? Number(e.target.value) : undefined }))}
          />
          <input
            className="border border-border rounded-md px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground"
            placeholder="Üye (metin) örn: 15K+ üye"
            value={form.membersText ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, membersText: e.target.value }))}
          />
          <div className="flex items-center gap-3">
            <select
              className="border border-border rounded-md px-3 py-2 bg-background text-foreground"
              value={form.type ?? 'GROUP'}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'CHANNEL' | 'GROUP' }))}
            >
              <option value="GROUP">Grup</option>
              <option value="CHANNEL">Kanal</option>
            </select>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!form.isFeatured}
                onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
              />
              Önerilen
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              className="border border-border rounded-md px-3 py-2 flex-1 bg-background text-foreground placeholder:text-muted-foreground"
              placeholder="Profil resmi URL (imageUrl)"
              value={form.imageUrl ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            />
            {/* Dosya input yerine medya seçici */}
            <Button type="button" variant="outline" onClick={() => setMediaOpenForm(true)}>
              Görsel Seç / Yükle
            </Button>
            <MediaPicker
              open={mediaOpenForm}
              onOpenChange={setMediaOpenForm}
              onSelect={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
              title="Telegram Görseli Seç / Yükle"
            />
          </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Rozetler</div>
            <div className="flex flex-wrap items-center gap-2">
              {(form.badges ?? []).map((b, idx) => (
                <button
                  key={`${b}-${idx}`}
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs border border-border bg-background hover:bg-accent"
                  onClick={() => setForm((f) => ({ ...f, badges: (f.badges ?? []).filter((x) => x !== b) }))}
                  title="Rozeti kaldır"
                >
                  <span>{b}</span>
                  <span className="text-muted-foreground">×</span>
                </button>
              ))}
              <input
                className="border border-border rounded-md px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground min-w-[180px]"
                placeholder="Rozet ekle ve Enter/virgül"
                value={badgeInput}
                onChange={(e) => setBadgeInput(e.target.value)}
                onKeyDown={(e) => {
                  const isCommit = e.key === 'Enter' || e.key === ','
                  if (isCommit) {
                    e.preventDefault()
                    const token = badgeInput.trim()
                    if (token) setForm((f) => ({ ...f, badges: [ ...(f.badges ?? []), token ] }))
                    setBadgeInput('')
                  }
                }}
                onBlur={() => {
                  const token = badgeInput.trim()
                  if (token) setForm((f) => ({ ...f, badges: [ ...(f.badges ?? []), token ] }))
                  setBadgeInput('')
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground">Örnek: Güvenilir, Aktif, 7/24</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
            disabled={saving || !form.name || !form.ctaUrl}
            onClick={createItem}
          >Kaydet</button>
          <input
            className="border border-border rounded-md px-3 py-2 flex-1 bg-background text-foreground placeholder:text-muted-foreground"
            placeholder="Gruplarda ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div>
         {loading && <div className="text-sm text-muted-foreground">Yükleniyor…</div>}

        {featured.length > 0 && (
          <section className="space-y-3">
            <div className="font-medium">Önerilen Gruplar</div>
          <div className="overflow-auto border border-border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 py-2">Ad</th>
                  <th className="text-left px-3 py-2">Tip</th>
                  <th className="text-left px-3 py-2">Üye (sayı)</th>
                  <th className="text-left px-3 py-2">Üye (metin)</th>
                  <th className="text-left px-3 py-2">Link</th>
                  <th className="text-left px-3 py-2">Resim</th>
                  <th className="text-left px-3 py-2">Rozetler</th>
                  <th className="text-left px-3 py-2">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {featured.map((g) => (
                  <tr key={g.id} className="border-t border-border hover:bg-accent">
                    <td className="px-3 py-2">
                      <input
                        className="border border-border rounded-md px-2 py-1 w-full bg-background text-foreground placeholder:text-muted-foreground"
                        value={g.name}
                        onChange={(e) => updateItem(g.id, { name: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="border border-border rounded-md px-2 py-1 bg-background text-foreground"
                        value={g.type}
                        onChange={(e) => updateItem(g.id, { type: e.target.value as any })}
                      >
                        <option value="GROUP">Grup</option>
                        <option value="CHANNEL">Kanal</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="border border-border rounded-md px-2 py-1 w-24 bg-background text-foreground placeholder:text-muted-foreground"
                        type="number"
                        value={g.members ?? ''}
                        onChange={(e) => updateItem(g.id, { members: e.target.value ? Number(e.target.value) : null })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="border border-border rounded-md px-2 py-1 w-full bg-background text-foreground placeholder:text-muted-foreground"
                        placeholder="Üye (metin)"
                        value={g.membersText ?? ''}
                        onChange={(e) => updateItem(g.id, { membersText: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="border border-border rounded-md px-2 py-1 w-full bg-background text-foreground placeholder:text-muted-foreground"
                        value={g.ctaUrl}
                        onChange={(e) => updateItem(g.id, { ctaUrl: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <input
                          className="border border-border rounded-md px-2 py-1 flex-1 bg-background text-foreground placeholder:text-muted-foreground"
                          value={g.imageUrl ?? ''}
                          onChange={(e) => updateItem(g.id, { imageUrl: e.target.value || null })}
                        />
                        {/* Dosya inputu yerine medya seçici */}
                        <Button type="button" variant="outline" onClick={() => setMediaOpenRowId(g.id)}>
                          Görsel Seç / Yükle
                        </Button>
                        <MediaPicker
                          open={mediaOpenRowId === g.id}
                          onOpenChange={(v) => setMediaOpenRowId(v ? g.id : null)}
                          onSelect={async (url) => {
                            try {
                              await updateItem(g.id, { imageUrl: url })
                            } catch (e: any) {
                              setError(e?.message ?? 'Güncelleme hatası')
                            }
                          }}
                          title="Telegram Görseli Seç / Yükle"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {(g.badges ?? []).map((b, idx) => (
                          <button
                            key={`${g.id}-b-${idx}`}
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border border-border bg-background hover:bg-accent"
                            onClick={() => updateItem(g.id, { badges: (g.badges ?? []).filter((x) => x !== b) as any })}
                            title="Rozeti kaldır"
                          >
                            <span>{b}</span>
                            <span className="text-muted-foreground">×</span>
                          </button>
                        ))}
                        <input
                          className="border border-border rounded-md px-2 py-1 bg-background text-foreground placeholder:text-muted-foreground min-w-[120px]"
                          placeholder="Rozet ekle"
                          onKeyDown={(e) => {
                            const el = e.currentTarget as HTMLInputElement
                            const isCommit = e.key === 'Enter' || e.key === ','
                            if (isCommit) {
                              e.preventDefault()
                              const token = el.value.trim()
                              if (token) updateItem(g.id, { badges: [ ...(g.badges ?? []), token ] as any })
                              el.value = ''
                            }
                          }}
                          onBlur={(e) => {
                            const token = e.currentTarget.value.trim()
                            if (token) updateItem(g.id, { badges: [ ...(g.badges ?? []), token ] as any })
                            e.currentTarget.value = ''
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={g.isFeatured}
                            onChange={(e) => updateItem(g.id, { isFeatured: e.target.checked })}
                          />
                          Önerilen
                        </label>
                        <button
                          className="px-2 py-1 rounded-md border border-destructive/30 hover:bg-destructive/15 text-destructive text-xs"
                          onClick={() => deleteItem(g.id)}
                        >Sil</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {featured.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-muted-foreground">Önerilen grup bulunamadı.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        )}

        <section className="space-y-3">
          <div className="font-medium">Tüm Gruplar</div>
          <div className="overflow-auto border border-border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 py-2">Ad</th>
                  <th className="text-left px-3 py-2">Tip</th>
                  <th className="text-left px-3 py-2">Üye (sayı)</th>
                  <th className="text-left px-3 py-2">Üye (metin)</th>
                  <th className="text-left px-3 py-2">Link</th>
                  <th className="text-left px-3 py-2">Resim</th>
                  <th className="text-left px-3 py-2">Rozetler</th>
                  <th className="text-left px-3 py-2">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {listed.map((g) => (
                  <tr key={g.id} className="border-t border-border hover:bg-accent">
                    <td className="px-3 py-2">
                      <input
                        className="border border-border rounded-md px-2 py-1 w-full bg-background text-foreground placeholder:text-muted-foreground"
                        value={g.name}
                        onChange={(e) => updateItem(g.id, { name: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="border border-border rounded-md px-2 py-1 bg-background text-foreground"
                        value={g.type}
                        onChange={(e) => updateItem(g.id, { type: e.target.value as any })}
                      >
                        <option value="GROUP">Grup</option>
                        <option value="CHANNEL">Kanal</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="border border-border rounded-md px-2 py-1 w-24 bg-background text-foreground placeholder:text-muted-foreground"
                        type="number"
                        value={g.members ?? ''}
                        onChange={(e) => updateItem(g.id, { members: e.target.value ? Number(e.target.value) : null })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="border border-border rounded-md px-2 py-1 w-full bg-background text-foreground placeholder:text-muted-foreground"
                        placeholder="Üye (metin)"
                        value={g.membersText ?? ''}
                        onChange={(e) => updateItem(g.id, { membersText: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="border border-border rounded-md px-2 py-1 w-full bg-background text-foreground placeholder:text-muted-foreground"
                        value={g.ctaUrl}
                        onChange={(e) => updateItem(g.id, { ctaUrl: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <input
                          className="border border-border rounded-md px-2 py-1 flex-1 bg-background text-foreground placeholder:text-muted-foreground"
                          value={g.imageUrl ?? ''}
                          onChange={(e) => updateItem(g.id, { imageUrl: e.target.value || null })}
                        />
                        {/* Dosya inputu yerine medya seçici */}
                        <Button type="button" variant="outline" onClick={() => setMediaOpenRowId(g.id)}>
                          Görsel Seç / Yükle
                        </Button>
                        <MediaPicker
                          open={mediaOpenRowId === g.id}
                          onOpenChange={(v) => setMediaOpenRowId(v ? g.id : null)}
                          onSelect={async (url) => {
                            try {
                              await updateItem(g.id, { imageUrl: url })
                            } catch (e: any) {
                              setError(e?.message ?? 'Güncelleme hatası')
                            }
                          }}
                          title="Telegram Görseli Seç / Yükle"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {(g.badges ?? []).map((b, idx) => (
                          <button
                            key={`${g.id}-lb-${idx}`}
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border border-border bg-background hover:bg-accent"
                            onClick={() => updateItem(g.id, { badges: (g.badges ?? []).filter((x) => x !== b) as any })}
                            title="Rozeti kaldır"
                          >
                            <span>{b}</span>
                            <span className="text-muted-foreground">×</span>
                          </button>
                        ))}
                        <input
                          className="border border-border rounded-md px-2 py-1 bg-background text-foreground placeholder:text-muted-foreground min-w-[120px]"
                          placeholder="Rozet ekle"
                          onKeyDown={(e) => {
                            const el = e.currentTarget as HTMLInputElement
                            const isCommit = e.key === 'Enter' || e.key === ','
                            if (isCommit) {
                              e.preventDefault()
                              const token = el.value.trim()
                              if (token) updateItem(g.id, { badges: [ ...(g.badges ?? []), token ] as any })
                              el.value = ''
                            }
                          }}
                          onBlur={(e) => {
                            const token = e.currentTarget.value.trim()
                            if (token) updateItem(g.id, { badges: [ ...(g.badges ?? []), token ] as any })
                            e.currentTarget.value = ''
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={g.isFeatured}
                            onChange={(e) => updateItem(g.id, { isFeatured: e.target.checked })}
                          />
                          Önerilen
                        </label>
                        <button
                          className="px-2 py-1 rounded-md border border-destructive/30 hover:bg-destructive/15 text-destructive text-xs"
                          onClick={() => deleteItem(g.id)}
                        >Sil</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {listed.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-muted-foreground">Listede grup yok.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      )}
    </div>
  )
}