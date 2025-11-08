"use client";

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ExternalLink, MessageSquare, ThumbsUp, ThumbsDown, AlertCircle, CheckCircle2, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
// MediaPicker kaldırıldı: doğrudan dosya yükleme kullanılacak
import { isSafeLocalUploadPath } from '@/lib/security'

type ReviewBrand = { id: string; name: string; slug: string; logoUrl?: string | null; siteUrl?: string | null; editorialSummary?: string | null }
interface Review { id: string; author?: string | null; isAnonymous: boolean; isPositive?: boolean | null; rating?: number | null; content: string; imageUrl?: string | null; imageUrls?: string[] | null; createdAt: string; helpfulCount: number; notHelpfulCount: number; repliedBy?: string | null; replyText?: string | null; repliedAt?: string | null; avatarUrl?: string | null }

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export default function YorumDetayClient({ slug, initialSite, initialReviews }: { slug: string; initialSite?: ReviewBrand | null; initialReviews?: Review[] | null }) {
  const [site, setSite] = useState<ReviewBrand | null>(initialSite ?? null)
  const [reviews, setReviews] = useState<Review[]>(initialReviews ?? [])
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [toneFilter, setToneFilter] = useState<'all' | 'positive' | 'negative'>('all')
  const [hasImageOnly, setHasImageOnly] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { toast } = useToast()

  // Form state
  const [author, setAuthor] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [isPositive, setIsPositive] = useState<boolean | null>(null)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [imageUrls, setImageUrls] = useState<(string | null)[]>([])
  const [uploading, setUploading] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingIndex, setPendingIndex] = useState<number | null>(null)
  const [dragActive, setDragActive] = useState<boolean>(false)
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState<number>(0)
  const [lightboxCaption, setLightboxCaption] = useState<string>('')


  // Simple captcha (math)
  const [captchaA, setCaptchaA] = useState<number>(() => Math.floor(Math.random()*5)+2)
  const [captchaB, setCaptchaB] = useState<number>(() => Math.floor(Math.random()*5)+2)
  const [captchaInput, setCaptchaInput] = useState<string>('')
  const captchaOk = useMemo(() => Number(captchaInput) === (captchaA + captchaB), [captchaInput, captchaA, captchaB])
  const regenCaptcha = () => { setCaptchaA(Math.floor(Math.random()*5)+2); setCaptchaB(Math.floor(Math.random()*5)+2); setCaptchaInput('') }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        // Site bilgisi yoksa getir
        if (!site) {
          const siteRes = await fetch(`/api/review-brands/by-slug/${slug}`)
          const siteData = await siteRes.json()
          if (siteRes.ok) setSite(siteData)
        }
        // İlk yüklemede newest için initialReviews varsa tekrar fetch etme
        const shouldFetchList = !(sort === 'newest' && !hasImageOnly && Array.isArray(initialReviews) && initialReviews.length > 0)
        if (shouldFetchList) {
          const listRes = await fetch(`/api/site-reviews?brandSlug=${slug}&sort=${sort}${hasImageOnly ? '&hasImage=true' : ''}`)
          const listData = await listRes.json()
          if (listRes.ok) setReviews(listData.items || [])
        }
        setError(null)
      } catch (e: any) {
        setError(e?.message ?? 'Yüklenemedi')
      } finally {
        setLoading(false)
      }
    })()
  }, [slug, sort, hasImageOnly])

  const summary: string = useMemo(() => String(site?.editorialSummary ?? ''), [site])

  const handleSubmit = async () => {
    if (typeof isPositive !== 'boolean') {
      toast({ variant: 'destructive', title: 'Eksik bilgi', description: 'Lütfen yorum türünü (olumlu/olumsuz) seçin.' })
      return
    }
    if (!isAnonymous && !author.trim()) {
      toast({ variant: 'destructive', title: 'Eksik bilgi', description: 'Lütfen kullanıcı adı veya takma ad girin.' })
      return
    }
    if (!content.trim()) {
      toast({ variant: 'destructive', title: 'Eksik bilgi', description: 'Lütfen yorum metni girin.' })
      return
    }
    try {
      setSubmitting(true)
      const finalContent = content
      const res = await fetch('/api/site-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandSlug: slug, author, isAnonymous, isPositive, content: finalContent, imageUrls: imageUrls.filter((u): u is string => typeof u === 'string') }),
      })
      if (res.ok) {
        setContent('')
        setAuthor('')
        setIsPositive(null)
        setIsAnonymous(true)
        setImageUrls([])
        regenCaptcha()
        toast({ title: 'Gönderildi', description: 'Moderatör onayından sonra mesajınız görüntülenecek.' })
      } else {
        const data = await res.json()
        toast({ variant: 'destructive', title: 'Gönderim hatası', description: data?.error ?? 'Gönderim hatası' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Dosya yükleme alanı için yardımcılar
  function canAddMoreImages(): boolean {
    const filledCount = imageUrls.filter(Boolean).length
    return filledCount < 3
  }

  async function processFiles(files: FileList | File[]) {
    const allowed = new Set(['image/png', 'image/jpeg'])
    for (const file of Array.from(files)) {
      if (!canAddMoreImages()) break
      if (!allowed.has(file.type)) { setUploadError('Sadece PNG/JPEG'); continue }
      if (file.size > 500 * 1024) { setUploadError('Maksimum 500KB'); continue }
      try {
        setUploading(true)
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (res.ok && data?.url) {
          const url = String(data.url)
          setImageUrls((prev) => {
            const next = [...prev]
            const target = typeof pendingIndex === 'number' ? pendingIndex : next.findIndex((v) => v == null)
            if (target >= 0) {
              next[target] = url
            } else if (next.length < 3) {
              next.push(url)
            }
            return next.slice(0,3)
          })
        } else {
          setUploadError(data?.error || 'Yükleme başarısız')
        }
      } catch (err: any) {
        setUploadError(err?.message || 'Yükleme hatası')
      } finally {
        setUploading(false)
      }
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadError(null)
    if (!canAddMoreImages() && pendingIndex === null) { setUploadError('En fazla 3 görsel yükleyebilirsiniz.') ; e.target.value = ''; return }
    await processFiles(files)
    e.target.value = ''
    setPendingIndex(null)
  }

  function removeImageAt(index: number) {
    setImageUrls((prev) => {
      const next = [...prev]
      next[index] = null
      return next
    })
  }

  function openLightbox(images: string[], index: number, caption?: string) {
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxCaption(String(caption ?? ''))
    setLightboxOpen(true)
  }
  function closeLightbox() { setLightboxOpen(false) }
  function prevLightbox() { setLightboxIndex((i) => (i - 1 + lightboxImages.length) % lightboxImages.length) }
  function nextLightbox() { setLightboxIndex((i) => (i + 1) % lightboxImages.length) }

  useEffect(() => {
    if (!lightboxOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') prevLightbox()
      if (e.key === 'ArrowRight') nextLightbox()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen, lightboxImages.length])

  const vote = async (id: string, action: 'helpful' | 'not_helpful') => {
    try {
      await fetch(`/api/site-reviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
      // optimistic update
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, helpfulCount: r.helpfulCount + (action==='helpful'?1:0), notHelpfulCount: r.notHelpfulCount + (action==='not_helpful'?1:0) } : r))
    } catch {}
  }

  async function handleVoteWithUndo(id: string, action: 'helpful' | 'not_helpful') {
    const key = `sr_vote_${id}`
    const existing = typeof window !== 'undefined' ? localStorage.getItem(key) : null
    // Zaten oy varsa geri alma öner
    if (existing) {
      toast({
        title: 'Oy zaten kayıtlı',
        description: 'Bu yoruma zaten oy verdiniz.',
        action: (
          <ToastAction
            altText="Geri al"
            onClick={async () => {
              const undo = existing === 'helpful' ? 'undo_helpful' : 'undo_not_helpful'
              try {
                const res = await fetch(`/api/site-reviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: undo }) })
                if (res.ok) {
                  setReviews((prev) => prev.map((r) => r.id === id ? {
                    ...r,
                    helpfulCount: Math.max(0, r.helpfulCount - (existing === 'helpful' ? 1 : 0)),
                    notHelpfulCount: Math.max(0, r.notHelpfulCount - (existing === 'not_helpful' ? 1 : 0)),
                  } : r))
                  localStorage.removeItem(key)
                  toast({ title: 'Oy geri alındı' })
                } else {
                  const data = await res.json().catch(()=>({}))
                  toast({ variant: 'destructive', title: 'Geri alma başarısız', description: String(data?.error || 'Hata') })
                }
              } catch (e: any) {
                toast({ variant: 'destructive', title: 'Geri alma hatası', description: e?.message ?? 'Hata' })
              }
            }}
          >
            Geri al
          </ToastAction>
        ),
      })
      return
    }

    try {
      const res = await fetch(`/api/site-reviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
      const data = await res.json().catch(()=>({}))
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Oy başarısız', description: String(data?.error || 'Hata') })
        return
      }
      // optimistic update
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, helpfulCount: r.helpfulCount + (action==='helpful'?1:0), notHelpfulCount: r.notHelpfulCount + (action==='not_helpful'?1:0) } : r))
      localStorage.setItem(key, action)
      toast({
        title: 'Oy kaydedildi',
        action: (
          <ToastAction
            altText="Geri al"
            onClick={async () => {
              const undo = action === 'helpful' ? 'undo_helpful' : 'undo_not_helpful'
              try {
                const res2 = await fetch(`/api/site-reviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: undo }) })
                const data2 = await res2.json().catch(()=>({}))
                if (!res2.ok) {
                  toast({ variant: 'destructive', title: 'Geri alma başarısız', description: String(data2?.error || 'Hata') })
                  return
                }
                setReviews((prev) => prev.map((r) => r.id === id ? {
                  ...r,
                  helpfulCount: Math.max(0, r.helpfulCount - (action === 'helpful' ? 1 : 0)),
                  notHelpfulCount: Math.max(0, r.notHelpfulCount - (action === 'not_helpful' ? 1 : 0)),
                } : r))
                localStorage.removeItem(key)
                toast({ title: 'Oy geri alındı' })
              } catch (e: any) {
                toast({ variant: 'destructive', title: 'Geri alma hatası', description: e?.message ?? 'Hata' })
              }
            }}
          >
            Geri al
          </ToastAction>
        ),
      })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Oy hatası', description: e?.message ?? 'Hata' })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header currentPath={`/yorumlar`} />
      <main className="container mx-auto px-4 py-8 md:pl-72">
        {loading && <div className="text-center text-muted-foreground py-6">Yükleniyor…</div>}
        {error && <div className="text-center text-red-500 py-6">{error}</div>}

        {!!site && (
          <>
            {/* Üst Bilgi */}
            <motion.section initial="initial" animate="animate" variants={fadeInUp} className="mb-8 p-6 bg-card rounded-2xl border">
              <div className="flex flex-col md:flex-row gap-4 md:items-center">
                <div className="w-28 h-16 overflow-hidden bg-muted border rounded-md flex items-center justify-center">
                  {site.logoUrl ? (
                    <img src={site.logoUrl} alt={site.name} className="w-full h-full object-contain" />
                  ) : (
                    <img src="/logo.svg" alt="logo" className="w-16 h-16" />
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gold mb-1">{site.name}</h1>
                  {!!summary && <div className="text-sm text-muted-foreground break-all md:break-words overflow-hidden">{summary}</div>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {!!site.siteUrl && (
                    <Button asChild>
                      <a href={site.siteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">Siteye Git <ExternalLink className="w-4 h-4 ml-2" /></a>
                    </Button>
                  )}
                  <Button variant="outline" asChild>
                    <a href="/bonuslar">Bonusları Gör</a>
                  </Button>
                </div>
              </div>
            </motion.section>

            {/* Yorum Bırakma */}
            <motion.section id="yeni-yorum" initial="initial" animate="animate" variants={fadeInUp} className="mb-8 p-6 bg-card rounded-2xl border">
              <h2 className="text-xl font-bold mb-4 flex items-center"><MessageSquare className="w-5 h-5 mr-2" /> Yorum Bırak</h2>

              <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4">
                <div>
                  <label className="text-sm mb-1 block">Kullanıcı Adı / Takma Ad</label>
                  <Input value={author} onChange={(e)=>setAuthor(e.target.value)} placeholder={isAnonymous ? "İsteğe bağlı" : "Zorunlu — kullanıcı adı veya takma ad"} />
                  {(!isAnonymous && !author.trim()) && (
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Lütfen kullanıcı adı veya takma ad girin.</div>
                  )}
                  <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Anonim</span>
                      <span className="text-xs text-muted-foreground">{isAnonymous ? 'İsminiz görüntülenmez.' : 'Anonim değil, isminiz görünebilir.'}</span>
                    </div>
                    <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {isAnonymous ? 'Anonim mod aktif.' : 'Anonim mod kapalı.'}
                  </div>
                </div>
                <div className="md:col-span-2 order-3">
                  <label className="text-sm mb-1 block">Yorum Türü</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" type="button" onClick={()=>setIsPositive(true)} variant={isPositive === true ? 'default' : 'outline'} className={`${isPositive === true ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-emerald-700 border-emerald-600'} w-full`}>
                      <ThumbsUp className="w-4 h-4 mr-2" /> Olumlu
                    </Button>
                    <Button size="sm" type="button" onClick={()=>setIsPositive(false)} variant={isPositive === false ? 'default' : 'outline'} className={`${isPositive === false ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'text-rose-700 border-rose-600'} w-full`}>
                      <ThumbsDown className="w-4 h-4 mr-2" /> Olumsuz
                    </Button>
                  </div>
                  {typeof isPositive !== 'boolean' && (
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Lütfen yorum türünü seçin.</div>
                  )}
                </div>
                <div className="md:col-span-2 order-2">
                  <label className="text-sm mb-1 block">Yorum Metni</label>
                  <Textarea rows={6} value={content} onChange={(e)=>setContent(e.target.value)} placeholder="Deneyiminizi yazın…" />
                  <div className="mt-3">
                    <label className="text-sm mb-1 block">Görsel Yükle (Opsiyonel)</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      multiple
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="hidden"
                    />
                    <div
                      className={`mt-1 flex gap-2 p-2 rounded-md border-2 ${dragActive ? 'border-gold bg-muted/40' : 'border-dashed'}`}
                      onDragOver={(e)=>{ e.preventDefault(); setDragActive(true) }}
                      onDragLeave={(e)=>{ e.preventDefault(); setDragActive(false) }}
                      onDrop={(e)=>{ e.preventDefault(); setDragActive(false); const dt = e.dataTransfer; const files = dt?.files; if (files && files.length) { setPendingIndex(null); processFiles(files) } }}
                      aria-label="Görsel sürükle-bırak alanı"
                    >
                      {[0,1,2].map((idx) => {
                        const url = imageUrls[idx] || null
                        const canClick = !uploading
                        return (
                          <div
                            key={idx}
                            className={`relative aspect-square w-20 sm:w-24 border-2 rounded-md ${url ? 'border-muted' : 'border-dashed'} flex items-center justify-center ${canClick ? 'cursor-pointer hover:bg-muted/40' : 'opacity-50 cursor-not-allowed'} bg-card`}
                            onClick={() => { if (!canClick) return ; setPendingIndex(idx); fileInputRef.current?.click() }}
                            aria-label={`Görsel yükle ${idx+1}`}
                            role="button"
                          >
                            {url ? (
                              <>
                                <img src={url} alt="yüklenen görsel" className="absolute inset-0 w-full h-full object-cover rounded-md" loading="lazy" />
                                <Button type="button" variant="destructive" size="sm" className="absolute top-1 right-1 h-6 px-2" onClick={(e)=>{ e.stopPropagation(); removeImageAt(idx) }}>Kaldır</Button>
                              </>
                            ) : (
                              <div className="text-muted-foreground flex items-center justify-center"><Plus className="w-6 h-6" /></div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Maksimum 500KB. PNG/JPEG izin verilir. Görsel yükleme opsiyoneldir.</p>
                    {uploadError && <div className="mt-1 text-xs text-red-600">{uploadError}</div>}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm">Doğrulama:</span>
                  <span className="font-mono text-sm">{captchaA} + {captchaB} =</span>
                  <Input
                    className="w-16 sm:w-20 h-8"
                    value={captchaInput}
                    onChange={(e)=>setCaptchaInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="?"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                  />
                  <Button size="sm" variant="outline" type="button" onClick={regenCaptcha}>Yenile</Button>
                </div>
                <Button size="sm" className="w-full sm:w-auto" onClick={()=>{ if (!captchaOk) { toast({ variant: 'destructive', title: 'Doğrulama gerekli', description: 'Captcha hatalı' }); return } ; handleSubmit() }} disabled={submitting || typeof isPositive !== 'boolean' || (!isAnonymous && !author.trim())}>{submitting ? 'Gönderiliyor…' : 'Yorumu Gönder'}</Button>

              </div>
            </motion.section>

            {/* Yorumlar Liste */}
            <motion.section initial="initial" animate="animate" variants={fadeInUp}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                <h2 className="text-xl font-bold">Yorumlar</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" variant={sort==='newest'?'default':'outline'} onClick={()=>setSort('newest')}>En Yeni</Button>
                  <Button size="sm" variant={sort==='oldest'?'default':'outline'} onClick={()=>setSort('oldest')}>En Eski</Button>
                  <span className="mx-2 border-l h-5" />
                  <Button size="sm" variant={toneFilter==='all'?'default':'outline'} onClick={()=>setToneFilter('all')}>Tümü</Button>
                  <Button size="sm" variant={toneFilter==='positive'?'default':'outline'} onClick={()=>setToneFilter('positive')}><ThumbsUp className="w-4 h-4 mr-1" /> Olumlu</Button>
                  <Button size="sm" variant={toneFilter==='negative'?'default':'outline'} onClick={()=>setToneFilter('negative')}><ThumbsDown className="w-4 h-4 mr-1" /> Olumsuz</Button>
                  <span className="mx-2 border-l h-5" />
                  <Button size="sm" variant={hasImageOnly?'default':'outline'} onClick={()=>setHasImageOnly((v)=>!v)}>Sadece görsel içerenler</Button>
                </div>
              </div>

              {(() => {
                const filtered = (toneFilter==='all' ? reviews : reviews.filter((r)=> toneFilter==='positive' ? r.isPositive === true : r.isPositive === false))
                const withImage = hasImageOnly ? filtered.filter((r) => {
                  const imgs = Array.isArray(r.imageUrls) && r.imageUrls?.length ? r.imageUrls! : (r.imageUrl ? [r.imageUrl] : [])
                  return imgs.length > 0
                }) : filtered
                return withImage.length === 0
              })() && (
                <div className="text-sm text-muted-foreground">Bu filtrelerle yorum bulunmuyor.</div>
              )}

              <div className="space-y-4">
                {(() => {
                  const filtered = (toneFilter==='all' ? reviews : reviews.filter((r)=> toneFilter==='positive' ? r.isPositive === true : r.isPositive === false))
                  const withImage = hasImageOnly ? filtered.filter((r) => {
                    const imgs = Array.isArray(r.imageUrls) && r.imageUrls?.length ? r.imageUrls! : (r.imageUrl ? [r.imageUrl] : [])
                    return imgs.length > 0
                  }) : filtered
                  return withImage
                })().map((r) => (
                  <Card key={r.id} className="rounded-xl border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <img
                            src={r.avatarUrl || `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(r.id)}&size=64&radius=50&backgroundType=gradientLinear`}
                            alt="Profil"
                            className="w-10 h-10 rounded-full border mr-3"
                            loading="lazy"
                          />
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-sm">{r.isAnonymous ? 'Anonim Kullanıcı' : (r.author || 'Kullanıcı')}</span>
                              <TooltipProvider delayDuration={150}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <CheckCircle2 aria-label="Doğrulanmış Kullanıcı" className="w-4 h-4 text-sky-500 ml-1" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">Doğrulanmış Kullanıcı</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="text-xs text-muted-foreground"><Calendar className="w-3 h-3 inline mr-1" /> {new Date(r.createdAt).toLocaleString('tr-TR')}</div>
                          </div>
                        </div>
                        {typeof r.isPositive === 'boolean' && (
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  className={`text-xs ${r.isPositive ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
                                >
                                  {r.isPositive ? 'Olumlu' : 'Olumsuz'}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                {r.isPositive ? 'Olumlu deneyim bildirimi' : 'Olumsuz deneyim bildirimi'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm mb-3 break-words">
                        <RenderedReview content={r.content} />
                        {(() => {
                          const imgs = Array.isArray(r.imageUrls) && r.imageUrls?.length ? r.imageUrls! : (r.imageUrl ? [r.imageUrl] : [])
                          return imgs.length > 0 ? (
                            <div className="mt-2 flex gap-2">
                              {imgs.slice(0,3).map((url, idx) => (
                                <button key={idx} type="button" className="relative w-24 h-24 overflow-hidden rounded-md border focus:outline-none focus:ring-2 focus:ring-gold"
                                  onClick={() => openLightbox(imgs, idx, r.content)}
                                  aria-label={`Görsel ${idx+1} büyüt`}>
                                  <img src={url} alt="yorum görseli" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                                </button>
                              ))}
                            </div>
                          ) : null
                        })()}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Button size="sm" variant="outline" className="gap-1" onClick={()=>handleVoteWithUndo(r.id, 'helpful')}>
                          <ThumbsUp className="w-4 h-4" /> {r.helpfulCount}
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1" onClick={()=>handleVoteWithUndo(r.id, 'not_helpful')}>
                          <ThumbsDown className="w-4 h-4" /> {r.notHelpfulCount}
                        </Button>
                      </div>
                      <div className="hidden"></div>
                      {r.replyText && (
                        <div className="mt-3 p-3 rounded-md border bg-muted/30 text-sm">
                          <div className="font-medium mb-1">Site Temsilcisi Yanıtı{r.repliedBy ? ` – ${r.repliedBy}` : ''}</div>
                          <div>{r.replyText}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.section>
          </>
        )}
      </main>
      <LightboxPortal
        open={lightboxOpen}
        images={lightboxImages}
        index={lightboxIndex}
        caption={lightboxCaption}
        onClose={closeLightbox}
        onPrev={prevLightbox}
        onNext={nextLightbox}
        onSelect={(i)=>setLightboxIndex(i)}
      />
      <Footer />
    </div>
  )
}

interface RenderedReviewProps { content: string }

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '"': return '&quot;'
      case "'": return '&#39;'
      default: return ch
    }
  })
}

function renderReviewContentToHtml(rawInput: string): string {
  const raw = String(rawInput || '')
  const images: string[] = []
  let idx = 0
  const withPlaceholders = raw.replace(/!\[([^\]]*)\]\((\/uploads\/[^)]+)\)/g, (_m, alt, url) => {
    const safeUrl = typeof url === 'string' && isSafeLocalUploadPath(url) ? url : null
    if (!safeUrl) return _m
    const token = `__IMG${idx}__`
    const altEsc = escapeHtml(String(alt || ''))
    images.push(`<img src="${safeUrl}" alt="${altEsc}" class="max-w-full h-auto rounded-md border my-2" loading="lazy" />`)
    idx++
    return token
  })
  // Escape everything
  let escaped = escapeHtml(withPlaceholders)
  // Restore image HTML
  images.forEach((html, i) => {
    escaped = escaped.replace(new RegExp(`__IMG${i}__`, 'g'), html)
  })
  return escaped
}

function RenderedReview({ content }: RenderedReviewProps) {
  const html = useMemo(() => renderReviewContentToHtml(content), [content])
  return <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
}

// Lightbox overlay
// Render at end to avoid z-index issues
// Uses Shadcn Button styles for controls

// Note: Component-scoped rendering within same file

export function LightboxPortal({ open, images, index, caption, onClose, onPrev, onNext, onSelect }: { open: boolean; images: string[]; index: number; caption?: string; onClose: ()=>void; onPrev: ()=>void; onNext: ()=>void; onSelect: (i:number)=>void }) {
  if (!open || !images.length) return null
  const current = images[index]
  const startYRef = useRef<number | null>(null)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => { startYRef.current = e.touches?.[0]?.clientY ?? null }
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (startYRef.current == null) return
    const dy = e.touches?.[0]?.clientY - startYRef.current
    if (dy && dy > 90) { onClose() }
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
      {/* Global close button */}
      <button type="button" onClick={(e)=>{ e.stopPropagation(); onClose() }} className="fixed top-4 right-4 z-[60] inline-flex items-center justify-center rounded-md border bg-card/90 text-foreground hover:bg-card px-2 py-1">
        <X className="w-6 h-6" />
      </button>
      <div className="relative max-w-[92vw] mx-auto" onClick={(e)=>e.stopPropagation()}>
        <div className="relative mx-auto max-w-[90vw] max-h-[70vh] w-full flex items-center justify-center">
          {images.length > 1 && (
            <button type="button" onClick={onPrev} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-md bg-card/70 hover:bg-card">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <img src={current} alt="büyük görsel" className="max-h-[70vh] w-auto object-contain rounded-md" />
          {images.length > 1 && (
            <button type="button" onClick={onNext} className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-md bg-card/70 hover:bg-card">
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto max-w-[90vw]">
            {images.map((url, i) => (
              <button key={i} type="button" onClick={()=>onSelect(i)} className={`relative w-16 h-16 rounded-md border ${i===index ? 'ring-2 ring-gold' : ''}`} aria-label={`Önizleme ${i+1}`}>
                <img src={url} alt={`küçük ${i+1}`} className="absolute inset-0 w-full h-full object-cover rounded-md" />
              </button>
            ))}
          </div>
        )}
        {!!caption && (
          <div className="mt-4 max-w-[90vw] sm:max-w-[70vw] lg:max-w-[60vw] max-h-[25vh] overflow-y-auto rounded-md border bg-card/70 p-3 text-sm sm:text-base leading-relaxed">
            <RenderedReview content={caption} />
          </div>
        )}
      </div>
    </div>
  )
}