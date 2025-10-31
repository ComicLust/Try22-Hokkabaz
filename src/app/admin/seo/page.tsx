"use client"
import { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
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
  const [routeQuery, setRouteQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<SeoSetting, 'id'>>(emptyForm)
  const [clientOrigin, setClientOrigin] = useState<string>('')
  const [mediaOpenOg, setMediaOpenOg] = useState(false)
  const [mediaOpenOgLogo, setMediaOpenOgLogo] = useState(false)
  const [mediaOpenTwitter, setMediaOpenTwitter] = useState(false)
  // Sol listeyi zenginleştirmek için statik sayfalar
  const staticRoutes = useMemo(() => ([
    '/',
    '/hizmetlerimiz',
    '/hakkimizda',
    '/iletisim',
    '/gizlilik-politikasi',
    '/kullanim-kosullari',
    '/kampanyalar',
    '/bonuslar',
    '/yorumlar',
    '/banko-kuponlar',
    '/banko-kuponlar/arsiv',
    '/anlasmali-siteler',
    '/guvenilir-bahis-siteleri-listesi',
    '/vpn-onerileri',
    '/canli-mac-izle',
    '/ozel-oranlar',
    '/guvenilir-telegram',
  ]), [])
  
  // Organization schema state
  const [orgSchema, setOrgSchema] = useState<OrganizationSchema>({
    name: 'Hokkabaz',
  url: 'https://hokkabaz.bet',
  logo: 'https://hokkabaz.bet/logo.svg',
  image: 'https://hokkabaz.bet/uploads/1760732951329-fzch33159aq.jpg'
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

  const filteredRoutes = useMemo(() => {
    const q = routeQuery.trim().toLowerCase()
    const all = Array.from(new Set([...(staticRoutes || []), ...routes])).sort()
    if (!q) return all
    return all.filter(r => r.toLowerCase().includes(q))
  }, [routes, routeQuery, staticRoutes])

  const allRoutes = useMemo(() => Array.from(new Set([...(staticRoutes || []), ...routes])).sort(), [routes, staticRoutes])

  const normalizedFormPage = useMemo(() => normalizePageKey(form.page), [form.page])
  const conflictItem = useMemo(() => {
    // Sadece yeni kayıt oluştururken çakışma kontrolü yap
    if (editingId) return null
    const key = normalizedFormPage === '' && form.page.trim() === '/' ? '' : normalizedFormPage
    const found = items.find(i => i.page === key)
    return found || null
  }, [items, normalizedFormPage, form.page, editingId])

  function normalizePageKey(page: string): string {
    const p = (page || '').trim()
    return p.startsWith('/') ? p.slice(1) : p
  }

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

  const handlePageSelectValue = async (value: string) => {
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
      // Çakışan page kontrolü (unique constraint öncesi) - sadece yeni kayıt oluştururken
      if (!editingId) {
        const normalized = normalizePageKey(form.page)
        const conflict = items.find(i => {
          // anasayfa özel durumu: '/' inputu DB'de '' olarak tutulabilir
          const key = normalized === '' && form.page.trim() === '/' ? '' : normalized
          return i.page === key
        })
        if (conflict) {
          setLoading(false)
          const msg = `Bu sayfa için zaten SEO kaydı var (id: ${conflict.id}). Sol listeden mevcut kaydı seçebilir veya 'Slug Taşıma' sekmesinden birleştirebilirsin.`
          setError(msg)
          toast({ title: 'Çakışan sayfa', description: msg, variant: 'destructive' as any })
          return
        }
      }
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
  url: org.url || 'https://hokkabaz.bet',
  logo: org.logo || 'https://hokkabaz.bet/logo.svg',
  image: org.image || 'https://hokkabaz.bet/uploads/1760732951329-fzch33159aq.jpg'
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">SEO Yönetimi</h1>
          <p className="text-sm text-muted-foreground">Sayfa bazlı meta ve yapılandırılmış verileri düzenle</p>
        </div>
        <div className="text-xs text-muted-foreground">Origin: <span suppressHydrationWarning>{clientOrigin}</span></div>
      </div>

      {error && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Otomatik SEO Yardımcıları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li>Canonical otomatik: <span className="font-mono" suppressHydrationWarning>{clientOrigin}</span></li>
            <li>Breadcrumb JSON-LD: URL segmentlerinden üretilir</li>
            <li>OG/Twitter: Canonical + sayfa özel alanlarıyla güncellenir</li>
          </ul>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Canonical (önizleme)</Label>
              <div className="mt-1 rounded border p-2 bg-muted">
                <div className="text-xs">Etkin değer:</div>
                <div className="text-sm font-mono break-all"><span suppressHydrationWarning>{canonicalPreview || '(tarayıcıda hesaplanır)'}</span></div>
                {editingItem?.canonicalUrl && (
                  <div className="mt-2 text-xs text-yellow-700">Override: {editingItem.canonicalUrl}</div>
                )}
              </div>
            </div>
            <div>
              <Label>Breadcrumb JSON-LD</Label>
              <pre className="mt-1 rounded border p-2 bg-muted text-xs overflow-auto max-h-48"><code>{breadcrumbPreviewJSON || '// tarayıcıda hesaplanır'}</code></pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Sayfalar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Input placeholder="Route ara" value={routeQuery} onChange={(e) => setRouteQuery(e.target.value)} />
              <Button variant="outline" onClick={() => setRouteQuery('')}>Temizle</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead className="w-20">Durum</TableHead>
                  <TableHead className="w-24">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoutes.map((r) => {
                  const hasSeo = items.some(i => i.page === r || i.page === normalizePageKey(r))
                  return (
                    <TableRow key={r} className="cursor-pointer" onClick={() => loadPageSeo(r)}>
                      <TableCell className="font-mono">{r}</TableCell>
                      <TableCell>
                        <span className={hasSeo ? 'text-green-600' : 'text-muted-foreground'}>{hasSeo ? 'Var' : 'Yok'}</span>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); loadPageSeo(r) }}>Seç</Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredRoutes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">Eşleşen rota yok</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{editingId ? 'SEO Kaydını Düzenle' : 'Yeni SEO Kaydı'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <Label>Sayfa Seç</Label>
                <Select value={form.page} onValueChange={handlePageSelectValue}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Bir sayfa seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {allRoutes.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Özel Sayfa</Label>
                <Input name="page" value={form.page} onChange={handleChange} className="mt-1" placeholder="/ozel-sayfa" />
                <p className="mt-1 text-xs text-muted-foreground">Başındaki slash otomatik normalize edilir. Ana sayfa için `/` girebilirsin.</p>
                {conflictItem && (
                  <div className="mt-2 text-xs text-red-600 flex items-center gap-2">
                    <span>Bu sayfa için zaten kayıt var.</span>
                    <Button size="sm" variant="outline" onClick={() => { setEditingId(conflictItem.id); setForm(prev => ({ ...prev, page: conflictItem.page })); }}>Mevcut Kaydı Aç</Button>
                  </div>
                )}
              </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="flex flex-wrap">
                <TabsTrigger value="general">Genel</TabsTrigger>
                <TabsTrigger value="og">Open Graph</TabsTrigger>
                <TabsTrigger value="twitter">Twitter</TabsTrigger>
                <TabsTrigger value="robots">Robots</TabsTrigger>
                <TabsTrigger value="schema">Schema</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-3 pt-4">
                <div>
                  <Label>Title</Label>
                  <Input name="title" value={form.title ?? ''} onChange={handleChange} className="mt-1" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea name="description" value={form.description ?? ''} onChange={handleChange} className="mt-1" rows={4} />
                </div>
                <div>
                  <Label>Keywords (virgülle)</Label>
                  <Input name="keywords" value={form.keywords ?? ''} onChange={handleChange} className="mt-1" placeholder="casino, bonus, bahis" />
                </div>
                <div>
                  <Label>Canonical URL</Label>
                  <Input name="canonicalUrl" value={form.canonicalUrl ?? ''} onChange={handleChange} className="mt-1" placeholder="https://site.com/" />
                </div>
              </TabsContent>

              <TabsContent value="og" className="space-y-3 pt-4">
                <div>
                  <Label>OG Type</Label>
                  <Input name="ogType" value={form.ogType ?? ''} onChange={handleChange} className="mt-1" placeholder="website, article" />
                </div>
                <div>
                  <Label>OG Title</Label>
                  <Input name="ogTitle" value={form.ogTitle ?? ''} onChange={handleChange} className="mt-1" />
                </div>
                <div>
                  <Label>OG Description</Label>
                  <Textarea name="ogDescription" value={form.ogDescription ?? ''} onChange={handleChange} className="mt-1" rows={4} />
                </div>
                <div>
                  <Label>OG Image URL</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input name="ogImageUrl" value={form.ogImageUrl ?? ''} onChange={handleChange} />
                    <Button type="button" variant="outline" onClick={() => setMediaOpenOg(true)}>Görsel Seç</Button>
                  </div>
                  {form.ogImageUrl && (
                    <div className="mt-2">
                      <img src={form.ogImageUrl as string} alt="OG preview" className="w-40 h-24 object-cover rounded border" />
                    </div>
                  )}
                  {ogAudit && (
                    <div className="mt-2 text-xs">
                      <div className="text-muted-foreground">Boyut: {ogAudit.width ?? '?'}x{ogAudit.height ?? '?'} | Oran: {ogAudit.ratio ? ogAudit.ratio.toFixed(2) : '?'}:1 | Tür: {(ogAudit.ext || '?').toUpperCase()}</div>
                      {ogAudit.warnings.length > 0 ? (
                        <ul className="mt-1 list-disc pl-5 text-yellow-700">
                          {ogAudit.warnings.map((w) => (<li key={w}>{w}</li>))}
                        </ul>
                      ) : (
                        <div className="mt-1 text-green-700">Uygun görünür.</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label>OG Logo URL</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input name="ogLogoUrl" value={form.ogLogoUrl ?? ''} onChange={handleChange} />
                    <Button type="button" variant="outline" onClick={() => setMediaOpenOgLogo(true)}>Logo Seç</Button>
                  </div>
                  {form.ogLogoUrl && (
                    <div className="mt-2">
                      <img src={form.ogLogoUrl as string} alt="OG logo preview" className="w-32 h-20 object-contain rounded border" />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="twitter" className="space-y-3 pt-4">
                <div>
                  <Label>Twitter Title</Label>
                  <Input name="twitterTitle" value={form.twitterTitle ?? ''} onChange={handleChange} className="mt-1" />
                </div>
                <div>
                  <Label>Twitter Description</Label>
                  <Textarea name="twitterDescription" value={form.twitterDescription ?? ''} onChange={handleChange} className="mt-1" rows={4} />
                </div>
                <div>
                  <Label>Twitter Image URL</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input name="twitterImageUrl" value={form.twitterImageUrl ?? ''} onChange={handleChange} />
                    <Button type="button" variant="outline" onClick={() => setMediaOpenTwitter(true)}>Görsel Seç</Button>
                  </div>
                  {form.twitterImageUrl && (
                    <div className="mt-2">
                      <img src={form.twitterImageUrl as string} alt="Twitter preview" className="w-40 h-24 object-cover rounded border" />
                    </div>
                  )}
                  {twAudit && (
                    <div className="mt-2 text-xs">
                      <div className="text-muted-foreground">Boyut: {twAudit.width ?? '?'}x{twAudit.height ?? '?'} | Oran: {twAudit.ratio ? twAudit.ratio.toFixed(2) : '?'}:1 | Tür: {(twAudit.ext || '?').toUpperCase()}</div>
                      {twAudit.warnings.length > 0 ? (
                        <ul className="mt-1 list-disc pl-5 text-yellow-700">
                          {twAudit.warnings.map((w) => (<li key={w}>{w}</li>))}
                        </ul>
                      ) : (
                        <div className="mt-1 text-green-700">Uygun görünür.</div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="robots" className="space-y-3 pt-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={form.robotsIndex} onCheckedChange={(v) => setForm(prev => ({ ...prev, robotsIndex: v }))} />
                    <Label>Robots Index</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={form.robotsFollow} onCheckedChange={(v) => setForm(prev => ({ ...prev, robotsFollow: v }))} />
                    <Label>Robots Follow</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="schema" className="space-y-3 pt-4">
                <div>
                  <Label>Structured Data (JSON-LD)</Label>
                  <Textarea defaultValue={form.structuredData ? JSON.stringify(form.structuredData, null, 2) : ''} onChange={handleStructuredDataChange} className="mt-1" rows={8} placeholder='{"@context":"https://schema.org","@type":"WebSite"}' />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 pt-4">
              <Button disabled={loading} onClick={submit} className="gap-2">
                {loading && <span className="inline-block w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />}
                {editingId ? 'Güncelle' : 'Kaydet'}
              </Button>
              {editingId && (
                <Button variant="outline" disabled={loading} onClick={() => { setEditingId(null); setForm(emptyForm); }}>İptal</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Schema (Global)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label>Organizasyon Adı</Label>
                  <Input name="name" value={orgSchema.name} onChange={handleOrgChange} className="mt-1" placeholder="Hokkabaz" />
                </div>
                <div>
                  <Label>Site URL</Label>
                  <Input name="url" value={orgSchema.url} onChange={handleOrgChange} className="mt-1" placeholder="https://hokkabaz.bet" />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Logo URL</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input name="logo" value={orgSchema.logo} onChange={handleOrgChange} />
                    <Button type="button" variant="outline" onClick={() => setMediaOpenOrgLogo(true)}>Logo Seç</Button>
                  </div>
                  {orgSchema.logo && (
                    <div className="mt-2">
                      <img src={orgSchema.logo} alt="Organization logo" className="w-32 h-20 object-contain rounded border" />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Temsili Görsel URL</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input name="image" value={orgSchema.image} onChange={handleOrgChange} />
                    <Button type="button" variant="outline" onClick={() => setMediaOpenOrgImage(true)}>Görsel Seç</Button>
                  </div>
                  {orgSchema.image && (
                    <div className="mt-2">
                      <img src={orgSchema.image} alt="Organization image" className="w-40 h-24 object-cover rounded border" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button disabled={orgLoading} onClick={saveOrganizationSchema} className="gap-2">
                {orgLoading && <span className="inline-block w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />}
                Organization Schema Kaydet
              </Button>
            </div>
            <MediaPicker open={mediaOpenOrgLogo} onOpenChange={setMediaOpenOrgLogo} onSelect={(url) => setOrgSchema(prev => ({ ...prev, logo: url }))} title="Organization Logo Seç / Yükle" />
            <MediaPicker open={mediaOpenOrgImage} onOpenChange={setMediaOpenOrgImage} onSelect={(url) => setOrgSchema(prev => ({ ...prev, image: url }))} title="Organization Görsel Seç / Yükle" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Slug Taşıma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Eski Slug</Label>
                <Input value={fromSlug} onChange={(e) => setFromSlug(e.target.value)} className="mt-1" placeholder="anlasmali-siteler" />
              </div>
              <div>
                <Label>Yeni Slug</Label>
                <Input value={toSlug} onChange={(e) => setToSlug(e.target.value)} className="mt-1" placeholder="guvenilir-bahis-siteleri-listesi" />
              </div>
            </div>
            <div className="flex items-center gap-4 pt-4">
              <Button disabled={migrating} onClick={migrateSlug}>
                {migrating ? 'Taşınıyor...' : 'Taşı'}
              </Button>
              <div className="text-xs text-muted-foreground">Not: SEO kayıtlarını taşır/birleştirir.</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">Öneri: Ana sayfa için `page` alanını `/` olarak gir.</p>
    </div>
  )


}