"use client";

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ExternalLink, MessageSquare, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'

type ReviewBrand = { id: string; name: string; slug: string; logoUrl?: string | null; siteUrl?: string | null; editorialSummary?: string | null }
type Review = { id: string; author?: string | null; isAnonymous: boolean; isPositive?: boolean | null; rating?: number | null; content: string; createdAt: string; helpfulCount: number; notHelpfulCount: number; repliedBy?: string | null; replyText?: string | null; repliedAt?: string | null; avatarUrl?: string | null }

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export default function YorumDetayClient({ slug }: { slug: string }) {
  const [site, setSite] = useState<ReviewBrand | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [toneFilter, setToneFilter] = useState<'all' | 'positive' | 'negative'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { toast } = useToast()

  // Form state
  const [author, setAuthor] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [isPositive, setIsPositive] = useState<boolean | null>(null)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)


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
        const siteRes = await fetch(`/api/review-brands/by-slug/${slug}`)
        const siteData = await siteRes.json()
        if (siteRes.ok) setSite(siteData)
        const listRes = await fetch(`/api/site-reviews?brandSlug=${slug}&sort=${sort}`)
        const listData = await listRes.json()
        if (listRes.ok) setReviews(listData.items || [])
        setError(null)
      } catch (e: any) {
        setError(e?.message ?? 'Yüklenemedi')
      } finally {
        setLoading(false)
      }
    })()
  }, [slug, sort])

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
      const res = await fetch('/api/site-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandSlug: slug, author, isAnonymous, isPositive, content }),
      })
      if (res.ok) {
        setContent('')
        setAuthor('')
        setIsPositive(null)
        setIsAnonymous(true)
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

  const vote = async (id: string, action: 'helpful' | 'not_helpful') => {
    try {
      await fetch(`/api/site-reviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
      // optimistic update
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, helpfulCount: r.helpfulCount + (action==='helpful'?1:0), notHelpfulCount: r.notHelpfulCount + (action==='not_helpful'?1:0) } : r))
    } catch {}
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
                </div>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm">Doğrulama:</span>
                  <span className="font-mono text-sm">{captchaA} + {captchaB} =</span>
                  <Input className="w-16 sm:w-20 h-8" value={captchaInput} onChange={(e)=>setCaptchaInput(e.target.value)} placeholder="?" />
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
                </div>
              </div>

              {(toneFilter==='all' ? reviews.length === 0 : reviews.filter((r)=> toneFilter==='positive' ? r.isPositive === true : r.isPositive === false).length === 0) && (
                <div className="text-sm text-muted-foreground">Bu filtrelerle yorum bulunmuyor.</div>
              )}

              <div className="space-y-4">
                {(toneFilter==='all' ? reviews : reviews.filter((r)=> toneFilter==='positive' ? r.isPositive === true : r.isPositive === false)).map((r) => (
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
                            <div className="font-medium text-sm">{r.isAnonymous ? 'Anonim Kullanıcı' : (r.author || 'Kullanıcı')}</div>
                            <div className="text-xs text-muted-foreground"><Calendar className="w-3 h-3 inline mr-1" /> {new Date(r.createdAt).toLocaleString('tr-TR')}</div>
                          </div>
                        </div>
                        {typeof r.isPositive === 'boolean' && (
                          <Badge className="text-xs" variant={r.isPositive ? 'default' : 'secondary'}>{r.isPositive ? 'Olumlu' : 'Olumsuz'}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm mb-3 break-words">{r.content}</div>
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
      <Footer />
    </div>
  )
}