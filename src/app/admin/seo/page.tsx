"use client"
import { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

type SeoSetting = {
  id: string
  page: string
  title?: string | null
  description?: string | null
  keywords?: string | null
  canonicalUrl?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  ogImageUrl?: string | null
  twitterTitle?: string | null
  twitterDescription?: string | null
  twitterImageUrl?: string | null
  robotsIndex: boolean
  robotsFollow: boolean
  structuredData?: any | null
  createdAt?: string
  updatedAt?: string
}

const emptyForm: Omit<SeoSetting, 'id'> = {
  page: '',
  title: '',
  description: '',
  keywords: '',
  canonicalUrl: '',
  ogTitle: '',
  ogDescription: '',
  ogImageUrl: '',
  twitterTitle: '',
  twitterDescription: '',
  twitterImageUrl: '',
  robotsIndex: true,
  robotsFollow: true,
  structuredData: null,
}

export default function AdminSeoPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<SeoSetting[]>([])
  const [routes, setRoutes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<SeoSetting, 'id'>>(emptyForm)
  const [clientOrigin, setClientOrigin] = useState<string>('')

  const editingItem = useMemo(() => items.find(i => i.id === editingId) ?? null, [items, editingId])

  // Preview values computed from selected `form.page`
  const canonicalPreview = useMemo(() => {
    const pagePath = (form.page || '/').startsWith('/') ? (form.page || '/') : `/${form.page || ''}`
    if (!clientOrigin) return ''
    return `${clientOrigin}${pagePath}`
  }, [clientOrigin, form.page])

  const breadcrumbPreviewJSON = useMemo(() => {
    try {
      const pagePath = (form.page || '/').startsWith('/') ? (form.page || '/') : `/${form.page || ''}`
      const segs = pagePath.split('/').filter(Boolean)
      const itemListElement = segs.map((seg, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        item: clientOrigin ? `${clientOrigin}/${segs.slice(0, idx + 1).join('/')}` : `/${segs.slice(0, idx + 1).join('/')}`,
      }))
      const obj = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement }
      return JSON.stringify(obj, null, 2)
    } catch {
      return ''
    }
  }, [clientOrigin, form.page])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/seo')
        const data = await res.json()
        setItems(Array.isArray(data) ? data : [])
      } catch (e: any) {
        setError(e?.message ?? 'Yükleme hatası')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const loadPages = async () => {
      try {
        const res = await fetch('/api/pages')
        const data = await res.json()
        setRoutes(Array.isArray(data) ? data : [])
      } catch (e: any) {
        // Sessiz geç: sayfa listesi olmadan da form çalışır
      }
    }
    loadPages()
    if (typeof window !== 'undefined') {
      setClientOrigin(window.location.origin)
    }
  }, [])

  useEffect(() => {
    if (editingItem) {
      setForm({
        page: editingItem.page ?? '',
        title: editingItem.title ?? '',
        description: editingItem.description ?? '',
        keywords: editingItem.keywords ?? '',
        canonicalUrl: editingItem.canonicalUrl ?? '',
        ogTitle: editingItem.ogTitle ?? '',
        ogDescription: editingItem.ogDescription ?? '',
        ogImageUrl: editingItem.ogImageUrl ?? '',
        twitterTitle: editingItem.twitterTitle ?? '',
        twitterDescription: editingItem.twitterDescription ?? '',
        twitterImageUrl: editingItem.twitterImageUrl ?? '',
        robotsIndex: editingItem.robotsIndex,
        robotsFollow: editingItem.robotsFollow,
        structuredData: editingItem.structuredData ?? null,
      })
    } else {
      setForm(emptyForm)
    }
  }, [editingItem])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const loadPageSeo = async (value: string) => {
    setForm(prev => ({ ...prev, page: value }))
    if (!value) return
    try {
      const res = await fetch(`/api/seo?page=${encodeURIComponent(value)}`)
      const data = await res.json()
      if (data && data.id) {
        setEditingId(data.id)
        setForm({
          page: data.page ?? '',
          title: data.title ?? '',
          description: data.description ?? '',
          keywords: data.keywords ?? '',
          canonicalUrl: data.canonicalUrl ?? '',
          ogTitle: data.ogTitle ?? '',
          ogDescription: data.ogDescription ?? '',
          ogImageUrl: data.ogImageUrl ?? '',
          twitterTitle: data.twitterTitle ?? '',
          twitterDescription: data.twitterDescription ?? '',
          twitterImageUrl: data.twitterImageUrl ?? '',
          robotsIndex: !!data.robotsIndex,
          robotsFollow: !!data.robotsFollow,
          structuredData: data.structuredData ?? null,
        })
      } else {
        setEditingId(null)
        setForm(prev => ({ ...emptyForm, page: value }))
      }
    } catch (err: any) {
      setEditingId(null)
      setForm(prev => ({ ...emptyForm, page: value }))
    }
  }

  const handlePageSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    await loadPageSeo(value)
  }

  const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setForm(prev => ({ ...prev, [name]: checked }))
  }

  const handleStructuredDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target
    try {
      const parsed = value ? JSON.parse(value) : null
      setForm(prev => ({ ...prev, structuredData: parsed }))
      setError(null)
    } catch (err: any) {
      setError('StructuredData JSON geçersiz: ' + (err?.message ?? ''))
    }
  }

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = { ...form }
      const res = await fetch(editingId ? `/api/seo/${editingId}` : '/api/seo', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Kaydetme hatası')
      // Refresh list
      const listRes = await fetch('/api/seo')
      const listData = await listRes.json()
      setItems(Array.isArray(listData) ? listData : [])
      setEditingId(null)
      setForm(emptyForm)
      toast({ title: 'SEO kaydı başarıyla kaydedildi', description: 'Değişiklikler frontend sayfalara yansıtıldı.' })
    } catch (e: any) {
      setError(e?.message ?? 'Kaydetme hatası')
      toast({ title: 'Kaydetme hatası', description: e?.message ?? 'Lütfen alanları kontrol edin.', variant: 'destructive' as any })
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Bu SEO kaydını silmek istediğine emin misin?')) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/seo/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Silme hatası')
      setItems(prev => prev.filter(i => i.id !== id))
      if (editingId === id) {
        setEditingId(null)
        setForm(emptyForm)
      }
    } catch (e: any) {
      setError(e?.message ?? 'Silme hatası')
    } finally {
      setLoading(false)
    }
  }

  // hydration uyarısını engellemek için clientOrigin + suppressHydrationWarning kullanılır

  return (
    <div className="p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Genel SEO Ayarları</h1>
        <div className="text-sm text-gray-500">Ana sayfa dahil tüm sayfalar</div>
      </header>

      {error && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2">{error}</div>
      )}

      {/* Otomatik ayarlar bilgilendirme */}
      <section className="border rounded p-4 bg-muted/30 text-sm space-y-2">
        <div className="font-medium">Otomatik SEO Yardımcıları</div>
        <ul className="list-disc pl-5 space-y-1">
          <li>Canonical: URL'den otomatik üretilir (<span suppressHydrationWarning>{clientOrigin}</span>)</li>
          <li>Breadcrumb Schema: URL segmentlerinden JSON-LD olarak &lt;head&gt; içine eklenir</li>
          <li>OG/Twitter: Canonical ve aşağıdaki sayfa özel alanlarıyla güncellenir</li>
        </ul>
        <div className="text-xs text-gray-500">İstersen sayfa bazlı canonical/OG/Twitter alanlarını aşağıdan manuel olarak override edebilirsin.</div>
      </section>

      {/* Otomatik Canonical / Breadcrumb Önizleme */}
      <section className="border rounded p-4 bg-muted/30 text-sm space-y-3">
        <div className="font-medium">Otomatik Canonical &amp; Breadcrumb Önizleme</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Seçili Sayfa</div>
            <div className="rounded border p-2 bg-white/5">
              <div className="text-xs text-gray-500">Canonical (otomatik):</div>
              <div className="text-sm font-mono break-all"><span suppressHydrationWarning>{canonicalPreview || '(tarayıcıda hesaplanır)'}</span></div>
              {editingItem?.canonicalUrl && (
                <div className="mt-2 text-xs text-yellow-600">Override: {editingItem.canonicalUrl}</div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Breadcrumb JSON-LD</div>
            <pre className="rounded border p-2 bg-white/5 text-xs overflow-auto max-h-48"><code>{breadcrumbPreviewJSON || '// tarayıcıda hesaplanır'}</code></pre>
          </div>
        </div>
        <div className="text-xs text-gray-500">Etkin değerler sayfa yüklenince SeoAutoInjector tarafından &lt;head&gt; içine eklenir.</div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* WordPress benzeri: Tüm sayfaları listele ve düzenle */}
          <div className="overflow-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2">Sayfa (Route)</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{r}</td>
                  </tr>
                ))}
                {routes.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-gray-500" colSpan={1}>Sayfa listesi yüklenemedi veya henüz yok.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="border rounded p-4 space-y-4">
            <h2 className="font-medium">{editingId ? 'SEO Kaydını Düzenle' : 'Yeni SEO Kaydı Ekle'}</h2>
            <div className="space-y-3">
              <label className="block text-sm">Sayfa Seç
                <select name="page" value={form.page} onChange={handlePageSelect} className="mt-1 w-full border rounded px-3 py-2">
                  <option value="">Bir sayfa seçiniz</option>
                  {routes.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              <div className="text-xs text-gray-500">Listede olmayan özel bir rota kullanıyorsan, aşağıdan el ile girerek kaydedebilirsin.</div>
              <label className="block text-sm">Özel Sayfa
                <input name="page" value={form.page} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" placeholder="/ozel-sayfa" />
              </label>
              <label className="block text-sm">Title
                <input name="title" value={form.title ?? ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
              </label>
              <label className="block text-sm">Description
                <textarea name="description" value={form.description ?? ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2 h-24" />
              </label>
              <label className="block text-sm">Keywords (virgülle)
                <input name="keywords" value={form.keywords ?? ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" placeholder="casino, bonus, bahis" />
              </label>
              <label className="block text-sm">Canonical URL
                <input name="canonicalUrl" value={form.canonicalUrl ?? ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" placeholder="https://site.com/" />
              </label>
              <div className="grid grid-cols-1 gap-3">
                <label className="block text-sm">OG Title
                  <input name="ogTitle" value={form.ogTitle ?? ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
                </label>
                <label className="block text-sm">OG Description
                  <textarea name="ogDescription" value={form.ogDescription ?? ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2 h-20" />
                </label>
                <label className="block text-sm">OG Image URL
                  <input name="ogImageUrl" value={form.ogImageUrl ?? ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <label className="block text-sm">Twitter Title
                  <input name="twitterTitle" value={form.twitterTitle ?? ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
                </label>
                <label className="block text-sm">Twitter Description
                  <textarea name="twitterDescription" value={form.twitterDescription ?? ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2 h-20" />
                </label>
                <label className="block text-sm">Twitter Image URL
                  <input name="twitterImageUrl" value={form.twitterImageUrl ?? ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
                </label>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="robotsIndex" checked={form.robotsIndex} onChange={handleBooleanChange} />
                  Robots Index
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="robotsFollow" checked={form.robotsFollow} onChange={handleBooleanChange} />
                  Robots Follow
                </label>
              </div>
              <label className="block text-sm">Structured Data (JSON-LD)
                <textarea defaultValue={form.structuredData ? JSON.stringify(form.structuredData, null, 2) : ''} onChange={handleStructuredDataChange} className="mt-1 w-full border rounded px-3 py-2 h-28" placeholder='{"@context":"https://schema.org","@type":"WebSite"}' />
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <button disabled={loading} onClick={submit} className="px-3 py-2 rounded bg-green-600 text-white disabled:opacity-50 flex items-center gap-2">
                {loading && <span className="inline-block w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />}
                {editingId ? 'Güncelle' : 'Kaydet'}
              </button>
              {editingId && (
                <button disabled={loading} onClick={() => { setEditingId(null); setForm(emptyForm); }} className="px-3 py-2 rounded bg-gray-200">İptal</button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="text-sm text-gray-500">
        Öneri: Ana sayfa için `page` alanını `/` olarak gir.
      </section>
    </div>
  )
}