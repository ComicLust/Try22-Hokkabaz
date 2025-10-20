"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Lightweight client-side SEO injector
// - Adds/updates <link rel="canonical"> based on current URL
// - Generates Breadcrumb JSON-LD from URL segments
// - Optionally applies OG/Twitter meta from /api/seo?page=<pathname>
export default function SeoAutoInjector() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const origin = window.location.origin
    const canonical = origin + pathname

    const head = document.head

    // Helper: upsert a <meta> by name or property
    const upsertMeta = (key: 'name' | 'property', id: string, content?: string | null) => {
      if (!content) return
      let el = head.querySelector(`meta[${key}='${id}']`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(key, id)
        head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    // Upsert canonical link
    let link = head.querySelector("link[rel='canonical']") as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      head.appendChild(link)
    }
    link.setAttribute('href', canonical)

    // OG/Twitter url always point to canonical
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('name', 'twitter:url', canonical)

    // Breadcrumb JSON-LD
    try {
      const segments = pathname.split('/').filter(Boolean)
      const itemListElement = segments.map((seg, idx) => {
        const itemPath = '/' + segments.slice(0, idx + 1).join('/')
        const name = seg
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
        return {
          '@type': 'ListItem',
          position: idx + 1,
          name,
          item: origin + itemPath,
        }
      })
      const breadcrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement,
      }
      let script = head.querySelector('#breadcrumb-jsonld') as HTMLScriptElement | null
      if (!script) {
        script = document.createElement('script')
        script.type = 'application/ld+json'
        script.id = 'breadcrumb-jsonld'
        head.appendChild(script)
      }
      script.textContent = JSON.stringify(breadcrumb)
    } catch {}

    // Fetch per-page SEO overrides
    ;(async () => {
      try {
        const res = await fetch(`/api/seo?page=${encodeURIComponent(pathname)}`)
        if (!res.ok) return
        const data = await res.json()
        if (!data) return
        const {
          title,
          description,
          keywords,
          ogTitle,
          ogDescription,
          ogImageUrl,
          twitterTitle,
          twitterDescription,
          twitterImageUrl,
          canonicalUrl,
        } = data

        // Canonical override
        if (canonicalUrl) {
          link?.setAttribute('href', canonicalUrl)
          upsertMeta('property', 'og:url', canonicalUrl)
          upsertMeta('name', 'twitter:url', canonicalUrl)
        }

        // Basic meta
        upsertMeta('name', 'description', description ?? undefined)
        upsertMeta('name', 'keywords', keywords ?? undefined)

        // OG
        upsertMeta('property', 'og:title', (ogTitle ?? title) ?? undefined)
        upsertMeta('property', 'og:description', (ogDescription ?? description) ?? undefined)
        upsertMeta('property', 'og:image', ogImageUrl ?? undefined)

        // Twitter
        upsertMeta('name', 'twitter:title', (twitterTitle ?? title) ?? undefined)
        upsertMeta('name', 'twitter:description', (twitterDescription ?? description) ?? undefined)
        upsertMeta('name', 'twitter:image', twitterImageUrl ?? undefined)
      } catch {
        // ignore
      }
    })()
  }, [pathname])

  return null
}