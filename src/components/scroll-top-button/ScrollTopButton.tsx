'use client'

import { useEffect, useState, useCallback } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ScrollTopButtonProps {
  offset?: number
}

export default function ScrollTopButton({ offset = 400 }: ScrollTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          setIsVisible(window.scrollY > offset)
          ticking = false
        })
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [offset])

  const handleClick = useCallback(() => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      window.scrollTo(0, 0)
    }
  }, [])

  return (
    <div
      className={`fixed right-4 md:right-6 bottom-20 md:bottom-6 z-50 transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <Button
        aria-label="Yukarı Çık"
        title="Yukarı Çık"
        size="icon"
        onClick={handleClick}
        className="rounded-full shadow-lg border border-border bg-background hover:bg-background/80"
        variant="outline"
      >
        <ArrowUp className="w-5 h-5" />
      </Button>
    </div>
  )
}