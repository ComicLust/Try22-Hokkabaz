"use client"

import { useEffect, useState } from 'react'

interface Article {
  id: string
  slug: string
  title: string | null
  content: string
  updatedAt: string
  createdAt: string
}

function sanitizeHtml(input: string) {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(input, 'text/html')
    const dangerous = doc.querySelectorAll('script, iframe, object, embed, style')
    dangerous.forEach(n => n.remove())
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT)
    let node = walker.nextNode() as Element | null
    while (node) {
      for (const attr of Array.from(node.attributes)) {
        if (/^on/i.test(attr.name)) node.removeAttribute(attr.name)
        if (attr.name === 'href' && /^\s*javascript:/i.test(attr.value)) node.removeAttribute(attr.name)
        if (attr.name === 'src' && /^\s*javascript:/i.test(attr.value)) node.removeAttribute(attr.name)
      }
      node = walker.nextNode() as Element | null
    }
    return doc.body.innerHTML
  } catch {
    return input
  }
}

export default function SeoArticle({ slug }: { slug: string }) {
  const [article, setArticle] = useState<Article | null>(null)
  const [renderedHtml, setRenderedHtml] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/page-articles/${slug}`, { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        setArticle(json)
      } catch {}
    }
    load()
  }, [slug])

  // İçerik Markdown ise HTML'e çevir, zaten HTML ise direkt kullan
  useEffect(() => {
    const convert = async () => {
      const src = article?.content ?? ''
      if (!src) {
        setRenderedHtml('')
        return
      }
      const isHtmlLike = /<\/?[a-z][\s\S]*>/i.test(src)
      if (isHtmlLike) {
        setRenderedHtml(sanitizeHtml(src))
        return
      }
      try {
        const { micromark } = await import('micromark')
        const html = micromark(src)
        setRenderedHtml(sanitizeHtml(html))
      } catch {
        setRenderedHtml(sanitizeHtml(src))
      }
    }
    convert()
  }, [article])

  if (!article || !renderedHtml) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title ?? slug,
    datePublished: article.createdAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: typeof window !== 'undefined' ? window.location.href : undefined,
  }

  return (
    <section className="mt-8">
      <div className="container mx-auto px-4 md:pl-72">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <article className="w-full border border-border rounded-lg p-6 md:p-8 bg-card text-foreground shadow-sm">
          {article.title && (
            <h3 className="font-semibold text-xl md:text-2xl mb-4 text-gold">{article.title}</h3>
          )}
          <div
            role="region"
            aria-label="Makale içeriği (kaydırılabilir)"
            tabIndex={0}
            className="prose prose-invert prose-lg leading-relaxed max-w-[75ch] mx-auto prose-headings:text-gold prose-a:text-primary prose-strong:text-foreground prose-p:text-gray-200 max-h-[160px] md:max-h-[160px] overflow-auto pr-2"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </article>
      </div>
    </section>
  )
}