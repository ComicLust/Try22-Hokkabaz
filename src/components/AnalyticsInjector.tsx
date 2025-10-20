"use client"

import { useEffect, useRef } from 'react'

type CodeItem = {
  id: string
  name: string
  type: string
  code: string
  injectTo: 'head' | 'body' | string
}

export default function AnalyticsInjector() {
  const injectedIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/analytics-codes')
        if (!res.ok) return
        const items: CodeItem[] = await res.json()
        if (cancelled) return
        items.forEach((item) => {
          if (injectedIds.current.has(item.id)) return
          const target = item.injectTo === 'body' ? document.body : document.head
          // Parse the code string into nodes
          const container = document.createElement('div')
          container.innerHTML = item.code
          // Handle <script> tags so they execute
          const scriptTags = Array.from(container.querySelectorAll('script'))
          scriptTags.forEach((srcEl) => {
            const s = document.createElement('script')
            // Copy attributes
            Array.from(srcEl.attributes).forEach((attr) => {
              try {
                s.setAttribute(attr.name, attr.value)
              } catch {}
            })
            if (srcEl.src) {
              s.src = srcEl.src
            } else {
              s.textContent = srcEl.innerHTML
            }
            s.dataset.analyticsId = item.id
            target.appendChild(s)
            // Remove original script from container to avoid duplicating
            srcEl.remove()
          })
          // Append remaining non-script nodes directly
          Array.from(container.childNodes).forEach((node) => {
            try {
              target.appendChild(node)
            } catch {}
          })
          injectedIds.current.add(item.id)
        })
      } catch (e) {
        // Fail silently; site must not break due to injector
        console.warn('AnalyticsInjector failed', e)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return null
}