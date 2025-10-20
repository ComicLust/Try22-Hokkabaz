'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function ResetStatsButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const onReset = async () => {
    if (loading) return
    const ok = window.confirm('Tüm istatistikleri sıfırlamak istediğinizden emin misiniz?')
    if (!ok) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/affiliate-links/reset-stats', { method: 'POST', credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Sıfırlama başarısız')
      }
      toast({ title: 'İstatistikler sıfırlandı', description: 'Tüm tıklama kayıtları ve sayaçlar temizlendi.' })
      router.refresh()
    } catch (e: any) {
      toast({ title: 'Hata', description: e?.message ?? 'Sıfırlama sırasında bir sorun oluştu', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="destructive" onClick={onReset} disabled={loading}>
      {loading ? 'Sıfırlanıyor...' : 'İstatistikleri Sıfırla'}
    </Button>
  )
}