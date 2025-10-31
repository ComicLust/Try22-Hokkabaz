"use client"

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { 
  MDXEditor, 
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

export default function EditPageArticle() {
  const params = useParams()
  const slug = String(params?.slug ?? '')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

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

  const handleSave = async () => {
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
              onChange={(e) => setTitle(e.target.value)} 
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
                onChange={setContent}
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
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
              <Button variant="secondary" onClick={() => setContent('')}>
                Temizle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}