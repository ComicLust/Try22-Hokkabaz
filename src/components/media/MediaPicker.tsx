"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Images, UploadCloud, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type UploadFile = {
  name: string
  url: string
  size: number
  mtime: number
}

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  title = "Görsel Seç / Yükle",
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSelect: (url: string) => void
  title?: string
}) {
  const { toast } = useToast()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const MAX_SIZE_CLIENT = 250 * 1024 // 250 KB
  const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"]

  const load = async (q?: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/upload${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      const data = await res.json()
      setFiles(Array.isArray(data?.files) ? data.files : [])
    } catch (err: any) {
      toast({ title: "Hata", description: err?.message ?? "Medya listesi yüklenemedi" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const filtered = useMemo(() => {
    if (!query) return files
    const q = query.toLowerCase()
    return files.filter((f) => f.name.toLowerCase().includes(q))
  }, [files, query])

  const uploadViaFetch = async (file: File) => {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    if (!res.ok) throw new Error("Yükleme hatası")
    const data = await res.json()
    return data.url as string
  }

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const file = fileList[0]

    // İstemci tarafı maksimum boyut ve tür kontrolü
    if (file.size > MAX_SIZE_CLIENT) {
      toast({ title: "Hata", description: "Maksimum dosya boyutu 250KB" })
      return
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      toast({ title: "Hata", description: "Desteklenmeyen dosya türü (PNG/JPEG/WebP)" })
      return
    }

    setUploading(true)
    try {
      const url = await uploadViaFetch(file)
      toast({ title: "Yüklendi", description: "Görsel başarıyla yüklendi" })
      await load(query)
      onSelect(url)
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: "Hata", description: err?.message ?? "Yükleme hatası" })
    } finally {
      setUploading(false)
    }
  }

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const dt = e.dataTransfer
    await handleFiles(dt.files)
  }

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Images className="size-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Görsel ara (dosya adı)"
                value={query}
                className="pl-8"
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => load(query)} disabled={loading}>
              {loading ? "Yükleniyor..." : "Yenile"}
            </Button>
          </div>

          <ScrollArea className="max-h-[300px] rounded-md border">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3">
              {loading && (
                <div className="col-span-full flex items-center justify-center py-10 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" /> Liste yükleniyor...
                </div>
              )}
              {!loading && filtered.length === 0 && (
                <div className="col-span-full text-center text-sm text-muted-foreground py-6">
                  Hiç görsel bulunamadı.
                </div>
              )}
              {!loading && filtered.map((f) => (
                <button
                  key={f.url}
                  type="button"
                  onClick={() => {
                    onSelect(f.url)
                    onOpenChange(false)
                  }}
                  className="group border rounded-md overflow-hidden hover:border-primary"
                  title={f.name}
                >
                  <img src={f.url} alt={f.name} className="w-full h-24 object-cover" />
                  <div className="px-2 py-1 text-[11px] text-left truncate text-muted-foreground">
                    {f.name}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>

          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={cn(
              "border rounded-md p-4 flex flex-col items-center justify-center gap-2 text-center",
              dragActive ? "border-primary bg-primary/5" : "border-dashed"
            )}
          >
            <UploadCloud className="size-8 text-muted-foreground" />
            <div className="text-sm">
              Görseli sürükleyip bırakın veya
              <Button
                variant="link"
                className="px-1"
                onClick={() => fileInputRef.current?.click()}
              >
                Dosya seçin
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Maksimum boyut: 250KB. Desteklenen türler: PNG, JPEG, WebP.
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {uploading && (
              <div className="text-xs text-muted-foreground">Yükleniyor...</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}