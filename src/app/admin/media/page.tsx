'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Images, Copy, Trash2, CheckSquare, Square, Wand2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface UploadFile {
  name: string
  url: string
  size: number
  mtime: string
}

export default function MediaLibraryPage() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkWorking, setBulkWorking] = useState<boolean>(false)
  const [deleteSources, setDeleteSources] = useState<boolean>(false)
  const [convertProgress, setConvertProgress] = useState<null | { id: string; total: number; converted: number; skipped: number; processed: number; status: string }>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/upload')
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error ?? 'Yükleme listesi alınamadı')
        setFiles(Array.isArray(json?.files) ? json.files : [])
      } catch (e: any) {
        setError(e?.message ?? 'List hata')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? files.filter((f) => f.name.toLowerCase().includes(q)) : files
  }, [files, query])

  const formatSize = (s: number) => {
    if (s < 1024) return `${s} B`
    if (s < 1024 * 1024) return `${(s / 1024).toFixed(1)} KB`
    return `${(s / (1024 * 1024)).toFixed(1)} MB`
  }

  const copyUrl = async (url: string) => {
    try {
      const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`
      await navigator.clipboard.writeText(fullUrl)
      toast({ title: 'Kopyalandı', description: fullUrl })
    } catch {
      alert('Kopyalama başarısız')
    }
  }

  const removeFile = async (name: string) => {
    if (!confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return
    try {
      const res = await fetch(`/api/upload?name=${encodeURIComponent(name)}`, { method: 'DELETE' })
      const json = await res.json().catch(()=>({}))
      if (!res.ok) throw new Error((json as any)?.error ?? 'Silme hatası')
      setFiles((prev) => prev.filter((f) => f.name !== name))
      toast({ title: 'Silindi', description: name })
    } catch (e: any) {
      toast({ title: 'Hata', description: e?.message ?? 'Silinemedi' })
    }
  }

  const toggleSelect = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name); else next.add(name)
      return next
    })
  }

  const selectAllVisible = () => {
    setSelected(new Set(filtered.map((f) => f.name)))
  }

  const clearSelection = () => setSelected(new Set())

  const bulkDelete = async () => {
    const names = Array.from(selected)
    if (names.length === 0) return
    if (!confirm(`Seçilen ${names.length} dosyayı silmek istiyor musunuz?`)) return
    setBulkWorking(true)
    try {
      const res = await fetch('/api/admin/media/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? 'Toplu silme hatası')
      const deletedNames = names.filter((n) => !json.errors?.some((e: any) => e.name === n))
      setFiles((prev) => prev.filter((f) => !deletedNames.includes(f.name)))
      clearSelection()
      toast({ title: 'Toplu silme tamam', description: `Silinen: ${json.deleted}, Hata: ${json.errors?.length ?? 0}` })
    } catch (e: any) {
      toast({ title: 'Hata', description: e?.message ?? 'Toplu silme başarısız' })
    } finally {
      setBulkWorking(false)
    }
  }

  const bulkConvertWebp = async (scope: 'selected' | 'all') => {
    const names = scope === 'selected' ? Array.from(selected) : undefined
    if (scope === 'selected' && (!names || names.length === 0)) return
    setBulkWorking(true)
    try {
      const res = await fetch('/api/admin/media/convert-webp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names, quality: 70, deleteSource: deleteSources }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? 'Toplu WebP hatası')
      const id = String(json?.reportId ?? '')
      if (id) {
        setConvertProgress({ id, total: json.total ?? 0, converted: 0, skipped: 0, processed: 0, status: 'running' })
        // poll status
        const poll = async () => {
          try {
            const sRes = await fetch(`/api/admin/media/convert-webp/status?id=${encodeURIComponent(id)}`)
            const sJson = await sRes.json().catch(()=>({}))
            const data = sJson?.data
            if (data) {
              setConvertProgress({ id, total: data.total ?? 0, converted: data.converted ?? 0, skipped: data.skipped ?? 0, processed: data.processed ?? 0, status: String(data.status ?? 'running') })
              if (data.status === 'done') {
                toast({ title: 'WebP dönüştürme tamam', description: `Dönüştürülen: ${data.converted ?? 0}, Atlanan: ${data.skipped ?? 0}` })
                clearInterval(timer)
                setBulkWorking(false)
              }
            }
          } catch {}
        }
        const timer = setInterval(poll, 1000)
        // initial poll
        await poll()
      } else {
        toast({ title: 'WebP dönüştürme tamam', description: `Dönüştürülen: ${json.converted}, Atlanan: ${json.skipped}` })
        setBulkWorking(false)
      }
    } catch (e: any) {
      toast({ title: 'Hata', description: e?.message ?? 'WebP dönüştürme başarısız' })
    } finally {
      // bulkWorking, poll tamamlandığında kapatılır
    }
  }

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Images className="w-5 h-5" /> Medya Kütüphanesi</h1>
        <div className="text-sm text-muted-foreground">Yüklenmiş görselleri görüntüleyin ve URL kopyalayın</div>
      </header>

      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Dosya adı ile ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <div className="text-sm text-muted-foreground">Toplam: {filtered.length}</div>
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={deleteSources} onChange={(e)=>setDeleteSources(e.target.checked)} />
            Dönüştürme sonrası kaynakları sil
          </label>
          <Button variant="outline" size="sm" onClick={selectAllVisible} disabled={filtered.length === 0}>
            <CheckSquare className="w-4 h-4 mr-2" /> Hepsini seç
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection} disabled={selected.size === 0}>
            <Square className="w-4 h-4 mr-2" /> Seçimi temizle
          </Button>
          <Button variant="destructive" size="sm" onClick={bulkDelete} disabled={selected.size === 0 || bulkWorking}>
            <Trash2 className="w-4 h-4 mr-2" /> Seçilenleri sil
          </Button>
          <Button variant="outline" size="sm" onClick={() => bulkConvertWebp('selected')} disabled={selected.size === 0 || bulkWorking}>
            <Wand2 className="w-4 h-4 mr-2" /> Seçilenleri WebP’ye çevir
          </Button>
          <Button variant="default" size="sm" onClick={() => bulkConvertWebp('all')} disabled={bulkWorking}>
            <Wand2 className="w-4 h-4 mr-2" /> Tümünü WebP’ye çevir
          </Button>
        </div>
      </div>

      {error && <div className="rounded bg-red-50 text-red-700 px-3 py-2">{error}</div>}

      {convertProgress && (
        <div className="rounded border p-3 bg-muted/30">
          <div className="flex items-center justify-between text-sm mb-2">
            <div>Toplu WebP Dönüştürme</div>
            <div className="text-muted-foreground">Durum: {convertProgress.status}</div>
          </div>
          <div className="w-full h-2 bg-muted rounded">
            <div
              className="h-2 bg-primary rounded"
              style={{ width: `${Math.min(100, Math.floor(((convertProgress.processed || 0) / Math.max(1, convertProgress.total || 1)) * 100))}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            İşlenen: {convertProgress.processed ?? 0}/{convertProgress.total ?? 0} · Dönüştürülen: {convertProgress.converted ?? 0} · Atlanan: {convertProgress.skipped ?? 0}
          </div>
        </div>
      )}

      <section>
        {loading ? (
          <div className="text-sm text-muted-foreground">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">Hiç görsel bulunamadı.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((f) => (
              <Card key={f.name}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(f.name)}
                      onChange={() => toggleSelect(f.name)}
                      className="h-4 w-4"
                      aria-label={`Seç ${f.name}`}
                    />
                    <CardTitle className="text-sm truncate" title={f.name}>{f.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-40 bg-muted rounded overflow-hidden">
                    <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatSize(f.size)}</span>
                    <span>{new Date(f.mtime).toLocaleString()}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyUrl(f.url)}>
                      <Copy className="w-4 h-4 mr-2" /> URL’yi Kopyala
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <a href={f.url} target="_blank" rel="noreferrer">Yeni sekmede aç</a>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => removeFile(f.name)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Sil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}