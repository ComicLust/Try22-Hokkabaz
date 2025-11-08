"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import dynamic from 'next/dynamic'
import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  frontmatterPlugin,
  directivesPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  BlockTypeSelect,
  Separator,
  DiffSourceToggleWrapper
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'

const MDXEditor = dynamic(() => import('@mdxeditor/editor').then(m => m.MDXEditor), {
  ssr: false,
  loading: () => <div className="p-4 text-muted-foreground">Editör yükleniyor…</div>
})

interface LintIssue {
  type: 'link' | 'image' | 'heading';
  message: string;
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms = 1200) {
  let t: any
  return (...args: Parameters<T>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

export default function EditPageArticle() {
  const params = useParams()
  const slug = String(params?.slug ?? '')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(true)

  // Sayaçlar ve basit linting
  const contentStats = useMemo(() => {
    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const words = text ? text.split(' ').length : 0
    const readingMinutes = Math.max(1, Math.round(words / 200))
    const hasH1 = /(^|\n)\s*#\s+/.test(content)
    const h2Count = (content.match(/(^|\n)\s*##\s+/g) || []).length
    const h3Count = (content.match(/(^|\n)\s*###\s+/g) || []).length
    return { words, readingMinutes, hasH1, h2Count, h3Count }
  }, [content])

  const lintIssues = useMemo<LintIssue[]>(() => {
    const issues: LintIssue[] = []
    // Link denetimi: rel/target, boş href
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    let match: RegExpExecArray | null
    while ((match = linkRegex.exec(content))) {
      const href = match[2]
      if (!href || href === '#') {
        issues.push({ type: 'link', message: 'Boş veya geçersiz link (href) bulundu.' })
      }
      try {
        const url = new URL(href, 'https://example.com')
        const isExternal = /^https?:/.test(href) && url.hostname !== 'example.com'
        if (isExternal && !/(rel="?nofollow"?|rel="?noopener"?)/i.test(content)) {
          issues.push({ type: 'link', message: 'Dış linklerde rel="nofollow"/"noopener" önerilir.' })
        }
      } catch {}
    }
    // Görsel denetimi: alt metin, boyut
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
    while ((match = imgRegex.exec(content))) {
      const alt = match[1]
      const src = match[2]
      if (!alt || alt.trim().length < 3) {
        issues.push({ type: 'image', message: `Görsel için açıklayıcı alt metin ekleyin (${src}).` })
      }
      if (!/\.webp($|\?)/i.test(src)) {
        issues.push({ type: 'image', message: `WebP formatı önerilir (${src}).` })
      }
    }
    // Başlık denetimi: H1 yoksa uyarı
    if (!contentStats.hasH1) {
      issues.push({ type: 'heading', message: 'İlk H1 başlık eksik. Bir H1 ekleyin.' })
    }
    if (contentStats.h2Count === 0) {
      issues.push({ type: 'heading', message: 'H2 alt başlık eksik. İçerik yapısını zenginleştirin.' })
    }
    return issues
  }, [content, contentStats])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/admin/page-articles/${slug}`, { cache: 'no-store' })
        const json = await res.json()
        setTitle(json?.title ?? '')
        setContent(json?.content ?? '')
      } catch {}
      setLoading(false)
    }
    fetchData()
  }, [slug])

  const doSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/page-articles/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || 'Kaydetme hatası')
      }
      setDirty(false)
      toast({ title: 'Kaydedildi', description: 'Makale başarıyla güncellendi.' })
    } catch (e: any) {
      toast({ title: 'Hata', description: e?.message ?? 'Kaydedilemedi', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const debouncedSave = useMemo(() => debounce(doSave, 1500), [])

  useEffect(() => {
    if (!loading && dirty) {
      debouncedSave()
    }
  }, [title, content, dirty, loading, debouncedSave])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Yükleniyor...</div>
        </div>
      </div>
    )
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
          <div className="space-y-4">
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setDirty(true) }}
              placeholder="Başlık (opsiyonel)" 
            />
            <div 
              className="border rounded-md overflow-hidden cursor-text"
              onClick={(e) => {
                // Editör alanına tıklandığında focus'u editöre yönlendir
                const editor = e.currentTarget.querySelector('.mdxeditor-rich-text-editor');
                if (editor) {
                  (editor as HTMLElement).focus();
                }
              }}
            >
              <MDXEditor
                markdown={content}
                onChange={(v) => { setContent(v); setDirty(true) }}
                placeholder="İçeriğinizi buraya yazın... Markdown ve HTML desteklenir."
                autoFocus={true}
                plugins={[
                  headingsPlugin(),
                  listsPlugin(),
                  quotePlugin(),
                  thematicBreakPlugin(),
                  markdownShortcutPlugin(),
                  linkPlugin(),
                  linkDialogPlugin(),
                  imagePlugin(),
                  tablePlugin(),
                  codeBlockPlugin({ defaultCodeBlockLanguage: 'html' }),
                  codeMirrorPlugin({ 
                    codeBlockLanguages: { 
                      html: 'HTML', 
                      css: 'CSS', 
                      js: 'JavaScript', 
                      jsx: 'JSX',
                      ts: 'TypeScript',
                      tsx: 'TSX'
                    } 
                  }),
                  diffSourcePlugin({ 
                    viewMode: 'rich-text', 
                    diffMarkdown: content 
                  }),
                  frontmatterPlugin(),
                  directivesPlugin(),
                  toolbarPlugin({
                    toolbarContents: () => (
                      <DiffSourceToggleWrapper>
                        <UndoRedo />
                        <Separator />
                        <BoldItalicUnderlineToggles />
                        <CodeToggle />
                        <Separator />
                        <BlockTypeSelect />
                        <Separator />
                        <CreateLink />
                        <InsertImage />
                        <Separator />
                        <ListsToggle />
                        <InsertTable />
                        <InsertThematicBreak />
                      </DiffSourceToggleWrapper>
                    )
                  })
                ]}
                className="min-h-[400px] w-full"
                contentEditableClassName="mdx-content-area"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                <span>Kelime: {contentStats.words}</span>
                <span>Okuma: ~{contentStats.readingMinutes} dk</span>
                <span>Başlık: {title.length} karakter</span>
                {!contentStats.hasH1 && (
                  <span className="text-amber-600">H1 eksik</span>
                )}
                {contentStats.h2Count === 0 && (
                  <span className="text-amber-600">H2 eksik</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={doSave} disabled={saving || loading}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
                <Button variant="secondary" onClick={() => { setContent(''); setDirty(true) }}>
                  Temizle
                </Button>
                <Button variant={previewOpen ? 'secondary' : 'outline'} onClick={() => setPreviewOpen(!previewOpen)}>
                  {previewOpen ? 'Önizlemeyi Gizle' : 'Önizlemeyi Aç'}
                </Button>
              </div>
            </div>
            {lintIssues.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
                <div className="font-medium mb-1">İçerik Uyarıları</div>
                <ul className="list-disc pl-5 space-y-1">
                  {lintIssues.map((i, idx) => (
                    <li key={idx}>{i.message}</li>
                  ))}
                </ul>
              </div>
            )}
            {previewOpen && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Sanitize Önizleme</div>
                <SanitizedPreview markdown={content} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Basit sanitize edilmiş önizleme: markdown’ı minimal HTML’e çevirip script/style kaldır.
function SanitizedPreview({ markdown }: { markdown: string }) {
  // Minimal dönüştürücü (başlıklar, link, görsel, paragraf). Üretim için mdx + rehype-sanitize önerilir.
  const html = useMemo(() => {
    let md = markdown || ''
    md = md.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
      .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
      .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" loading="lazy" />')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" rel="nofollow noopener">$1</a>')
      .replace(/\n{2,}/g, '</p><p>')
    const wrapped = `<p>${md}</p>`
    // Script/style ve on* event’leri temizle (basit sanitize)
    const sanitized = wrapped
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/ on[a-z]+="[^"]*"/gi, '')
    return sanitized
  }, [markdown])

  return (
    <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />
  )
}