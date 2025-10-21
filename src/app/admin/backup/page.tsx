'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

export default function AdminBackupPage() {
  const { toast } = useToast()
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [exportResult, setExportResult] = useState<{ url: string; filename: string; size: number } | null>(null)

  const handleExport = async () => {
    try {
      setExporting(true)
      setExportResult(null)
      const res = await fetch('/api/admin/backup/export', { method: 'POST', credentials: 'include' })
      if (!res.ok) throw new Error('Yedekleme çıkartma başarısız')
      const data = await res.json()
      setExportResult(data)
      toast({ title: 'Yedek oluşturuldu', description: `${data.filename} hazır.` })
    } catch (err: any) {
      toast({ title: 'Hata', description: err?.message ?? 'Yedek oluşturulamadı', variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      toast({ title: 'Dosya seçin', description: 'İçe aktarım için .zip dosyası seçin', variant: 'destructive' })
      return
    }
    try {
      setImporting(true)
      const form = new FormData()
      form.append('file', importFile)
      const res = await fetch('/api/admin/backup/import', { method: 'POST', body: form, credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'İçe aktarım başarısız')
      toast({ title: 'İçe aktarım tamamlandı', description: data?.message ?? 'Veriler başarıyla içe aktarıldı.' })
    } catch (err: any) {
      toast({ title: 'Hata', description: err?.message ?? 'İçe aktarım başarısız', variant: 'destructive' })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Yedekleme</h1>

      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="text-lg font-medium">Dışa Aktar</h2>
        <p className="text-sm text-muted-foreground">Tüm veritabanı verilerini .zip dosyası olarak dışa aktarın.</p>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? 'Oluşturuluyor…' : 'Yedeği Dışa Aktar'}
          </Button>
          {exportResult?.url && (
            <a href={exportResult.url} target="_blank" rel="noreferrer" className="text-primary underline">
              {exportResult.filename} indir ({Math.round(exportResult.size / 1024)} KB)
            </a>
          )}
        </div>
      </section>

      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="text-lg font-medium">İçe Aktar</h2>
        <p className="text-sm text-muted-foreground">Önceden dışa aktarılan bir .zip yedeğini yükleyerek verileri içe aktarın.</p>
        <div className="flex items-center gap-2">
          <Input type="file" accept=".zip" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} className="w-64" />
          <Button variant="secondary" onClick={handleImport} disabled={importing || !importFile}>
            {importing ? 'İçe aktarılıyor…' : 'Yedeği İçe Aktar'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Not: İçe aktarım tekrarlanan kayıtları otomatik olarak atlar.</p>
      </section>
    </div>
  )
}