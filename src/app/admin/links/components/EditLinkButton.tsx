'use client'
import { useState } from 'react'

export default function EditLinkButton({ id, initialTitle, initialTargetUrl, initialSlug }: { id: string; initialTitle: string; initialTargetUrl: string; initialSlug: string }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [targetUrl, setTargetUrl] = useState(initialTargetUrl)
  const [slug, setSlug] = useState(initialSlug)
  const [loading, setLoading] = useState(false)

  async function submit() {
    try {
      if (!title || !targetUrl) {
        alert('Başlık ve hedef URL zorunlu')
        return
      }
      setLoading(true)
      const res = await fetch(`/api/affiliate-links/by-id/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, targetUrl, slug }),
      })
      const data = await res.json()
      setLoading(false)
      if (!res.ok) {
        alert(data?.error || 'Güncelleme hatası')
        return
      }
      setOpen(false)
      // Refresh page to reflect changes
      window.location.reload()
    } catch (e: any) {
      setLoading(false)
      alert(e?.message || 'Hata')
    }
  }

  return (
    <div>
      <button className="px-3 py-2 rounded bg-secondary text-secondary-foreground border border-border hover:opacity-90" onClick={() => setOpen(true)}>Düzenle</button>
      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Linki Düzenle</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Başlık</label>
                <input className="mt-1 w-full px-3 py-2 rounded border border-border bg-background text-foreground" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Kampanya Linki" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Hedef URL</label>
                <input className="mt-1 w-full px-3 py-2 rounded border border-border bg-background text-foreground" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Kısa URL (slug)</label>
                <input className="mt-1 w-full px-3 py-2 rounded border border-border bg-background text-foreground" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="örn: kampanya-linki" />
                <p className="mt-1 text-xs text-muted-foreground">Bu slug ile şu linkler çalışır: <span className="font-mono">/{'{'}slug{'}'}</span> ve <span className="font-mono">/out/{'{'}slug{'}'}</span></p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button className="px-3 py-2 rounded bg-secondary text-secondary-foreground border border-border hover:opacity-90" onClick={() => setOpen(false)} disabled={loading}>İptal</button>
                <button className="px-3 py-2 rounded bg-primary text-primary-foreground hover:opacity-90" onClick={submit} disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}