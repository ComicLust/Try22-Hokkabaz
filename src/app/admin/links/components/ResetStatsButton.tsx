'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'

export default function ResetStatsButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const onConfirmReset = async () => {
    if (loading) return
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
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={loading}>
          {loading ? 'Sıfırlanıyor...' : 'İstatistikleri Sıfırla'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>İstatistikleri Sıfırla</AlertDialogTitle>
          <AlertDialogDescription>
            Bu işlem tüm tıklama kayıtlarını ve sayaçları temizler. Devam etmek istiyor musunuz?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Vazgeç</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmReset} className="bg-destructive hover:bg-destructive/90">
            Evet, Sıfırla
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}