'use client'

import { Gift, Megaphone, MessageSquare, Globe, Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function MobileBottomNav() {
  const pathname = usePathname()

  const items = [
    { href: '/bonuslar', label: 'Bonuslar', Icon: Gift },
    { href: '/kampanyalar', label: 'Kampanyalar', Icon: Megaphone },
    { href: '/yorumlar', label: 'Yorumlar', Icon: MessageSquare },
    { href: '/anlasmali-siteler', label: 'Siteler', Icon: Globe },
  ]

  const isActive = (href: string) => {
    if (!pathname) return false
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const openMenu = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('open-mobile-menu'))
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 pb-[env(safe-area-inset-bottom)] transform-gpu">
      <div className="mx-auto w-full">
        <div className="grid grid-cols-5 gap-0 min-h-[56px]">
          {items.map(({ href, label, Icon }) => (
            <a
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center py-2 text-xs transition-colors ${
                isActive(href) ? 'text-gold' : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive(href) ? 'text-gold' : 'text-foreground/70'}`} />
              <span className="leading-none">{label}</span>
            </a>
          ))}
          <button
            type="button"
            onClick={openMenu}
            className="flex flex-col items-center justify-center py-2 text-xs text-foreground/70 hover:text-foreground"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="leading-none">Menü</span>
          </button>
        </div>
      </div>
    </nav>
  )
}