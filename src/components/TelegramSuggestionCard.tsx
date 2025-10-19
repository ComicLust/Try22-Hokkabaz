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
}

export default function TelegramSuggestionCard() {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [state, setState] = React.useState<FormState>({
    name: '',
    ctaUrl: '',
    adminUsername: '',
    members: '',
    imageUrl: '',
    type: 'GROUP',
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const { toast } = useToast()
  const [submitted, setSubmitted] = React.useState(false)

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

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!state.name.trim()) errs.name = 'Ad gerekli'
    if (!state.ctaUrl.trim()) errs.ctaUrl = 'CTA URL gerekli'
    if (!/^https?:\/\//i.test(state.ctaUrl.trim())) errs.ctaUrl = 'Geçerli bir URL girin'
    if (state.members && isNaN(Number(state.members))) errs.members = 'Üye sayısı sayı olmalı'
    if (state.imageUrl && !/^https?:\/\//i.test(state.imageUrl.trim())) errs.imageUrl = 'Geçerli bir URL girin'
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
      }
      const res = await fetch('/api/telegram-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'Gönderim hatası')
      }
      toast({ title: 'Öneri gönderildi', description: 'Onay sonrası listede görünecektir.' })
      setSubmitted(true)
      setOpen(false)
      setState({ name: '', ctaUrl: '', adminUsername: '', members: '', imageUrl: '', type: 'GROUP' })
      regenCaptcha()
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
                  <Input value={state.adminUsername} onChange={(e) => onChange('adminUsername', e.target.value)} placeholder="@username (opsiyonel)" />
                </div>
                <div>
                  <Label>Üye Sayısı</Label>
                  <Input value={state.members} onChange={(e) => onChange('members', e.target.value)} placeholder="Sayı (opsiyonel)" />
                  {errors.members && <p className="text-sm text-red-600 mt-1">{errors.members}</p>}
                </div>
                <div className="col-span-2">
                  <Label>Görsel URL</Label>
                  <Input value={state.imageUrl} onChange={(e) => onChange('imageUrl', e.target.value)} placeholder="https://... (opsiyonel)" />
                  {errors.imageUrl && <p className="text-sm text-red-600 mt-1">{errors.imageUrl}</p>}
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