"use client"

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'

function Toolbar({ exec }: { exec: (cmd: string, value?: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <Button variant="secondary" size="sm" onClick={() => exec('bold')}>B</Button>
      <Button variant="secondary" size="sm" onClick={() => exec('italic')}>I</Button>
      <Button variant="secondary" size="sm" onClick={() => exec('underline')}>U</Button>
      <Button variant="secondary" size="sm" onClick={() => exec('formatBlock', 'h2')}>H2</Button>
      <Button variant="secondary" size="sm" onClick={() => exec('formatBlock', 'h3')}>H3</Button>
      <Button variant="secondary" size="sm" onClick={() => exec('insertUnorderedList')}>• Liste</Button>
      <Button variant="secondary" size="sm" onClick={() => {
        const url = prompt('Bağlantı URL')
        if (url) exec('createLink', url)
      }}>Link</Button>
      <Button variant="secondary" size="sm" onClick={() => {
        const url = prompt('Resim URL')
        if (url) exec('insertImage', url)
      }}>Resim</Button>
      <Button variant="secondary" size="sm" onClick={() => {
        const rows = Number(prompt('Satır sayısı', '2') || '2')
        const cols = Number(prompt('Sütun sayısı', '2') || '2')
        const table = Array.from({ length: rows }).map(() => `<tr>${Array.from({ length: cols }).map(() => '<td> </td>').join('')}</tr>`).join('')
        exec('insertHTML', `<table class="table-auto border-collapse"><tbody>${table}</tbody></table>`)
      }}>Tablo</Button>
    </div>
  )
}

export default function EditPageArticle() {
  const params = useParams()
  const slug = String(params?.slug ?? '')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const editorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/admin/page-articles/${slug}`, { cache: 'no-store' })
        const json = await res.json()
        setTitle(json?.title ?? '')
        if (editorRef.current) editorRef.current.innerHTML = json?.content ?? ''
      } catch {}
      setLoading(false)
    }
    fetchData()
  }, [slug])

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
  }

  const handleSave = async () => {
    const content = editorRef.current?.innerHTML ?? ''
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/page-articles/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
      if (!res.ok) throw new Error('Kaydetme hatası')
      toast({ title: 'Kaydedildi', description: 'Makale başarıyla güncellendi.' })
    } catch (e: any) {
      toast({ title: 'Hata', description: e?.message ?? 'Kaydedilemedi', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Makale Düzenle: {slug}</h1>
        <Link href="/admin/page-articles"><Button variant="outline">Geri</Button></Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Başlık ve İçerik</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Başlık (opsiyonel)" />
            <Toolbar exec={exec} />
            <div
              ref={editorRef}
              className="min-h-[200px] border rounded-md p-3 bg-background"
              contentEditable
              suppressContentEditableWarning
              style={{ lineHeight: 1.6 }}
            />
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading}>Kaydet</Button>
              <Button variant="secondary" onClick={() => { if (editorRef.current) editorRef.current.innerHTML = '' }}>Temizle</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}