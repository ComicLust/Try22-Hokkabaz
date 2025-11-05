"use client";

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

type Suggestion = {
  id: string
  brandName: string
  email?: string | null
  siteUrl?: string | null
  createdAt: string
  isReviewed: number
}

export default function AdminBrandSuggestionsPage() {
  const [items, setItems] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/brand-suggestions', { headers: { Accept: 'application/json' } })
        const data = await res.json()
        if (res.ok) setItems(Array.isArray(data?.items) ? data.items : [])
        else setError(data?.error ?? 'Listeleme hatası')
      } catch (e: any) {
        setError(e?.message ?? 'Listeleme hatası')
      } finally { setLoading(false) }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Marka Önerileri</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-muted-foreground">Yükleniyor…</div>}
          {error && <div className="text-sm text-red-500">{error}</div>}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marka Adı</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.brandName}</TableCell>
                      <TableCell>{s.email || '-'}</TableCell>
                      <TableCell>
                        {s.siteUrl ? (
                          <a href={s.siteUrl} target="_blank" rel="noopener noreferrer" className="underline">
                            {s.siteUrl}
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{new Date(s.createdAt).toLocaleString('tr-TR')}</TableCell>
                      <TableCell>
                        <Badge variant={s.isReviewed ? 'secondary' : 'default'}>{s.isReviewed ? 'İncelendi' : 'Yeni'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">Henüz öneri yok.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}