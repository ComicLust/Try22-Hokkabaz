"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Plus } from 'lucide-react'

type FormState = {
  name: string
  ctaUrl: string
  adminUsername: string
  members: string
  imageUrl: string
  type: 'GROUP' | 'CHANNEL'
  badge?: string
}

// Add optional apiPath prop to allow posting to brand-specific endpoint
export default function TelegramSuggestionCard({ apiPath = '/api/telegram-suggestions', onSubmitted }: { apiPath?: string, onSubmitted?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [state, setState] = React.useState<FormState>({
    name: '',
    ctaUrl: '',
    adminUsername: '',
    members: '',
    imageUrl: '',
    type: 'GROUP',
    badge: '',
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const { toast } = useToast()
  const [submitted, setSubmitted] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)

  // Simple captcha (math) similar to comment page
  const [captchaA, setCaptchaA] = React.useState<number>(() => Math.floor(Math.random() * 5) + 2)
  const [captchaB, setCaptchaB] = React.useState<number>(() => Math.floor(Math.random() * 5) + 2)
  const [captchaInput, setCaptchaInput] = React.useState<string>('')
  const captchaOk = React.useMemo(() => Number(captchaInput) === (captchaA + captchaB), [captchaInput, captchaA, captchaB])
  const regenCaptcha = () => { setCaptchaA(Math.floor(Math.random() * 5) + 2); setCaptchaB(Math.floor(Math.random() * 5) + 2); setCaptchaInput('') }
  const onCaptchaChange = (v: string) => { setCaptchaInput(v); setErrors((e) => ({ ...e, captcha: '' })) }

  const onChange = (field: keyof FormState, value: string) => {
    setState((s) => ({ ...s, [field]: value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  const handleFileSelect = async (file: File | null) => {
    if (!file) return
    const allowed = ['image/png', 'image/jpeg', 'image/webp']
    if (!allowed.includes(file.type)) {
      setErrors((e) => ({ ...e, imageUrl: 'Yalnızca PNG/JPEG/WEBP yükleyin' }))
      toast({ title: 'Desteklenmeyen dosya türü', description: 'Sadece PNG/JPEG/WEBP', variant: 'destructive' })
      return
    }
    if (file.size > 100 * 1024) {
      setErrors((e) => ({ ...e, imageUrl: 'Maksimum 100KB olmalı' }))
      toast({ title: 'Dosya çok büyük', description: 'Maksimum 100KB', variant: 'destructive' })
      return
    }
    try {
      setUploading(true)
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'Yükleme hatası')
      }
      const j = await res.json()
      onChange('imageUrl', j.url)
    } catch (e) {
      console.error(e)
      toast({ title: 'Yükleme hatası', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!state.name.trim()) errs.name = 'Ad gerekli'
    if (!state.ctaUrl.trim()) errs.ctaUrl = 'CTA URL gerekli'
    if (!/^https?:\/\//i.test(state.ctaUrl.trim())) errs.ctaUrl = 'Geçerli bir URL girin'
    if (!state.adminUsername.trim()) errs.adminUsername = 'Yönetici adı gerekli'
    if (!state.members.trim()) errs.members = 'Üye sayısı gerekli'
    else if (isNaN(Number(state.members))) errs.members = 'Üye sayısı sayı olmalı'
    if (!state.imageUrl.trim()) errs.imageUrl = 'Görsel gerekli'
    if (!captchaOk) errs.captcha = 'Captcha hatalı'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const body = {
        name: state.name.trim(),
        ctaUrl: state.ctaUrl.trim(),
        adminUsername: state.adminUsername.trim() || null,
        members: state.members ? Number(state.members) : null,
        imageUrl: state.imageUrl.trim() || null,
        type: state.type,
        badge: state.badge?.trim() ? state.badge.trim() : undefined,
      }
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'Gönderim hatası')
      }
      toast({ title: 'Öneri gönderildi', description: 'Listede durumu görüntüleyebilirsiniz.' })
      setSubmitted(true)
      setOpen(false)
      setState({ name: '', ctaUrl: '', adminUsername: '', members: '', imageUrl: '', type: 'GROUP', badge: '' })
      regenCaptcha()
      try { onSubmitted && onSubmitted() } catch {}
    } catch (e) {
      console.error(e)
      toast({ title: 'Hata', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-dashed relative">
      <CardHeader>
        <CardTitle>Telegram Grubunuzu/Kanalınızı Önerin</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center text-center gap-3">
        <div className="w-20 h-20 rounded-full border border-border flex items-center justify-center text-muted-foreground">
          <Plus className="w-8 h-8" />
        </div>
        {submitted && (
          <div className="mb-3 text-sm text-green-600">Bilgiler gönderildi. Moderasyon sonrası yayında olacaktır.</div>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Grubunu/Kanalını Ekle</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Öneri</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ad</Label>
                  <Input value={state.name} onChange={(e) => onChange('name', e.target.value)} placeholder="Grup/Kanal adı" />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label>Tür</Label>
                  <Select value={state.type} onValueChange={(v) => onChange('type', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tür" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GROUP">Grup</SelectItem>
                      <SelectItem value="CHANNEL">Kanal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>CTA URL</Label>
                  <Input value={state.ctaUrl} onChange={(e) => onChange('ctaUrl', e.target.value)} placeholder="https://t.me/your-group" />
                  {errors.ctaUrl && <p className="text-sm text-red-600 mt-1">{errors.ctaUrl}</p>}
                </div>
                <div>
                  <Label>Yönetici Kullanıcı Adı</Label>
                  <Input value={state.adminUsername} onChange={(e) => onChange('adminUsername', e.target.value)} placeholder="@username" />
                  {errors.adminUsername && <p className="text-sm text-red-600 mt-1">{errors.adminUsername}</p>}
                </div>
                <div>
                  <Label>Üye Sayısı</Label>
                  <Input value={state.members} onChange={(e) => onChange('members', e.target.value)} placeholder="Sayı" />
                  {errors.members && <p className="text-sm text-red-600 mt-1">{errors.members}</p>}
                </div>
                <div>
                  <Label>Rozet (opsiyonel, tek)</Label>
                  <Input value={state.badge ?? ''} onChange={(e) => onChange('badge', e.target.value)} placeholder="Örn: Lisanslı" />
                  <p className="text-[11px] text-muted-foreground mt-1">Yalnızca tek bir rozet girin.</p>
                </div>
                <div className="col-span-2">
                  <Label>Görsel</Label>
                  <div className="flex items-center gap-3">
                    {state.imageUrl && (
                      <img src={state.imageUrl} alt="Seçilen görsel" className="w-16 h-16 rounded object-cover border" />
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/webp"
                      hidden
                      onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                    />
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? 'Yükleniyor...' : 'Görsel Seç'}
                    </Button>
                  </div>
                  {errors.imageUrl && <p className="text-sm text-red-600 mt-1">{errors.imageUrl}</p>}
                  <p className="text-[11px] text-muted-foreground mt-1">Maksimum 100KB. PNG/JPEG/WEBP desteklenir.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label>Doğrulama</Label>
                <span className="font-mono text-sm">{captchaA} + {captchaB} =</span>
                <Input className="w-16 h-9" value={captchaInput} onChange={(e) => onCaptchaChange(e.target.value)} placeholder="?" />
                <Button size="sm" variant="outline" type="button" onClick={regenCaptcha}>Yenile</Button>
              </div>
              {errors.captcha && <p className="text-sm text-red-600">{errors.captcha}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setOpen(false)}>İptal</Button>
                <Button onClick={submit} disabled={loading || !captchaOk}>{loading ? 'Gönderiliyor...' : 'Gönder'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}