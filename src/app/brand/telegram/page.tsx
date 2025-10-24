"use client"

import TelegramSuggestionCard from '@/components/TelegramSuggestionCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import React from 'react'

type Suggestion = {
  id: string
  name: string
  type: 'GROUP' | 'CHANNEL'
  members: number
  imageUrl: string
  ctaUrl: string
  adminUsername: string | null
  badges: string[] | null
  isApproved: boolean
  isRejected: boolean
  createdAt: string
}

export default function BrandTelegramPage() {
  const [items, setItems] = React.useState<Suggestion[]>([])
  const [loading, setLoading] = React.useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/brand/telegram-suggestions?status=all')
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Listeleme hatası')
      setItems(Array.isArray(j) ? j : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [])

  const statusLabel = (it: Suggestion) => {
    if (it.isApproved) return 'Onaylandı'
    if (it.isRejected) return 'Reddedildi'
    return 'Beklemede'
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="bg-neutral-950/60 border-yellow-500/20">
        <CardHeader>
          <CardTitle className="text-yellow-300">Telegram Grubu/Kanalı Gönder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Buradan markanıza ait Telegram grubu veya kanalını moderasyon onayına gönderebilirsiniz. En fazla 3 öneri aynı anda onay bekleyebilir.
          </p>
        </CardContent>
      </Card>

      <TelegramSuggestionCard apiPath="/api/brand/telegram-suggestions" onSubmitted={load} />

      <Card>
        <CardHeader>
          <CardTitle>Gönderilen Öneriler</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Yükleniyor...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz bir öneri göndermediniz.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((it) => (
                <div key={it.id} className="border rounded-lg p-3 flex gap-3">
                  <img src={it.imageUrl} alt="" className="w-16 h-16 rounded object-cover border" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{it.name}</span>
                      <Badge variant={it.type === 'CHANNEL' ? 'default' : 'secondary'}>{it.type === 'CHANNEL' ? 'Kanal' : 'Grup'}</Badge>
                      {it.badges?.[0] && (
                        <Badge variant="outline">{it.badges[0]}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Üye: {it.members}</div>
                    <div className="mt-2">
                      <Badge className={cn('text-xs', it.isApproved ? 'bg-green-600' : it.isRejected ? 'bg-red-600' : 'bg-yellow-600')}>
                        {statusLabel(it)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}