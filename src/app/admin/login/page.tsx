"use client"

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Giriş başarısız')
      }
      const rawNext = searchParams.get('next')
      const next = rawNext && rawNext.startsWith('/admin') ? rawNext : '/admin'
      router.replace(next)
    } catch (e: any) {
      toast({ title: 'Giriş başarısız', description: e?.message ?? 'Hata oluştu', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Suspense>
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-sm bg-neutral-950/60 border-yellow-500/20">
          <CardHeader className="text-center">
            <CardTitle className="text-yellow-300">Yönetici Girişi</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={onSubmit}>
              <div>
                <label className="text-xs text-neutral-400">Kullanıcı Adı</label>
                <Input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="ornek-kullanici" />
              </div>
              <div>
                <label className="text-xs text-neutral-400">Şifre</label>
                <Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </Button>
            </form>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Giriş bilgilerinizi Hokkabaz yönetimi sağlar.
            </p>
          </CardContent>
        </Card>
      </div>
    </Suspense>
  )
}