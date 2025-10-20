'use client'
import { useEffect } from 'react'

export default function ExternalLinkTracker() {
  useEffect(() => {
    function isExternal(href: string) {
      try {
        const u = new URL(href, window.location.origin)
        if (!(u.protocol === 'http:' || u.protocol === 'https:')) return false
        return u.origin !== window.location.origin
      } catch {
        return false
      }
    }

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null
      const anchor = target?.closest && target.closest('a') as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute('href') || ''
      if (!href || anchor.getAttribute('data-no-track') === 'true') return
      if (!isExternal(href)) return

      e.preventDefault()
      const trackUrl = `/out?u=${encodeURIComponent(href)}`
      const tgt = anchor.getAttribute('target') || '_self'
      // Modifiers (ctrl/cmd) yeni sekme davranışı için korunur
      const openInNewTab = tgt === '_blank' || (e.ctrlKey || e.metaKey)
      if (openInNewTab) {
        window.open(trackUrl, '_blank')
      } else {
        window.location.assign(trackUrl)
      }
    }

    document.addEventListener('click', handleClick, { capture: true })
    return () => {
      document.removeEventListener('click', handleClick, { capture: true })
    }
  }, [])

  return null
}