"use client"
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MediaPicker } from '@/components/media/MediaPicker'

type MarqueeLogo = {
  id: string
  imageUrl: string
  href?: string | null
  order: number
  isActive: boolean
}

export default function MarqueeLogosPage() {
  const [items, setItems] = useState<MarqueeLogo[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Partial<MarqueeLogo>>({ isActive: true, order: 0, imageUrl: '' })
  const [uploading, setUploading] = useState(false)
  
  // Markalarımız (Partner Sites) yönetimi
  type PartnerSite = {
    id: string
    name: string
    slug: string
    logoUrl?: string | null
    siteUrl?: string | null
    rating?: number | null
    features?: any
    isActive: boolean
  }
  const [brands, setBrands] = useState<PartnerSite[]>([])
  const [brandLoading, setBrandLoading] = useState(false)
  const [brandForm, setBrandForm] = useState<Partial<PartnerSite>>({ isActive: true, name: '', siteUrl: '', logoUrl: '', features: { badge: '' } })
  const [brandUploading, setBrandUploading] = useState(false)
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
const [mediaOpenMarqueeForm, setMediaOpenMarqueeForm] = useState(false)
const [mediaOpenMarqueeRowId, setMediaOpenMarqueeRowId] = useState<string | null>(null)
const [mediaOpenBrandForm, setMediaOpenBrandForm] = useState(false)
const [mediaOpenBrandRowId, setMediaOpenBrandRowId] = useState<string | null>(null)
const [mediaOpenSlideDesktopForm, setMediaOpenSlideDesktopForm] = useState(false)
const [mediaOpenSlideMobileForm, setMediaOpenSlideMobileForm] = useState(false)
const [mediaOpenSlideRowDesktopId, setMediaOpenSlideRowDesktopId] = useState<string | null>(null)
const [mediaOpenSlideRowMobileId, setMediaOpenSlideRowMobileId] = useState<string | null>(null)
  
  // Slider (Carousel) yönetimi için durumlar
  type CarouselSlide = {
    id: string
    title?: string | null
    subtitle?: string | null
    imageUrl?: string | null
    desktopImageUrl?: string | null
    mobileImageUrl?: string | null
    ctaLabel?: string | null
    ctaUrl?: string | null
    order: number
    isActive: boolean
  }
  const [slides, setSlides] = useState<CarouselSlide[]>([])
  const [slideLoading, setSlideLoading] = useState(false)
  const [slideForm, setSlideForm] = useState<Partial<CarouselSlide>>({ isActive: true, order: 0, imageUrl: '', desktopImageUrl: '', mobileImageUrl: '' })
  const [slideUploading, setSlideUploading] = useState(false)
  const [showSlideModal, setShowSlideModal] = useState(false)
  const [slideUploadingId, setSlideUploadingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/marquee-logos')
    const data = await res.json()
    setItems(data)
    setLoading(false)
  }

  // Mevcut markanın logosunu yükle ve güncelle
  const [logoUploadingId, setLogoUploadingId] = useState<string | null>(null)
  const uploadBrandLogoFor = async (id: string, file: File) => {
    setLogoUploadingId(id)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    setLogoUploadingId(null)
    if (!res.ok) {
      alert('Yükleme hatası')
      return
    }
    const data = await res.json()
    await updateBrand(id, { logoUrl: data.url })
  }
  useEffect(() => {
    load()
    loadSlides()
    loadBrands()
  }, [])

  const uploadFile = async (file: File) => {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    setUploading(false)
    if (!res.ok) {
      alert('Yükleme hatası')
      return
    }
    const data = await res.json()
    setForm((f) => ({ ...f, imageUrl: data.url }))
  }

  // Marka görsel yükleme
  const uploadBrandLogo = async (file: File) => {
    setBrandUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    setBrandUploading(false)
    if (!res.ok) {
      alert('Yükleme hatası')
      return
    }
    const data = await res.json()
    setBrandForm((f) => ({ ...f, logoUrl: data.url }))
  }

  // Basit slugify
  const slugify = (s: string) => s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  // Markaları yükle
  const loadBrands = async () => {
    setBrandLoading(true)
    const res = await fetch('/api/partner-sites')
    const data = await res.json()
    const sorted = Array.isArray(data)
      ? [...data].sort((a: any, b: any) => ((a?.features?.order ?? 999) - (b?.features?.order ?? 999)))
      : []
    setBrands(sorted)
    setBrandLoading(false)
  }

  // Yeni marka oluştur
  const createBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandForm?.name) {
      alert('Lütfen marka ismi girin')
      return
    }
    const payload: any = {
      name: brandForm.name,
      slug: slugify(brandForm.name!),
      logoUrl: brandForm.logoUrl,
      siteUrl: brandForm.siteUrl,
      isActive: brandForm.isActive ?? true,
      features: { order: (brands.length || 0) + 1, badge: brandForm.features?.badge ?? '' },
    }
    const res = await fetch('/api/partner-sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setBrandForm({ isActive: true, name: '', siteUrl: '', logoUrl: '' })
      setShowBrandModal(false)
      await loadBrands()
    } else {
      alert('Marka oluşturma hatası')
    }
  }

  // Marka güncelle
  const updateBrand = async (id: string, patch: Partial<PartnerSite>) => {
    const res = await fetch(`/api/partner-sites/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) await loadBrands()
  }

  // Marka sil
  const deleteBrand = async (id: string) => {
    if (!confirm('Bu marka silinsin mi?')) return
    const res = await fetch(`/api/partner-sites/${id}`, { method: 'DELETE' })
    if (res.ok) await loadBrands()
  }

  // Sürükle-bırak sıralama ve kaydetme
  const onDragStart = (index: number) => setDragIndex(index)
  const onDragOver = (e: React.DragEvent) => e.preventDefault()
  const onDrop = async (index: number) => {
    if (dragIndex === null) return
    const next = [...brands]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    setBrands(next)
    setDragIndex(null)
    await Promise.all(next.map((b, i) => updateBrand(b.id, { features: { ...(b.features || {}), order: i + 1 } })))
  }

  // Hero markalar: ayrı yönetim (3 adet, sıralı)
  const heroBrands = brands
    .filter((b) => !!b.features?.hero)
    .sort((a, b) => ((a.features?.heroOrder ?? 999) - (b.features?.heroOrder ?? 999)))

  const addBrandToHero = async (id: string) => {
    const used = new Set(heroBrands.map((b) => b.features?.heroOrder).filter(Boolean))
    let order = 1
    while (used.has(order) && order <= 3) order++
    if (order > 3) {
      alert('Hero alanı en fazla 3 marka alır')
      return
    }
    const current = brands.find(b => b.id === id)
    await updateBrand(id, { features: { ...(current?.features || {}), hero: true, heroOrder: order } })
  }

  const removeBrandFromHero = async (id: string) => {
    const current = brands.find(b => b.id === id)
    if (!current) return
    const { hero, heroOrder, ...rest } = current.features || {}
    await updateBrand(id, { features: { ...rest } })
  }

  const changeHeroOrder = async (id: string, order: number) => {
    if (order < 1 || order > 3) return
    const current = brands.find(b => b.id === id)
    await updateBrand(id, { features: { ...(current?.features || {}), hero: true, heroOrder: order } })
  }

  // Slider görsel yükleme (genel)
  const uploadSlideImage = async (file: File) => {
    setSlideUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    setSlideUploading(false)
    if (!res.ok) {
      alert('Yükleme hatası')
      return
    }
    const data = await res.json()
    setSlideForm((f) => ({ ...f, imageUrl: data.url }))
  }

  // Desktop görsel yükleme
  const uploadSlideDesktopImage = async (file: File) => {
    setSlideUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    setSlideUploading(false)
    if (!res.ok) {
      alert('Yükleme hatası')
      return
    }
    const data = await res.json()
    setSlideForm((f) => ({ ...f, desktopImageUrl: data.url }))
  }

  // Mobil görsel yükleme
  const uploadSlideMobileImage = async (file: File) => {
    setSlideUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    setSlideUploading(false)
    if (!res.ok) {
      alert('Yükleme hatası')
      return
    }
    const data = await res.json()
    setSlideForm((f) => ({ ...f, mobileImageUrl: data.url }))
  }

  // Mevcut slider için görsel yükle ve güncelle (hedef: desktop/mobile)
  const uploadSlideImageFor = async (id: string, file: File, target: 'desktop' | 'mobile' | 'default' = 'default') => {
    setSlideUploadingId(id)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    setSlideUploadingId(null)
    if (!res.ok) {
      alert('Yükleme hatası')
      return
    }
    const data = await res.json()
    if (target === 'desktop') {
      await updateSlide(id, { desktopImageUrl: data.url })
    } else if (target === 'mobile') {
      await updateSlide(id, { mobileImageUrl: data.url })
    } else {
      await updateSlide(id, { imageUrl: data.url })
    }
  }

  // Slider CRUD işlemleri
  const loadSlides = async () => {
    setSlideLoading(true)
    const res = await fetch('/api/carousel')
    const data = await res.json()
    setSlides(data)
    setSlideLoading(false)
  }

  const createSlide = async (e: React.FormEvent) => {
    e.preventDefault()
    // Basit doğrulamalar
    if (!slideForm.desktopImageUrl && !slideForm.mobileImageUrl && !slideForm.imageUrl) {
      alert('Lütfen en az bir görsel (desktop veya mobil) yükleyin veya URL girin')
      return
    }
    if (!slideForm.title || String(slideForm.title).trim() === '') {
      alert('Lütfen slider başlığı girin')
      return
    }

    // Order benzersiz olmalı; doluysa kullan, değilse en büyük+1 ata
    let order = Number(slideForm.order ?? 0)
    const maxOrder = slides.length ? Math.max(...slides.map((s) => Number(s.order ?? 0))) : 0
    const hasDuplicate = slides.some((s) => Number(s.order) === order)
    if (order <= 0 || hasDuplicate) {
      order = maxOrder + 1
    }

    const res = await fetch('/api/carousel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: slideForm.title,
        subtitle: slideForm.subtitle,
        ctaLabel: slideForm.ctaLabel,
        ctaUrl: slideForm.ctaUrl,
        isActive: slideForm.isActive ?? true,
        order,
        // Görsel alanları
        imageUrl: slideForm.imageUrl || slideForm.desktopImageUrl || slideForm.mobileImageUrl,
        desktopImageUrl: slideForm.desktopImageUrl || undefined,
        mobileImageUrl: slideForm.mobileImageUrl || undefined,
      }),
    })
    if (res.ok) {
      setSlideForm({ isActive: true, order: 0, imageUrl: '', desktopImageUrl: '', mobileImageUrl: '' })
      setShowSlideModal(false)
      await loadSlides()
    } else {
      try {
        const err = await res.json()
        alert(`Slider oluşturma hatası: ${err?.error ?? 'Bilinmeyen hata'}`)
      } catch {
        alert('Slider oluşturma hatası')
      }
    }
  }

  const updateSlide = async (id: string, patch: Partial<CarouselSlide>) => {
    const res = await fetch(`/api/carousel/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) await loadSlides()
  }

  const deleteSlide = async (id: string) => {
    if (!confirm('Bu slider silinsin mi?')) return
    const res = await fetch(`/api/carousel/${id}`, { method: 'DELETE' })
    if (res.ok) await loadSlides()
  }

  const createItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.imageUrl) {
      alert('Lütfen logo görseli yükleyin veya URL girin')
      return
    }

    // Order benzersiz olmalı; formdaki geçersiz/tekrarlı ise en büyük + 1 ver
    let order = Number(form.order ?? 0)
    const maxOrder = items.length ? Math.max(...items.map((i) => Number(i.order ?? 0))) : 0
    const hasDuplicate = items.some((i) => Number(i.order) === order)
    if (order <= 0 || hasDuplicate) {
      order = maxOrder + 1
    }

    const payload = {
      imageUrl: form.imageUrl as string,
      href: form.href ?? undefined,
      isActive: form.isActive ?? true,
      order,
    }

    const res = await fetch('/api/marquee-logos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setForm({ isActive: true, order: 0, imageUrl: '' })
      setShowMarqueeModal(false)
      await load()
    } else {
      try {
        const err = await res.json()
        alert(`Oluşturma hatası: ${err?.error ?? 'Bilinmeyen hata'}`)
      } catch {
        alert('Oluşturma hatası')
      }
    }
  }

  const updateItem = async (id: string, patch: Partial<MarqueeLogo>) => {
    const res = await fetch(`/api/marquee-logos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) await load()
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Bu logo silinsin mi?')) return
    const res = await fetch(`/api/marquee-logos/${id}`, { method: 'DELETE' })
    if (res.ok) await load()
  }

  // Marquee (kayan logolar) için sürükle-bırak ve modal ekleme
  const [marqueeDragIndex, setMarqueeDragIndex] = useState<number | null>(null)
  const marqueeOnDragStart = (index: number) => setMarqueeDragIndex(index)
  const marqueeOnDragOver = (e: React.DragEvent) => e.preventDefault()
  const marqueeOnDrop = async (index: number) => {
    if (marqueeDragIndex === null) return
    const next = [...items]
    const [moved] = next.splice(marqueeDragIndex, 1)
    next.splice(index, 0, moved)
    setItems(next)
    setMarqueeDragIndex(null)
    await Promise.all(next.map((it, i) => updateItem(it.id, { order: i + 1 })))
  }

  const [showMarqueeModal, setShowMarqueeModal] = useState(false)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Kayan Logolar (Marquee)</h1>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Kayan Logoları Yönet</h2>
        <button className="px-3 py-2 rounded-md border" onClick={() => setShowMarqueeModal(true)}>Yeni Logo Ekle</button>
      </div>

      <div className="border rounded-md p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((it, i) => (
            <div
              key={it.id}
              className="group relative rounded-xl border p-4 bg-gradient-to-br from-[#111] to-[#1a1a1a]"
              draggable
              onDragStart={() => marqueeOnDragStart(i)}
              onDragOver={marqueeOnDragOver}
              onDrop={() => marqueeOnDrop(i)}
            >
              <div className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded-full bg-gold/20 text-gold border border-gold">{i + 1}</div>
              <img src={it.imageUrl} alt="logo" className="w-[220px] h-[73px] mx-auto object-contain" />
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  className="border border-border rounded-md px-2 py-1 w-full bg-background text-foreground"
                  placeholder="https://..."
                  defaultValue={it.href ?? ''}
                  onBlur={(e) => updateItem(it.id, { href: e.target.value })}
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={it.isActive}
                    onChange={(e) => updateItem(it.id, { isActive: e.target.checked })}
                  />
                  Aktif
                </label>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setMediaOpenMarqueeRowId(it.id)}>
                  Görsel Seç / Yükle
                </Button>
                <MediaPicker
                  open={mediaOpenMarqueeRowId === it.id}
                  onOpenChange={(v) => setMediaOpenMarqueeRowId(v ? it.id : null)}
                  onSelect={(url) => updateItem(it.id, { imageUrl: url })}
                  title="Logo Görseli Seç / Yükle"
                />
                <button className="ml-auto px-3 py-1 rounded-md border" onClick={() => deleteItem(it.id)}>Sil</button>
              </div>
            </div>
          ))}
        </div>
        {loading && <div className="p-3">Yükleniyor...</div>}
      </div>

      {/* Markalarımız (Grid) Yönetimi */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Markalarımız (Grid)</h2>
        <button className="px-3 py-2 rounded-md border" onClick={() => setShowBrandModal(true)}>Yeni Marka Ekle</button>
      </div>
      <div className="border rounded-md p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {brands.map((b, i) => (
            <div
              key={b.id}
              className="group relative rounded-xl border p-4 bg-gradient-to-br from-[#111] to-[#1a1a1a]"
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(i)}
            >
              <div className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded-full bg-gold/20 text-gold border border-gold">{i + 1}</div>
              <img src={b.logoUrl ?? ''} alt={b.name} className="w-[220px] h-[73px] mx-auto object-contain" />
              <div className="mt-2 flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setMediaOpenBrandRowId(b.id)}>Logo Seç / Yükle</Button>
                <MediaPicker
                  open={mediaOpenBrandRowId === b.id}
                  onOpenChange={(v) => setMediaOpenBrandRowId(v ? b.id : null)}
                  onSelect={(url) => updateBrand(b.id, { logoUrl: url })}
                  title="Marka Logosu Seç / Yükle"
                />
                {logoUploadingId === b.id && (<span className="text-xs text-muted-foreground">Yükleniyor...</span>)}
              </div>
              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  className="border border-border rounded-md px-2 py-1 w-full bg-background text-foreground"
                  defaultValue={b.name}
                  onBlur={(e) => updateBrand(b.id, { name: e.target.value })}
                />
                <input
                  type="text"
                  className="border border-border rounded-md px-2 py-1 w-full bg-background text-foreground"
                  placeholder="https://..."
                  defaultValue={b.siteUrl ?? ''}
                  onBlur={(e) => updateBrand(b.id, { siteUrl: e.target.value })}
                />
                <input
                  type="text"
                  className="border border-border rounded-md px-2 py-1 w-full bg-background text-foreground"
                  placeholder="Rozet (badge)"
                  defaultValue={b.features?.badge ?? ''}
                  onBlur={(e) => updateBrand(b.id, { features: { ...(b.features || {}), badge: e.target.value } })}
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!b.isActive}
                    onChange={(e) => updateBrand(b.id, { isActive: e.target.checked })}
                  />
                  Aktif
                </label>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 rounded-md border" onClick={() => deleteBrand(b.id)}>Sil</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {brandLoading && <div className="p-3">Yükleniyor...</div>}
      </div>

      {/* Hero Markalar (3'lü büyük kartlar) */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Hero Markalar (3'lü)</h2>
        <div className="flex items-center gap-2">
          <select
            className="border border-border rounded-md px-2 py-1 bg-background text-foreground"
            defaultValue=""
            onChange={(e) => {
              const id = e.target.value
              if (id) addBrandToHero(id)
              e.target.value = ''
            }}
          >
            <option value="" disabled>Marka seç ve Hero'a ekle</option>
            {brands.filter(b => !b.features?.hero).map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="border rounded-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {heroBrands.map((b) => (
            <div key={b.id} className="relative rounded-xl border p-4 bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a]">
              <span className="absolute top-2 right-2 text-[10px] md:text-xs px-2 py-1 rounded-full bg-gold/20 text-gold border border-gold">Hero #{b.features?.heroOrder ?? '-'}</span>
              <img src={b.logoUrl ?? ''} alt={b.name} className="w-[260px] h-[100px] mx-auto object-contain" />
              <div className="mt-3 flex items-center gap-2">
                <label className="text-sm">Sıra:</label>
                <select
                  className="border border-border rounded-md px-2 py-1 bg-background text-foreground"
                  value={b.features?.heroOrder ?? 1}
                  onChange={(e) => changeHeroOrder(b.id, Number(e.target.value))}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
                <button className="ml-auto px-3 py-1 rounded-md border" onClick={() => removeBrandFromHero(b.id)}>Çıkar</button>
              </div>
            </div>
          ))}
          {heroBrands.length === 0 && (
            <div className="text-sm text-muted-foreground">Henüz hero marka seçilmedi. Yukarıdaki seçimden ekleyin.</div>
          )}
        </div>
      </div>

      {/* Yeni Marka Ekle Modal */}
      {showBrandModal && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center z-50">
          <div className="bg-background text-foreground w-full max-w-lg rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Yeni Marka Ekle</h3>
            <form onSubmit={createBrand} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Marka İsmi</label>
                <input
                  type="text"
                  className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground"
                  placeholder="Marka adı"
                  value={brandForm.name ?? ''}
                  onChange={(e) => setBrandForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Web Sitesi URL</label>
                <input
                  type="text"
                  className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground"
                  placeholder="https://..."
                  value={brandForm.siteUrl ?? ''}
                  onChange={(e) => setBrandForm((f) => ({ ...f, siteUrl: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Rozet (badge)</label>
                <input
                  type="text"
                  className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground"
                  placeholder="Örn: Güvenilir"
                  value={brandForm.features?.badge ?? ''}
                  onChange={(e) => setBrandForm((f) => ({ ...f, features: { ...(f.features || {}), badge: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Logo Görseli</label>
                <input
                  type="text"
                  className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground"
                  placeholder="Logo URL"
                  value={brandForm.logoUrl ?? ''}
                  onChange={(e) => setBrandForm((f) => ({ ...f, logoUrl: e.target.value }))}
                />
                <Button type="button" variant="outline" onClick={() => setMediaOpenBrandForm(true)}>Logo Seç / Yükle</Button>
                <MediaPicker
                  open={mediaOpenBrandForm}
                  onOpenChange={setMediaOpenBrandForm}
                  onSelect={(url) => setBrandForm((f) => ({ ...f, logoUrl: url }))}
                  title="Marka Logosu Seç / Yükle"
                />
                {brandUploading && <div className="text-sm">Yükleniyor...</div>}
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!brandForm.isActive}
                    onChange={(e) => setBrandForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  Aktif
                </label>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button type="submit" className="px-3 py-2 rounded-md border">Ekle</button>
                <button type="button" className="px-3 py-2 rounded-md border" onClick={() => setShowBrandModal(false)}>Kapat</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Yeni Marquee Logo Ekle Modal */}
      {showMarqueeModal && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center z-50">
          <div className="bg-background text-foreground w-full max-w-lg rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Yeni Kayan Logo Ekle</h3>
            <form onSubmit={createItem} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Logo Görseli</label>
                <input
                  type="text"
                  className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground"
                  placeholder="Logo URL"
                  value={form.imageUrl ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                />
                <Button type="button" variant="outline" onClick={() => setMediaOpenMarqueeForm(true)}>Görsel Seç / Yükle</Button>
                <MediaPicker
                  open={mediaOpenMarqueeForm}
                  onOpenChange={setMediaOpenMarqueeForm}
                  onSelect={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                  title="Marquee Logo Seç / Yükle"
                />
                {uploading && <div className="text-sm">Yükleniyor...</div>}
              </div>
              <div>
                <label className="block text-sm font-medium">Bağlantı (href)</label>
                <input
                  className="border border-border rounded-md px-3 py-2 w-full bg-background text-foreground"
                  placeholder="https://..."
                  value={form.href ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  Aktif
                </label>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button type="submit" className="px-3 py-2 rounded-md border">Ekle</button>
                <button type="button" className="px-3 py-2 rounded-md border" onClick={() => setShowMarqueeModal(false)}>Kapat</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Slider (Önerilen Siteler) Yönetimi */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Önerilen Siteler Slider</h2>
        <button className="px-3 py-2 rounded-md border" onClick={() => setShowSlideModal(true)}>Yeni Slider Ekle</button>
      </div>

      {/* Yeni Slider Ekle Modal */}
      {showSlideModal && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center z-50">
          <div className="bg-background text-foreground w-full max-w-2xl rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Yeni Slider Ekle</h3>
            <form onSubmit={createSlide} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Desktop Görseli (Instagram Post 1:1)</label>
                  <input
                    type="text"
                    className="border rounded-md px-3 py-2 w-full"
                    placeholder="Desktop Görsel URL"
                    value={slideForm.desktopImageUrl ?? ''}
                    onChange={(e) => setSlideForm((f) => ({ ...f, desktopImageUrl: e.target.value }))}
                  />
                  <Button type="button" variant="outline" onClick={() => setMediaOpenSlideDesktopForm(true)}>Görsel Seç / Yükle</Button>
                  <MediaPicker
                    open={mediaOpenSlideDesktopForm}
                    onOpenChange={setMediaOpenSlideDesktopForm}
                    onSelect={(url) => setSlideForm((f) => ({ ...f, desktopImageUrl: url }))}
                    title="Slider Desktop Görsel Seç / Yükle"
                  />
                  {slideUploading && <div className="text-sm text-muted-foreground">Yükleniyor...</div>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Mobil Görseli (Instagram Story 9:16)</label>
                  <input
                    type="text"
                    className="border rounded-md px-3 py-2 w-full"
                    placeholder="Mobil Görsel URL"
                    value={slideForm.mobileImageUrl ?? ''}
                    onChange={(e) => setSlideForm((f) => ({ ...f, mobileImageUrl: e.target.value }))}
                  />
                  <Button type="button" variant="outline" onClick={() => setMediaOpenSlideMobileForm(true)}>Görsel Seç / Yükle</Button>
                  <MediaPicker
                    open={mediaOpenSlideMobileForm}
                    onOpenChange={setMediaOpenSlideMobileForm}
                    onSelect={(url) => setSlideForm((f) => ({ ...f, mobileImageUrl: url }))}
                    title="Slider Mobil Görsel Seç / Yükle"
                  />
                  {slideUploading && <div className="text-sm text-muted-foreground">Yükleniyor...</div>}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium">Başlık</label>
                  <input
                    className="border rounded-md px-3 py-2 w-full"
                    value={slideForm.title ?? ''}
                    onChange={(e) => setSlideForm((f) => ({ ...f, title: e.target.value }))}
                  />
                  <label className="block text-sm font-medium">Alt Başlık</label>
                  <input
                    className="border rounded-md px-3 py-2 w-full"
                    value={slideForm.subtitle ?? ''}
                    onChange={(e) => setSlideForm((f) => ({ ...f, subtitle: e.target.value }))}
                  />
                  <label className="block text-sm font-medium">CTA Label</label>
                  <input
                    className="border rounded-md px-3 py-2 w-full"
                    value={slideForm.ctaLabel ?? ''}
                    onChange={(e) => setSlideForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                  />
                  <label className="block text-sm font-medium">CTA URL</label>
                  <input
                    className="border rounded-md px-3 py-2 w-full"
                    value={slideForm.ctaUrl ?? ''}
                    onChange={(e) => setSlideForm((f) => ({ ...f, ctaUrl: e.target.value }))}
                  />
                  <label className="flex items-center gap-2 mt-2">
                    Sıra
                    <input
                      type="number"
                      className="border rounded-md px-2 py-1 w-24"
                      value={Number(slideForm.order ?? 0)}
                      onChange={(e) => setSlideForm((f) => ({ ...f, order: Number(e.target.value) }))}
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!slideForm.isActive}
                      onChange={(e) => setSlideForm((f) => ({ ...f, isActive: e.target.checked }))}
                    />
                    Aktif
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button type="submit" className="px-3 py-2 rounded-md border">Ekle</button>
                <button type="button" className="px-3 py-2 rounded-md border" onClick={() => setShowSlideModal(false)}>Kapat</button>
                {slideLoading && <span className="text-sm text-muted-foreground">Yükleniyor...</span>}
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="border rounded-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-3">Önizleme</th>
              <th className="p-3">Başlık</th>
              <th className="p-3">Alt Başlık</th>
              <th className="p-3">CTA</th>
              <th className="p-3">Sıra</th>
              <th className="p-3">Aktif</th>
              <th className="p-3">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {slides.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-muted-foreground">Desktop</div>
                    <img src={(s.desktopImageUrl ?? s.imageUrl) ?? ''} alt="desktop" className="h-12 w-12 object-cover rounded" />
                    <div className="text-xs text-muted-foreground ml-4">Mobil</div>
                    <img src={(s.mobileImageUrl ?? s.imageUrl) ?? ''} alt="mobile" className="h-12 w-8 object-cover rounded" />
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <label className="text-xs">Desktop:</label>
                    <Button type="button" variant="outline" onClick={() => setMediaOpenSlideRowDesktopId(s.id)}>Görsel Seç / Yükle</Button>
                    <MediaPicker
                      open={mediaOpenSlideRowDesktopId === s.id}
                      onOpenChange={(v) => setMediaOpenSlideRowDesktopId(v ? s.id : null)}
                      onSelect={(url) => updateSlide(s.id, { desktopImageUrl: url })}
                      title="Slider Desktop Görsel Seç / Yükle"
                    />
                    <label className="text-xs ml-4">Mobil:</label>
                    <Button type="button" variant="outline" onClick={() => setMediaOpenSlideRowMobileId(s.id)}>Görsel Seç / Yükle</Button>
                    <MediaPicker
                      open={mediaOpenSlideRowMobileId === s.id}
                      onOpenChange={(v) => setMediaOpenSlideRowMobileId(v ? s.id : null)}
                      onSelect={(url) => updateSlide(s.id, { mobileImageUrl: url })}
                      title="Slider Mobil Görsel Seç / Yükle"
                    />
                    {slideUploadingId === s.id && <div className="text-xs text-muted-foreground">Yükleniyor...</div>}
                  </div>
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    className="border rounded-md px-2 py-1 w-full"
                    defaultValue={s.title ?? ''}
                    onBlur={(e) => updateSlide(s.id, { title: e.target.value })}
                  />
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    className="border rounded-md px-2 py-1 w-full"
                    defaultValue={s.subtitle ?? ''}
                    onBlur={(e) => updateSlide(s.id, { subtitle: e.target.value })}
                  />
                </td>
                <td className="p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="border rounded-md px-2 py-1"
                      placeholder="Label"
                      defaultValue={s.ctaLabel ?? ''}
                      onBlur={(e) => updateSlide(s.id, { ctaLabel: e.target.value })}
                    />
                    <input
                      type="text"
                      className="border rounded-md px-2 py-1"
                      placeholder="/anlasmali-siteler"
                      defaultValue={s.ctaUrl ?? ''}
                      onBlur={(e) => updateSlide(s.id, { ctaUrl: e.target.value })}
                    />
                  </div>
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    className="border rounded-md px-2 py-1 w-24"
                    defaultValue={s.order}
                    onBlur={(e) => updateSlide(s.id, { order: Number(e.target.value) })}
                  />
                </td>
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={s.isActive}
                    onChange={(e) => updateSlide(s.id, { isActive: e.target.checked })}
                  />
                </td>
                <td className="p-3 space-x-2">
                  <button className="px-3 py-1 rounded-md border" onClick={() => deleteSlide(s.id)}>Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {slideLoading && <div className="p-3">Yükleniyor...</div>}
      </div>
    </div>
  )
}