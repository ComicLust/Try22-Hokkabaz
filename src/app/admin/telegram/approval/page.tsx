"use client"

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { useToast } from '@/hooks/use-toast'

type Suggestion = {
  id: string
  name: string
  ctaUrl: string
  adminUsername: string | null
  members: number | null
  imageUrl: string | null
  type: 'GROUP' | 'CHANNEL'
  isApproved: boolean
  isRejected: boolean
  createdAt: string
}

export default function AdminTelegramApprovalPage() {
  const [items, setItems] = React.useState<Suggestion[]>([])
  const [loading, setLoading] = React.useState(false)
  const [status, setStatus] = React.useState<'pending'|'approved'|'rejected'|'all'>('pending')
  const [q, setQ] = React.useState('')
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(20)
  const [total, setTotal] = React.useState(0)
  const [sortBy, setSortBy] = React.useState<'createdAt'|'name'|'members'>('createdAt')
  const [order, setOrder] = React.useState<'asc'|'desc'>('desc')
  const { toast } = useToast()

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('status', status)
      if (q) params.set('q', q)
      params.set('page', String(page))
      params.set('limit', String(limit))
      params.set('sortBy', sortBy)
      params.set('order', order)
      const res = await fetch(`/api/admin/telegram-suggestions?${params.toString()}`)
      const json = await res.json()
      setItems(json.items ?? [])
      setTotal(Number(json.total || 0))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [status, q, page, limit, sortBy, order])

  React.useEffect(() => { load() }, [load])

  const act = async (id: string, action: 'approve' | 'reject' | 'unapprove' | 'unreject') => {
    try {
      const res = await fetch(`/api/admin/telegram-suggestions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'İşlem hatası')
      }
      await load()
      const msg = action === 'approve' ? 'Öneri onaylandı' : action === 'reject' ? 'Öneri reddedildi' : action === 'unapprove' ? 'Onay kaldırıldı' : 'Red kaldırıldı'
      toast({ title: msg })
    } catch (e) {
      console.error(e)
      toast({ title: 'Hata', description: (e as Error).message, variant: 'destructive' })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Telegram Onay</h1>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Bekleyen</SelectItem>
              <SelectItem value="approved">Onaylanan</SelectItem>
              <SelectItem value="rejected">Reddedilen</SelectItem>
              <SelectItem value="all">Tümü</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara: grup adı"
            className="w-64"
          />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sırala alan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Tarih</SelectItem>
              <SelectItem value="name">Ad</SelectItem>
              <SelectItem value="members">Üye</SelectItem>
            </SelectContent>
          </Select>
          <Select value={order} onValueChange={(v) => setOrder(v as any)}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Yön" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Azalan</SelectItem>
              <SelectItem value="asc">Artan</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1) }}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Sayfa boyutu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={load} disabled={loading}>Filtrele</Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Üye</TableHead>
              <TableHead>Yönetici</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Oluşturma</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="font-medium">{it.name}</TableCell>
                <TableCell>
                  <Badge variant={it.type === 'CHANNEL' ? 'default' : 'secondary'}>
                    {it.type === 'CHANNEL' ? 'Kanal' : 'Grup'}
                  </Badge>
                </TableCell>
                <TableCell>{it.members ?? '-'}</TableCell>
                <TableCell>{it.adminUsername ?? '-'}</TableCell>
                <TableCell>
                  <a href={it.ctaUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Bağlantı</a>
                </TableCell>
                <TableCell>
                  {it.isApproved ? (
                    <Badge variant="default">Onaylandı</Badge>
                  ) : it.isRejected ? (
                    <Badge variant="destructive">Reddedildi</Badge>
                  ) : (
                    <Badge>Bekliyor</Badge>
                  )}
                </TableCell>
                <TableCell>{new Date(it.createdAt).toLocaleString()}</TableCell>
                <TableCell className="text-right space-x-2">
                  {(!it.isApproved && !it.isRejected) && (
                    <>
                      <Button size="sm" onClick={() => act(it.id, 'approve')}>Onayla</Button>
                      <Button size="sm" variant="destructive" onClick={() => act(it.id, 'reject')}>Reddet</Button>
                    </>
                  )}
                  {it.isApproved && (
                    <Button size="sm" variant="secondary" onClick={() => act(it.id, 'unapprove')}>Onayı Kaldır</Button>
                  )}
                  {it.isRejected && (
                    <Button size="sm" variant="secondary" onClick={() => act(it.id, 'unreject')}>Reddi Kaldır</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">Kayıt bulunamadı</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">Toplam: {total} • Sayfa {page} / {Math.max(1, Math.ceil(total / limit))}</div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)) }} />
            </PaginationItem>
            {Array.from({ length: Math.max(1, Math.ceil(total / limit)) }).slice(0, 5).map((_, idx) => {
              const p = idx + 1
              return (
                <PaginationItem key={p}>
                  <PaginationLink href="#" isActive={p === page} onClick={(e) => { e.preventDefault(); setPage(p) }}>{p}</PaginationLink>
                </PaginationItem>
              )
            })}
            <PaginationItem>
              <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(Math.max(1, Math.ceil(total / limit)), p + 1)) }} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}