"use client"
import React, { useEffect, useState } from 'react'

export interface TickerItem {
  imageUrl: string
  href?: string | null
}

export interface TopBrandTickerProps {
  items: TickerItem[]
  className?: string
}

export function TopBrandTicker({ items, className }: TopBrandTickerProps) {
  // Cihaz kapasitesine göre hız ayarı
  const [isLowPerf, setIsLowPerf] = useState(false)
  useEffect(function detectLowPerf() {
    try {
      const nav = typeof navigator !== 'undefined' ? navigator : undefined
      const deviceMemory = (nav as any)?.deviceMemory
      const cores = nav?.hardwareConcurrency
      const isOldAndroid = typeof navigator !== 'undefined' && /Android\s(7|8|9|10)/i.test(navigator.userAgent)
      const lowMem = typeof deviceMemory === 'number' && deviceMemory < 4
      const lowCores = typeof cores === 'number' && cores < 4
      setIsLowPerf(Boolean(lowMem || lowCores || isOldAndroid))
    } catch {
      setIsLowPerf(false)
    }
  }, [])

  // Boş içerikte bile hook'lar çağrıldıktan sonra erken dönüş yap
  if (!items || items.length === 0) return null

  // Kesintisiz akış için içeriği iki kez render et (items + items)
  const doubled = [...items, ...items]
  return (
    <section className={`w-full border-b border-border bg-gradient-to-b from-[#0d0d0d] to-[#151515] ${className ?? ''}`} aria-label="Kayan marka logoları">
      <div className="marquee py-2 md:py-3" data-lowperf={isLowPerf ? 'true' : undefined}>
        <div className="marquee-track">
          {doubled.map((l, i) => (
            <a
              key={`top-marquee-${i}`}
              href={l.href ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block shrink-0"
              aria-hidden={i >= items.length ? true : undefined}
            >
              <img
                src={l.imageUrl}
                alt="logo"
                width={220}
                height={73}
                className="w-[200px] md:w-[220px] h-[60px] md:h-[73px] opacity-90 hover:opacity-100 transition-opacity object-contain"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}