"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function BrandDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/brand/summary', { credentials: 'include', cache: 'no-store' })
        const json = await res.json()
        if (!mounted) return
        if (!res.ok) throw new Error(json?.error || 'Yükleme hatası')
        setData(json)
      } catch (e: any) {
        setError(e?.message ?? 'Hata')
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const stats = data?.stats || { total: 0, pending: 0, live: 0 }
  const brand = data?.brand || null

  return (
    <div className="p-6 space-y-6 bg-background text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hoş geldin{brand?.name ? `, ${brand.name}` : ''}!</h1>
          <p className="text-sm text-muted-foreground">Eklediğiniz bonuslar Hokkabaz yöneticisinin onayına sunulur.</p>
        </div>
        <div>
          <Link href="mailto:destek@hokkabaz.net" className="text-sm text-primary">Yöneticiyle İletişime Geç</Link>
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-neutral-950/60 border-yellow-500/20">
          <CardHeader>
            <CardTitle className="text-yellow-300">Toplam Bonus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '...' : stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-neutral-950/60 border-yellow-500/20">
          <CardHeader>
            <CardTitle className="text-yellow-300">Onay Bekleyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '...' : stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="bg-neutral-950/60 border-yellow-500/20">
          <CardHeader>
            <CardTitle className="text-yellow-300">Yayında Olan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '...' : stats.live}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Bonuslarınızı burada yönetebilirsiniz.</div>
        <Button asChild>
          <Link href="/brand/bonuses">Bonusları Yönet</Link>
        </Button>
      </div>
    </div>
  )
}