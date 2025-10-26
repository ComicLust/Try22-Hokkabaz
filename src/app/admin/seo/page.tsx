"use client"
import { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MediaPicker } from '@/components/media/MediaPicker'

type SeoSetting = {
  id: string
  page: string
  title?: string | null
  description?: string | null
  keywords?: string | null
  canonicalUrl?: string | null
  ogType?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  ogImageUrl?: string | null
  ogLogoUrl?: string | null
  twitterTitle?: string | null
  twitterDescription?: string | null
  twitterImageUrl?: string | null
  robotsIndex: boolean
  robotsFollow: boolean
  structuredData?: any | null
  createdAt?: string
  updatedAt?: string
}

type OrganizationSchema = {
  name: string
  url: string
  logo: string
  image: string
}

const emptyForm: Omit<SeoSetting, 'id'> = {
  page: '',
  title: '',
  description: '',
  keywords: '',
  canonicalUrl: '',
  ogType: '',
  ogTitle: '',
  ogDescription: '',
  ogImageUrl: '',
  ogLogoUrl: '',
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
  const [mediaOpenOg, setMediaOpenOg] = useState(false)
  const [mediaOpenOgLogo, setMediaOpenOgLogo] = useState(false)
  const [mediaOpenTwitter, setMediaOpenTwitter] = useState(false)
  
  // Organization schema state
  const [orgSchema, setOrgSchema] = useState<OrganizationSchema>({
    name: 'Hokkabaz',
    url: 'https://hokkabaz.net',
    logo: 'https://hokkabaz.net/logo.svg',
    image: 'https://hokkabaz.net/uploads/1760732951329-fzch33159aq.jpg'
  })
  const [orgLoading, setOrgLoading] = useState(false)
  const [mediaOpenOrgLogo, setMediaOpenOrgLogo] = useState(false)
  const [mediaOpenOrgImage, setMediaOpenOrgImage] = useState(false)

  // Slug taşıma state
  const [fromSlug, setFromSlug] = useState('anlasmali-siteler')
  const [toSlug, setToSlug] = useState('guvenilir-bahis-siteleri-listesi')
  const [migrating, setMigrating] = useState(false)

  const reloadSeoItems = async () => {
    try {
      const res = await fetch('/api/seo')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch {}
  }

  const migrateSlug = async () => {
    if (!fromSlug.trim() || !toSlug.trim()) {
      toast({ title: 'Hata', description: 'Her iki slug da zorunlu', variant: 'destructive' })
      return
    }
    setMigrating(true)
    try {
      const res = await fetch('/api/admin/seo/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromSlug: fromSlug.trim(), toSlug: toSlug.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Taşıma hatası')
      toast({ title: 'Slug Taşındı', description: `İşlem: ${data.action}` })
      // Kayıt listesini tazele
      try { await reloadSeoItems() } catch {}
    } catch (e: any) {
      toast({ title: 'Hata', description: e?.message || 'Taşıma başarısız', variant: 'destructive' })
    } finally {
      setMigrating(false)
    }
  }

  // --- Görsel Uyarı Yardımcıları ---
  type ImageAudit = { absoluteUrl: string, width?: number, height?: number, ratio?: number, ext?: string, warnings: string[] }
  const toAbsolute = (url?: string | null) => {
    const u = (url || '').trim()
    if (!u) return ''
    if (/^https?:\/\//i.test(u)) return u
    const path = u.startsWith('/') ? u : `/${u}`
    return clientOrigin ? `${clientOrigin}${path}` : path
  }
  const inferExt = (u: string) => {
    const clean = (u || '').split('?')[0].toLowerCase()
    const m = clean.match(/\.([a-z0-9]+)$/)
    return m?.[1]
  }
  const loadDims = (abs: string): Promise<{ width?: number, height?: number }> => new Promise((resolve) => {
    if (!abs) return resolve({})
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({})
    img.src = abs
  })
  const auditImage = async (url: string | null | undefined, kind: 'og' | 'twitter'): Promise<ImageAudit | null> => {
    const absoluteUrl = toAbsolute(url)
    if (!absoluteUrl) return null
    const { width, height } = await loadDims(absoluteUrl)
    const ratio = (width && height && height > 0) ? (width / height) : undefined
    const ext = inferExt(absoluteUrl)
    const warnings: string[] = []
    const allowed = ['jpg', 'jpeg', 'png', 'webp']
    if (ext && !allowed.includes(ext)) warnings.push('Tür önerisi: jpg/png/webp kullanın.')
    if (!ext) warnings.push('Tür tespit edilemedi: URL uzantısı yok gibi görünüyor.')
    if (ratio) {
      const diff = Math.abs(ratio - 1.91)
      if (diff > 0.1) warnings.push('Önerilen oran ~1.91:1 (Facebook/Twitter paylaşımları için).')
    }
    if (kind === 'og') {
      if ((width ?? 0) < 1200 || (height ?? 0) < 630) warnings.push('OG için önerilen minimum: 1200x630 piksel.')
    } else {
      if ((width ?? 0) < 600 || (height ?? 0) < 335) warnings.push('Twitter için önerilen minimum: 600x335 piksel.')
    }
    return { absoluteUrl, width, height, ratio, ext, warnings }
  }
  const [ogAudit, setOgAudit] = useState<ImageAudit | null>(null)
  const [twAudit, setTwAudit] = useState<ImageAudit | null>(null)

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
    loadOrganizationSchema()
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
        ogType: editingItem.ogType ?? '',
        ogTitle: editingItem.ogTitle ?? '',
        ogDescription: editingItem.ogDescription ?? '',
        ogImageUrl: editingItem.ogImageUrl ?? '',
        ogLogoUrl: editingItem.ogLogoUrl ?? '',
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

  // Görsel oran/tür uyarılarını hesapla
  useEffect(() => {
    (async () => {
      if (form.ogImageUrl) {
        const a = await auditImage(form.ogImageUrl, 'og')
        setOgAudit(a)
      } else {
        setOgAudit(null)
      }
    })()
  }, [form.ogImageUrl, clientOrigin])
  useEffect(() => {
    (async () => {
      if (form.twitterImageUrl) {
        const a = await auditImage(form.twitterImageUrl, 'twitter')
        setTwAudit(a)
      } else {
        setTwAudit(null)
      }
    })()
  }, [form.twitterImageUrl, clientOrigin])

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
          ogType: data.ogType ?? '',
          ogTitle: data.ogTitle ?? '',
          ogDescription: data.ogDescription ?? '',
          ogImageUrl: data.ogImageUrl ?? '',
          ogLogoUrl: data.ogLogoUrl ?? '',
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

  // Organization schema functions
  const loadOrganizationSchema = async () => {
    try {
      const res = await fetch('/api/seo?page=__organization__')
      const data = await res.json()
      if (data && data.structuredData) {
        const org = data.structuredData
        setOrgSchema({
          name: org.name || 'Hokkabaz',
          url: org.url || 'https://hokkabaz.net',
          logo: org.logo || 'https://hokkabaz.net/logo.svg',
          image: org.image || 'https://hokkabaz.net/uploads/1760732951329-fzch33159aq.jpg'
        })
      }
    } catch (err) {
      console.error('Organization schema yüklenemedi:', err)
    }
  }

  const saveOrganizationSchema = async () => {
    setOrgLoading(true)
    setError(null)
    try {
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        ...orgSchema
      }
      
      // Check if organization record exists
      const checkRes = await fetch('/api/seo?page=__organization__')
      const existingData = await checkRes.json()
      
      const payload = {
        page: '__organization__',
        title: 'Organization Schema',
        structuredData
      }
      
      const res = await fetch(existingData?.id ? `/api/seo/${existingData.id}` : '/api/seo', {
        method: existingData?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Organization schema kaydetme hatası')
      
      toast({ 
        title: 'Organization Schema Kaydedildi', 
        description: 'Değişiklikler tüm sayfalara yansıtılacak.' 
      })
    } catch (e: any) {
      setError(e?.message ?? 'Organization schema kaydetme hatası')
      toast({ 
        title: 'Kaydetme hatası', 
        description: e?.message ?? 'Organization schema kaydedilemedi.', 
        variant: 'destructive' as any 
      })
    } finally {
      setOrgLoading(false)
    }
  }

  const handleOrgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setOrgSchema(prev => ({ ...prev, [name]: value }))
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

      {/* Organization Schema Editing — moved to bottom */}

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
                <label className="block text-sm">OG Type
                  <input name="ogType" value={form.ogType ?? ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" placeholder="website, article" />
                </label>
                <label className="block text-sm">OG Title
                  <input name="ogTitle" value={form.ogTitle ?? ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
                </label>
                <label className="block text-sm">OG Description
                  <textarea name="ogDescription" value={form.ogDescription ?? ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2 h-20" />
                </label>
                <label className="block text-sm">OG Image URL
                  <div className="mt-1 flex items-center gap-2">
                    <input name="ogImageUrl" value={form.ogImageUrl ?? ''} onChange={handleChange} className="flex-1 border rounded px-3 py-2" />
                    <Button type="button" variant="outline" onClick={() => setMediaOpenOg(true)}>Görsel Seç / Yükle</Button>
                  </div>
                  {form.ogImageUrl && (
                    <div className="mt-2">
                      <img src={form.ogImageUrl as string} alt="OG preview" className="w-40 h-24 object-cover rounded border" />
                    </div>
                  )}
                  {/* Uyarılar */}
                  {ogAudit && (
                    <div className="mt-2 text-xs">
                      <div className="text-gray-600">Boyut: {ogAudit.width ?? '?'}x{ogAudit.height ?? '?'} | Oran: {ogAudit.ratio ? ogAudit.ratio.toFixed(2) : '?'}:1 | Tür: {(ogAudit.ext || '?').toUpperCase()}</div>
                      {ogAudit.warnings.length > 0 ? (
                        <ul className="mt-1 list-disc pl-5 text-yellow-700">
                          {ogAudit.warnings.map((w) => (<li key={w}>{w}</li>))}
                        </ul>
                      ) : (
                        <div className="mt-1 text-green-700">Uygun görünür.</div>
                      )}
                    </div>
                  )}
                  <MediaPicker
                    open={mediaOpenOg}
                    onOpenChange={setMediaOpenOg}
                    onSelect={(url) => setForm(prev => ({ ...prev, ogImageUrl: url }))}
                    title="OG Görsel Seç / Yükle"
                  />
                </label>
                <label className="block text-sm">OG Logo URL
                  <div className="mt-1 flex items-center gap-2">
                    <input name="ogLogoUrl" value={form.ogLogoUrl ?? ''} onChange={handleChange} className="flex-1 border rounded px-3 py-2" />
                    <Button type="button" variant="outline" onClick={() => setMediaOpenOgLogo(true)}>Logo Seç / Yükle</Button>
                  </div>
                  {form.ogLogoUrl && (
                    <div className="mt-2">
                      <img src={form.ogLogoUrl as string} alt="OG logo preview" className="w-32 h-20 object-contain rounded border" />
                    </div>
                  )}
                  <MediaPicker
                    open={mediaOpenOgLogo}
                    onOpenChange={setMediaOpenOgLogo}
                    onSelect={(url) => setForm(prev => ({ ...prev, ogLogoUrl: url }))}
                    title="OG Logo Seç / Yükle"
                  />
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
                  <div className="mt-1 flex items-center gap-2">
                    <input name="twitterImageUrl" value={form.twitterImageUrl ?? ''} onChange={handleChange} className="flex-1 border rounded px-3 py-2" />
                    <Button type="button" variant="outline" onClick={() => setMediaOpenTwitter(true)}>Görsel Seç / Yükle</Button>
                  </div>
                  {form.twitterImageUrl && (
                    <div className="mt-2">
                      <img src={form.twitterImageUrl as string} alt="Twitter preview" className="w-40 h-24 object-cover rounded border" />
                    </div>
                  )}
                  {/* Uyarılar */}
                  {twAudit && (
                    <div className="mt-2 text-xs">
                      <div className="text-gray-600">Boyut: {twAudit.width ?? '?'}x{twAudit.height ?? '?'} | Oran: {twAudit.ratio ? twAudit.ratio.toFixed(2) : '?'}:1 | Tür: {(twAudit.ext || '?').toUpperCase()}</div>
                      {twAudit.warnings.length > 0 ? (
                        <ul className="mt-1 list-disc pl-5 text-yellow-700">
                          {twAudit.warnings.map((w) => (<li key={w}>{w}</li>))}
                        </ul>
                      ) : (
                        <div className="mt-1 text-green-700">Uygun görünür.</div>
                      )}
                    </div>
                  )}
                  <MediaPicker
                    open={mediaOpenTwitter}
                    onOpenChange={setMediaOpenTwitter}
                    onSelect={(url) => setForm(prev => ({ ...prev, twitterImageUrl: url }))}
                    title="Twitter Görsel Seç / Yükle"
                  />
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

      {/* Organization Schema Editing — dark themed at bottom */}
      <section className="mt-10 border border-gray-800 rounded p-6 bg-gray-900 text-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Organization Schema (Global)</h2>
          <div className="text-sm text-gray-300">Tüm sayfalarda görünür</div>
        </div>
        <div className="text-sm text-gray-300 mb-4">
          Bu bilgiler sitenin Organization JSON-LD şemasını oluşturur ve arama motorlarına kimliğini tanıtır.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              Organizasyon Adı
              <input
                name="name"
                value={orgSchema.name}
                onChange={handleOrgChange}
                className="mt-1 w-full border border-gray-700 rounded px-3 py-2 bg-gray-800 text-gray-100 placeholder-gray-400"
                placeholder="Hokkabaz"
              />
            </label>
            <label className="block text-sm font-medium">
              Site URL
              <input
                name="url"
                value={orgSchema.url}
                onChange={handleOrgChange}
                className="mt-1 w-full border border-gray-700 rounded px-3 py-2 bg-gray-800 text-gray-100 placeholder-gray-400"
                placeholder="https://hokkabaz.net"
              />
            </label>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              Logo URL
              <div className="mt-1 flex items-center gap-2">
                <input
                  name="logo"
                  value={orgSchema.logo}
                  onChange={handleOrgChange}
                  className="flex-1 border border-gray-700 rounded px-3 py-2 bg-gray-800 text-gray-100 placeholder-gray-400"
                  placeholder="https://hokkabaz.net/logo.svg"
                />
                <Button type="button" variant="outline" onClick={() => setMediaOpenOrgLogo(true)}>
                  Logo Seç
                </Button>
              </div>
              {orgSchema.logo && (
                <div className="mt-2">
                  <img src={orgSchema.logo} alt="Organization logo" className="w-32 h-20 object-contain rounded border border-gray-700 bg-gray-900" />
                </div>
              )}
            </label>
            <label className="block text-sm font-medium">
              Temsili Görsel URL
              <div className="mt-1 flex items-center gap-2">
                <input
                  name="image"
                  value={orgSchema.image}
                  onChange={handleOrgChange}
                  className="flex-1 border border-gray-700 rounded px-3 py-2 bg-gray-800 text-gray-100 placeholder-gray-400"
                  placeholder="https://hokkabaz.net/uploads/..."
                />
                <Button type="button" variant="outline" onClick={() => setMediaOpenOrgImage(true)}>
                  Görsel Seç
                </Button>
              </div>
              {orgSchema.image && (
                <div className="mt-2">
                  <img src={orgSchema.image} alt="Organization image" className="w-40 h-24 object-cover rounded border border-gray-700 bg-gray-900" />
                </div>
              )}
            </label>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            disabled={orgLoading}
            onClick={saveOrganizationSchema}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50 flex items-center gap-2"
          >
            {orgLoading && <span className="inline-block w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />}
            Organization Schema Kaydet
          </button>
        </div>

        {/* Media Pickers for Organization */}
        <MediaPicker
          open={mediaOpenOrgLogo}
          onOpenChange={setMediaOpenOrgLogo}
          onSelect={(url) => setOrgSchema(prev => ({ ...prev, logo: url }))}
          title="Organization Logo Seç / Yükle"
        />
        <MediaPicker
          open={mediaOpenOrgImage}
          onOpenChange={setMediaOpenOrgImage}
          onSelect={(url) => setOrgSchema(prev => ({ ...prev, image: url }))}
          title="Organization Görsel Seç / Yükle"
        />
      </section>

      {/* Slug Taşıma */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Slug Taşıma</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-sm">Eski Slug
            <input value={fromSlug} onChange={(e) => setFromSlug(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="anlasmali-siteler" />
          </label>
          <label className="block text-sm">Yeni Slug
            <input value={toSlug} onChange={(e) => setToSlug(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="guvenilir-bahis-siteleri-listesi" />
          </label>
        </div>
        <div className="flex items-center gap-4 pt-2">
          <Button disabled={migrating} onClick={migrateSlug} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
            {migrating ? 'Taşınıyor...' : 'Taşı'}
          </Button>
          <div className="text-xs text-gray-600">
            Not: SEO kayıtlarını taşır/birleştirir; rota listeleri ve harici linkler ayrı yönetilir.
          </div>
        </div>
      </section>

      <section className="text-sm text-gray-500">
        Öneri: Ana sayfa için `page` alanını `/` olarak gir.
      </section>
    </div>
  )


}