"use client"
import { useEffect, useMemo, useState } from 'react'
import { Award, Calendar, Check, Clock, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MediaPicker } from '@/components/media/MediaPicker'

type Bonus = {
  id: string
  title: string
  slug: string
  bonusType?: string | null
  gameCategory?: string | null
  amount?: number | null
  wager?: number | null
  minDeposit?: number | null
  imageUrl?: string | null
  ctaUrl?: string | null
  isActive: boolean
  isFeatured?: boolean
  priority?: number
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
  }

  useEffect(() => {
    load()
    ;(async () => {
      try {
        const res = await fetch('/api/bonuses')
        const all = await res.json()
        const types = Array.from(new Set((all || []).map((b: any) => b.bonusType).filter(Boolean)))
        const cats = Array.from(new Set((all || []).map((b: any) => b.gameCategory).filter(Boolean)))
        if (types.length) setTypeOptions((prev) => Array.from(new Set<string>([...prev, ...types])))
        if (cats.length) setCategoryOptions((prev) => Array.from(new Set<string>([...prev, ...cats])))
      } catch {}
    })()
  }, [])

  const createItem = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/bonuses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setForm({ isActive: true, isFeatured: false, priority: 0 })
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
  }, [items, searchQuery, activeFilter, amountFilter, featuredFilter])

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
            {featuredItems.map((bonus) => (
              <div key={bonus.id} className="relative overflow-hidden backdrop-blur-lg bg-opacity-80 bg-card border-2 border-gold rounded-2xl p-4">
                <div className="absolute top-4 right-4">
                  <span className="text-xs px-2 py-1 rounded-full bg-gold text-background">ÖNE ÇIKAN</span>
                </div>
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Award className="w-8 h-8 text-gold" />
                </div>
                <div className="text-center space-y-2">
                  <div className="text-lg font-medium">{bonus.title}</div>
                  <div className="text-3xl font-bold text-gold">{bonus.amount ?? 0} TL</div>
                  <div className="text-muted-foreground">Deneme Bonusu</div>
                  <div className="space-y-1">
                    {['Çevrim Şartsız', '7/24 Destek'].map((f, i) => (
                      <div key={i} className="flex items-center justify-center text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-gold mr-2" /> {f}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 inline mr-1" /> Son 5 gün
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {['Lisanslı', 'SSL', 'Güvenilir'].map((b, i) => (
                      <span key={i} className="px-2 py-1 rounded-full border text-center">{b}</span>
                    ))}
                  </div>
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
          {listedItems.map((bonus) => (
            <div key={bonus.id} className="backdrop-blur-lg bg-opacity-80 bg-card border rounded-2xl p-4 hover:border-gold transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-gold" />
                </div>
                <span className="text-xs border rounded-full px-2 py-1">{bonus.wager ? `${bonus.wager}x` : 'wager yok'}</span>
              </div>
              <div className="text-lg font-medium">{bonus.title}</div>
              <div className="text-2xl font-bold text-gold">{bonus.amount ?? 0} TL</div>
              <div className="text-xs text-muted-foreground mb-4">
                <Calendar className="w-3 h-3 inline mr-1" /> Min. Yatırım: {bonus.minDeposit ?? 0} TL
              </div>
              <div className="space-y-2 mb-4">
                {['Çevrim Şartsız', 'Anında Çekim'].map((f, i) => (
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
      <form onSubmit={createItem} className="border rounded-md p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="border rounded-md px-3 py-2"
            placeholder="Başlık"
            value={form.title ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <input
            className="border rounded-md px-3 py-2"
            placeholder="Slug"
            value={form.slug ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            required
          />
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
          <input
            type="number"
            className="border rounded-md px-3 py-2"
            placeholder="Tutar"
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
            placeholder="Min. Yatırım"
            value={form.minDeposit ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, minDeposit: Number(e.target.value) }))}
          />
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
              title="Bonus Görseli Seç / Yükle"
            />
          </div>
          <input
            className="border rounded-md px-3 py-2"
            placeholder="CTA URL"
            value={form.ctaUrl ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
          />
        </div>
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
        <button type="submit" className="px-4 py-2 rounded-md bg-primary text-primary-foreground">Ekle</button>
      </form>

      {loading && <div className="p-3">Yükleniyor...</div>}
    </div>
  )
}