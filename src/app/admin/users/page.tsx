'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Edit, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import BrandManagersSection from './BrandManagersSection'

interface User {
  id: string
  email: string
  name: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminUsersPage() {
  const [items, setItems] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  const load = async (_page = page) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(_page), limit: String(limit) })
      if (q.trim()) params.set('q', q.trim())
      const res = await fetch(`/api/admin/users?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setItems(Array.isArray(data.items) ? data.items : [])
        setTotal(typeof data.total === 'number' ? data.total : 0)
        setPage(typeof data.page === 'number' ? data.page : _page)
        setLimit(typeof data.limit === 'number' ? data.limit : limit)
      } else {
        setError(data?.error ?? 'Liste yüklenemedi')
      }
    } catch (e: any) {
      setError(e?.message ?? 'Liste yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = async () => {
    await load(1)
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kullanıcı Yönetimi</h1>
        <CreateUserDialog onCreated={() => load(page)} />
      </header>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Kullanıcılar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Input placeholder="E-posta veya ad ile ara" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
            <Button variant="outline" onClick={handleSearch}>Ara</Button>
          </div>

          {error && <div className="rounded bg-red-50 text-red-700 px-3 py-2 mb-3">{error}</div>}

          <Table>
            <TableCaption>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); const p = Math.max(1, page - 1); setPage(p); load(p) }} />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>{page}/{totalPages}</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); const p = Math.min(totalPages, page + 1); setPage(p); load(p) }} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>E-posta</TableHead>
                <TableHead>Ad</TableHead>
                <TableHead>Oluşturma</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.name ?? '-'}</TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <EditUserDialog user={u} onUpdated={() => load(page)} />
                    <DeleteUserButton id={u.id} email={u.email} onDeleted={() => load(page)} />
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">Kayıt bulunamadı</TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Yükleniyor…</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Marka Yöneticileri Bölümü */}
      <BrandManagersSection />
    </div>
  )
}

function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Oluşturma hatası')
        toast({ title: 'Oluşturma başarısız', description: (data?.error ?? 'Hata oluştu'), variant: 'destructive' })
      } else {
        setOpen(false)
        setEmail('')
        setName('')
        toast({ title: 'Kullanıcı oluşturuldu', description: `${email.trim()} e-posta ile kullanıcı eklendi.` })
        onCreated()
      }
    } catch (e: any) {
      setError(e?.message ?? 'Oluşturma hatası')
      toast({ title: 'Oluşturma başarısız', description: (e?.message ?? 'Hata oluştu'), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" /> Yeni Kullanıcı</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Kullanıcı</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {error && <div className="rounded bg-red-50 text-red-700 px-3 py-2">{error}</div>}
          <Input placeholder="E-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Ad (opsiyonel)" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button onClick={handleCreate} disabled={loading || !email.trim()}>Oluştur</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditUserDialog({ user, onUpdated }: { user: User; onUpdated: () => void }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(user.email)
  const [name, setName] = useState(user.name ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleUpdate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Güncelleme hatası')
        toast({ title: 'Güncelleme başarısız', description: (data?.error ?? 'Hata oluştu'), variant: 'destructive' })
      } else {
        setOpen(false)
        toast({ title: 'Kullanıcı güncellendi', description: `${email.trim()} kullanıcısı güncellendi.` })
        onUpdated()
      }
    } catch (e: any) {
      setError(e?.message ?? 'Güncelleme hatası')
      toast({ title: 'Güncelleme başarısız', description: (e?.message ?? 'Hata oluştu'), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="mr-2"><Edit className="w-4 h-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {error && <div className="rounded bg-red-50 text-red-700 px-3 py-2">{error}</div>}
          <Input placeholder="E-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Ad (opsiyonel)" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button onClick={handleUpdate} disabled={loading || !email.trim()}>Güncelle</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DeleteUserButton({ id, email, onDeleted }: { id: string, email: string, onDeleted: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Silme hatası')
        toast({ title: 'Silme başarısız', description: (data?.error ?? 'Hata oluştu'), variant: 'destructive' })
      } else {
        setOpen(false)
        toast({ title: 'Kullanıcı silindi', description: `${email} kullanıcısı silindi.` })
        onDeleted()
      }
    } catch (e: any) {
      setError(e?.message ?? 'Silme hatası')
      toast({ title: 'Silme başarısız', description: (e?.message ?? 'Hata oluştu'), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Silme işlemini onayla</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="text-sm">{email} kullanıcısını silmek üzeresiniz. Bu işlem geri alınamaz.</div>
        {error && <div className="rounded bg-red-50 text-red-700 px-3 py-2 mt-2">{error}</div>}
        <div className="flex justify-end gap-2 mt-3">
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>Sil</AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}