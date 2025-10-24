"use client"
import { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MediaPicker } from '@/components/media/MediaPicker'
import { useToast } from '@/hooks/use-toast'

export type BrandManagerItem = {
  id: string
  loginId: string
  name?: string | null
  brandId: string
  createdAt: string
  updatedAt: string
  brand?: { id: string; name: string; slug: string; logoUrl?: string | null; siteUrl?: string | null }
}

export default function BrandManagersSection() {
  const { toast } = useToast()
  const [items, setItems] = useState<BrandManagerItem[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [q, setQ] = useState('')

  const [brandName, setBrandName] = useState('')
  const [brandLogoUrl, setBrandLogoUrl] = useState('')
  const [brandSiteUrl, setBrandSiteUrl] = useState('')
  const [managerLoginId, setManagerLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [managerName, setManagerName] = useState('')
  const [mediaOpen, setMediaOpen] = useState(false)

  const [resetId, setResetId] = useState<string | null>(null)
  const [resetPassword, setResetPassword] = useState('')

  type EditState = { name: string; logoUrl: string | null; siteUrl: string | null; open: boolean; saving?: boolean }
  const [edits, setEdits] = useState<Record<string, EditState>>({})

  async function load(params?: { page?: number; limit?: number; q?: string }) {
    try {
      setLoading(true)
      const curPage = params?.page ?? page
      const curLimit = params?.limit ?? limit
      const curQ = params?.q ?? q
      const usp = new URLSearchParams()
      usp.set('page', String(curPage))
      usp.set('limit', String(curLimit))
      if (curQ.trim()) usp.set('q', curQ.trim())
      const res = await fetch(`/api/admin/brand-managers?${usp.toString()}`)
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Yükleme hatası')
      setItems(data.items || [])
      setTotal(Number(data.total || 0))
      setPage(Number(data.page || 1))
      // init edits for brands
      const next: Record<string, EditState> = {}
      for (const it of data.items || []) {
        if (it.brand) {
          next[it.brand.id] = {
            name: it.brand.name || '',
            logoUrl: it.brand.logoUrl ?? null,
            siteUrl: it.brand.siteUrl ?? null,
            open: false,
          }
        }
      }
      setEdits(next)
    } catch (e: any) {
      toast({ title: 'Hata', description: e?.message || 'Yükleme başarısız', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Debounce search
  const debouncedQ = useMemo(() => q, [q])
  useEffect(() => {
    const t = setTimeout(() => { load({ page: 1, q: debouncedQ }) }, 300)
    return () => clearTimeout(t)
  }, [debouncedQ])

  async function createManager(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload = {
        brandName: brandName.trim(),
        brandLogoUrl: brandLogoUrl.trim() || undefined,
        brandSiteUrl: brandSiteUrl.trim() || undefined,
        managerLoginId: managerLoginId.trim(),
        password,
        managerName: managerName.trim() || undefined,
      }
      const res = await fetch('/api/admin/brand-managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Ekleme hatası')
      setBrandName('')
      setBrandLogoUrl('')
      setBrandSiteUrl('')
      setManagerLoginId('')
      setPassword('')
      setManagerName('')
      toast({ title: 'Başarılı', description: 'Marka yöneticisi oluşturuldu' })
      await load()
    } catch (e: any) {
      toast({ title: 'Hata', description: e?.message || 'Ekleme başarısız', variant: 'destructive' })
    }
  }

  async function deleteManager(id: string) {
    if (!confirm('Bu marka yöneticisini silmek istediğinize emin misiniz?')) return
    try {
      const res = await fetch(`/api/admin/brand-managers/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Silme hatası')
      toast({ title: 'Silindi', description: 'Marka yöneticisi silindi' })
      setItems((arr) => arr.filter((x) => x.id !== id))
    } catch (e: any) {
      toast({ title: 'Hata', description: e?.message || 'Silme başarısız', variant: 'destructive' })
    }
  }

  async function applyPasswordReset() {
    if (!resetId || !resetPassword) return
    try {
      const res = await fetch(`/api/admin/brand-managers/${resetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPassword }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Şifre güncelleme hatası')
      toast({ title: 'Güncellendi', description: 'Şifre sıfırlandı' })
      setResetId(null)
      setResetPassword('')
      await load()
    } catch (e: any) {
      toast({ title: 'Hata', description: e?.message || 'Güncelleme başarısız', variant: 'destructive' })
    }
  }

  async function saveBrand(brandId: string) {
    const edit = edits[brandId]
    if (!edit) return
    try {
      setEdits((m) => ({ ...m, [brandId]: { ...edit, saving: true } }))
      const res = await fetch(`/api/admin/review-brands/${brandId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: edit.name, logoUrl: edit.logoUrl ?? undefined, siteUrl: edit.siteUrl ?? undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Marka güncelleme hatası')
      toast({ title: 'Güncellendi', description: 'Marka bilgileri güncellendi' })
      // reflect changes in list
      setItems((arr) => arr.map((x) => x.brand && x.brand.id === brandId ? ({ ...x, brand: { ...x.brand, name: edit.name, logoUrl: edit.logoUrl, siteUrl: edit.siteUrl ?? null } }) : x))
    } catch (e: any) {
      toast({ title: 'Hata', description: e?.message || 'Güncelleme başarısız', variant: 'destructive' })
    } finally {
      setEdits((m) => ({ ...m, [brandId]: { ...m[brandId], saving: false } }))
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-xl font-semibold">Marka Yöneticileri</h2>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Marka Yöneticisi Oluştur</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createManager} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm mb-1 block">Marka Adı</label>
              <Input value={brandName} onChange={(e)=>setBrandName(e.target.value)} placeholder="Örn: OrnekBet" />
            </div>
            <div>
              <label className="text-sm mb-1 block">Marka Logosu (URL)</label>
              <div className="flex items-center gap-2">
                <Input value={brandLogoUrl} onChange={(e)=>setBrandLogoUrl(e.target.value)} placeholder="https://..." />
                <Button type="button" variant="outline" onClick={()=>setMediaOpen(true)}>Görsel Seç / Yükle</Button>
              </div>
              <MediaPicker open={mediaOpen} onOpenChange={setMediaOpen} onSelect={(url)=>setBrandLogoUrl(url)} title="Marka Logosu Seç / Yükle" />
            </div>
            <div>
              <label className="text-sm mb-1 block">Site URL (opsiyonel)</label>
              <Input value={brandSiteUrl} onChange={(e)=>setBrandSiteUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm mb-1 block">Yönetici Kullanıcı Adı</label>
              <Input value={managerLoginId} onChange={(e)=>setManagerLoginId(e.target.value)} placeholder="Örn: ornekbet-admin" />
            </div>
            <div>
              <label className="text-sm mb-1 block">Şifre</label>
              <Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Güçlü bir şifre" />
            </div>
            <div>
              <label className="text-sm mb-1 block">Yönetici Adı (opsiyonel)</label>
              <Input value={managerName} onChange={(e)=>setManagerName(e.target.value)} placeholder="Örn: Ali Veli" />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <Button type="submit">Oluştur</Button>
              <a href="/brand/login" className="text-sm underline">Marka paneli giriş sayfasını aç</a>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mevcut Yöneticiler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Ara: marka adı, login, slug…" className="w-full md:w-80" />
          </div>
          {loading ? (
            <div>Yükleniyor...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Marka</th>
                    <th className="p-2">Login ID</th>
                    <th className="p-2">Ad</th>
                    <th className="p-2">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-t align-top">
                      <td className="p-2">
                        <div className="flex items-start gap-3">
                          {it.brand?.logoUrl ? (
                            <img src={it.brand.logoUrl} alt={it.brand?.name || ''} className="w-10 h-10 object-contain border rounded" />
                          ) : (
                            <div className="w-10 h-10 border rounded bg-muted" />
                          )}
                          <div className="space-y-2 w-full max-w-xl">
                            <div className="text-xs text-muted-foreground">Slug: {it.brand?.slug}</div>
                            {it.brand && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div>
                                  <label className="text-xs mb-1 block">Marka Adı</label>
                                  <Input value={edits[it.brand.id]?.name ?? ''} onChange={(e)=>setEdits((m)=>({ ...m, [it.brand!.id]: { ...m[it.brand!.id], name: e.target.value, logoUrl: m[it.brand!.id]?.logoUrl ?? it.brand!.logoUrl ?? null, siteUrl: m[it.brand!.id]?.siteUrl ?? it.brand!.siteUrl ?? null, open: m[it.brand!.id]?.open ?? false } }))} />
                                </div>
                                <div>
                                  <label className="text-xs mb-1 block">Site URL</label>
                                  <Input value={edits[it.brand.id]?.siteUrl ?? ''} onChange={(e)=>setEdits((m)=>({ ...m, [it.brand!.id]: { ...m[it.brand!.id], siteUrl: e.target.value, name: m[it.brand!.id]?.name ?? it.brand!.name, logoUrl: m[it.brand!.id]?.logoUrl ?? it.brand!.logoUrl ?? null, open: m[it.brand!.id]?.open ?? false } }))} placeholder="https://..." />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="text-xs mb-1 block">Logo</label>
                                  <div className="flex items-center gap-2">
                                    <Input value={edits[it.brand.id]?.logoUrl ?? ''} onChange={(e)=>setEdits((m)=>({ ...m, [it.brand!.id]: { ...m[it.brand!.id], logoUrl: e.target.value || null, name: m[it.brand!.id]?.name ?? it.brand!.name, siteUrl: m[it.brand!.id]?.siteUrl ?? it.brand!.siteUrl ?? null, open: m[it.brand!.id]?.open ?? false } }))} placeholder="https://..." />
                                    <Button type="button" variant="outline" size="sm" onClick={()=>setEdits((m)=>({ ...m, [it.brand!.id]: { ...m[it.brand!.id], open: true, name: m[it.brand!.id]?.name ?? it.brand!.name, logoUrl: m[it.brand!.id]?.logoUrl ?? it.brand!.logoUrl ?? null, siteUrl: m[it.brand!.id]?.siteUrl ?? it.brand!.siteUrl ?? null } }))}>Görsel Seç</Button>
                                  </div>
                                  <MediaPicker open={!!edits[it.brand.id]?.open} onOpenChange={(open)=>setEdits((m)=>({ ...m, [it.brand!.id]: { ...m[it.brand!.id], open, name: m[it.brand!.id]?.name ?? it.brand!.name, logoUrl: m[it.brand!.id]?.logoUrl ?? it.brand!.logoUrl ?? null, siteUrl: m[it.brand!.id]?.siteUrl ?? it.brand!.siteUrl ?? null } }))} onSelect={(url)=>setEdits((m)=>({ ...m, [it.brand!.id]: { ...m[it.brand!.id], logoUrl: url, name: m[it.brand!.id]?.name ?? it.brand!.name, siteUrl: m[it.brand!.id]?.siteUrl ?? it.brand!.siteUrl ?? null } }))} title={`Logo Seç / Yükle: ${it.brand?.name ?? ''}`} />
                                </div>
                                <div className="md:col-span-2 flex items-center gap-2">
                                  <Button size="sm" onClick={()=>it.brand && saveBrand(it.brand.id)} disabled={!!edits[it.brand?.id]?.saving}>Kaydet</Button>
                                  <Button size="sm" variant="outline" onClick={()=>it.brand && setEdits((m)=>({ ...m, [it.brand!.id]: { name: it.brand!.name, logoUrl: it.brand!.logoUrl ?? null, siteUrl: it.brand!.siteUrl ?? null, open: false } }))}>Sıfırla</Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-2 font-mono">{it.loginId}</td>
                      <td className="p-2">{it.name || '-'}</td>
                      <td className="p-2 space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setResetId(it.id)}>Şifre Sıfırla</Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteManager(it.id)}>Sil</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && (
                <div className="text-sm text-muted-foreground py-4">Kayıtlı marka yöneticisi bulunmuyor.</div>
              )}
            </div>
          )}

          {resetId && (
            <div className="mt-4 border rounded-md p-4 space-y-2">
              <div className="font-medium">Şifre Sıfırla</div>
              <Input type="password" value={resetPassword} onChange={(e)=>setResetPassword(e.target.value)} placeholder="Yeni şifre" />
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={()=>{setResetId(null); setResetPassword('')}}>Vazgeç</Button>
                <Button onClick={applyPasswordReset}>Kaydet</Button>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 justify-end">
            <Button size="sm" variant="outline" disabled={page<=1} onClick={()=>{ const np = Math.max(1, page-1); setPage(np); load({ page: np }) }}>Önceki</Button>
            <div className="text-sm">Sayfa {page} / {pageCount}</div>
            <Button size="sm" variant="outline" disabled={page>=pageCount} onClick={()=>{ const np = Math.min(pageCount, page+1); setPage(np); load({ page: np }) }}>Sonraki</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}