"use client"
import { useEffect, useMemo, useState } from 'react'
import { Award, Calendar, Check, Clock, Star, Filter, GripVertical, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
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
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" /> Filtreler
          </CardTitle>
          <CardDescription className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1"><Search className="w-4 h-4" /> Arama ve filtrelerle listeyi daraltın.</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Input
              placeholder="Bonus veya site ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={featuredFilter} onValueChange={(v) => setFeaturedFilter(v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Öne Çıkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Öne Çıkan (Tümü)</SelectItem>
                <SelectItem value="featured">Öne Çıkan</SelectItem>
                <SelectItem value="nonfeatured">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={amountFilter} onValueChange={(v) => setAmountFilter(v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tutar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutar (Tümü)</SelectItem>
                <SelectItem value="0-100">0–100</SelectItem>
                <SelectItem value="100-200">100–200</SelectItem>
                <SelectItem value="200+">200+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <div className="text-sm text-muted-foreground">{filtered.length} bonus bulundu</div>
        </CardFooter>
      </Card>

      {/* Öne Çıkan Bonuslar */}
      {featuredItems.length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-gold">
              <Star className="w-5 h-5" /> Öne Çıkan Bonuslar
            </CardTitle>
            <CardDescription>Yüksek öncelikli ve öne çıkan bonus kartları.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.map((bonus, index) => (
              <Card
                key={bonus.id}
                className="relative cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={() => onDragStart(index)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(index, true)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-16 rounded-md flex items-center justify-center border bg-background">
                      {bonus.imageUrl ? (
                        <img src={bonus.imageUrl} alt={bonus.title} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Award className="w-8 h-8 text-gold" />
                      )}
                    </div>
                    <Badge variant="secondary">ÖNE ÇIKAN</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-lg font-medium text-center">{bonus.title}</div>
                  {bonus.brandId && (
                    <div className="text-xs text-muted-foreground text-center">Gönderen: {bonus.createdByName || bonus.createdByLoginId || bonus.brand?.name || bonus.brand?.slug || '—'}</div>
                  )}
                  <div className="text-3xl font-bold text-gold text-center">{bonus.amount ?? 0} TL</div>
                  <div className="text-muted-foreground text-center">{bonus.bonusType ?? 'Bonus'}</div>
                  <div className="space-y-1">
                    {(bonus.features ?? []).map((f, i) => (
                      <div key={i} className="flex items-center justify-center text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-gold mr-2" /> {f}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    <Clock className="w-3 h-3 inline mr-1" /> Son 5 gün
                  </div>
                  {(bonus.badges ?? []).length > 0 && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {(bonus.badges ?? []).map((b, i) => (
                        <span key={i} className="px-2 py-1 rounded-full border text-center">{b}</span>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button variant="outline" onClick={() => updateItem(bonus.id, { isFeatured: false })}>Normal Yap</Button>
                  <Button variant="outline" onClick={() => updateItem(bonus.id, { isActive: !bonus.isActive })}>{bonus.isActive ? 'Pasifleştir' : 'Aktifleştir'}</Button>
                  <Button variant="outline" asChild>
                    <a href={`/admin/bonuses/${bonus.id}`}>Düzenle</a>
                  </Button>
                  <Button variant="outline" onClick={() => deleteItem(bonus.id)}>Sil</Button>
                </CardFooter>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Listelenen Bonuslar */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" /> Listelenen Bonuslar
          </CardTitle>
          <CardDescription>Drag & drop ile sıralamayı değiştirebilirsiniz.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {listedItems.map((bonus, index) => (
            <Card
              key={bonus.id}
              className="cursor-grab active:cursor-grabbing hover:border-gold transition-colors"
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(index, false)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-md flex items-center justify-center border bg-background">
                      {bonus.imageUrl ? (
                        <img src={bonus.imageUrl} alt={bonus.title} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Award className="w-6 h-6 text-gold" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{bonus.title}</span>
                  </div>
                  <GripVertical className="w-4 h-4 opacity-50" />
                </div>
              </CardHeader>
              <CardContent>
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
              </CardContent>
              <CardFooter className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => updateItem(bonus.id, { isFeatured: true })}>Öne Çıkar</Button>
                <Button variant="outline" onClick={() => updateItem(bonus.id, { isActive: !bonus.isActive })}>{bonus.isActive ? 'Pasifleştir' : 'Aktifleştir'}</Button>
                <Button variant="outline" onClick={() => deleteItem(bonus.id)}>Sil</Button>
                <Button variant="outline" onClick={() => updateItem(bonus.id, { priority: (bonus.priority ?? 0) + 1 })}>Öncelik +1</Button>
                <Button variant="outline" asChild>
                  <a href={`/admin/bonuses/${bonus.id}`}>Düzenle</a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </CardContent>
        {listedItems.length === 0 && (
          <CardFooter>
            <div className="text-center text-muted-foreground py-8 w-full">Listelenecek bonus bulunamadı.</div>
          </CardFooter>
        )}
      </Card>

      {/* Hızlı Ekle Formu */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Hızlı Bonus Ekle</CardTitle>
          <CardDescription>Gerekli alanları doldurarak yeni bonus ekleyin.</CardDescription>
        </CardHeader>
        <form onSubmit={createItem}>
          <CardContent className="space-y-4">
            {/* Görseller */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm">Bet Sitesi Logosu</label>
            <div className="flex items-center gap-2">
              <Input
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
              <Input
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
          <Input
            placeholder="Başlık"
            value={form.title ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: slugifyTr(e.target.value, { withHyphens: true, maxLen: 64 }) }))}
            required
          />
          <Input
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
            <Select value={form.bonusType ?? ''} onValueChange={(v) => setForm((f) => ({ ...f, bonusType: v || null }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Bonus Türü (seçiniz)" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Yeni tür ekle"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const v = newType.trim(); if (!v) return;
                  setTypeOptions(prev => Array.from(new Set([...prev, v])));
                  setForm(f => ({ ...f, bonusType: v }));
                  setNewType('');
                }}
              >Ekle</Button>
            </div>
          </div>
          {/* Site Kategorisi */}
          <div className="space-y-2">
            <Select value={form.gameCategory ?? ''} onValueChange={(v) => setForm((f) => ({ ...f, gameCategory: v || null }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Site Kategorisi (seçiniz)" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Yeni kategori ekle"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const v = newCategory.trim(); if (!v) return;
                  setCategoryOptions(prev => Array.from(new Set([...prev, v])));
                  setForm(f => ({ ...f, gameCategory: v }));
                  setNewCategory('');
                }}
              >Ekle</Button>
            </div>
          </div>
        </div>

        {/* Sayısal alanlar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            type="number"
            placeholder="Tutar (TL)"
            value={form.amount ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
          />
          <Input
            type="number"
            placeholder="Çevirim (wager)"
            value={form.wager ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, wager: Number(e.target.value) }))}
          />
          <Input
            type="number"
            placeholder="Min. Yatırım (TL)"
            value={form.minDeposit ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, minDeposit: Number(e.target.value) }))}
          />
        </div>

        {/* CTA */}
        <div>
          <Input
            placeholder="CTA URL"
            value={form.ctaUrl ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
          />
        </div>

        {/* Açıklamalar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm">Açıklama</label>
            <Textarea
              rows={3}
              value={form.description ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Kısa Açıklama (kart/metin alanı için)</label>
            <Input
              placeholder="Örn: Çevrim şartsız deneme bonusu"
              value={form.shortDescription ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
            />
          </div>
        </div>

        {/* Geçerlilik ve Tarihler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder="Geçerlilik Metni"
            value={form.validityText ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, validityText: e.target.value }))}
          />
          <div className="space-y-2">
            <label className="text-sm">Başlangıç Tarihi</label>
            <Input
              type="date"
              value={form.startDate ? String(form.startDate).substring(0, 10) : ''}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Bitiş Tarihi</label>
            <Input
              type="date"
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
                <Button type="button" variant="destructive" size="sm" className="h-5 px-2" onClick={() => setForm(f => ({ ...f, badges: (f.badges ?? []).filter((t) => t !== tag) }))}>Sil</Button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Örn: Lisanslı, SSL, 18+"
              value={newBadge}
              onChange={(e) => setNewBadge(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const raw = newBadge.trim();
                if (!raw) return;
                const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
                if (parts.length === 0) return;
                setForm(f => ({ ...f, badges: Array.from(new Set([...(f.badges ?? []), ...parts])) }))
                setNewBadge('')
              }}
            >Ekle</Button>
          </div>
          {availableBadges.length > 0 && (
            <div className="text-xs text-muted-foreground mt-2">
              Önerilen: {availableBadges.map((t) => (
                <Button key={t} type="button" variant="link" className="mr-2 px-0" onClick={() => setForm(f => ({ ...f, badges: Array.from(new Set([...(f.badges ?? []), t])) }))}>{t}</Button>
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
                <Input className="w-full" value={feat} onChange={(e) => {
                  const arr = [...(form.features ?? [])];
                  arr[idx] = e.target.value;
                  setForm(f => ({ ...f, features: arr }))
                }} />
                <Button type="button" variant="outline" onClick={() => setForm(f => ({ ...f, features: (f.features ?? []).filter((_, i) => i !== idx) }))}>Sil</Button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Örn: Çevrim Şartsız"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const val = newFeature.trim(); if (!val) return;
                setForm(f => ({ ...f, features: [...(f.features ?? []), val] }))
                setNewFeature('')
              }}
            >Ekle</Button>
          </div>
        </div>

        {/* Durumlar ve aksiyonlar */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <Checkbox checked={!!form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: !!v }))} />
            Aktif
          </label>
          <label className="flex items-center gap-2">
            <Checkbox checked={!!form.isFeatured} onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: !!v }))} />
            Öne Çıkan
          </label>
          <div className="flex items-center gap-2">
            <span>Öncelik</span>
            <Input
              type="number"
              className="w-24"
              value={form.priority ?? 0}
              onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
            />
          </div>
        </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button type="submit">Kaydet</Button>
            <Button type="submit" variant="outline" onClick={() => { setSendForApproval(true); }}>Onaya Gönder</Button>
          </CardFooter>
        </form>
      </Card>

      {loading && <div className="p-3">Yükleniyor...</div>}
    </div>
  )
}