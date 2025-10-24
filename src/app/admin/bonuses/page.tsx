"use client"
import { useEffect, useMemo, useState } from 'react'
import { Award, Calendar, Check, Clock, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MediaPicker } from '@/components/media/MediaPicker'
import { slugifyTr } from '@/lib/slugify'

type Bonus = {
  id: string
  title: string
  slug: string
  description?: string | null
  shortDescription?: string | null
  bonusType?: string | null
  gameCategory?: string | null
  amount?: number | null
  wager?: number | null
  minDeposit?: number | null
  imageUrl?: string | null
  postImageUrl?: string | null
  ctaUrl?: string | null
  badges?: string[] | null
  features?: string[] | null
  validityText?: string | null
  startDate?: string | null
  endDate?: string | null
  isActive: boolean
  isFeatured?: boolean
  priority?: number
  isApproved?: boolean
  brandId?: string | null
  brand?: { name?: string | null; slug?: string | null } | null
  createdByLoginId?: string | null
  createdByName?: string | null
}

export default function BonusesPage() {
  const [items, setItems] = useState<Bonus[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Partial<Bonus>>({ isActive: true, isFeatured: false, priority: 0 })
  const [typeOptions, setTypeOptions] = useState<string[]>(['Deneme Bonusu','Hoşgeldin Bonusu','Yatırım Bonusu','Kayıp Bonusu'])
  const [categoryOptions, setCategoryOptions] = useState<string[]>(['Spor','Casino','Slot','Poker','Bingo','Tombala','E-spor','Sanal'])
  const [newType, setNewType] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [mediaOpenForm, setMediaOpenForm] = useState(false)
  const [mediaOpenPost, setMediaOpenPost] = useState(false)
  const [newBadge, setNewBadge] = useState('')
  const [newFeature, setNewFeature] = useState('')
  const [availableBadges, setAvailableBadges] = useState<string[]>([])
  const [sendForApproval, setSendForApproval] = useState(false)

  // Drag and drop state
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all'|'active'|'inactive'>('all')
  const [featuredFilter, setFeaturedFilter] = useState<'all'|'featured'|'nonfeatured'>('all')
  const [amountFilter, setAmountFilter] = useState<'all'|'0-100'|'100-200'|'200+'>('all')

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/bonuses')
    const data = await res.json()
    setItems(data)
    setLoading(false)
    // önerilen rozetleri topla
    try {
      const uniq = Array.from(new Set((data || []).flatMap((b: any) => Array.isArray(b.badges) ? b.badges : []))) as string[]
      setAvailableBadges(uniq)
      const types = Array.from(new Set((data || []).map((b: any) => b.bonusType).filter(Boolean)))
      const cats = Array.from(new Set((data || []).map((b: any) => b.gameCategory).filter(Boolean)))
      if (types.length) setTypeOptions((prev) => Array.from(new Set<string>([...prev, ...(types as string[])])))
      if (cats.length) setCategoryOptions((prev) => Array.from(new Set<string>([...prev, ...(cats as string[])])))
    } catch {}
  }

  useEffect(() => {
    load()
  }, [])

  const createItem = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form } as any
    // tarihleri ISO ya çevir
    if (typeof payload.startDate === 'string' && payload.startDate) {
      payload.startDate = new Date(payload.startDate).toISOString()
    }
    if (typeof payload.endDate === 'string' && payload.endDate) {
      payload.endDate = new Date(payload.endDate).toISOString()
    }
    if (sendForApproval) payload.isApproved = false
    const res = await fetch('/api/bonuses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setForm({ isActive: true, isFeatured: false, priority: 0 })
      setSendForApproval(false)
      setNewBadge('')
      setNewFeature('')
      await load()
    } else {
      alert('Oluşturma hatası')
    }
  }

  const updateItem = async (id: string, patch: Partial<Bonus>) => {
    const res = await fetch(`/api/bonuses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) await load()
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Bu bonus silinsin mi?')) return
    const res = await fetch(`/api/bonuses/${id}`, { method: 'DELETE' })
    if (res.ok) await load()
  }

  // Drag and drop functions
  const onDragStart = (index: number) => setDragIndex(index)
  const onDragOver = (e: React.DragEvent) => e.preventDefault()
  const onDrop = async (index: number, isFeaturedSection: boolean) => {
    if (dragIndex === null) return
    
    const sourceItems = isFeaturedSection ? featuredItems : listedItems
    const next = [...sourceItems]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    
    // Update priorities based on new order
    await Promise.all(next.map((item, i) => 
      updateItem(item.id, { priority: next.length - i })
    ))
    
    setDragIndex(null)
    await load()
  }

  const filtered = useMemo(() => {
    return items.filter((b) => {
      const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.slug.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesActive =
        activeFilter === 'all' ||
        (activeFilter === 'active' && b.isActive) ||
        (activeFilter === 'inactive' && !b.isActive)

      const amt = Number(b.amount ?? 0)
      const matchesAmount =
        amountFilter === 'all' ||
        (amountFilter === '0-100' && amt >= 0 && amt <= 100) ||
        (amountFilter === '100-200' && amt > 100 && amt <= 200) ||
        (amountFilter === '200+' && amt > 200)

      const matchesFeatured =
        featuredFilter === 'all' ||
        (featuredFilter === 'featured' && !!b.isFeatured) ||
        (featuredFilter === 'nonfeatured' && !b.isFeatured)

      return matchesSearch && matchesActive && matchesAmount && matchesFeatured
    })
  }, [items, searchQuery, activeFilter, featuredFilter, amountFilter])

  const featuredItems = filtered.filter((b) => !!b.isFeatured)
  const listedItems = filtered.filter((b) => !b.isFeatured)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Bonuslar (Admin)</h1>

      {/* Filtreleme Alanı */}
      <div className="border rounded-md p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          className="border rounded-md px-3 py-2"
          placeholder="Bonus veya site ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="border rounded-md px-3 py-2"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as any)}
        >
          <option value="all">Tümü</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
        </select>
        <select
          className="border rounded-md px-3 py-2"
          value={featuredFilter}
          onChange={(e) => setFeaturedFilter(e.target.value as any)}
        >
          <option value="all">Öne Çıkan (Tümü)</option>
          <option value="featured">Öne Çıkan</option>
          <option value="nonfeatured">Normal</option>
        </select>
        <select
          className="border rounded-md px-3 py-2"
          value={amountFilter}
          onChange={(e) => setAmountFilter(e.target.value as any)}
        >
          <option value="all">Tutar (Tümü)</option>
          <option value="0-100">0–100</option>
          <option value="100-200">100–200</option>
          <option value="200+">200+</option>
        </select>
      </div>

      <div className="text-sm text-muted-foreground">{filtered.length} bonus bulundu</div>

      {/* Öne Çıkan Bonuslar */}
      {featuredItems.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gold flex items-center">
            <Star className="w-5 h-5 mr-2" /> Öne Çıkan Bonuslar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.map((bonus, index) => (
              <div 
                key={bonus.id} 
                className="relative overflow-hidden backdrop-blur-lg bg-opacity-80 bg-card border-2 border-gold rounded-2xl p-4 cursor-move"
                draggable
                onDragStart={() => onDragStart(index)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(index, true)}
              >
                <div className="absolute top-4 right-4">
                  <span className="text-xs px-2 py-1 rounded-full bg-gold text-background">ÖNE ÇIKAN</span>
                </div>
                <div className="w-16 h-16 mx-auto mb-4 rounded-md flex items-center justify-center border bg-background">
                  {bonus.imageUrl ? (
                    <img src={bonus.imageUrl} alt={bonus.title} className="w-full h-full object-contain p-1" />
                  ) : (
                    <Award className="w-8 h-8 text-gold" />
                  )}
                </div>
                <div className="text-center space-y-2">
                  <div className="text-lg font-medium">{bonus.title}</div>
                  {bonus.brandId && (
                    <div className="text-xs text-muted-foreground">Gönderen: {bonus.createdByName || bonus.createdByLoginId || bonus.brand?.name || bonus.brand?.slug || '—'}</div>
                  )}
                  <div className="text-3xl font-bold text-gold">{bonus.amount ?? 0} TL</div>
                  <div className="text-muted-foreground">{bonus.bonusType ?? 'Bonus'}</div>
                  <div className="space-y-1">
                    {(bonus.features ?? []).map((f, i) => (
                      <div key={i} className="flex items-center justify-center text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-gold mr-2" /> {f}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 inline mr-1" /> Son 5 gün
                  </div>
                  {(bonus.badges ?? []).length > 0 && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {(bonus.badges ?? []).map((b, i) => (
                        <span key={i} className="px-2 py-1 rounded-full border text-center">{b}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  <button className="px-3 py-2 rounded-md border" onClick={() => updateItem(bonus.id, { isFeatured: false })}>Normal Yap</button>
                  <button className="px-3 py-2 rounded-md border" onClick={() => updateItem(bonus.id, { isActive: !bonus.isActive })}>{bonus.isActive ? 'Pasifleştir' : 'Aktifleştir'}</button>
                  <a className="px-3 py-2 rounded-md border text-center" href={`/admin/bonuses/${bonus.id}`}>Düzenle</a>
                  <button className="px-3 py-2 rounded-md border" onClick={() => deleteItem(bonus.id)}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Listelenen Bonuslar */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Listelenen Bonuslar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {listedItems.map((bonus, index) => (
            <div 
              key={bonus.id} 
              className="backdrop-blur-lg bg-opacity-80 bg-card border rounded-2xl p-4 hover:border-gold transition-colors cursor-move"
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(index, false)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-md flex items-center justify-center border bg-background">
                  {bonus.imageUrl ? (
                    <img src={bonus.imageUrl} alt={bonus.title} className="w-full h-full object-contain p-1" />
                  ) : (
                    <Award className="w-6 h-6 text-gold" />
                  )}
                </div>
                {(bonus.createdByName || bonus.createdByLoginId || bonus.brand?.name || bonus.brand?.slug) && (
                  <span className="text-xs border rounded-full px-2 py-1">Gönderen: {bonus.createdByName || bonus.createdByLoginId || bonus.brand?.name || bonus.brand?.slug}</span>
                )}
              </div>
              <div className="text-lg font-medium">{bonus.title}</div>
              {bonus.brandId && (
                <div className="text-xs text-muted-foreground mb-1">Gönderen: {bonus.createdByName || bonus.createdByLoginId || bonus.brand?.name || bonus.brand?.slug || '—'}</div>
              )}
              <div className="text-2xl font-bold text-gold">{bonus.amount ?? 0} TL</div>
              <div className="text-xs text-muted-foreground mb-4">
                <Calendar className="w-3 h-3 inline mr-1" /> Min. Yatırım: {bonus.minDeposit ?? 0} TL
              </div>
              <div className="space-y-2 mb-4">
                {(bonus.features ?? []).map((f, i) => (
                  <div key={i} className="flex items-center text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-gold mr-2" /> {f}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="px-3 py-2 rounded-md border" onClick={() => updateItem(bonus.id, { isFeatured: true })}>Öne Çıkar</button>
                <button className="px-3 py-2 rounded-md border" onClick={() => updateItem(bonus.id, { isActive: !bonus.isActive })}>{bonus.isActive ? 'Pasifleştir' : 'Aktifleştir'}</button>
                <button className="px-3 py-2 rounded-md border" onClick={() => deleteItem(bonus.id)}>Sil</button>
                <button className="px-3 py-2 rounded-md border" onClick={() => updateItem(bonus.id, { priority: (bonus.priority ?? 0) + 1 })}>Öncelik +1</button>
                <a className="px-3 py-2 rounded-md border text-center" href={`/admin/bonuses/${bonus.id}`}>Düzenle</a>
              </div>
            </div>
          ))}
        </div>
        {listedItems.length === 0 && (
          <div className="text-center text-muted-foreground py-8">Listelenecek bonus bulunamadı.</div>
        )}
      </section>

      {/* Hızlı Ekle Formu */}
      <form onSubmit={createItem} className="border rounded-md p-4 space-y-4">
        {/* Görseller */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm">Bet Sitesi Logosu</label>
            <div className="flex items-center gap-2">
              <input
                className="border rounded-md px-3 py-2 flex-1"
                placeholder="Görsel URL"
                value={form.imageUrl ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              />
              <Button type="button" variant="outline" onClick={() => setMediaOpenForm(true)}>Görsel Seç / Yükle</Button>
              <MediaPicker
                open={mediaOpenForm}
                onOpenChange={setMediaOpenForm}
                onSelect={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                title="Logo Seç / Yükle"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm">Bonus Kare Görseli (Instagram post)</label>
            <div className="flex items-center gap-2">
              <input
                className="border rounded-md px-3 py-2 flex-1"
                placeholder="Kare görsel URL"
                value={form.postImageUrl ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, postImageUrl: e.target.value }))}
              />
              <Button type="button" variant="outline" onClick={() => setMediaOpenPost(true)}>Görsel Seç / Yükle</Button>
              <MediaPicker
                open={mediaOpenPost}
                onOpenChange={setMediaOpenPost}
                onSelect={(url) => setForm((f) => ({ ...f, postImageUrl: url }))}
                title="Kare Görsel Seç / Yükle"
              />
            </div>
          </div>
        </div>

        {/* Başlık ve slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="border rounded-md px-3 py-2"
            placeholder="Başlık"
            value={form.title ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: slugifyTr(e.target.value, { withHyphens: true, maxLen: 64 }) }))}
            required
          />
          <input
            className="border rounded-md px-3 py-2"
            type="hidden"
            value={form.slug ?? ''}
            readOnly
            required
          />
        </div>

        {/* Tür & Kategori */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Bonus Türü */}
          <div className="space-y-2">
            <select
              className="border rounded-md px-3 py-2 w-full"
              value={form.bonusType ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, bonusType: e.target.value || null }))}
            >
              <option value="">Bonus Türü (seçiniz)</option>
              {typeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                className="border rounded-md px-3 py-2 w-full"
                placeholder="Yeni tür ekle"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              />
              <button
                type="button"
                className="px-3 py-2 rounded-md border"
                onClick={() => {
                  const v = newType.trim(); if (!v) return;
                  setTypeOptions(prev => Array.from(new Set([...prev, v])));
                  setForm(f => ({ ...f, bonusType: v }));
                  setNewType('');
                }}
              >Ekle</button>
            </div>
          </div>
          {/* Site Kategorisi */}
          <div className="space-y-2">
            <select
              className="border rounded-md px-3 py-2 w-full"
              value={form.gameCategory ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, gameCategory: e.target.value || null }))}
            >
              <option value="">Site Kategorisi (seçiniz)</option>
              {categoryOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                className="border rounded-md px-3 py-2 w-full"
                placeholder="Yeni kategori ekle"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button
                type="button"
                className="px-3 py-2 rounded-md border"
                onClick={() => {
                  const v = newCategory.trim(); if (!v) return;
                  setCategoryOptions(prev => Array.from(new Set([...prev, v])));
                  setForm(f => ({ ...f, gameCategory: v }));
                  setNewCategory('');
                }}
              >Ekle</button>
            </div>
          </div>
        </div>

        {/* Sayısal alanlar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="number"
            className="border rounded-md px-3 py-2"
            placeholder="Tutar (TL)"
            value={form.amount ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
          />
          <input
            type="number"
            className="border rounded-md px-3 py-2"
            placeholder="Çevirim (wager)"
            value={form.wager ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, wager: Number(e.target.value) }))}
          />
          <input
            type="number"
            className="border rounded-md px-3 py-2"
            placeholder="Min. Yatırım (TL)"
            value={form.minDeposit ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, minDeposit: Number(e.target.value) }))}
          />
        </div>

        {/* CTA */}
        <div>
          <input
            className="border rounded-md px-3 py-2 w-full"
            placeholder="CTA URL"
            value={form.ctaUrl ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
          />
        </div>

        {/* Açıklamalar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm">Açıklama</label>
            <textarea
              className="border rounded-md px-3 py-2 w-full"
              rows={3}
              value={form.description ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Kısa Açıklama (kart/metin alanı için)</label>
            <input
              className="border rounded-md px-3 py-2 w-full"
              placeholder="Örn: Çevrim şartsız deneme bonusu"
              value={form.shortDescription ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
            />
          </div>
        </div>

        {/* Geçerlilik ve Tarihler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="border rounded-md px-3 py-2"
            placeholder="Geçerlilik Metni"
            value={form.validityText ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, validityText: e.target.value }))}
          />
          <div className="space-y-2">
            <label className="text-sm">Başlangıç Tarihi</label>
            <input
              type="date"
              className="border rounded-md px-3 py-2 w-full"
              value={form.startDate ? String(form.startDate).substring(0, 10) : ''}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Bitiş Tarihi</label>
            <input
              type="date"
              className="border rounded-md px-3 py-2 w-full"
              value={form.endDate ? String(form.endDate).substring(0, 10) : ''}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
        </div>

        {/* Rozetler */}
        <div className="space-y-2">
          <label className="text-sm">Rozetler</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(form.badges ?? []).map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded border">
                {tag}
                <button type="button" className="text-red-500" onClick={() => setForm(f => ({ ...f, badges: (f.badges ?? []).filter((t) => t !== tag) }))}>x</button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              className="border rounded-md px-3 py-2 w-full"
              placeholder="Örn: Lisanslı, SSL, 18+"
              value={newBadge}
              onChange={(e) => setNewBadge(e.target.value)}
            />
            <button
              type="button"
              className="px-3 py-2 rounded-md border"
              onClick={() => {
                const raw = newBadge.trim();
                if (!raw) return;
                const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
                if (parts.length === 0) return;
                setForm(f => ({ ...f, badges: Array.from(new Set([...(f.badges ?? []), ...parts])) }))
                setNewBadge('')
              }}
            >Ekle</button>
          </div>
          {availableBadges.length > 0 && (
            <div className="text-xs text-muted-foreground mt-2">
              Önerilen: {availableBadges.map((t) => (
                <button key={t} type="button" className="mr-2 underline" onClick={() => setForm(f => ({ ...f, badges: Array.from(new Set([...(f.badges ?? []), t])) }))}>{t}</button>
              ))}
            </div>
          )}
        </div>

        {/* Özellikler */}
        <div className="space-y-2">
          <label className="text-sm">Özellikler / Alt Yazılar</label>
          <div className="space-y-2">
            {(form.features ?? []).map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input className="border rounded-md px-3 py-2 w-full" value={feat} onChange={(e) => {
                  const arr = [...(form.features ?? [])];
                  arr[idx] = e.target.value;
                  setForm(f => ({ ...f, features: arr }))
                }} />
                <button type="button" className="px-3 py-2 rounded-md border" onClick={() => setForm(f => ({ ...f, features: (f.features ?? []).filter((_, i) => i !== idx) }))}>Sil</button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              className="border rounded-md px-3 py-2 w-full"
              placeholder="Örn: Çevrim Şartsız"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
            />
            <button
              type="button"
              className="px-3 py-2 rounded-md border"
              onClick={() => {
                const val = newFeature.trim(); if (!val) return;
                setForm(f => ({ ...f, features: [...(f.features ?? []), val] }))
                setNewFeature('')
              }}
            >Ekle</button>
          </div>
        </div>

        {/* Durumlar ve aksiyonlar */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Aktif
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.isFeatured}
              onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
            />
            Öne Çıkan
          </label>
          <div className="flex items-center gap-2">
            <span>Öncelik</span>
            <input
              type="number"
              className="border rounded-md px-3 py-2 w-24"
              value={form.priority ?? 0}
              onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 rounded-md bg-primary text-primary-foreground">Kaydet</button>
          <button type="submit" className="px-4 py-2 rounded-md border" onClick={() => { setSendForApproval(true); }}>Onaya Gönder</button>
        </div>
      </form>

      {loading && <div className="p-3">Yükleniyor...</div>}
    </div>
  )
}