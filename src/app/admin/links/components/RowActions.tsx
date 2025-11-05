"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function RowActions({ id, slug, isManual }: { id: string; slug: string; isManual?: boolean }) {
  const [busy, setBusy] = useState(false)

  const legacyCopy = (text: string) => {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.top = '-1000px'
      ta.style.left = '-1000px'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }

  const copyLink = async () => {
    setBusy(true)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const text = `${origin}/${slug}`
    try {
      let success = false
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        success = true
      } else {
        success = legacyCopy(text)
      }

      if (success) {
        toast({ title: 'Kopyalandı', description: text })
      } else {
        throw new Error('Kopyalama başarısız')
      }
    } catch {
      const ok = legacyCopy(text)
      if (ok) {
        toast({ title: 'Kopyalandı', description: text })
      } else {
        toast({ title: 'Hata', description: 'Kopyalama başarısız. Lütfen manuel kopyalayın.' })
      }
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!confirm('Bu linki silmek istediğinize emin misiniz?')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/affiliate-links/by-id/${id}`, { method: 'DELETE' })
      const json = await res.json().catch(()=>({}))
      if (!res.ok) throw new Error((json as any)?.error ?? 'Silme hatası')
      toast({ title: 'Silindi', description: `Link (${slug}) kaldırıldı` })
      // Sayfayı tazele
      window.location.reload()
    } catch (e: any) {
      toast({ title: 'Hata', description: e?.message ?? 'Silme başarısız' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={copyLink} disabled={busy}>
        <Copy className="w-4 h-4 mr-2" /> Kopyala
      </Button>
      <Button size="sm" variant="destructive" onClick={remove} disabled={busy}>
        <Trash2 className="w-4 h-4 mr-2" /> Sil
      </Button>
    </div>
  )
}