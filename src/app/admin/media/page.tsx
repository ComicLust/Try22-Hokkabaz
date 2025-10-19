'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Images, Copy } from 'lucide-react'
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

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Images className="w-5 h-5" /> Medya Kütüphanesi</h1>
        <div className="text-sm text-muted-foreground">Yüklenmiş görselleri görüntüleyin ve URL kopyalayın</div>
      </header>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Dosya adı ile ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <div className="text-sm text-muted-foreground">Toplam: {filtered.length}</div>
      </div>

      {error && <div className="rounded bg-red-50 text-red-700 px-3 py-2">{error}</div>}

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
                  <CardTitle className="text-sm truncate" title={f.name}>{f.name}</CardTitle>
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